from __future__ import annotations

import json
import tempfile
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import structlog

logger = structlog.get_logger(__name__)

ARTIFACT_TYPE_ALIAS = {
    "quiz": "quiz",
    "mindmap": "mind_map",
    "summary": "summary",
    "flashcards": "flashcards",
}


@dataclass(frozen=True)
class ResourceInfo:
    url: str
    source_type: str  # "webpage" | "video" | "paper"


async def generate_artifact(
    resources: list[ResourceInfo],
    artifact_type: str,
) -> dict[str, Any]:
    """Create a temporary NotebookLM notebook, add sources, generate
    artifact, and return JSON.

    The notebook is always deleted after generation (success or failure).
    """
    from notebooklm import NotebookLMClient

    nb_name = f"EdCurate-{uuid.uuid4().hex[:8]}"
    nb_id: str | None = None

    async with await NotebookLMClient.from_storage() as client:
        try:
            nb = await client.notebooks.create(nb_name)
            nb_id = nb.id
            logger.info("notebooklm.notebook_created", notebook_id=nb_id, name=nb_name)

            for res in resources:
                await client.sources.add_url(nb_id, res.url, wait=True)
                logger.info(
                    "notebooklm.source_added", url=res.url, type=res.source_type
                )

            content = await _generate_and_download(client, nb_id, artifact_type)
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
) -> dict[str, Any]:
    """Dispatch generation + download by artifact type."""
    with tempfile.TemporaryDirectory() as tmpdir:
        out_path = Path(tmpdir) / "artifact.json"

        if artifact_type == "quiz":
            status = await client.artifacts.generate_quiz(notebook_id)
            await client.artifacts.wait_for_completion(notebook_id, status.task_id)
            await client.artifacts.download_quiz(
                notebook_id, str(out_path), output_format="json"
            )

        elif artifact_type == "mindmap":
            await client.artifacts.generate_mind_map(notebook_id)
            await client.artifacts.download_mind_map(notebook_id, str(out_path))

        elif artifact_type == "flashcards":
            status = await client.artifacts.generate_flashcards(notebook_id)
            await client.artifacts.wait_for_completion(notebook_id, status.task_id)
            await client.artifacts.download_flashcards(
                notebook_id, str(out_path), output_format="json"
            )

        elif artifact_type == "summary":
            summary_text = await client.notebooks.get_summary(notebook_id)
            return {"summary": summary_text}

        else:
            raise ValueError(f"Unsupported artifact type: {artifact_type}")

        return json.loads(out_path.read_text(encoding="utf-8"))
