from sqlalchemy import distinct, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.curriculum.model import CurriculumEntry


async def list_countries(db: AsyncSession) -> list[dict]:
    result = await db.execute(
        select(
            CurriculumEntry.country_code,
            CurriculumEntry.country_name,
        )
        .where(CurriculumEntry.is_active.is_(True))
        .distinct()
        .order_by(CurriculumEntry.country_name)
    )
    return [{"code": r.country_code, "name": r.country_name} for r in result.all()]


async def list_subjects(db: AsyncSession, country_code: str) -> list[str]:
    result = await db.execute(
        select(distinct(CurriculumEntry.subject))
        .where(
            CurriculumEntry.country_code == country_code,
            CurriculumEntry.is_active.is_(True),
        )
        .order_by(CurriculumEntry.subject)
    )
    return list(result.scalars().all())


async def list_frameworks(
    db: AsyncSession, country_code: str, subject: str
) -> list[str]:
    result = await db.execute(
        select(distinct(CurriculumEntry.framework))
        .where(
            CurriculumEntry.country_code == country_code,
            CurriculumEntry.subject == subject,
            CurriculumEntry.is_active.is_(True),
        )
        .order_by(CurriculumEntry.framework)
    )
    return list(result.scalars().all())


async def list_grades(
    db: AsyncSession, country_code: str, subject: str, framework: str
) -> list[dict]:
    result = await db.execute(
        select(CurriculumEntry.grade, CurriculumEntry.grade_sort)
        .where(
            CurriculumEntry.country_code == country_code,
            CurriculumEntry.subject == subject,
            CurriculumEntry.framework == framework,
            CurriculumEntry.is_active.is_(True),
        )
        .order_by(CurriculumEntry.grade_sort)
    )
    return [{"name": r.grade, "sort_order": r.grade_sort} for r in result.all()]
