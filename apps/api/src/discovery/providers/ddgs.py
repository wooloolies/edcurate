"""DuckDuckGo search provider using the ddgs library."""

import asyncio
from functools import partial
from urllib.parse import urlparse

from src.discovery.providers.base import SearchProvider
from src.discovery.schemas import DdgsMetadata, ResourceCard
from src.presets.model import ClassroomPreset

# Country → DDGS region code mapping (subset; defaults to wt-wt for unmapped)
_COUNTRY_REGION_MAP: dict[str, str] = {
    "Australia": "au-en",
    "United States": "us-en",
    "United Kingdom": "uk-en",
    "Canada": "ca-en",
    "New Zealand": "nz-en",
    "India": "in-en",
    "Germany": "de-de",
    "France": "fr-fr",
    "Japan": "jp-jp",
    "China": "cn-zh",
    "Brazil": "br-pt",
    "Mexico": "mx-es",
    "Spain": "es-es",
    "Italy": "it-it",
    "Netherlands": "nl-nl",
    "South Korea": "kr-kr",
    "Singapore": "sg-en",
    "South Africa": "za-en",
}


def _country_to_region(country: str) -> str:
    """Map a country name to a DDGS region code."""
    return _COUNTRY_REGION_MAP.get(country, "wt-wt")


def _sync_ddgs_search(query: str, region: str, limit: int) -> list[dict]:
    """Synchronous DDGS text search — run in executor to avoid blocking."""
    from ddgs import DDGS

    return list(
        DDGS().text(
            query,
            region=region,
            safesearch="on",
            max_results=limit,
        )
    )


class DdgsProvider(SearchProvider):
    """Search provider backed by DuckDuckGo via duckduckgo-search."""

    async def search(
        self,
        query: str,
        context: ClassroomPreset,
        limit: int,
        queries: list[str] | None = None,
    ) -> list[ResourceCard]:
        region = _country_to_region(context.country)

        if queries is None:
            queries = [
                f"{query} {context.subject} {context.year_level} resources".strip()
            ]

        loop = asyncio.get_running_loop()
        per_query_limit = max(1, limit // len(queries)) + 2

        seen_urls: set[str] = set()
        cards: list[ResourceCard] = []

        for q in queries:
            raw_results: list[dict] = await loop.run_in_executor(
                None,
                partial(_sync_ddgs_search, q, region, per_query_limit),
            )
            for item in raw_results:
                url: str = item.get("href", "")
                if not url or url in seen_urls:
                    continue
                seen_urls.add(url)
                domain = urlparse(url).netloc or url
                cards.append(
                    ResourceCard(
                        title=item.get("title", ""),
                        url=url,
                        source="ddgs",
                        type="webpage",
                        snippet=item.get("body", ""),
                        thumbnail_url=None,
                        metadata=DdgsMetadata(
                            domain=domain,
                            published_date=item.get("published"),
                            language=context.teaching_language,
                        ),
                    )
                )

        return cards[:limit]
