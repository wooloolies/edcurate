"""Tests for global candidate selection replacing round-robin interleaving."""

import pytest

from src.discovery.schemas import (
    DdgsMetadata,
    OpenAlexMetadata,
    ResourceCard,
    YoutubeMetadata,
)


def _make_card(
    title: str,
    snippet: str = "content",
    source: str = "ddgs",
    url: str | None = None,
) -> ResourceCard:
    url = url or f"https://example.com/{title.lower().replace(' ', '-')}"
    metadata_map = {
        "ddgs": DdgsMetadata(domain="example.com"),
        "youtube": YoutubeMetadata(channel="test-channel"),
        "openalex": OpenAlexMetadata(authors=["Author"]),
    }
    type_map = {"ddgs": "webpage", "youtube": "video", "openalex": "paper"}
    return ResourceCard(
        title=title,
        url=url,
        source=source,
        type=type_map.get(source, "webpage"),
        snippet=snippet,
        metadata=metadata_map[source],
    )


# ---------------------------------------------------------------------------
# _select_candidates: global ranking
# ---------------------------------------------------------------------------


class TestSelectCandidatesGlobalRanking:
    """The selector must pick the globally highest-scored candidates."""

    def test_high_score_from_one_provider_beats_low_scores_elsewhere(self):
        from src.discovery.service import _select_candidates

        results_by_source = {
            "ddgs": [
                _make_card("D1", source="ddgs"),
                _make_card("D2", source="ddgs"),
            ],
            "youtube": [
                _make_card("Y1", source="youtube"),
            ],
            "openalex": [
                _make_card("O1", source="openalex"),
                _make_card("O2", source="openalex"),
            ],
        }
        scores = {
            "https://example.com/d1": 0.9,
            "https://example.com/d2": 0.85,
            "https://example.com/y1": 0.3,
            "https://example.com/o1": 0.4,
            "https://example.com/o2": 0.2,
        }

        _, top_cards = _select_candidates(results_by_source, scores, top_k=3)

        top_urls = [c.url for c in top_cards]
        assert top_urls == [
            "https://example.com/d1",
            "https://example.com/d2",
            "https://example.com/o1",
        ]

    def test_returns_all_results_sorted_globally(self):
        from src.discovery.service import _select_candidates

        results_by_source = {
            "ddgs": [_make_card("D1", source="ddgs")],
            "youtube": [_make_card("Y1", source="youtube")],
            "openalex": [_make_card("O1", source="openalex")],
        }
        scores = {
            "https://example.com/d1": 0.5,
            "https://example.com/y1": 0.9,
            "https://example.com/o1": 0.7,
        }

        all_results, _ = _select_candidates(results_by_source, scores, top_k=2)

        assert [c.url for c in all_results] == [
            "https://example.com/y1",
            "https://example.com/o1",
            "https://example.com/d1",
        ]


# ---------------------------------------------------------------------------
# _select_candidates: URL dedup across providers
# ---------------------------------------------------------------------------


class TestSelectCandidatesDedup:
    """Identical URLs across providers must be deduplicated."""

    def test_duplicate_url_keeps_higher_scored_copy(self):
        from src.discovery.service import _select_candidates

        shared_url = "https://example.com/shared"
        results_by_source = {
            "ddgs": [
                _make_card("DDGS copy", source="ddgs", url=shared_url),
            ],
            "youtube": [],
            "openalex": [
                _make_card("OA copy", source="openalex", url=shared_url),
            ],
        }
        scores = {shared_url: 0.8}

        all_results, _ = _select_candidates(results_by_source, scores, top_k=4)

        assert len(all_results) == 1
        assert all_results[0].url == shared_url

    def test_unique_urls_all_preserved(self):
        from src.discovery.service import _select_candidates

        results_by_source = {
            "ddgs": [_make_card("D1", source="ddgs")],
            "youtube": [_make_card("Y1", source="youtube")],
            "openalex": [],
        }
        scores = {
            "https://example.com/d1": 0.6,
            "https://example.com/y1": 0.7,
        }

        all_results, _ = _select_candidates(results_by_source, scores, top_k=4)

        assert len(all_results) == 2


