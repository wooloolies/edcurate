from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from sqlalchemy.engine import Connection

from alembic import context
from src.curriculum.model import CurriculumEntry  # noqa: F401
from src.lib.config import escape_alembic_url, settings
from src.lib.database import Base
from src.localizer.model import GeneratedArtifact  # noqa: F401
from src.presets.model import ClassroomPreset  # noqa: F401
from src.saved_resources.model import SavedResource  # noqa: F401
from src.users.model import User  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set sqlalchemy.url from settings (sync driver required by Alembic)
assert settings.DATABASE_URL_SYNC is not None
config.set_main_option("sqlalchemy.url", escape_alembic_url(settings.DATABASE_URL_SYNC))

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Run migrations with connection."""
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    url = settings.DATABASE_URL_SYNC
    connect_args: dict = {}
    if "localhost" not in url and "127.0.0.1" not in url:
        connect_args["sslmode"] = "require"

    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )

    with connectable.connect() as connection:
        do_run_migrations(connection)

    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
