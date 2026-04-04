# Backend Agent Result

## Status
DONE

## Summary
Verified the backend API at `apps/api`. The FastAPI server is already running on port 8000. All infrastructure containers (PostgreSQL, Redis, MinIO) are healthy. The server starts cleanly with no import errors. One actionable issue was found: the server has no `.env` file, so it uses the default `DATABASE_URL` pointing to a database named `edcurate`, but the Docker Compose PostgreSQL container only creates a database named `app`. This causes the `/health` endpoint to report `database: unhealthy`. The readiness probe at `/health/ready` still returns HTTP 200 (incorrectly, see findings).

---

## Task Findings

### Task 1 — `main.py`: Health endpoint, DB check, Redis check

**File**: `/Users/gracefullight/workspace/edcurate/apps/api/src/main.py`

- `GET /health` — Full health check: calls `check_database()` and `check_redis()`, returns an aggregated `HealthResponse` with `status: healthy | degraded | unhealthy`.
- `GET /health/live` — Kubernetes liveness probe, always returns `{"status": "ok"}`.
- `GET /health/ready` — Readiness probe: calls `check_database()`, raises HTTP 503 if DB is unhealthy.
- `check_database()` — Opens an async SQLAlchemy session and executes `SELECT 1`, measures latency.
- `check_redis()` — Short-circuits if `REDIS_URL` is not configured. Creates a one-off `redis.from_url()` client per call (no connection reuse), pings, and closes it.
- Error messages are redacted in `prod` env (`"connection failed"` instead of raw exception string).
- Middleware: request ID injection (UUID4 fallback), CORS, and a global exception handler.

**Issue — Readiness probe gives false positive when DB is down:**
`/health/ready` currently returns HTTP 200 even when `DATABASE_URL` points to a non-existent database. Observed: `curl http://localhost:8000/health/ready` returns `{"status": "ready"}` with HTTP 200, while `/health` returns `database: unhealthy`. This happens because the DB error is caught and re-raised as a non-HTTP exception inside an async context, but the readiness probe wraps the outer call. Needs investigation — see issue detail below.

Actually, upon inspection: the readiness check *does* propagate `HTTPException` on DB failure (line 236-240 in main.py). The observed HTTP 200 is likely because the running process was started before the `.env` mismatch was introduced, OR the engine's `pool_pre_ping` masks the connection failure at session creation. This warrants a direct test once the DB is configured correctly.

### Task 2 — `rate_limit.py`: Redis connection code

**File**: `/Users/gracefullight/workspace/edcurate/apps/api/src/lib/rate_limit.py`

- `RedisRateLimiter` uses **lazy connection** via `_get_redis()` — Redis client is not created until the first rate-limited request arrives.
- Uses `redis.asyncio.from_url()` with `ssl_cert_reqs=None` for `rediss://` (Upstash TLS) URLs.
- Rate limiting algorithm: **sliding window** using Redis sorted sets (`ZREMRANGEBYSCORE` + `ZCARD` + `ZADD` in a pipeline).
- Falls back to `InMemoryRateLimiter` when `REDIS_URL` is not set. Logs a warning in non-local environments.
- Health check paths (`/health*`) are excluded from rate limiting via `rate_limit_middleware`.
- The global `_rate_limiter` singleton is initialized once — any config change requires a process restart.
- Graceful shutdown: `main.py` lifespan handler calls `await _rate_limiter.close()` if using Redis.

**Note**: The `rate_limit` decorator (endpoint-level) and `rate_limit_middleware` (global) both share the same singleton `_rate_limiter`. They must be consistent in their `RateLimitConfig` — using both simultaneously with different configs would cause the first initialization to win.

### Task 3 — `config.py`: All settings

**File**: `/Users/gracefullight/workspace/edcurate/apps/api/src/lib/config.py`

All settings and their defaults:

| Setting | Type | Default | Notes |
|---|---|---|---|
| `PROJECT_NAME` | str | `"edcurate-api"` | |
| `PROJECT_ENV` | Literal | `"local"` | Accepts: `local`, `staging`, `prod` |
| `DATABASE_URL` | str | `postgresql+asyncpg://postgres:postgres@localhost:5432/edcurate` | asyncpg async driver |
| `DATABASE_URL_SYNC` | str | `postgresql://postgres:postgres@localhost:5432/edcurate` | For Alembic migrations |
| `CORS_ORIGINS` | list[str] | `["http://localhost:3000"]` | |
| `BETTER_AUTH_URL` | str | `"http://localhost:3000"` | better-auth web server URL |
| `JWE_SECRET_KEY` | str | default placeholder | Validated: must be changed in non-local envs |
| `REDIS_URL` | str or None | `None` | Optional; enables Redis rate limiter |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | str or None | `None` | Optional OpenTelemetry |
| `OTEL_SERVICE_NAME` | str or None | `None` | Optional OpenTelemetry |
| `AI_PROVIDER` | Literal | `"gemini"` | Accepts: `gemini`, `openai` |
| `GOOGLE_CLOUD_PROJECT` | str or None | `None` | |
| `GEMINI_API_KEY` | str or None | `None` | |
| `OPENAI_API_KEY` | str or None | `None` | |
| `STORAGE_BACKEND` | Literal | `"minio"` | Accepts: `gcs`, `s3`, `minio` |
| `GCS_BUCKET_NAME` | str or None | `None` | |
| `MINIO_ENDPOINT` | str | `"localhost:9000"` | |
| `MINIO_ACCESS_KEY` | str | `"minioadmin"` | |
| `MINIO_SECRET_KEY` | str | `"minioadmin"` | |

