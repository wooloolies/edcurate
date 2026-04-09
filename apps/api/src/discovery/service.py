"""Federated search orchestrator with RAG pipeline and deep evaluation."""

import asyncio
import hashlib
import json
import re
import uuid
from collections.abc import AsyncGenerator
from dataclasses import dataclass
from itertools import zip_longest
from typing import Literal

from src.agents.evaluation.adversarial_retrieval import (
    ADV_RETRIEVAL_LIMIT,
    bucket_chunks_for_adversarial,
    build_adversarial_hybrid_query_text,
)
from src.agents.evaluation.final_judge import judge_resource
from src.agents.evaluation.risk_scanner import scan_resource_risks
from src.agents.evaluation.triage_agent import triage_resource
from src.agents.schemas import (
    JudgedSearchResponse,
    JudgmentResult,
    RiskScanResult,
    TriageResult,
)
from src.agents.search.search_query_agent import SearchQueryAgent
from src.discovery.providers.ddgs import DdgsProvider
from src.discovery.providers.openalex import OpenAlexProvider
from src.discovery.providers.youtube import YoutubeProvider
from src.discovery.schemas import (
    GeneratedSearchQueries,
    ResourceCard,
    SearchStageEvent,
    SourceError,
)
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

_STATUS_CODE_RE = re.compile(r"(\d{3})")


def _sanitize_error(error: Exception) -> str:
    """Return a user-friendly error message without URLs or technical details."""
    msg = str(error)
    logger.error(
        "Search provider error: %s: %s",
        type(error).__name__,
        msg,
        exc_info=error,
    )
    # Extract HTTP status code from httpx-style messages (e.g. "Client error '403 …'")
    match = re.search(r"\b[45]\d{2}\b", msg)
    code = match.group(0) if match else None
    if code == "403":
        return "Access denied — API quota may be exceeded. Try again later."
    if code == "429":
        return "Too many requests — rate limit reached. Try again later."
    if code and code.startswith("5"):
        return "Provider is temporarily unavailable. Try again later."
    if "timeout" in msg.lower() or "timed out" in msg.lower():
        return "Request timed out. Try again later."
    return f"Search failed: [{type(error).__name__}] {msg[:200]}"


@dataclass
class _RagContext:
    eval_vector: list[float]
    adv_vector: list[float]
    readability_map: dict[str, dict[str, float]]
    search_id: str
    preset: ClassroomPreset


_CACHE_TTL = 3600  # 1 hour
_EVAL_CTX_TTL = 600  # 10 minutes — Phase 2 must start within this window
_TOTAL_RESULTS = 15
_TOP_K_EVALUATE = 4
_SOURCE_KEYS: list[Literal["ddgs", "youtube", "openalex"]] = [
    "ddgs",
    "youtube",
    "openalex",
]


# ---------------------------------------------------------------------------
# Phase 2 context persistence (Redis)
# ---------------------------------------------------------------------------


async def _store_eval_context(
    search_id: str,
    ctx: _RagContext,
    top_urls: list[str],
) -> None:
    """Persist vectors + readability so Phase 2 can evaluate without re-fetching."""
    if not settings.REDIS_URL:
        return
    try:
        import redis.asyncio as aioredis

        data = json.dumps(
            {
                "eval_vector": ctx.eval_vector,
                "adv_vector": ctx.adv_vector,
                "readability_map": ctx.readability_map,
                "top_urls": top_urls,
            }
        )
        r = aioredis.from_url(settings.REDIS_URL)
        try:
            await r.set(f"eval_ctx:{search_id}", data, ex=_EVAL_CTX_TTL)
        finally:
            await r.aclose()
    except Exception as e:
        logger.warning(
            "Failed to store eval context",
            search_id=search_id,
            error=str(e),
        )


