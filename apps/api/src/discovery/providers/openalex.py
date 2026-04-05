"""OpenAlex works search provider."""

import httpx

from src.discovery.providers.base import SearchProvider
from src.discovery.schemas import OpenAlexMetadata, ResourceCard
from src.lib.config import settings
from src.presets.model import ClassroomPreset

_OPENALEX_WORKS_URL = "https://api.openalex.org/works"

# Publishers excluded due to peer-review integrity concerns, mass retractions,
# or institutional non-recognition (Malaysia, China, Finland, Czech Republic).
_EXCLUDED_PUBLISHERS = [
    "https://openalex.org/P4310310987",  # MDPI
    "https://openalex.org/P4310320527",  # Frontiers Media
    "https://openalex.org/P4310319869",  # Hindawi (11,300+ retractions, shut down 2024)
    "https://openalex.org/P4310320466",  # OMICS International (FTC lawsuit, $50M fine)
]


def _reconstruct_abstract(
    abstract_index: dict[str, list[int]] | None,
) -> str:
    """Reconstruct OpenAlex abstract text from the inverted index."""
    if not abstract_index:
        return ""

    position_to_word: dict[int, str] = {}
    for word, positions in abstract_index.items():
        for position in positions:
            position_to_word[position] = word

    return " ".join(
        position_to_word[position]
        for position in sorted(position_to_word)
    )


class OpenAlexProvider(SearchProvider):
    """Search provider backed by the OpenAlex public API."""

    async def search(
        self,
        query: str,
        context: ClassroomPreset,
        limit: int,
    ) -> list[ResourceCard]:
        topic = context.topic or ""
        built_query = f"{topic} {query}".strip() if topic else query

        exclusion_filters = ",".join(
            f"primary_location.source.publisher_lineage:!{pid}"
            for pid in _EXCLUDED_PUBLISHERS
        )

        params: dict[str, str | int] = {
            "search": built_query,
            "filter": exclusion_filters,
            "per_page": limit,
            "select": (
                "id,title,primary_location,authorships,"
                "abstract_inverted_index,cited_by_count,doi,publication_date"
            ),
        }
        if settings.OPENALEX_API_KEY:
            params["api_key"] = settings.OPENALEX_API_KEY

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                _OPENALEX_WORKS_URL,
                params=params,
                headers={"User-Agent": "edcurate/1.0 (mailto:admin@edcurate.app)"},
            )
            response.raise_for_status()
            data = response.json()

        cards: list[ResourceCard] = []
        for work in data.get("results", []):
            # Resolve landing page URL
            primary_location = work.get("primary_location") or {}
            landing_page = primary_location.get("landing_page_url") or ""
            doi = work.get("doi") or ""
            url = landing_page or doi or work.get("id", "")
            if not url:
                continue

            # Authors
            authors: list[str] = []
            for authorship in work.get("authorships", []):
                author = authorship.get("author", {})
                display_name = author.get("display_name")
                if display_name:
                    authors.append(display_name)

            # Journal from primary_location source
            source = primary_location.get("source") or {}
            journal: str | None = source.get("display_name")

            # Abstract is not included in select, use empty snippet
            title: str = work.get("title") or ""
            abstract = _reconstruct_abstract(work.get("abstract_inverted_index"))

            cards.append(
                ResourceCard(
                    title=title,
                    url=url,
                    source="openalex",
                    type="paper",
                    snippet=abstract
                    or (f"Authors: {', '.join(authors[:3])}" if authors else ""),
                    thumbnail_url=None,
                    metadata=OpenAlexMetadata(
                        authors=authors,
                        journal=journal,
                        citation_count=work.get("cited_by_count"),
                        doi=doi or None,
                        published_date=work.get("publication_date"),
                    ),
                )
            )
        return cards
