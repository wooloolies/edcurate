---
description: Backend-Frontend communication must go through gen:api (orval) generated code
---


# API Contract Rule

Backend and Frontend communicate exclusively through auto-generated API client code. Never write manual API calls.

## Workflow
1. Backend defines/updates FastAPI endpoints → `apps/api/openapi.json` auto-generated
2. Frontend runs `bun run gen:api` (orval) → generates types, hooks, zod schemas
3. Frontend uses only generated code from `src/lib/api/` for API calls

## Generated Output
- **React Query hooks**: `src/lib/api/{tag}/{tag}.ts` (react-query + axios)
- **Type models**: `src/lib/api/model/`
- **Zod schemas**: `src/lib/api/zod/{tag}/{tag}.zod.ts`
- **HTTP client**: axios via `src/hooks/use-custom-instance.ts` mutator

## Prohibited
- Manual `axios.get/post/put/delete` calls to backend endpoints
- Manual `fetch()` calls to backend endpoints
- Hand-written request/response types that duplicate OpenAPI schema
- Modifying generated files in `src/lib/api/` directly (they get overwritten by `gen:api`)

## When adding a new endpoint
1. Add the endpoint in `apps/api/`
2. Regenerate `openapi.json`
3. Run `bun run gen:api` in `apps/web/`
4. Import and use the generated hook/function