async def _load_eval_context(search_id: str) -> dict | None:
    """Load Phase 2 evaluation context from Redis."""
    if not settings.REDIS_URL:
        return None
    try:
        import redis.asyncio as aioredis

        r = aioredis.from_url(settings.REDIS_URL)
        try:
            raw = await r.get(f"eval_ctx:{search_id}")
        finally:
            await r.aclose()
        if raw:
            return json.loads(raw)
    except Exception as e:
        logger.warning("Failed to load eval context", search_id=search_id, error=str(e))
    return None


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
        f"Country: {preset.country}\n"
        f"Student Interests: {interests or 'Not specified'}\n"
        f"Teaching Language: {preset.teaching_language}\n"
        f"Search Query: {query}"
    )


_SNIPPET_EMBED_LIMIT = 4000


async def _sort_by_relevance(
    eval_query_text: str,
    results_by_source: dict[str, list[ResourceCard]],
) -> tuple[dict[str, list[ResourceCard]], list[float] | None, dict[str, float]]:
    """Sort each provider's results by cosine similarity to the eval query.

    Returns:
        - (possibly reordered) results dict
        - eval_vector for reuse in the RAG pipeline (None on failure)
        - scores_by_url mapping each card URL to its cosine similarity score
    """
    scores_by_url: dict[str, float] = {}

    try:
        eval_vector = await embed_single(eval_query_text)
    except Exception as e:
        logger.warning("Pre-sort embedding failed — skipping sort", error=str(e))
        return results_by_source, None, scores_by_url

    sorted_results: dict[str, list[ResourceCard]] = {}
    for source, cards in results_by_source.items():
        if not cards:
            sorted_results[source] = cards
            continue

        texts = [f"{c.title}. {c.snippet}"[:_SNIPPET_EMBED_LIMIT] for c in cards]
        try:
            vectors = await embed_texts(texts)
        except Exception as e:
            logger.warning(
                "Pre-sort snippet embedding failed — keeping original order",
                source=source,
                error=str(e),
            )
            sorted_results[source] = cards
            continue

        # Cosine similarity via dot product
        # (text-embedding-004 returns normalized vectors)
        scored = []
        for card, vec in zip(cards, vectors, strict=True):
            score = sum(a * b for a, b in zip(eval_vector, vec, strict=True))
            scores_by_url[card.url] = score
            scored.append((score, card))
        scored.sort(key=lambda t: t[0], reverse=True)
        sorted_results[source] = [card for _, card in scored]

    return sorted_results, eval_vector, scores_by_url


def _select_candidates(
    results_by_source: dict[str, list[ResourceCard]],
    scores_by_url: dict[str, float],
    top_k: int = _TOP_K_EVALUATE,
) -> tuple[list[ResourceCard], list[ResourceCard]]:
    """Flatten, dedupe, and globally rank candidates by embedding similarity.

    Returns (all_results, top_cards) where both lists are sorted by
    descending embedding score.  If scoring is unavailable, falls back to
    round-robin interleaving to preserve provider diversity.
    """
    seen_urls: set[str] = set()
    all_cards: list[ResourceCard] = []

    if not scores_by_url:
        valid_results_lists = [cards for cards in results_by_source.values() if cards]
        for interleaved_tuple in zip_longest(*valid_results_lists):
            for card in interleaved_tuple:
                if card is not None and card.url not in seen_urls:
                    seen_urls.add(card.url)
                    all_cards.append(card)
        return all_cards, all_cards[:top_k]

    for cards in results_by_source.values():
        for card in cards:
            if card.url not in seen_urls:
                seen_urls.add(card.url)
                all_cards.append(card)

    all_cards.sort(key=lambda c: scores_by_url.get(c.url, 0.0), reverse=True)

    return all_cards, all_cards[:top_k]


