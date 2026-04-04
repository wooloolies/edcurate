"""YouTube Data API v3 search provider."""

import httpx

from src.discovery.providers.base import SearchProvider
from src.discovery.schemas import ResourceCard, YoutubeMetadata
from src.lib.config import settings
from src.presets.model import ClassroomPreset

_YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"

# Country name → ISO 3166-1 alpha-2 region code mapping (subset)
_COUNTRY_REGION_MAP: dict[str, str] = {
    "Australia": "AU",
    "United States": "US",
    "United Kingdom": "GB",
    "Canada": "CA",
    "New Zealand": "NZ",
    "India": "IN",
    "Germany": "DE",
    "France": "FR",
    "Japan": "JP",
    "China": "CN",
    "Brazil": "BR",
    "Mexico": "MX",
    "Spain": "ES",
    "Italy": "IT",
    "Netherlands": "NL",
    "South Korea": "KR",
    "Singapore": "SG",
    "South Africa": "ZA",
}


def _country_to_region_code(country: str) -> str | None:
    return _COUNTRY_REGION_MAP.get(country)


class YoutubeProvider(SearchProvider):
    """Search provider backed by YouTube Data API v3."""

    async def search(
        self,
        query: str,
        context: ClassroomPreset,
        limit: int,
    ) -> list[ResourceCard]:
        if not settings.YOUTUBE_API_KEY:
            return []

        topic = context.topic or ""
        built_query = f"{topic} {query} {context.subject} lesson".strip()

        params: dict[str, str | int] = {
            "key": settings.YOUTUBE_API_KEY,
            "q": built_query,
            "part": "snippet",
            "type": "video",
            "safeSearch": "strict",
            "relevanceLanguage": context.teaching_language,
            "maxResults": limit,
        }
        region_code = _country_to_region_code(context.country)
        if region_code:
            params["regionCode"] = region_code

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(_YOUTUBE_SEARCH_URL, params=params)
            response.raise_for_status()
            data = response.json()

        cards: list[ResourceCard] = []
        for item in data.get("items", []):
            snippet = item.get("snippet", {})
            video_id = item.get("id", {}).get("videoId", "")
            if not video_id:
                continue

            url = f"https://www.youtube.com/watch?v={video_id}"
            thumbnails = snippet.get("thumbnails", {})
            thumbnail_url: str | None = thumbnails.get("medium", {}).get(
                "url"
            ) or thumbnails.get("default", {}).get("url")

            cards.append(
                ResourceCard(
                    title=snippet.get("title", ""),
                    url=url,
                    source="youtube",
                    type="video",
                    snippet=snippet.get("description", ""),
                    thumbnail_url=thumbnail_url,
                    metadata=YoutubeMetadata(
                        channel=snippet.get("channelTitle", ""),
                        duration="",  # Not in search API
                        published_date=snippet.get("publishedAt"),
                    ),
                )
            )
        return cards
