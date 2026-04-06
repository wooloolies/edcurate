"""Tests for _sort_by_relevance pre-sort function."""

import pytest

from src.discovery.schemas import DdgsMetadata, ResourceCard


def _make_card(title: str, snippet: str, source: str = "ddgs") -> ResourceCard:
    """Helper to create a minimal ResourceCard for testing."""
    return ResourceCard(
        title=title,
        url=f"https://example.com/{title.lower().replace(' ', '-')}",
        source=source,
        type="webpage",
        snippet=snippet,
        metadata=DdgsMetadata(domain="example.com"),
    )


@pytest.mark.asyncio
async def test_sort_by_relevance_sorts_by_cosine_similarity(monkeypatch):
    """Results should be sorted by cosine similarity descending within each provider."""
    from src.discovery import service

    async def mock_embed_single(text):
        return [1.0, 0.0, 0.0]

    async def mock_embed_texts(texts):
        vectors_by_index = [
            [0.1, 0.9, 0.0],
            [0.9, 0.1, 0.0],
            [0.5, 0.5, 0.0],
        ]
        return vectors_by_index[: len(texts)]

    monkeypatch.setattr(service, "embed_single", mock_embed_single)
    monkeypatch.setattr(service, "embed_texts", mock_embed_texts)

    cards = [
        _make_card("Low Match", "irrelevant content"),
        _make_card("High Match", "very relevant content"),
        _make_card("Medium Match", "somewhat relevant"),
    ]

    results_by_source = {"ddgs": cards, "youtube": [], "openalex": []}

    sorted_results, eval_vector = await service._sort_by_relevance(
        "test query", results_by_source
    )

    assert eval_vector == [1.0, 0.0, 0.0]
    sorted_ddgs = sorted_results["ddgs"]
    assert sorted_ddgs[0].title == "High Match"
    assert sorted_ddgs[1].title == "Medium Match"
    assert sorted_ddgs[2].title == "Low Match"


@pytest.mark.asyncio
async def test_sort_by_relevance_skips_empty_providers(monkeypatch):
    """Empty provider lists should not trigger embedding calls."""
    from src.discovery import service

    embed_texts_calls = []

    async def mock_embed_single(text):
        return [1.0, 0.0]

    async def mock_embed_texts(texts):
        embed_texts_calls.append(texts)
        return [[0.5, 0.5]] * len(texts)

    monkeypatch.setattr(service, "embed_single", mock_embed_single)
    monkeypatch.setattr(service, "embed_texts", mock_embed_texts)

    results_by_source = {
        "ddgs": [_make_card("Only Card", "content")],
        "youtube": [],
        "openalex": [],
    }

    sorted_results, _ = await service._sort_by_relevance(
        "test query", results_by_source
    )

    assert len(embed_texts_calls) == 1
    assert len(sorted_results["ddgs"]) == 1
    assert sorted_results["youtube"] == []
    assert sorted_results["openalex"] == []


@pytest.mark.asyncio
async def test_sort_by_relevance_graceful_on_embed_failure(monkeypatch):
    """If embedding fails, return unsorted results and eval_vector=None."""
    from src.discovery import service

    async def mock_embed_single(text):
        raise RuntimeError("Vertex AI is down")

    monkeypatch.setattr(service, "embed_single", mock_embed_single)

    cards = [
        _make_card("Card A", "content a"),
        _make_card("Card B", "content b"),
    ]
    results_by_source = {"ddgs": cards, "youtube": [], "openalex": []}

    sorted_results, eval_vector = await service._sort_by_relevance(
        "test query", results_by_source
    )

    assert eval_vector is None
    assert sorted_results["ddgs"][0].title == "Card A"
    assert sorted_results["ddgs"][1].title == "Card B"


@pytest.mark.asyncio
async def test_sort_by_relevance_truncates_long_snippets(monkeypatch):
    """Snippets longer than 4000 chars should be truncated before embedding."""
    from src.discovery import service

    captured_texts = []

    async def mock_embed_single(text):
        return [1.0]

    async def mock_embed_texts(texts):
        captured_texts.extend(texts)
        return [[0.5]] * len(texts)

    monkeypatch.setattr(service, "embed_single", mock_embed_single)
    monkeypatch.setattr(service, "embed_texts", mock_embed_texts)

    long_snippet = "x" * 10000
    results_by_source = {
        "ddgs": [_make_card("Title", long_snippet)],
        "youtube": [],
        "openalex": [],
    }

    await service._sort_by_relevance("test query", results_by_source)

    assert len(captured_texts) == 1
    assert len(captured_texts[0]) == 4000
