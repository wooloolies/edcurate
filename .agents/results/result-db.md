# DB Review Result

## Status
COMPLETE (review only — no changes made)

## Summary
Full review of the FastAPI + SQLAlchemy (async) + Alembic + PostgreSQL (Supabase) + Redis (Upstash) database layer. Seven issues found ranging from critical to low severity.

---

## Findings

### CRITICAL — SSL not configured for Supabase production connection

**File:** `apps/api/src/lib/database.py` and `apps/api/src/lib/config.py`

`create_async_engine` is called with `settings.DATABASE_URL` directly. No `connect_args` or `ssl` keyword is passed. Supabase requires `sslmode=require` for all external connections. Without it, the asyncpg driver attempts a plain TCP connection. Supabase's pooler (port 5432 via pgBouncer) and the direct connection endpoint (port 5432 on `db.*.supabase.co`) both enforce TLS, so the connection may silently fail or succeed with an unverified certificate depending on server-side enforcement mode.

For asyncpg the SSL parameter is passed via `connect_args`, not in the URL query string:

```python
import ssl
ssl_context = ssl.create_default_context()
engine = create_async_engine(
    settings.DATABASE_URL,
    connect_args={"ssl": ssl_context},
    ...
)
```

For Supabase with a CA bundle (recommended for production):
```python
ssl_context = ssl.create_default_context(cafile="/path/to/supabase-ca.crt")
```

The same gap applies to `DATABASE_URL_SYNC` used by Alembic. For psycopg2 (sync), the `connect_args` equivalent is `{"sslmode": "require"}`.

The `DATABASE_URL_SYNC` in config has no `?sslmode=require` appended either.

---

### HIGH — No connection pool tuning; defaults are wrong for Supabase

**File:** `apps/api/src/lib/database.py`

`create_async_engine` is called with only `echo` and `pool_pre_ping=True`. SQLAlchemy's default pool for async engines is `AsyncAdaptedQueuePool` with:
- `pool_size = 5`
- `max_overflow = 10`
- `pool_timeout = 30`
- `pool_recycle = -1` (never recycle)

Problems for Supabase:
1. Supabase free/pro tiers cap total connections (typically 15–25 on free, 60 on pro via pgBouncer). With `pool_size=5` and `max_overflow=10`, a single Vercel serverless instance can open 15 connections. Multiple concurrent cold-starts exhaust the limit immediately.
2. `pool_recycle=-1` means connections are never recycled. Supabase's idle connection timeout (default 30 minutes) will silently close long-idle connections; `pool_pre_ping=True` recovers from this on next use but adds a roundtrip per request.
3. For Vercel serverless (stateless, ephemeral workers), the recommended pattern is `poolclass=NullPool` (no pooling) in the app engine and routing through Supabase's PgBouncer (transaction mode) instead. This is already done correctly in `alembic/env.py` but not in the application engine.

Recommended changes:
- Add `pool_size`, `max_overflow`, `pool_recycle` explicitly.
- For serverless deployment: use `NullPool` and rely on Supabase's built-in connection pooler (port 6543 for transaction mode).
- Expose `POOL_SIZE`, `MAX_OVERFLOW`, `POOL_RECYCLE` as environment variables so they can be tuned per environment without a code change.

---

### HIGH — Alembic `versions/` directory does not exist; no migration history

**File:** `apps/api/alembic/`

The `alembic/` directory contains only `env.py` and `script.py.mako`. There is no `versions/` subdirectory and no migration files. `vercel.json` runs `alembic upgrade head` on every deploy. With an empty versions directory that command is a no-op — schema is never created. The `users` table (and any future tables) will be absent in production unless migrations are generated and committed.

Action required: run `alembic revision --autogenerate -m "initial"` after importing all models into `env.py`, review the generated script, and commit it.

---

### HIGH — Model imports missing from `alembic/env.py`

**File:** `apps/api/alembic/env.py`, line 10

```python
# Import all models here for autogenerate
# from src.users.models import User
```

The `User` model (and the `UUIDMixin` / `TimestampMixin` definitions in `src/common/models/base.py`) are commented out. Because `target_metadata = Base.metadata` is used, autogenerate only detects tables whose models have been imported. Any table whose model is not imported will be missing from generated migrations — silently, with no error.

Every SQLAlchemy model file must be unconditionally imported in `env.py` before `target_metadata` is referenced.

---

### MEDIUM — `updated_at` is inconsistent across the two mixin definitions

**File:** `apps/api/src/users/model.py` vs `apps/api/src/common/models/base.py`

`User` defines its own `updated_at` with `server_default=func.now()` and `onupdate=func.now()`.
`TimestampMixin` in `base.py` defines `updated_at` as `nullable=True` with no `server_default`.

