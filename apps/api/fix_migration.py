"""One-time fix: remove stale alembic stamp for bcddadb2147a.

The saved_resources table doesn't exist in production but alembic_version
records bcddadb2147a as applied. This script removes that stamp so
`alembic upgrade head` will re-create the table.
"""

from sqlalchemy import create_engine, inspect, text

from src.lib.config import settings

engine = create_engine(settings.DATABASE_URL_SYNC)
with engine.connect() as conn:
    inspector = inspect(conn)
    tables = inspector.get_table_names()

    if "saved_resources" not in tables:
        conn.execute(
            text("DELETE FROM alembic_version WHERE version_num = 'bcddadb2147a'")
        )
        conn.commit()
        print("FIXED: removed stale stamp for bcddadb2147a, saved_resources will be re-created")
    else:
        print("OK: saved_resources table exists, no fix needed")

engine.dispose()
