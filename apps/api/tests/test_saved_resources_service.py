from datetime import UTC, datetime
from types import SimpleNamespace
from uuid import uuid4

import httpx
import pytest
from sqlalchemy.dialects import postgresql

from src.agents.schemas import JudgmentResult, MetricResult
from src.discovery.schemas import CustomMetadata, ResourceCard
from src.saved_resources.schemas import AddCustomLinkRequest
from src.saved_resources.service import _dump_eval_data, add_custom_link


class _ScalarOneOrNoneResult:
    def __init__(self, value: object | None) -> None:
        self._value = value

    def scalar_one_or_none(self) -> object | None:
        return self._value


class _ScalarOneResult:
    def __init__(self, value: object) -> None:
        self._value = value

    def scalar_one(self) -> object:
        return self._value


class _FakeAsyncClient:
    def __init__(self, *_args: object, **_kwargs: object) -> None:
        pass

    async def __aenter__(self) -> "_FakeAsyncClient":
        return self

    async def __aexit__(
        self,
        _exc_type: object,
        _exc: object,
        _tb: object,
    ) -> None:
        return None

    async def get(self, _url: str, *, follow_redirects: bool = True) -> SimpleNamespace:
        assert follow_redirects is True
        return SimpleNamespace(text="<html><head></head><body></body></html>")


class _DB:
    def __init__(self, preset: object, saved: object) -> None:
        self._preset = preset
        self._saved = saved
        self.calls: list[object] = []

    def add(self, _instance: object) -> None:
        pass

    async def flush(self) -> None:
        pass

    async def commit(self) -> None:
        pass

    async def execute(self, statement: object) -> object:
        self.calls.append(statement)
        match len(self.calls):
            case 1:
                return _ScalarOneOrNoneResult(self._preset)
            case 2:
                return _ScalarOneOrNoneResult(None)
            case 3:
                return _ScalarOneResult(self._saved)
            case _:
                raise AssertionError("Unexpected DB.execute call")


def test_dump_eval_data_returns_none() -> None:
    assert _dump_eval_data(None) is None


def test_dump_eval_data_serializes_judgment_result() -> None:
    judgment = JudgmentResult(
        resource_url="https://example.com/matrix",
        verdict="skip_it",
        confidence="high",
        curriculum_fit=MetricResult(rating="weak", reason="Too advanced"),
        accessibility=MetricResult(rating="weak", reason="Too advanced"),
        trustworthiness=MetricResult(rating="adequate", reason="Accurate"),
        reasoning_chain="Matrices are out of scope for Year 7.",
    )

    assert _dump_eval_data(judgment) == judgment.model_dump(mode="json")


@pytest.mark.asyncio
async def test_add_custom_link_duplicate_uses_request_search_query(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    user_id = uuid4()
    preset_id = uuid4()
    saved_id = uuid4()
    search_query = "fractions practice"
    resource_url = "https://example.com/fractions"

    monkeypatch.setattr(httpx, "AsyncClient", _FakeAsyncClient)

    col_id = uuid4()
    col = SimpleNamespace(
        id=col_id, preset_id=preset_id, search_query=search_query, user_id=user_id
    )
    resource_data = ResourceCard(
        title="Fractions resource",
        url=resource_url,
        source="custom",
        type="webpage",
        snippet="example.com",
        metadata=CustomMetadata(
            domain="example.com",
            og_title="Fractions resource",
            og_description="",
            og_image=None,
        ),
    ).model_dump(mode="json")
    saved = SimpleNamespace(
        id=saved_id,
        preset_id=preset_id,
        search_query=search_query,
        resource_url=resource_url,
        resource_data=resource_data,
        evaluation_data=None,
        saved_at=datetime.now(UTC),
    )
    db = _DB(col, saved)

    response = await add_custom_link(
        db,
        user_id,
        AddCustomLinkRequest(
            preset_id=preset_id,
            search_query=search_query,
            url=resource_url,
        ),
    )

    fallback_query = db.calls[2].compile(
        dialect=postgresql.dialect(),
        compile_kwargs={"literal_binds": True},
    )
    fallback_sql = str(fallback_query)

    assert response.id == saved_id
    assert f"saved_resources.collection_id = '{col_id}'" in fallback_sql
