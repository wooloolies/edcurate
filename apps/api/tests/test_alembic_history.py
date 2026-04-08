import importlib.util
from pathlib import Path
from types import ModuleType, SimpleNamespace

from alembic.config import Config
from alembic.script import ScriptDirectory
from pytest import MonkeyPatch


def _load_script_directory() -> ScriptDirectory:
    config = Config(
        str(Path(__file__).resolve().parents[1] / "alembic.ini")
    )
    return ScriptDirectory.from_config(config)


def _load_revision_module(filename: str) -> ModuleType:
    path = Path(__file__).resolve().parents[1] / "alembic" / "versions" / filename
    spec = importlib.util.spec_from_file_location(filename.removesuffix(".py"), path)
    assert spec is not None
    assert spec.loader is not None

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_generated_artifacts_revision_keeps_original_parent() -> None:
    script = _load_script_directory()

    revision = script.get_revision("c27674d0b6c1")

    assert revision is not None
    assert revision.down_revision == "8559518b168b"


def test_migration_history_has_single_merged_head() -> None:
    script = _load_script_directory()

    revision = script.get_revision("a2b3c4d5e6f7")

    assert revision is not None
    assert set(revision.down_revision) == {"465be38b13e8", "e7f8a9b0c1d2"}
    assert script.get_current_head() == "a2b3c4d5e6f7"


def test_password_hash_migration_checks_column_presence(
    monkeypatch: MonkeyPatch,
) -> None:
    module = _load_revision_module("b2c3d4e5f6a7_add_password_hash.py")

    class FakeResult:
        def __init__(self, exists: bool) -> None:
            self._exists = exists

        def fetchone(self) -> tuple[int] | None:
            return (1,) if self._exists else None

    class FakeConnection:
        def __init__(self, exists: bool) -> None:
            self._exists = exists

        def execute(self, _statement: object) -> FakeResult:
            return FakeResult(self._exists)

    added: list[tuple[str, object]] = []
    dropped: list[tuple[str, str]] = []

    monkeypatch.setattr(
        module,
        "op",
        SimpleNamespace(
            get_bind=lambda: FakeConnection(False),
            add_column=lambda table, column: added.append((table, column)),
            drop_column=lambda table, column: dropped.append((table, column)),
        ),
    )
    module.upgrade()
    assert len(added) == 1

    monkeypatch.setattr(
        module,
        "op",
        SimpleNamespace(
            get_bind=lambda: FakeConnection(True),
            add_column=lambda table, column: added.append((table, column)),
            drop_column=lambda table, column: dropped.append((table, column)),
        ),
    )
    module.upgrade()
    assert len(added) == 1

    monkeypatch.setattr(
        module,
        "op",
        SimpleNamespace(
            get_bind=lambda: FakeConnection(False),
            add_column=lambda table, column: added.append((table, column)),
            drop_column=lambda table, column: dropped.append((table, column)),
        ),
    )
    module.downgrade()
    assert dropped == []

    monkeypatch.setattr(
        module,
        "op",
        SimpleNamespace(
            get_bind=lambda: FakeConnection(True),
            add_column=lambda table, column: added.append((table, column)),
            drop_column=lambda table, column: dropped.append((table, column)),
        ),
    )
    module.downgrade()
    assert dropped == [("users", "password_hash")]
