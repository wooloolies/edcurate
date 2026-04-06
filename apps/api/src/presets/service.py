import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.common.models.pagination import PaginatedResponse, PaginationParams
from src.presets.model import ClassroomPreset
from src.presets.schemas import PresetCreate, PresetResponse, PresetUpdate


async def create_preset(
    db: AsyncSession,
    user_id: uuid.UUID,
    data: PresetCreate,
) -> ClassroomPreset:
    """Create a new classroom preset for the user."""
    preset = ClassroomPreset(
        user_id=user_id,
        name=data.name,
        is_default=data.is_default,
        curriculum_framework=data.curriculum_framework,
        subject=data.subject,
        year_level=data.year_level,
        country=data.country,
        state_region=data.state_region,
        city=data.city,
        teaching_language=data.teaching_language,
        class_size=data.class_size,
        eal_d_students=data.eal_d_students,
        reading_support_students=data.reading_support_students,
        extension_students=data.extension_students,
        student_interests=data.student_interests,
        language_backgrounds=data.language_backgrounds,
        average_reading_level=data.average_reading_level,
        source_weights=data.source_weights.model_dump(),
        additional_notes=data.additional_notes,
    )

    # If this is set as default, clear any existing default first
    if data.is_default:
        await db.execute(
            update(ClassroomPreset)
            .where(
                ClassroomPreset.user_id == user_id,
                ClassroomPreset.is_default.is_(True),
            )
            .values(is_default=False)
        )

    db.add(preset)
    await db.flush()
    await db.refresh(preset)
    return preset


async def list_presets(
    db: AsyncSession,
    user_id: uuid.UUID,
    pagination: PaginationParams,
) -> PaginatedResponse[PresetResponse]:
    """List all presets for a user with pagination."""
    count_result = await db.execute(
        select(func.count())
        .select_from(ClassroomPreset)
        .where(ClassroomPreset.user_id == user_id)
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(ClassroomPreset)
        .where(ClassroomPreset.user_id == user_id)
        .order_by(ClassroomPreset.is_default.desc(), ClassroomPreset.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.limit)
    )
    presets = list(result.scalars().all())

    return PaginatedResponse[PresetResponse].create(
        data=[PresetResponse.model_validate(p) for p in presets],
        total=total,
        page=pagination.page,
        limit=pagination.limit,
    )


async def get_preset(
    db: AsyncSession,
    user_id: uuid.UUID,
    preset_id: uuid.UUID,
) -> ClassroomPreset:
    """Get a single preset by id, scoped to user."""
    result = await db.execute(
        select(ClassroomPreset).where(
            ClassroomPreset.id == preset_id,
            ClassroomPreset.user_id == user_id,
        )
    )
    preset = result.scalar_one_or_none()
    if preset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preset not found",
        )
    return preset


async def update_preset(
    db: AsyncSession,
    user_id: uuid.UUID,
    preset_id: uuid.UUID,
    data: PresetUpdate,
) -> ClassroomPreset:
    """Full update of a preset, scoped to user."""
    preset = await get_preset(db, user_id, preset_id)

    # If switching to default, clear old default first
    if data.is_default and not preset.is_default:
        await db.execute(
            update(ClassroomPreset)
            .where(
                ClassroomPreset.user_id == user_id,
                ClassroomPreset.is_default.is_(True),
            )
            .values(is_default=False)
        )

    preset.name = data.name
    preset.is_default = data.is_default
    preset.curriculum_framework = data.curriculum_framework
    preset.subject = data.subject
    preset.year_level = data.year_level
    preset.country = data.country
    preset.state_region = data.state_region
    preset.city = data.city
    preset.teaching_language = data.teaching_language
    preset.class_size = data.class_size
    preset.eal_d_students = data.eal_d_students
    preset.reading_support_students = data.reading_support_students
    preset.extension_students = data.extension_students
    preset.student_interests = data.student_interests
    preset.language_backgrounds = data.language_backgrounds
    preset.average_reading_level = data.average_reading_level
    preset.source_weights = data.source_weights.model_dump()
    preset.additional_notes = data.additional_notes

    await db.flush()
    await db.refresh(preset)
    return preset


async def delete_preset(
    db: AsyncSession,
    user_id: uuid.UUID,
    preset_id: uuid.UUID,
) -> None:
    """Delete a preset. Raises 409 if preset is the default."""
    preset = await get_preset(db, user_id, preset_id)

    if preset.is_default:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Cannot delete the default preset. Set another preset as default first."
            ),
        )

    await db.delete(preset)
    await db.flush()


async def set_default_preset(
    db: AsyncSession,
    user_id: uuid.UUID,
    preset_id: uuid.UUID,
) -> ClassroomPreset:
    """Atomically set a preset as default."""
    preset = await get_preset(db, user_id, preset_id)

    # Unset all other defaults for this user atomically
    await db.execute(
        update(ClassroomPreset)
        .where(
            ClassroomPreset.user_id == user_id,
            ClassroomPreset.id != preset_id,
            ClassroomPreset.is_default.is_(True),
        )
        .values(is_default=False)
    )

    preset.is_default = True
    await db.flush()
    await db.refresh(preset)
    return preset
