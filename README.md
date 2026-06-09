# api-documentation-template

A documentation starter for API teams that need guides, versioned OpenAPI reference pages, sandboxed Try It requests, OAuth token flows, SDK links, and schema-driven publish examples.

## Project Structure

- `frontend/` - Next.js documentation app.
- `sandbox/` - Fastify sandbox API used by the Try It console.
- `content/` - Site configuration, guides, and versioned OpenAPI specs.
- `scripts/` - Helper scripts for generated SDK assets.

## Run Locally

Install dependencies in each app, then start both services:

```bash
cd frontend && npm install && npm run dev
cd sandbox && npm install && npm run dev
```

The frontend defaults to `http://localhost:3000` and the sandbox defaults to `http://localhost:4000`.

## Content Model

Each API lives under `content/apis/<api-slug>/` with:

- `api.config.json` for display name, versions, and default version.
- `nav.config.json` for guide and OpenAPI navigation.
- `guides/*.mdx` for written documentation.
- `versions/<version>/openapi.yaml` for versioned reference content.

Publish-enabled operations use `x-webhook-event` on the REST operation and define the payload under `x-webhooks`. The Try It console only shows publish delivery fields for operations with `x-webhook-event`.

## Verification

Useful checks:

```bash
cd frontend && npm run type-check
cd sandbox && npm run build
```
