"""YouTube Data API v3 search provider with video detail enrichment."""

import httpx

from src.discovery.providers.base import SearchProvider
from src.discovery.schemas import ResourceCard, YoutubeMetadata
from src.lib.config import settings
from src.lib.logging import get_logger
from src.presets.model import ClassroomPreset

logger = get_logger(__name__)

_YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
_YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos"

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
        queries: list[str] | None = None,
    ) -> list[ResourceCard]:
        if not settings.YOUTUBE_API_KEY:
            return []

        if queries is None:
            queries = [f"{query} {context.subject} lesson".strip()]

        region_code = _country_to_region_code(context.country)
        per_query_limit = max(1, limit // len(queries)) + 2

        all_items: list[dict] = []
        seen_video_ids: set[str] = set()

        async with httpx.AsyncClient(timeout=10.0) as client:
            for q in queries:
                params: dict[str, str | int] = {
                    "key": settings.YOUTUBE_API_KEY,
                    "q": q,
                    "part": "snippet",
                    "type": "video",
                    "safeSearch": "strict",
                    "relevanceLanguage": context.teaching_language,
                    "maxResults": per_query_limit,
                }
                if region_code:
                    params["regionCode"] = region_code

                response = await client.get(_YOUTUBE_SEARCH_URL, params=params)
                response.raise_for_status()
                data = response.json()

                for item in data.get("items", []):
                    vid = item.get("id", {}).get("videoId", "")
                    if vid and vid not in seen_video_ids:
                        seen_video_ids.add(vid)
                        all_items.append(item)

        all_items = all_items[:limit]

        video_ids = [
            item.get("id", {}).get("videoId", "")
            for item in all_items
            if item.get("id", {}).get("videoId")
        ]

        video_details = await self._fetch_video_details(video_ids)

        cards: list[ResourceCard] = []
        for item in all_items:
            snippet = item.get("snippet", {})
            video_id = item.get("id", {}).get("videoId", "")
            if not video_id:
                continue

            url = f"https://www.youtube.com/watch?v={video_id}"
            thumbnails = snippet.get("thumbnails", {})
            thumbnail_url: str | None = thumbnails.get("medium", {}).get(
                "url"
            ) or thumbnails.get("default", {}).get("url")

            details = video_details.get(video_id, {})
            full_description = details.get("description") or snippet.get(
                "description", ""
            )

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
                        duration=details.get("duration", ""),
                        view_count=details.get("view_count"),
                        published_date=snippet.get("publishedAt"),
                        tags=details.get("tags", []),
                        full_description=full_description,
                    ),
                )
            )
        return cards

    async def _fetch_video_details(self, video_ids: list[str]) -> dict[str, dict]:
        """Batch-fetch video details (snippet, contentDetails, statistics)."""
        if not video_ids or not settings.YOUTUBE_API_KEY:
            return {}

        params: dict[str, str] = {
            "key": settings.YOUTUBE_API_KEY,
            "id": ",".join(video_ids),
            "part": "snippet,contentDetails,statistics,topicDetails",
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(_YOUTUBE_VIDEOS_URL, params=params)
                response.raise_for_status()
                data = response.json()
        except Exception as e:
            logger.warning("YouTube videos endpoint failed", error=str(e))
            return {}

        details: dict[str, dict] = {}
        for item in data.get("items", []):
            vid = item.get("id", "")
            snippet = item.get("snippet", {})
            content = item.get("contentDetails", {})
            stats = item.get("statistics", {})

            view_count_raw = stats.get("viewCount")
            details[vid] = {
                "description": snippet.get("description", ""),
                "tags": snippet.get("tags", []),
                "duration": content.get("duration", ""),
                "view_count": int(view_count_raw) if view_count_raw else None,
            }

        return details
