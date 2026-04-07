import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from src.lib.config import settings
from src.presets.model import ClassroomPreset
from src.saved_resources.model import LibraryCollection
from src.users.model import User


async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Create a test user who owns these collections
        test_email = "teacher.mock@example.com"
        result = await session.execute(select(User).where(User.email == test_email))
        user = result.scalar_one_or_none()

        if not user:
            user = User(
                email=test_email,
                name="Mock Teacher",
                email_verified=True,
                password_hash="dummy_hash_value_123", # noqa: S106
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)

        print(f"Test User ID: {user.id}")

        # Ensure a preset exists
        preset_result = await session.execute(
            select(ClassroomPreset).where(ClassroomPreset.user_id == user.id)
        )
        preset = preset_result.scalar_one_or_none()

        if not preset:
            preset = ClassroomPreset(
                user_id=user.id,
                name="General Science",
                subject="Science",
                year_level="Year 9",
                country="Australia",
            )
            session.add(preset)
            await session.commit()
            await session.refresh(preset)

        print(f"Test Preset ID: {preset.id}")

        # Create public collections
        collections_data = [
            ("biology cells", "Introduction to Cells (Starter)", 15),
            ("biology cells plant", "Plant Cells Virtual Lab", 8),
            ("photosynthesis", "Photosynthesis Masterclass", 42),
            ("biology evolution", "Evolution Case Studies", 3),
        ]

        for q, name, clones in collections_data:
            col_res = await session.execute(
                select(LibraryCollection).where(LibraryCollection.name == name)
            )
            col = col_res.scalar_one_or_none()
            if not col:
                col = LibraryCollection(
                    user_id=user.id,
                    preset_id=preset.id,
                    search_query=q,
                    name=name,
                    is_public=True,
                    clone_count=clones,
                )
                session.add(col)

        await session.commit()
        print("Mock public collections for seed seeded successfully.")


if __name__ == "__main__":
    asyncio.run(main())