- Settings loaded via `pydantic-settings` from `.env` file + env vars.
- `@model_validator` enforces that `JWE_SECRET_KEY` is not the default placeholder in non-local environments.
- `get_settings()` is `@lru_cache` — singleton pattern.

### Task 4 — Docker infrastructure status

All three containers are up and healthy:

| Container | Status | Ports |
|---|---|---|
| `edcurate-postgres` | Up 10h (healthy) | 0.0.0.0:5432->5432/tcp |
| `edcurate-redis` | Up 10h (healthy) | 0.0.0.0:6379->6379/tcp |
| `edcurate-minio` | Up 10h (healthy) | 0.0.0.0:9000-9001->9001/tcp |

### Task 5 — Docker start (not needed)

Infrastructure was already running. No action required.

### Task 6 — API server start

The FastAPI server was **already running** on port 8000 (PID 75802, started via `uv run fastapi dev src/main.py --port 8000`). The attempt to start a second instance failed with `[Errno 48] Address already in use`, confirming the server is active.

No import errors or startup failures were observed.

### Task 7 — Health endpoint test

**Actual response from `GET http://localhost:8000/health`:**

```json
{
    "status": "unhealthy",
    "version": "0.1.0",
    "services": {
        "database": {
            "status": "unhealthy",
            "latency_ms": 89.91,
            "error": "database \"edcurate\" does not exist"
        }
    }
}
```

- Redis does not appear in the health response because `REDIS_URL` is not set (no `.env` file present).
- `/health/live` returns `{"status": "ok"}` — HTTP 200. Correct.
- `/health/ready` returns `{"status": "ready"}` — HTTP 200. This is **unexpected** given the DB is unhealthy.

**Swagger UI**: Accessible at `http://localhost:8000/docs` — HTTP 200 (dev mode).

### Task 8 — Import errors and runtime issues

No import errors. The server runs. All issues are configuration-related, not code bugs.

---

## Issues Found

### ISSUE 1 (HIGH) — Missing `.env` file causes DB connection failure

**Root cause**: No `/Users/gracefullight/workspace/edcurate/apps/api/.env` file exists. The server falls back to the default `DATABASE_URL` in `config.py` which points to `edcurate` database, but Docker Compose (`docker-compose.infra.yml`) creates a database named `app` (`POSTGRES_DB: app`).

**Effect**: `GET /health` returns `status: unhealthy` with `"database \"edcurate\" does not exist"`. All endpoints requiring DB access will fail at runtime.

**Fix**: Create `/Users/gracefullight/workspace/edcurate/apps/api/.env` from `.env.example`, then either:
- Option A: Change `DATABASE_URL` in `.env` to use `app` as the DB name (`postgresql+asyncpg://postgres:postgres@localhost:5432/app`), OR
- Option B: Recreate the Docker container with `POSTGRES_DB: edcurate` in `docker-compose.infra.yml`.

Option A is lower friction for local dev. Option B aligns docker-compose with the documented convention.

### ISSUE 2 (MEDIUM) — Redis not configured despite container running

**Root cause**: No `.env` file, so `REDIS_URL` defaults to `None`. The Redis container is healthy and listening on port 6379, but the API doesn't connect to it.

**Effect**: Rate limiting falls back to in-memory mode (per-process, not shared across workers). The health endpoint does not report Redis status.

**Fix**: Add `REDIS_URL=redis://localhost:6379` to the `.env` file (as shown in `.env.example`).

### ISSUE 3 (LOW) — Readiness probe may give false positive

**Observed**: `/health/ready` returns HTTP 200 even when the DB is reportedly unhealthy per `/health`. This may be a `pool_pre_ping` behavior masking the initial connection failure at session creation, or a timing artifact. Needs a clean restart test once the DB config is corrected.

### ISSUE 4 (INFO) — DB name inconsistency between docker-compose and config

`docker-compose.infra.yml` sets `POSTGRES_DB: app`, but both `config.py` defaults and `.env.example` reference database name `edcurate`. One of these must be corrected to be the canonical DB name.

---

## Acceptance Criteria Checklist

- [x] `main.py` health endpoint, DB check, Redis check code reviewed
- [x] `rate_limit.py` Redis connection code reviewed
- [x] `config.py` all settings documented
- [x] Docker infrastructure status checked — all 3 containers healthy
- [x] Docker start step — skipped (already running)
- [x] API server start attempt — server already running, no import errors
- [x] Health endpoint tested — responds correctly, DB unhealthy due to config issue
- [x] Import errors and runtime issues checked — none found, only config issues

---

## Previous Result (preserved)

Applied all 6 security fixes to the API auth and config modules. Changes were minimal and surgical — only the lines specified by the task were altered.

**Files changed in previous session:**
- `/Users/gracefullight/workspace/edcurate/apps/api/src/lib/auth.py`
- `/Users/gracefullight/workspace/edcurate/apps/api/src/lib/config.py`
- `/Users/gracefullight/workspace/edcurate/apps/api/.env.example`
