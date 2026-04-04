"""Federated search orchestrator."""

import asyncio
import uuid
from typing import Literal

from src.discovery.providers.ddgs import DdgsProvider
from src.discovery.providers.openalex import OpenAlexProvider
from src.discovery.providers.youtube import YoutubeProvider
from src.discovery.schemas import ResourceCard, SearchResponse, SourceError
from src.presets.model import ClassroomPreset

_TOTAL_RESULTS = 15
_SOURCE_KEYS: list[Literal["ddgs", "youtube", "openalex"]] = [
    "ddgs",
    "youtube",
    "openalex",
]


def _calculate_limits(
    source_weights: dict, total: int = _TOTAL_RESULTS
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
            # Give remaining to last source to avoid rounding loss
            limits[source] = max(1, total - allocated)
        else:
            share = round(weights[source] / total_weight * total)
            limits[source] = max(1, share)
            allocated += limits[source]
    return limits


async def search_resources(
    preset: ClassroomPreset,
    query: str,
) -> SearchResponse:
    """
    Run federated search across all providers in parallel.

    Returns unified SearchResponse. If all providers fail, raises HTTPException 502.
    If 1-2 fail, returns partial results with errors list populated.
    """
    from fastapi import HTTPException, status

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

    all_results: list[ResourceCard] = []
    errors: list[SourceError] = []
    seen_urls: set[str] = set()

    for source, result in zip(_SOURCE_KEYS, raw_results, strict=True):
        if isinstance(result, Exception):
            errors.append(SourceError(source=source, message=str(result)))
        else:
            for card in result:
                if card.url not in seen_urls:
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

    return SearchResponse(
        query=query,
        preset_id=uuid.UUID(str(preset.id)),
        total_results=len(all_results),
        counts_by_source=counts_by_source,
        results=all_results,
        errors=errors,
    )
