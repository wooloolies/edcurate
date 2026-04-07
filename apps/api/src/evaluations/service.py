"""Evaluation persistence service."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.agents.schemas import JudgmentResult
from src.evaluations.model import ResourceEvaluation


async def save_evaluation(
    db: AsyncSession,
    user_id: uuid.UUID,
    preset_id: uuid.UUID,
    resource_url: str,
    search_query: str,
    judgment: JudgmentResult,
) -> uuid.UUID:
    """Save or update an evaluation result. Returns the evaluation ID."""
    # Check for existing evaluation (upsert semantics)
    stmt = select(ResourceEvaluation).where(
        ResourceEvaluation.preset_id == preset_id,
        ResourceEvaluation.resource_url == resource_url,
        ResourceEvaluation.search_query == search_query,
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing:
        existing.judgment_data = judgment.model_dump(mode="json")
        await db.flush()
        return existing.id

    row = ResourceEvaluation(
        user_id=user_id,
        preset_id=preset_id,
        resource_url=resource_url,
        search_query=search_query,
        judgment_data=judgment.model_dump(mode="json"),
    )
    db.add(row)
    await db.flush()
    return row.id


async def get_evaluation(
    db: AsyncSession,
    evaluation_id: uuid.UUID,
) -> ResourceEvaluation | None:
    """Fetch an evaluation by ID."""
    result = await db.execute(
        select(ResourceEvaluation).where(ResourceEvaluation.id == evaluation_id)
    )
    return result.scalar_one_or_none()