This produces two different schemas depending on which definition is used:
- `User` has `updated_at NOT NULL DEFAULT now()`.
- Any model using `TimestampMixin` has `updated_at NULLABLE` with no default.

The `User` model duplicates the mixin fields instead of inheriting from `TimestampMixin`, and the two implementations diverge. `updated_at` should never be nullable — it should always equal `created_at` at insert time via `server_default=func.now()`.

---

### MEDIUM — `UUIDMixin` and `User.id` use two different UUID column definitions

**File:** `apps/api/src/common/models/base.py` (UUIDMixin) vs `apps/api/src/users/model.py` (User)

`UUIDMixin` uses `UUID(as_uuid=True)` (the PostgreSQL dialect-specific type) with only a Python-side `default=uuid.uuid4`.

`User.id` uses the generic `mapped_column(primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))`.

Problems:
1. `UUID(as_uuid=True)` in `UUIDMixin` is PostgreSQL-specific. The generic `Mapped[uuid.UUID]` + `mapped_column(primary_key=True)` is preferred with modern SQLAlchemy 2.x typed mappings, and SQLAlchemy handles the driver-level conversion automatically.
2. `server_default=text("gen_random_uuid()")` is not set in `UUIDMixin`. Rows inserted with raw SQL (e.g., in migrations or seeds) without supplying `id` will fail.
3. Both approaches exist side by side, so future models may follow either pattern, creating schema drift.

Standardize on one approach. For PostgreSQL + asyncpg the idiomatic modern pattern is:
```python
id: Mapped[uuid.UUID] = mapped_column(
    primary_key=True,
    server_default=text("gen_random_uuid()"),
)
```
Drop the Python-side `default` when `server_default` covers the same ground.

---

### LOW — `alembic.ini` `sqlalchemy.url` is a placeholder

**File:** `apps/api/alembic.ini`, line 6

```ini
sqlalchemy.url = driver://user:pass@localhost/dbname
```

The placeholder is overridden correctly in `env.py` via `config.set_main_option(...)`, so this has no runtime impact. However, it is misleading and could cause confusion if someone runs Alembic directly without invoking `env.py` (e.g., with `--config` pointing to the ini only). Replace the value with a comment or a representative non-functional string such as `# set programmatically in env.py`.

---

### LOW — `image` column is `String(500)` — too short for some OAuth avatar URLs

**File:** `apps/api/src/users/model.py`, line 23

Google, GitHub, and Facebook profile image URLs are typically 100–300 characters, but CDN-signed URLs (especially Facebook Graph API) can exceed 500 characters. Use `Text` (unbounded) or at minimum `String(2048)` to match the practical URL length limit. There is no performance cost to a wider varchar in PostgreSQL.

---

## Acceptance Criteria Checklist

- [x] `config.py` reviewed: DATABASE_URL, DATABASE_URL_SYNC, secret defaults
- [x] `database.py` reviewed: engine creation, pool settings, SSL, session factory
- [x] `alembic/env.py` reviewed: model imports, sync URL, offline/online modes
- [x] `alembic.ini` reviewed: placeholder URL, logging config
- [x] `vercel.json` reviewed: build-step migration command
- [x] Model files reviewed: `users/model.py`, `common/models/base.py`, `common/models/pagination.py`
- [x] SSL gap for Supabase identified and documented with fix
- [x] Pool configuration gap documented
- [x] Migration generation gap (no versions/) documented
- [x] Schema inconsistencies documented
- [x] No source files modified

## Files Reviewed

- `/Users/gracefullight/workspace/edcurate/apps/api/src/lib/config.py`
- `/Users/gracefullight/workspace/edcurate/apps/api/src/lib/database.py`
- `/Users/gracefullight/workspace/edcurate/apps/api/alembic/env.py`
- `/Users/gracefullight/workspace/edcurate/apps/api/alembic.ini`
- `/Users/gracefullight/workspace/edcurate/apps/api/vercel.json`
- `/Users/gracefullight/workspace/edcurate/apps/api/src/users/model.py`
- `/Users/gracefullight/workspace/edcurate/apps/api/src/common/models/base.py`
- `/Users/gracefullight/workspace/edcurate/apps/api/src/common/models/pagination.py`
- `/Users/gracefullight/workspace/edcurate/apps/api/src/lib/auth.py`
- `/Users/gracefullight/workspace/edcurate/apps/api/src/lib/rate_limit.py`
- `/Users/gracefullight/workspace/edcurate/apps/api/src/lib/dependencies.py`
- `/Users/gracefullight/workspace/edcurate/apps/api/pyproject.toml`
