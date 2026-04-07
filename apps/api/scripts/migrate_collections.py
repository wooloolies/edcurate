import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text

from src.main import app
from src.lib.config import settings
from src.saved_resources.model import SavedResource, LibraryCollection

async def run_migration():
    engine = create_async_engine(str(settings.DATABASE_URL))
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        print("Finding resources without collection_id...")
        res = await db.execute(select(SavedResource).where(SavedResource.collection_id.is_(None)))
        items = res.scalars().all()
        
        if not items:
            print("No resources need migrating.")
            return

        print(f"Found {len(items)} items to migrate. Grouping by user/preset/search_query...")
        
        groups = {}
        for item in items:
            key = (item.user_id, item.preset_id, item.search_query)
            if key not in groups:
                groups[key] = []
            groups[key].append(item)
            
        print(f"Grouped into {len(groups)} collections.")
        
        for (user_id, preset_id, search_query), group_items in groups.items():
            print(f"Processing group {user_id} - {preset_id} - {search_query}")
            
            # Find existing collection or create one
            col_exec = await db.execute(
                select(LibraryCollection).where(
                    LibraryCollection.user_id == user_id,
                    LibraryCollection.preset_id == preset_id,
                    LibraryCollection.search_query == search_query,
                )
            )
            col = col_exec.scalar_one_or_none()
            
            if not col:
                col = LibraryCollection(
                    user_id=user_id,
                    preset_id=preset_id,
                    search_query=search_query,
                    name=f"Collection for {search_query.title()}" if search_query else "Saved Items",
                    is_public=False
                )
                db.add(col)
                await db.flush()
                
            for item in group_items:
                item.collection_id = col.id
                
        await db.commit()
        print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(run_migration())
