from __future__ import annotations

import json
import tempfile
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, cast

import structlog

from src.lib.config import settings

logger = structlog.get_logger(__name__)


@dataclass(frozen=True)
class ResourceInfo:
    url: str
    source_type: str  # "webpage" | "video" | "paper"


class NotebookLMConfigurationError(RuntimeError):
    """NotebookLM authentication is not available in this runtime."""


async def generate_artifact(
    resources: list[ResourceInfo],
    artifact_type: str,
    options: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Create a temporary NotebookLM notebook, add sources, generate
    artifact, and return JSON.

    The notebook is always deleted after generation (success or failure).
    """
    from notebooklm import NotebookLMClient

    nb_name = f"EdCurate-{uuid.uuid4().hex[:8]}"
    nb_id: str | None = None

    try:
        client_context = await NotebookLMClient.from_storage(
            path=settings.NOTEBOOKLM_STORAGE_STATE_PATH
        )
    except FileNotFoundError as exc:
        raise NotebookLMConfigurationError(
            "NotebookLM storage state is not configured"
        ) from exc

    async with client_context as client:
        try:
            nb = await client.notebooks.create(nb_name)
            nb_id = nb.id
            logger.info("notebooklm.notebook_created", notebook_id=nb_id, name=nb_name)

            for res in resources:
                await client.sources.add_url(nb_id, res.url, wait=True)
                logger.info(
                    "notebooklm.source_added", url=res.url, type=res.source_type
                )

            content = await _generate_and_download(
                client, nb_id, artifact_type, options
            )
            logger.info("notebooklm.artifact_generated", type=artifact_type)
            return content

        finally:
            if nb_id is not None:
                try:
                    await client.notebooks.delete(nb_id)
                    logger.info("notebooklm.notebook_deleted", notebook_id=nb_id)
                except Exception:
                    logger.warning(
                        "notebooklm.notebook_delete_failed",
                        notebook_id=nb_id,
                        exc_info=True,
                    )


async def _generate_and_download(
    client: Any,
    notebook_id: str,
    artifact_type: str,
    options: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Dispatch generation + download by artifact type."""
    with tempfile.TemporaryDirectory() as tmpdir:
        out_path = Path(tmpdir) / "artifact.json"

        if artifact_type == "quiz":
            kwargs = _build_quiz_kwargs(options)
            status = await client.artifacts.generate_quiz(notebook_id, **kwargs)
            await client.artifacts.wait_for_completion(notebook_id, status.task_id)
            await client.artifacts.download_quiz(
                notebook_id, str(out_path), output_format="json"
            )

        elif artifact_type == "mindmap":
            await client.artifacts.generate_mind_map(notebook_id)
            await client.artifacts.download_mind_map(notebook_id, str(out_path))

        elif artifact_type == "flashcards":
            kwargs = _build_quiz_kwargs(options)
            status = await client.artifacts.generate_flashcards(notebook_id, **kwargs)
            await client.artifacts.wait_for_completion(notebook_id, status.task_id)
            await client.artifacts.download_flashcards(
                notebook_id, str(out_path), output_format="json"
            )

        elif artifact_type == "summary":
            summary_text = await client.notebooks.get_summary(notebook_id)
            return {"summary": summary_text}

        elif artifact_type == "study_guide":
            kwargs = _build_report_kwargs(options)
            status = await client.artifacts.generate_study_guide(
                notebook_id, **kwargs
            )
            await client.artifacts.wait_for_completion(notebook_id, status.task_id)
            out_path = Path(tmpdir) / "artifact.md"
            await client.artifacts.download_report(notebook_id, str(out_path))
            return {"study_guide": out_path.read_text(encoding="utf-8")}

        elif artifact_type == "briefing_doc":
            from notebooklm import ReportFormat

            kwargs = _build_report_kwargs(options)
            status = await client.artifacts.generate_report(
                notebook_id, report_format=ReportFormat.BRIEFING_DOC, **kwargs
            )
            await client.artifacts.wait_for_completion(notebook_id, status.task_id)
            out_path = Path(tmpdir) / "artifact.md"
            await client.artifacts.download_report(notebook_id, str(out_path))
            return {"briefing_doc": out_path.read_text(encoding="utf-8")}

        else:
            raise ValueError(f"Unsupported artifact type: {artifact_type}")

        content = json.loads(out_path.read_text(encoding="utf-8"))
        if not isinstance(content, dict):
            raise ValueError(
                "NotebookLM artifact download did not return a JSON object"
            )
        return cast(dict[str, Any], content)


def _build_quiz_kwargs(options: dict[str, Any] | None) -> dict[str, Any]:
    """Map generation options to generate_quiz / generate_flashcards kwargs."""
    if not options:
        return {}

    from notebooklm import QuizDifficulty, QuizQuantity

    kwargs: dict[str, Any] = {}
    if q := options.get("quantity"):
        kwargs["quantity"] = QuizQuantity[q.upper()]
    if d := options.get("difficulty"):
        kwargs["difficulty"] = QuizDifficulty[d.upper()]
    if inst := options.get("instructions"):
        kwargs["instructions"] = inst
    return kwargs


def _build_report_kwargs(options: dict[str, Any] | None) -> dict[str, Any]:
    """Map generation options to generate_study_guide / generate_report kwargs."""
    if not options:
        return {}

    kwargs: dict[str, Any] = {}
    if lang := options.get("language"):
        kwargs["language"] = lang
    if inst := options.get("instructions"):
        kwargs["extra_instructions"] = inst
    return kwargs
