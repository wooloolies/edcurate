"""Content fetcher — retrieves and extracts clean text from URLs."""

import asyncio
import ipaddress
import socket
from functools import partial
from urllib.parse import urljoin, urlparse

import httpx
import trafilatura

from src.lib.logging import get_logger

logger = get_logger(__name__)

_TIMEOUT = 15.0
_MAX_CONTENT_LENGTH = 500_000  # ~500KB text limit
_MAX_REDIRECTS = 5
_REDIRECT_STATUS_CODES = {301, 302, 303, 307, 308}


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
                raise ValueError("Only public HTTP(S) URLs can be fetched")
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


async def _fetch_youtube_text(url: str) -> str:
    """Extract text from YouTube video metadata."""
    # For POC: fetch the YouTube page and extract what we can
    # In production, would use YouTube Data API for captions
    try:
        return await _fetch_web_content(url)
    except Exception:
        return ""
