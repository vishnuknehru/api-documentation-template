# Agent Instructions

## Scope

This repository is an API documentation template with a Next.js frontend, a Fastify sandbox, and content-driven OpenAPI examples. Keep changes focused on template behavior or example content requested by the user.

## Working Rules

- Prefer existing local patterns and component structure.
- Avoid editing `node_modules`, `.next`, or generated caches.
- Use `rg`/`find` with exclusions when searching because dependency folders are checked in.
- Keep OpenAPI examples internally consistent: operation IDs, schemas, responses, publish events, and examples should agree.
- Publish Try It behavior should remain opt-in per request. Do not persist one-shot publish endpoint/auth details in the in-memory cache.
- Normal REST endpoints should not show publish delivery controls unless the operation declares `x-webhook-event`.

## Validation

Run the relevant check after code changes:

```bash
cd frontend && npm run type-check
cd sandbox && npm run type-check
```

If a local server is needed for visual QA, run the frontend with `npm run dev` in `frontend/` and the sandbox with `npm run dev` in `sandbox/`.