async def _prepare_rag_context(
    cards: list[ResourceCard],
    preset: ClassroomPreset,
    query: str,
    search_id: str,
    eval_vector: list[float] | None = None,
) -> _RagContext | None:
    """Shared RAG setup: Weaviate, fetch, chunk, embed, query vectors.

    Returns None if setup fails (e.g. query embedding failure).
    """
    from src.rag.readability import compute_readability

    # Step 1: Ensure Weaviate collection exists
    try:
        await asyncio.to_thread(ensure_collection)
    except Exception as e:
        logger.error("Weaviate collection setup failed", error=str(e))
        return None

    # Step 2: Fetch content for all resources in parallel
    fetch_tasks = [fetch_content(card) for card in cards]
    contents = await asyncio.gather(*fetch_tasks, return_exceptions=True)

    # Step 3: Chunk, embed, compute readability
    readability_map: dict[str, dict[str, float]] = {}
    for card, content in zip(cards, contents, strict=True):
        if not isinstance(content, str) or not content:
            logger.warning("Skipping resource — no content", url=card.url)
            continue

        # Compute readability on full text before chunking
        metrics = compute_readability(content)
        if metrics:
            readability_map[card.url] = metrics

        chunks = chunk_text(content, heading=card.title)
        if not chunks:
            continue

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
            logger.error("Chunk embedding/upsert failed", url=card.url, error=str(e))

    # Step 4: Embed queries — reuse eval_vector if provided by pre-sort
    hybrid_text = build_adversarial_hybrid_query_text(preset, query)

    try:
        if eval_vector is None:
            eval_query_text = _build_eval_query(preset, query)
            eval_vector, adv_vector = await asyncio.gather(
                embed_single(eval_query_text),
                embed_single(hybrid_text),
            )
        else:
            adv_vector = await embed_single(hybrid_text)
    except Exception as e:
        logger.error("Query embedding failed", error=str(e))
        return None

    # eval_vector is guaranteed non-None here (either passed in or just computed above)
    assert eval_vector is not None

    return _RagContext(
        eval_vector=eval_vector,
        adv_vector=adv_vector,
        readability_map=readability_map,
        search_id=search_id,
        preset=preset,
    )


async def _process_one(card: ResourceCard, ctx: _RagContext) -> JudgmentResult | None:
    """Triage + Risk Scanner in parallel, then Final Judge."""
    # Retrieve both chunk sets in parallel
    try:
        eval_retrieved, adv_retrieved = await asyncio.gather(
            asyncio.to_thread(
                query_chunks,
                query_vector=ctx.eval_vector,
                search_id=ctx.search_id,
                resource_url=card.url,
                limit=5,
            ),
            asyncio.to_thread(
                query_chunks,
                query_vector=ctx.adv_vector,
                search_id=ctx.search_id,
                resource_url=card.url,
                limit=ADV_RETRIEVAL_LIMIT,
            ),
        )
    except Exception as e:
        logger.warning("Chunk retrieval failed", url=card.url, error=str(e))
        eval_retrieved = []
        adv_retrieved = []

    # Build triage text (Call 1)
    if not eval_retrieved:
        eval_chunks_text = card.snippet
    else:
        eval_chunks_text = "\n\n---\n\n".join(
            str(r.get("chunk_text", "")) for r in eval_retrieved
        )

    # Build risk scanner texts (Call 2) — claim vs framing buckets
    claim_text, framing_text = bucket_chunks_for_adversarial(
        adv_retrieved if isinstance(adv_retrieved, list) else [],
        card.snippet,
    )

    # Run Call 1 (Triage) + Call 2 (Risk Scanner) in PARALLEL — blind
    triage_result, risk_result = await asyncio.gather(
        triage_resource(
            title=card.title,
            url=card.url,
            source=card.source,
            chunks_text=eval_chunks_text,
            preset=ctx.preset,
            readability_metrics=ctx.readability_map.get(card.url),
        ),
        scan_resource_risks(
            claim_chunks_text=claim_text,
            framing_chunks_text=framing_text,
            title=card.title,
            url=card.url,
            source=card.source,
            preset=ctx.preset,
        ),
        return_exceptions=True,
    )

    # Handle Call 1 failure — cannot proceed without triage
    if isinstance(triage_result, Exception):
        logger.warning(
            "Call 1 triage failed", url=card.url, error=str(triage_result)
        )
        return None
    if not isinstance(triage_result, TriageResult):
        return None

    # Handle Call 2 failure — use empty risk scan
    if isinstance(risk_result, Exception):
        logger.warning(
            "Call 2 risk scan failed — proceeding with empty risks",
            url=card.url,
            error=str(risk_result),
        )
        risk_result = RiskScanResult(flags=[], summary="Risk scan unavailable.")
    elif not isinstance(risk_result, RiskScanResult):
        risk_result = RiskScanResult(flags=[], summary="Risk scan unavailable.")

    # Call 3 — Final Judge (sequential, sees both outputs)
    judgment = await judge_resource(
        triage=triage_result,
        risk=risk_result,
        title=card.title,
        url=card.url,
        preset=ctx.preset,
    )
    return judgment


