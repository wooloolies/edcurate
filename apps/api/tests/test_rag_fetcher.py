import ipaddress

import pytest

from src.rag.fetcher import _is_forbidden_ip, _validate_public_url


def test_is_forbidden_ip_rejects_non_public_ranges() -> None:
    assert _is_forbidden_ip(ipaddress.ip_address("127.0.0.1"))
    assert _is_forbidden_ip(ipaddress.ip_address("10.0.0.8"))
    assert not _is_forbidden_ip(ipaddress.ip_address("8.8.8.8"))


@pytest.mark.asyncio
async def test_validate_public_url_rejects_loopback_literal() -> None:
    with pytest.raises(ValueError, match="public HTTP\\(S\\) URLs"):
        await _validate_public_url("http://127.0.0.1/internal")


@pytest.mark.asyncio
async def test_validate_public_url_rejects_private_dns_resolution(monkeypatch) -> None:
    async def _fake_resolve(_hostname: str, _port: int) -> list[str]:
        return ["10.0.0.5"]

    monkeypatch.setattr("src.rag.fetcher._resolve_host_ips", _fake_resolve)

    with pytest.raises(ValueError, match="public HTTP\\(S\\) URLs"):
        await _validate_public_url("https://internal.example/resource")


@pytest.mark.asyncio
async def test_validate_public_url_allows_public_dns_resolution(monkeypatch) -> None:
    async def _fake_resolve(_hostname: str, _port: int) -> list[str]:
        return ["8.8.8.8"]

    monkeypatch.setattr("src.rag.fetcher._resolve_host_ips", _fake_resolve)

    await _validate_public_url("https://example.com/resource")
