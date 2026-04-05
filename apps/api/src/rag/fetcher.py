"""Content fetcher — retrieves and extracts clean text from URLs."""

import asyncio
from functools import partial

import httpx
import trafilatura

from src.lib.logging import get_logger

logger = get_logger(__name__)

_TIMEOUT = 15.0
_MAX_CONTENT_LENGTH = 500_000  # ~500KB text limit


async def fetch_content(url: str, source_type: str = "ddgs") -> str:
    """
    Fetch and extract clean text content from a URL.

    For YouTube videos, extracts title + description.
    For papers (OpenAlex), returns the abstract text.
    For web pages, uses trafilatura for clean extraction.
    """
    try:
        if source_type == "youtube":
            return await _fetch_youtube_text(url)
        return await _fetch_web_content(url)
    except Exception as e:
        logger.warning("Failed to fetch content", url=url, error=str(e))
        return ""


async def _fetch_web_content(url: str) -> str:
    """Fetch and extract web page content using trafilatura."""
    async with httpx.AsyncClient(
        timeout=_TIMEOUT,
        follow_redirects=True,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/125.0.0.0 Safari/537.36"
            )
        },
    ) as client:
        resp = await client.get(url)
        resp.raise_for_status()

    html = resp.text[:_MAX_CONTENT_LENGTH]

    loop = asyncio.get_running_loop()
    text = await loop.run_in_executor(
        None,
        partial(
            trafilatura.extract,
            html,
            include_comments=False,
            include_tables=True,
            favor_recall=True,
        ),
    )
    return text or ""


async def _fetch_youtube_text(url: str) -> str:
    """Extract text from YouTube video metadata."""
    # For POC: fetch the YouTube page and extract what we can
    # In production, would use YouTube Data API for captions
    try:
        return await _fetch_web_content(url)
    except Exception:
        return ""
