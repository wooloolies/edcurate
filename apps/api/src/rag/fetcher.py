"""Content fetcher — retrieves and extracts clean text from URLs."""

from __future__ import annotations

import asyncio
import ipaddress
import socket
from functools import partial
from typing import TYPE_CHECKING
from urllib.parse import urljoin, urlparse

import httpx
import trafilatura
from google import genai
from google.genai import types
from youtube_transcript_api import YouTubeTranscriptApi

from src.lib.config import settings
from src.lib.logging import get_logger

if TYPE_CHECKING:
    from src.discovery.schemas import ResourceCard

logger = get_logger(__name__)

_TIMEOUT = 15.0
_MAX_CONTENT_LENGTH = 500_000  # ~500KB text limit
_MAX_REDIRECTS = 5
_REDIRECT_STATUS_CODES = {301, 302, 303, 307, 308}


async def fetch_content(card: ResourceCard) -> str:
    """
    Fetch and extract clean text content from a resource card.

    For YouTube videos, tries transcript first, falls back to metadata.
    For web pages, uses trafilatura for clean extraction.
    """
    try:
        if card.source == "youtube":
            transcript = await _fetch_youtube_transcript(card.url)
            if transcript:
                summary = await _summarize_transcript(transcript, card.title)
                return summary if summary else _build_youtube_text(card)
            return _build_youtube_text(card)
        return await _fetch_web_content(card.url)
    except Exception as e:
        logger.warning("Failed to fetch content", url=card.url, error=str(e))
        return ""


def _is_forbidden_ip(
    address: ipaddress.IPv4Address | ipaddress.IPv6Address,
) -> bool:
    """Block non-public IP ranges to reduce SSRF risk."""
    return (
        address.is_private
        or address.is_loopback
        or address.is_link_local
        or address.is_multicast
        or address.is_reserved
        or address.is_unspecified
    )


async def _resolve_host_ips(hostname: str, port: int) -> list[str]:
    """Resolve a hostname to its IP addresses off the event loop."""
    loop = asyncio.get_running_loop()
    addrinfo = await loop.run_in_executor(
        None,
        partial(
            socket.getaddrinfo,
            hostname,
            port,
            type=socket.SOCK_STREAM,
        ),
    )
    return [str(info[4][0]) for info in addrinfo]


async def _validate_public_url(url: str) -> None:
    """Reject non-HTTP(S) or non-public URLs before fetching them."""
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("Only public HTTP(S) URLs can be fetched")

    hostname = parsed.hostname
    if not hostname:
        raise ValueError("URL is missing a hostname")

    normalized_host = hostname.lower()
    if normalized_host == "localhost" or normalized_host.endswith(".localhost"):
        raise ValueError("Only public HTTP(S) URLs can be fetched")

    port = parsed.port or (443 if parsed.scheme == "https" else 80)

    try:
        literal_ip = ipaddress.ip_address(hostname)
    except ValueError:
        resolved_ips = await _resolve_host_ips(hostname, port)
        if not resolved_ips:
            raise ValueError("Host did not resolve to a public IP") from None
        for raw_ip in resolved_ips:
            if _is_forbidden_ip(ipaddress.ip_address(raw_ip)):
                raise ValueError("Only public HTTP(S) URLs can be fetched") from None
        return

    if _is_forbidden_ip(literal_ip):
        raise ValueError("Only public HTTP(S) URLs can be fetched")


async def _fetch_web_content(url: str) -> str:
    """Fetch and extract web page content using trafilatura."""
    async with httpx.AsyncClient(
        timeout=_TIMEOUT,
        follow_redirects=False,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/125.0.0.0 Safari/537.36"
            )
        },
    ) as client:
        current_url = url
        html = ""
        for _ in range(_MAX_REDIRECTS + 1):
            await _validate_public_url(current_url)
            resp = await client.get(current_url)

            if resp.status_code in _REDIRECT_STATUS_CODES:
                location = resp.headers.get("location")
                if not location:
                    resp.raise_for_status()
                current_url = urljoin(str(resp.url), location)
                continue

            resp.raise_for_status()
            html = resp.text[:_MAX_CONTENT_LENGTH]
            break
        else:
            raise ValueError("Too many redirects while fetching content")

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


def _extract_video_id(url: str) -> str | None:
    """Extract video ID from a YouTube URL."""
    parsed = urlparse(url)
    if parsed.hostname in {"www.youtube.com", "youtube.com"}:
        from urllib.parse import parse_qs

        return parse_qs(parsed.query).get("v", [None])[0]
    if parsed.hostname == "youtu.be":
        return parsed.path.lstrip("/")
    return None


_MAX_TRANSCRIPT_CHARS = 30_000


async def _fetch_youtube_transcript(url: str) -> str:
    """Fetch transcript text from a YouTube video.

    Tries manual captions first, then auto-generated.
    Returns joined plain text or empty string on failure.
    """
    video_id = _extract_video_id(url)
    if not video_id:
        return ""

    loop = asyncio.get_running_loop()

    try:
        api = YouTubeTranscriptApi()
        transcript_list = await loop.run_in_executor(
            None,
            partial(api.list, video_id),
        )

        # Prefer manual captions, then auto-generated
        manual = [t for t in transcript_list if not t.is_generated]
        auto = [t for t in transcript_list if t.is_generated]
        target = manual[0] if manual else (auto[0] if auto else None)

        if not target:
            return ""

        result = await loop.run_in_executor(
            None,
            partial(api.fetch, video_id, languages=[target.language_code]),
        )

        text = " ".join(snippet.text for snippet in result.snippets)
        return text[:_MAX_TRANSCRIPT_CHARS]
    except Exception as e:
        logger.debug(
            "YouTube transcript unavailable, falling back to metadata",
            video_id=video_id,
            error=str(e),
        )
        return ""


_SUMMARIZE_PROMPT = """\
Summarize the following video transcript into a structured abstract.
Include: main topics covered, key concepts explained, and methodology used.
Keep it concise (300-500 words). Write in clear, formal prose — not bullet points.

Video Title: {title}

Transcript:
{transcript}"""

_SUMMARIZE_MODEL = "gemini-2.5-flash"


async def _summarize_transcript(transcript: str, title: str) -> str:
    """Summarize raw transcript into a structured educational abstract via Gemini."""
    try:
        client = genai.Client(
            vertexai=True,
            project=settings.GOOGLE_CLOUD_PROJECT,
            location="us-central1",
        )

        prompt = _SUMMARIZE_PROMPT.format(
            title=title,
            transcript=transcript[:_MAX_TRANSCRIPT_CHARS],
        )

        response = await asyncio.to_thread(
            client.models.generate_content,
            model=_SUMMARIZE_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.1,
            ),
        )

        return response.text or ""
    except Exception as e:
        logger.warning("Transcript summarization failed", error=str(e))
        return ""


def _build_youtube_text(card: ResourceCard) -> str:
    """Build rich text from YouTube video metadata for chunking."""
    from src.discovery.schemas import YoutubeMetadata

    parts: list[str] = [f"Title: {card.title}"]

    if isinstance(card.metadata, YoutubeMetadata):
        meta = card.metadata
        if meta.channel:
            parts.append(f"Channel: {meta.channel}")
        if meta.duration:
            parts.append(f"Duration: {meta.duration}")
        if meta.tags:
            parts.append(f"Tags: {', '.join(meta.tags[:20])}")
        if meta.full_description:
            parts.append(f"\n{meta.full_description}")
        elif card.snippet:
            parts.append(f"\n{card.snippet}")
    elif card.snippet:
        parts.append(f"\n{card.snippet}")

    return "\n".join(parts)