# ---------------------------------------------------------------------------
# _select_candidates: graceful degradation
# ---------------------------------------------------------------------------


class TestSelectCandidatesGracefulDegradation:
    """When pre-sort scores are missing, preserve provider diversity."""

    def test_empty_scores_falls_back_to_round_robin_order(self):
        from src.discovery.service import _select_candidates

        results_by_source = {
            "ddgs": [_make_card(f"D{i}", source="ddgs") for i in range(1, 6)],
            "youtube": [_make_card(f"Y{i}", source="youtube") for i in range(1, 6)],
            "openalex": [_make_card(f"O{i}", source="openalex") for i in range(1, 3)],
        }

        all_results, top_cards = _select_candidates(
            results_by_source, scores_by_url={}, top_k=4
        )

        assert len(all_results) == 12
        assert [c.url for c in top_cards] == [
            "https://example.com/d1",
            "https://example.com/y1",
            "https://example.com/o1",
            "https://example.com/d2",
        ]

    def test_empty_providers_returns_empty(self):
        from src.discovery.service import _select_candidates

        results_by_source = {"ddgs": [], "youtube": [], "openalex": []}
        all_results, top_cards = _select_candidates(
            results_by_source, scores_by_url={}, top_k=4
        )
        assert all_results == []
        assert top_cards == []


# ---------------------------------------------------------------------------
# _select_candidates: counts_by_source consistency
# ---------------------------------------------------------------------------


class TestSelectCandidatesCounts:
    """Source counts must reflect the deduplicated result list."""

    def test_counts_match_deduplicated_list(self):
        from src.discovery.service import _select_candidates

        results_by_source = {
            "ddgs": [
                _make_card("D1", source="ddgs"),
                _make_card("D2", source="ddgs"),
            ],
            "youtube": [_make_card("Y1", source="youtube")],
            "openalex": [],
        }
        scores = {
            "https://example.com/d1": 0.9,
            "https://example.com/d2": 0.5,
            "https://example.com/y1": 0.7,
        }

        all_results, _ = _select_candidates(results_by_source, scores, top_k=4)

        from collections import Counter

        counts = Counter(c.source for c in all_results)
        assert counts["ddgs"] == 2
        assert counts["youtube"] == 1
        assert counts.get("openalex", 0) == 0


# ---------------------------------------------------------------------------
# _sort_by_relevance: now returns scores_by_url
# ---------------------------------------------------------------------------


class TestSortByRelevanceReturnsScores:
    """_sort_by_relevance must return (sorted_results, eval_vector, scores_by_url)."""

    @pytest.mark.asyncio
    async def test_returns_scores_dict(self, monkeypatch):
        from src.discovery import service

        async def mock_embed_single(text):
            return [1.0, 0.0]

        async def mock_embed_texts(texts):
            return [[0.9, 0.1]] * len(texts)

        monkeypatch.setattr(service, "embed_single", mock_embed_single)
        monkeypatch.setattr(service, "embed_texts", mock_embed_texts)

        cards = [_make_card("Card A", source="ddgs")]
        results_by_source = {"ddgs": cards, "youtube": [], "openalex": []}

        _, _, scores = await service._sort_by_relevance(
            "test query", results_by_source
        )

        assert isinstance(scores, dict)
        assert "https://example.com/card-a" in scores
        assert scores["https://example.com/card-a"] == pytest.approx(0.9, abs=0.01)

    @pytest.mark.asyncio
    async def test_returns_empty_scores_on_failure(self, monkeypatch):
        from src.discovery import service

        async def mock_embed_single(text):
            raise RuntimeError("down")

        monkeypatch.setattr(service, "embed_single", mock_embed_single)

        results_by_source = {
            "ddgs": [_make_card("X", source="ddgs")],
            "youtube": [],
            "openalex": [],
        }

        _, eval_vector, scores = await service._sort_by_relevance(
            "test query", results_by_source
        )

        assert eval_vector is None
        assert scores == {}
