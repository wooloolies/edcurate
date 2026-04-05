"""Federated search orchestrator with RAG pipeline and deep evaluation."""

import asyncio
import hashlib
import json
import uuid
from typing import Literal

from src.discovery.providers.ddgs import DdgsProvider
from src.discovery.providers.openalex import OpenAlexProvider
from src.discovery.providers.youtube import YoutubeProvider
from src.discovery.schemas import ResourceCard, SourceError
from src.evaluation.agent import evaluate_resource
from src.evaluation.schemas import EvaluatedSearchResponse, EvaluationResult
from src.lib.config import settings
from src.lib.logging import get_logger
from src.presets.model import ClassroomPreset
from src.rag.chunker import chunk_text
from src.rag.embedder import embed_single, embed_texts
from src.rag.fetcher import fetch_content
from src.rag.weaviate_store import (
    ensure_collection,
    query_chunks,
    upsert_chunks,
)

logger = get_logger(__name__)

_CACHE_TTL = 3600  # 1 hour
_TOTAL_RESULTS = 15
_TOP_K_EVALUATE = 4
_SOURCE_KEYS: list[Literal["ddgs", "youtube", "openalex"]] = [
    "ddgs",
    "youtube",
    "openalex",
]


def _calculate_limits(
    source_weights: dict[str, float], total: int = _TOTAL_RESULTS
) -> dict[str, int]:
    """Distribute total results across sources proportional to their weights."""
    weights = {
        "ddgs": float(source_weights.get("ddgs", 0.34)),
        "youtube": float(source_weights.get("youtube", 0.33)),
        "openalex": float(source_weights.get("openalex", 0.33)),
    }
    total_weight = sum(weights.values()) or 1.0

    limits: dict[str, int] = {}
    allocated = 0
    sources = list(weights.keys())
    for i, source in enumerate(sources):
        if i == len(sources) - 1:
            limits[source] = max(1, total - allocated)
        else:
            share = round(weights[source] / total_weight * total)
            limits[source] = max(1, share)
            allocated += limits[source]
    return limits


def _build_eval_query(preset: ClassroomPreset, query: str) -> str:
    """Combine search query + preset context into evaluation query text."""
    interests = ", ".join(preset.student_interests or [])
    return (
        f"Subject: {preset.subject}\n"
        f"Year Level: {preset.year_level}\n"
        f"Curriculum: {preset.curriculum_framework or 'Not specified'}\n"
        f"Topic: {preset.topic or 'Not specified'}\n"
        f"Country: {preset.country}\n"
        f"Student Interests: {interests or 'Not specified'}\n"
        f"Teaching Language: {preset.teaching_language}\n"
        f"Search Query: {query}"
    )


async def _run_rag_pipeline(
    cards: list[ResourceCard],
    preset: ClassroomPreset,
    query: str,
    search_id: str,
) -> list[EvaluationResult]:
    """
    Run the full RAG pipeline on top-4 resources:
    1. Fetch content
    2. Chunk
    3. Embed chunks + store in Weaviate
    4. Build eval query + embed
    5. For each resource: retrieve chunks → Gemini 7-dim score
    """
    # Step 1: Ensure Weaviate collection exists
    try:
        await asyncio.to_thread(ensure_collection)
    except Exception as e:
        logger.error("Weaviate collection setup failed", error=str(e))
        return []

    # Step 2: Fetch content for all resources in parallel
    fetch_tasks = [fetch_content(card) for card in cards]
    contents = await asyncio.gather(*fetch_tasks, return_exceptions=True)

    # Step 3: Chunk and embed each resource
    for card, content in zip(cards, contents, strict=True):
        if not isinstance(content, str) or not content:
            logger.warning(
                "Skipping resource — no content",
                url=card.url,
            )
            continue

        chunks = chunk_text(content, heading=card.title)
        if not chunks:
            continue

        # Embed all chunks for this resource
        try:
            chunk_texts = [c.text for c in chunks]
            vectors = await embed_texts(chunk_texts)
            await asyncio.to_thread(
                upsert_chunks,
                chunks=chunks,
                resource_url=card.url,
                source_type=card.source,
                search_id=search_id,
                vectors=vectors,
            )
        except Exception as e:
            logger.error(
                "Chunk embedding/upsert failed",
                url=card.url,
                error=str(e),
            )

    # Step 4: Build and embed the evaluation query
    eval_query_text = _build_eval_query(preset, query)
    try:
        eval_vector = await embed_single(eval_query_text)
    except Exception as e:
        logger.error("Eval query embedding failed", error=str(e))
        return []

    # Step 5: For each resource, retrieve chunks and evaluate
    evaluations: list[EvaluationResult] = []
    eval_tasks = []

    for card in cards:
        try:
            retrieved = await asyncio.to_thread(
                query_chunks,
                query_vector=eval_vector,
                search_id=search_id,
                resource_url=card.url,
                limit=5,
            )
        except Exception as e:
            logger.warning(
                "Chunk retrieval failed",
                url=card.url,
                error=str(e),
            )
            retrieved = []

        if not retrieved:
            # Use snippet as fallback
            chunks_text = card.snippet
        else:
            chunks_text = "\n\n---\n\n".join(
                str(r.get("chunk_text", "")) for r in retrieved
            )

        eval_tasks.append(
            evaluate_resource(
                title=card.title,
                url=card.url,
                source=card.source,
                chunks_text=chunks_text,
                preset=preset,
            )
        )

    # Run all evaluations in parallel
    eval_results = await asyncio.gather(*eval_tasks, return_exceptions=True)
    for result in eval_results:
        if isinstance(result, EvaluationResult):
            evaluations.append(result)
        elif isinstance(result, Exception):
            logger.warning("Evaluation task failed", error=str(result))

    # Sort by overall_score descending
    evaluations.sort(key=lambda e: e.overall_score, reverse=True)
    return evaluations