async def _run_rag_pipeline(
    cards: list[ResourceCard],
    preset: ClassroomPreset,
    query: str,
    search_id: str,
    eval_vector: list[float] | None = None,
) -> list[JudgmentResult]:
    """Run the full RAG pipeline with 3-call evaluation.

    1. Fetch content + compute readability
    2. Chunk + embed + store in Weaviate
    3. Embed query vectors
    4. For each resource: Call 1 (Triage) + Call 2 (Risk Scanner) in PARALLEL
    5. Call 3 (Final Judge) sequentially with both outputs
    """
    ctx = await _prepare_rag_context(cards, preset, query, search_id, eval_vector)
    if ctx is None:
        return []

    # Run all resources in parallel with timeout
    try:
        results = await asyncio.wait_for(
            asyncio.gather(
                *[_process_one(card, ctx) for card in cards],
                return_exceptions=True,
            ),
            timeout=180.0,
        )
    except TimeoutError:
        logger.warning("RAG pipeline timed out")
        return []

    judgments: list[JudgmentResult] = []
    for result in results:
        if isinstance(result, JudgmentResult):
            judgments.append(result)
        elif isinstance(result, Exception):
            logger.warning("Resource processing failed", error=str(result))

    # Sort: use_it first, then adapt_it, then skip_it
    _VERDICT_ORDER = {"use_it": 0, "adapt_it": 1, "skip_it": 2}
    judgments.sort(key=lambda j: _VERDICT_ORDER.get(j.verdict, 3))

    return judgments


async def evaluate_single_resource(
    search_id: str,
    preset: ClassroomPreset,
    title: str,
    url: str,
    source: str,
    snippet: str,
    query: str,
) -> JudgmentResult | None:
    """Phase 2: evaluate one resource.

    Performs per-resource RAG prep (fetch → chunk → embed → Weaviate)
    then runs the 3-call evaluation pipeline.
    Returns None when context has expired or evaluation fails.
    """
    from src.rag.readability import compute_readability

    ctx_data = await _load_eval_context(search_id)
    if ctx_data is None:
        logger.warning(
            "Eval context expired or unavailable",
            search_id=search_id,
        )
        return None

    # Reject URLs that were not in the Phase 1 result set
    top_urls: list[str] = ctx_data.get("top_urls", [])
    if top_urls and url not in top_urls:
        logger.warning(
            "URL not in stored result set",
            url=url,
            search_id=search_id,
        )
        return None

    eval_vector = ctx_data["eval_vector"]
    adv_vector = ctx_data["adv_vector"]

    # --- Per-resource RAG preparation ---
    domain = url.split("/")[2] if "/" in url else url
    metadata: dict = {"source": source}
    if source == "youtube":
        metadata["channel"] = ""
    elif source == "openalex":
        pass  # all fields have defaults
    else:
        metadata["domain"] = domain

    card = ResourceCard(
        title=title,
        url=url,
        source=source,
        type=(
            "video"
            if source == "youtube"
            else (
                "paper" if source == "openalex" else "webpage"
            )
        ),
        snippet=snippet,
        metadata=metadata,
    )

    # 1. Ensure Weaviate collection
    try:
        await asyncio.to_thread(ensure_collection)
    except Exception as e:
        logger.error(
            "Weaviate collection setup failed",
            error=str(e),
        )
        return None

    # 2. Fetch content + readability
    readability_map: dict[str, dict[str, float]] = {}
    try:
        content = await fetch_content(card)
        if isinstance(content, str) and content:
            metrics = compute_readability(content)
            if metrics:
                readability_map[url] = metrics

            chunks = chunk_text(content, heading=title)
            if chunks:
                chunk_texts = [c.text for c in chunks]
                vectors = await embed_texts(chunk_texts)
                await asyncio.to_thread(
                    upsert_chunks,
                    chunks=chunks,
                    resource_url=url,
                    source_type=source,
                    search_id=search_id,
                    vectors=vectors,
                )
    except Exception as e:
        logger.warning(
            "Per-resource RAG prep failed",
            url=url,
            error=str(e),
        )

    # 3. Build context and evaluate
    ctx = _RagContext(
        eval_vector=eval_vector,
        adv_vector=adv_vector,
        readability_map=readability_map,
        search_id=search_id,
        preset=preset,
    )

    return await _process_one(card, ctx)


