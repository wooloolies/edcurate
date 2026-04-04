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
    ) -> list[ResourceCard]:
        topic = context.topic or ""
        parts = f"{topic} {query} {context.subject}"
        built_query = f"{parts} {context.year_level} resources"
        built_query = built_query.strip()
        region = _country_to_region(context.country)

        loop = asyncio.get_running_loop()
        raw_results: list[dict] = await loop.run_in_executor(
            None,
            partial(_sync_ddgs_search, built_query, region, limit),
        )

        cards: list[ResourceCard] = []
        for item in raw_results:
            url: str = item.get("href", "")
            if not url:
                continue
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
        return cards