def _cache_key(preset_id: str, query: str) -> str:
    """Build a deterministic Redis key for search results."""
    raw = f"{preset_id}:{query.lower().strip()}"
    digest = hashlib.sha256(raw.encode()).hexdigest()[:16]
    return f"discovery:result:{digest}"


async def _get_cached(key: str) -> EvaluatedSearchResponse | None:
    if not settings.REDIS_URL:
        return None
    try:
        import redis.asyncio as aioredis

        r = aioredis.from_url(settings.REDIS_URL)
        try:
            data = await r.get(key)
            if data:
                return EvaluatedSearchResponse.model_validate_json(data)
        finally:
            await r.aclose()
    except Exception as e:
        logger.debug("Cache read miss", key=key, error=str(e))
    return None


async def _set_cached(key: str, response: EvaluatedSearchResponse) -> None:
    if not settings.REDIS_URL:
        return
    try:
        import redis.asyncio as aioredis

        r = aioredis.from_url(settings.REDIS_URL)
        try:
            await r.set(key, response.model_dump_json(), ex=_CACHE_TTL)
        finally:
            await r.aclose()
    except Exception as e:
        logger.debug("Cache write failed", key=key, error=str(e))


async def search_resources(
    preset: ClassroomPreset,
    query: str,
) -> EvaluatedSearchResponse:
    """
    Run federated search with RAG pipeline and deep evaluation.

    1. Check Redis cache
    2. Federated search across all providers (~15 results)
    3. Take top 4 results
    4. RAG pipeline: fetch → chunk → embed → Weaviate → evaluate
    5. Cache and return
    """
    from fastapi import HTTPException, status

    # Check cache first
    cache_key = _cache_key(str(preset.id), query)
    cached = await _get_cached(cache_key)
    if cached:
        logger.info("Cache hit", key=cache_key, query=query)
        return cached

    search_id = str(uuid.uuid4())
    limits = _calculate_limits(preset.source_weights)

    providers = {
        "ddgs": DdgsProvider(),
        "youtube": YoutubeProvider(),
        "openalex": OpenAlexProvider(),
    }

    tasks = [
        providers[source].search(query, preset, limits[source])
        for source in _SOURCE_KEYS
    ]

    raw_results = await asyncio.gather(*tasks, return_exceptions=True)

    from itertools import zip_longest

    all_results: list[ResourceCard] = []
    errors: list[SourceError] = []
    seen_urls: set[str] = set()

    # Collect successful iterables for round-robin interleaving
    valid_results_lists: list[list[ResourceCard]] = []

    for source, result in zip(_SOURCE_KEYS, raw_results, strict=True):
        if isinstance(result, Exception):
            errors.append(SourceError(source=source, message=str(result)))
        elif isinstance(result, list):
            valid_results_lists.append(result)

    # Interleave 1 item from each provider round-robin
    for interleaved_tuple in zip_longest(*valid_results_lists):
        for card in interleaved_tuple:
            if card is not None and card.url not in seen_urls:
                seen_urls.add(card.url)
                all_results.append(card)

    if not all_results and len(errors) == len(_SOURCE_KEYS):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="All search providers failed. Please try again later.",
        )

    counts_by_source: dict[str, int] = {source: 0 for source in _SOURCE_KEYS}
    for card in all_results:
        counts_by_source[card.source] += 1

    # Take top 4 for evaluation
    top_cards = all_results[:_TOP_K_EVALUATE]

    # Run RAG pipeline + evaluation (graceful degradation)
    evaluations: list[EvaluationResult] = []
    try:
        evaluations = await asyncio.wait_for(
            _run_rag_pipeline(top_cards, preset, query, search_id), timeout=100.0
        )
        # Create a lookup mapping by URL
        eval_map = {e.resource_url: e for e in evaluations}

        # Attach relevance score and reason to the original results
        # so the frontend can display them directly on the card
        for card in all_results:
            if card.url in eval_map:
                evaluation = eval_map[card.url]
                card.relevance_score = evaluation.overall_score
                card.relevance_reason = evaluation.relevance_reason
                card.evaluation_details = {
                    k: v.model_dump() for k, v in evaluation.scores.items()
                }

    except Exception as e:
        logger.error(
            "RAG pipeline failed — returning results without evaluations",
            error=str(e),
        )

    # Sort results by relevance_score descending (putting None values at the end)
    all_results.sort(
        key=lambda card: card.relevance_score
        if card.relevance_score is not None
        else -1.0,
        reverse=True,
    )

    response = EvaluatedSearchResponse(
        query=query,
        preset_id=uuid.UUID(str(preset.id)),
        total_results=len(all_results),
        counts_by_source=counts_by_source,
        results=all_results,
        errors=errors,
        evaluations=evaluations,
    )

    await _set_cached(cache_key, response)
    return response