def _cache_key(preset_id: str, query: str) -> str:
    """Build a deterministic Redis key for search results."""
    raw = f"{preset_id}:{query.lower().strip()}"
    digest = hashlib.sha256(raw.encode()).hexdigest()[:16]
    return f"discovery:result:{digest}"


async def _get_cached(key: str) -> JudgedSearchResponse | None:
    if not settings.REDIS_URL:
        return None
    try:
        import redis.asyncio as aioredis

        r = aioredis.from_url(settings.REDIS_URL)
        try:
            data = await r.get(key)
            if data:
                return JudgedSearchResponse.model_validate_json(data)
        finally:
            await r.aclose()
    except Exception as e:
        logger.debug("Cache read miss", key=key, error=str(e))
    return None


async def _set_cached(key: str, response: JudgedSearchResponse) -> None:
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
) -> JudgedSearchResponse:
    """Run federated search with RAG pipeline and 3-call evaluation.

    1. Check Redis cache
    2. Federated search across all providers (~15 results)
    3. Take top 4 results
    4. RAG pipeline: fetch → chunk → embed → Weaviate →
       Triage + Risk Scanner (parallel, blind) → Final Judge
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

    # Generate provider-tailored queries via the search query agent.
    # Falls back to None (provider defaults) on timeout or failure.
    query_map: dict[str, list[str] | None] = {s: None for s in _SOURCE_KEYS}
    generated_queries: GeneratedSearchQueries | None = None
    try:
        generated_queries = await asyncio.wait_for(
            SearchQueryAgent().run(query=query, preset=preset),
            timeout=10.0,
        )
        if generated_queries is not None:
            # Empty lists fall back to None so providers use their defaults
            query_map["ddgs"] = generated_queries.ddgs or None
            query_map["youtube"] = generated_queries.youtube or None
            query_map["openalex"] = generated_queries.openalex or None
            logger.info(
                "Search query agent succeeded",
                ddgs_queries=generated_queries.ddgs,
                youtube_queries=generated_queries.youtube,
                openalex_queries=generated_queries.openalex,
            )
    except TimeoutError:
        logger.warning("Search query agent timed out - using provider defaults")
    except Exception as e:
        logger.warning(
            "Search query agent failed - using provider defaults",
            error=str(e),
        )

    providers = {
        "ddgs": DdgsProvider(),
        "youtube": YoutubeProvider(),
        "openalex": OpenAlexProvider(),
    }

    tasks = [
        providers[source].search(
            query, preset, limits[source], queries=query_map[source]
        )
        for source in _SOURCE_KEYS
    ]

    raw_results = await asyncio.gather(*tasks, return_exceptions=True)

    errors: list[SourceError] = []
    results_by_source: dict[str, list[ResourceCard]] = {}

    for source, result in zip(_SOURCE_KEYS, raw_results, strict=True):
        if isinstance(result, Exception):
            errors.append(SourceError(source=source, message=_sanitize_error(result)))
            results_by_source[source] = []
        elif isinstance(result, list):
            results_by_source[source] = result
        else:
            results_by_source[source] = []

    # Pre-sort each provider's results by embedding similarity
    eval_query_text = _build_eval_query(preset, query)
    results_by_source, eval_vector, scores_by_url = await _sort_by_relevance(
        eval_query_text, results_by_source
    )

    # Global ranking: flatten, dedupe, pick top-k by embedding score
    all_results, top_cards = _select_candidates(
        results_by_source, scores_by_url, top_k=_TOP_K_EVALUATE
    )

    if not all_results and len(errors) == len(_SOURCE_KEYS):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="All search providers failed. Please try again later.",
        )

    counts_by_source: dict[str, int] = {source: 0 for source in _SOURCE_KEYS}
    for card in all_results:
        counts_by_source[card.source] += 1

    # Run RAG pipeline + evaluation (graceful degradation)
    _VERDICT_SCORE: dict[str, float] = {"use_it": 1.0, "adapt_it": 0.5, "skip_it": 0.0}
    judgments: list[JudgmentResult] = []
    try:
        judgments = await asyncio.wait_for(
            _run_rag_pipeline(
                top_cards, preset, query, search_id, eval_vector=eval_vector
            ),
            timeout=120.0,
        )
        judgment_map = {j.resource_url: j for j in judgments}

        # Attach verdict, relevance score proxy, and reasoning to each card
        for card in all_results:
            if card.url in judgment_map:
                j = judgment_map[card.url]
                card.verdict = j.verdict
                card.relevance_score = _VERDICT_SCORE.get(j.verdict, 0.5)
                card.relevance_reason = j.reasoning_chain

    except Exception as e:
        logger.error(
            "RAG pipeline failed — returning results without evaluations",
            error=str(e),
        )

    # Sort: judged resources first (by verdict proxy), unevaluated at end
    all_results.sort(
        key=lambda card: (
            card.relevance_score if card.relevance_score is not None else -1.0
        ),
        reverse=True,
    )

    response = JudgedSearchResponse(
        query=query,
        preset_id=uuid.UUID(str(preset.id)),
        total_results=len(all_results),
        counts_by_source=counts_by_source,
        results=all_results,
        errors=errors,
        judgments=judgments,
        generated_queries=generated_queries,
    )

    await _set_cached(cache_key, response)
    return response


async def search_resources_stream(
    preset: ClassroomPreset,
    query: str,
) -> AsyncGenerator[SearchStageEvent, None]:
    """Async generator that yields SearchStageEvent at each pipeline stage.

    Mirrors search_resources() but streams progress to the caller via SSE.
    All business logic is delegated to the same helpers used by search_resources().

    Stage sequence (normal flow):
        query_generation  working → done
        federated_search  working → done
        rag_preparation   working → done
        evaluation        working (per resource, = triage + risk scan)
        adversarial       working (per resource, = risk scan in progress)
        evaluation        done    (per resource, after pipeline)
        adversarial       done    (per resource, after pipeline)
        complete          done    (full JudgedSearchResponse)

    Cache hit:
        complete  done  cached=True  (full JudgedSearchResponse)
    """
    # Cache check — emit single complete event and return early
    cache_key = _cache_key(str(preset.id), query)
    cached = await _get_cached(cache_key)
    if cached:
        logger.info("Cache hit (stream)", key=cache_key, query=query)
        yield SearchStageEvent(
            stage="complete",
            status="done",
            cached=True,
            data=cached.model_dump(),
        )
        return

    search_id = str(uuid.uuid4())
    limits = _calculate_limits(preset.source_weights)

    # Stage 1: Query Generation
    yield SearchStageEvent(stage="query_generation", status="working")

    query_map: dict[str, list[str] | None] = {s: None for s in _SOURCE_KEYS}
    generated_queries: GeneratedSearchQueries | None = None
    try:
        generated_queries = await asyncio.wait_for(
            SearchQueryAgent().run(query=query, preset=preset),
            timeout=10.0,
        )
        if generated_queries is not None:
            query_map["ddgs"] = generated_queries.ddgs or None
            query_map["youtube"] = generated_queries.youtube or None
            query_map["openalex"] = generated_queries.openalex or None
            logger.info(
                "Search query agent succeeded (stream)",
                ddgs_queries=generated_queries.ddgs,
                youtube_queries=generated_queries.youtube,
                openalex_queries=generated_queries.openalex,
            )
    except TimeoutError:
        logger.warning(
            "Search query agent timed out (stream) - using provider defaults"
        )
    except Exception as e:
        logger.warning(
            "Search query agent failed (stream) - using provider defaults",
            error=str(e),
        )

    query_gen_data: dict | None = None
    if generated_queries is not None:
        query_gen_data = {
            "ddgs": generated_queries.ddgs,
            "youtube": generated_queries.youtube,
            "openalex": generated_queries.openalex,
        }
    yield SearchStageEvent(
        stage="query_generation",
        status="done",
        data=query_gen_data,
    )

    # Stage 2: Federated Search
    yield SearchStageEvent(stage="federated_search", status="working")

    providers = {
        "ddgs": DdgsProvider(),
        "youtube": YoutubeProvider(),
        "openalex": OpenAlexProvider(),
    }

    tasks = [
        providers[source].search(
            query, preset, limits[source], queries=query_map[source]
        )
        for source in _SOURCE_KEYS
    ]

    raw_results = await asyncio.gather(*tasks, return_exceptions=True)

    errors: list[SourceError] = []
    results_by_source: dict[str, list[ResourceCard]] = {}

    for source, result in zip(_SOURCE_KEYS, raw_results, strict=True):
        if isinstance(result, Exception):
            errors.append(SourceError(source=source, message=_sanitize_error(result)))
            results_by_source[source] = []
        elif isinstance(result, list):
            results_by_source[source] = result
        else:
            results_by_source[source] = []

    if not any(results_by_source.values()) and len(errors) == len(_SOURCE_KEYS):
        error_response = JudgedSearchResponse(
            query=query,
            preset_id=uuid.UUID(str(preset.id)),
            total_results=0,
            counts_by_source={s: 0 for s in _SOURCE_KEYS},
            results=[],
            errors=errors,
            judgments=[],
            generated_queries=generated_queries,
        )
        yield SearchStageEvent(
            stage="complete",
            status="done",
            data=error_response.model_dump(),
        )
        return

    # Stage 3: RAG Preparation (pre-sort + interleave)
    yield SearchStageEvent(stage="rag_preparation", status="working")

    eval_query_text = _build_eval_query(preset, query)
    results_by_source, eval_vector, scores_by_url = await _sort_by_relevance(
        eval_query_text, results_by_source
    )

    # Global ranking: flatten, dedupe, pick top-k by embedding score
    all_results, top_cards = _select_candidates(
        results_by_source, scores_by_url, top_k=_TOP_K_EVALUATE
    )

    counts_by_source: dict[str, int] = {source: 0 for source in _SOURCE_KEYS}
    for card in all_results:
        counts_by_source[card.source] += 1

    yield SearchStageEvent(
        stage="federated_search",
        status="done",
        data={
            "counts": counts_by_source,
            "results": [card.model_dump() for card in all_results],
        },
    )

    # Store only vectors for Phase 2 — NO content fetching here.
    # Phase 2 does per-resource fetch/chunk/embed/evaluate.
    if eval_vector is not None:
        hybrid_text = build_adversarial_hybrid_query_text(
            preset, query
        )
        try:
            adv_vector = await embed_single(hybrid_text)
        except Exception:
            adv_vector = None

        if adv_vector is not None:
            await _store_eval_context(
                search_id,
                _RagContext(
                    eval_vector=eval_vector,
                    adv_vector=adv_vector,
                    readability_map={},
                    search_id=search_id,
                    preset=preset,
                ),
                [card.url for card in top_cards],
            )

    yield SearchStageEvent(stage="rag_preparation", status="done")

    # Phase 1 complete — return results without judgments.
    # The frontend will call GET /evaluate per resource (Phase 2).
    response = JudgedSearchResponse(
        query=query,
        preset_id=uuid.UUID(str(preset.id)),
        total_results=len(all_results),
        counts_by_source=counts_by_source,
        results=all_results,
        errors=errors,
        judgments=[],
        generated_queries=generated_queries,
        search_id=search_id,
    )

    yield SearchStageEvent(
        stage="complete",
        status="done",
        data=response.model_dump(),
    )

    # NOTE: Phase 1 does NOT write to the shared cache because it has no
    # judgments.  Only the non-streaming search_resources() (REST fallback)
    # caches the full response.  This avoids poisoning the cache that both
    # /search and /search/stream share.
