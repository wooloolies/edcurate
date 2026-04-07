from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory


def _load_script_directory() -> ScriptDirectory:
    config = Config(
        str(Path(__file__).resolve().parents[1] / "alembic.ini")
    )
    return ScriptDirectory.from_config(config)


def test_generated_artifacts_revision_keeps_original_parent() -> None:
    script = _load_script_directory()

    revision = script.get_revision("c27674d0b6c1")

    assert revision is not None
    assert revision.down_revision == "8559518b168b"


def test_migration_history_has_single_merged_head() -> None:
    script = _load_script_directory()

    revision = script.get_revision("e6f7a8b9c0d1")

    assert revision is not None
    assert set(revision.down_revision) == {"5899875c22d2", "c27674d0b6c1"}
    assert script.get_current_head() == "e6f7a8b9c0d1"
