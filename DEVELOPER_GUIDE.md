# Developer Guide — Hosting Your API Documentation

This guide walks you through forking this template and publishing documentation for your own API from scratch. No code changes are required — everything is driven by content files in the `content/` folder.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Fork and Clone](#2-fork-and-clone)
3. [Project Structure at a Glance](#3-project-structure-at-a-glance)
4. [Quick Start with Docker](#4-quick-start-with-docker)
5. [Local Development (without Docker)](#5-local-development-without-docker)
6. [Add Your API](#6-add-your-api)
   - [6.1 Create the folder structure](#61-create-the-folder-structure)
   - [6.2 Configure your API (`api.config.json`)](#62-configure-your-api-apiconfigjson)
   - [6.3 Write your OpenAPI spec](#63-write-your-openapi-spec)
   - [6.4 Configure the sidebar (`nav.config.json`)](#64-configure-the-sidebar-navconfigjson)
   - [6.5 Write guides (MDX)](#65-write-guides-mdx)
   - [6.6 Define webhook events (`x-webhooks`)](#66-define-webhook-events-x-webhooks)
7. [Register Your API with the Site](#7-register-your-api-with-the-site)
8. [Manage Versions](#8-manage-versions)
9. [Generate and Serve SDKs](#9-generate-and-serve-sdks)
10. [Environment Variables Reference](#10-environment-variables-reference)
11. [Sandbox Credentials](#11-sandbox-credentials)
12. [Deploy to Production](#12-deploy-to-production)
13. [Remove the Example API](#13-remove-the-example-api)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Prerequisites

| Tool | Minimum version | Purpose |
|---|---|---|
| **Git** | any | Cloning and version control |
| **Node.js** | 18 LTS or later | Running frontend and sandbox locally |
| **npm** | 9+ (ships with Node 18) | Package management |
| **Docker** | 24+ | Building images and running in production |
| **Docker Compose** | v2 (ships with Docker Desktop) | Multi-service orchestration |

Docker is optional for local development but required for `make build`, `make up`, and `make generate-sdks`.

---

## 2. Fork and Clone

### On GitHub

1. Open the template repository on GitHub.
2. Click **Use this template → Create a new repository**.
3. Give it a name (e.g. `my-company-api-docs`), set visibility, click **Create repository**.

### Clone locally

```bash
git clone https://github.com/<your-org>/my-company-api-docs.git
cd my-company-api-docs
```

### Copy the environment file

```bash
cp .env.example .env
```

You can leave the defaults in `.env` as-is for local development. See [Section 10](#10-environment-variables-reference) for what each variable controls.

---

## 3. Project Structure at a Glance

```
my-company-api-docs/
│
├── content/                        ← Everything you edit lives here
│   ├── site.config.json            ← Site name, logo, list of APIs
│   └── apis/
│       └── example/                ← One folder per API
│           ├── api.config.json     ← API metadata (name, versions, colour)
│           ├── nav.config.json     ← Sidebar structure
│           ├── versions/
│           │   ├── v1/openapi.yaml ← OpenAPI spec for v1
│           │   └── v2/openapi.yaml ← OpenAPI spec for v2
│           ├── guides/             ← MDX guide pages
│           │   ├── getting-started.mdx
│           │   ├── authentication.mdx
│           │   └── webhooks.mdx
│           └── images/             ← Images referenced in guides
│
├── frontend/                       ← Next.js 14 app (do not edit)
├── sandbox/                        ← Fastify sandbox server (do not edit)
├── scripts/
│   └── generate-sdks.sh            ← SDK generation via openapi-generator-cli
├── docker-compose.yml
├── Makefile
└── .env.example
```

**The only folder you work in is `content/`.** The frontend and sandbox read from it at runtime — no rebuilds needed when you update specs or guides.

---

## 4. Quick Start with Docker

The fastest way to see everything running:

```bash
# Install dependencies (first time only)
make install

# Build Docker images
make build

# Start frontend (port 3000) + sandbox (port 4000)
make up
```

Then open:
- **Documentation site** → http://localhost:3000
- **Sandbox API** → http://localhost:4000

To stop:

```bash
make down
```

To run in the background:

```bash
make up-d
```

---

## 5. Local Development (without Docker)

Better for rapid iteration — the frontend hot-reloads when you save a guide or spec file.

```bash
# Install all dependencies
make install

# Start both services in parallel
make dev
```

This runs:
- **Frontend** on http://localhost:3000 (Next.js dev server with hot reload)
- **Sandbox** on http://localhost:4000 (tsx watch mode)

> **Tip:** The frontend reads spec and guide files from disk at request time. Save your `openapi.yaml` and reload the browser — no restart needed.

---

## 6. Add Your API

### 6.1 Create the folder structure

Replace `payments` with your API slug (lowercase, hyphens, no spaces):

```bash
cp -r content/apis/example content/apis/payments
```

You now have a complete starting point. Customise each file in the steps below.

The folder name (`payments`) becomes the URL prefix: `http://localhost:3000/payments/v1/...`

---

### 6.2 Configure your API (`api.config.json`)

Edit `content/apis/payments/api.config.json`:

```json
{
  "name": "Payments API",
  "description": "Accept and manage payments, refunds, and payouts.",
  "icon": "credit-card",
  "defaultVersion": "v1",
  "versions": ["v1"],
  "color": "#0f766e"
}
```

| Field | Description |
|---|---|
| `name` | Display name shown in the sidebar header and landing page card |
| `description` | Short description on the landing page |
| `icon` | Any icon name from [Lucide Icons](https://lucide.dev/icons/) |
| `defaultVersion` | The version the site loads by default — must exist in `versions/` |
| `versions` | All available versions, **listed newest first** |
| `color` | Brand accent colour used on the landing page card |

---

### 6.3 Write your OpenAPI spec

Place your spec at:

```
content/apis/payments/versions/v1/openapi.yaml
```

The spec must be **OpenAPI 3.0.x** (YAML or JSON). A minimal example:

```yaml
openapi: "3.0.3"
info:
  title: Payments API
  version: "1.0.0"
  description: Accept and manage payments, refunds, and payouts.

servers:
  - url: https://api.yourcompany.com/v1
    description: Production
  - url: http://localhost:4000/sandbox/payments/v1
    description: Sandbox (local)

tags:
  - name: Charges
    description: Create and retrieve payment charges.

paths:
  /charges:
    post:
      tags: [Charges]
      operationId: create-charge
      summary: Create a charge
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateChargeInput"
      responses:
        "201":
          description: Charge created successfully.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Charge"
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer

  schemas:
    CreateChargeInput:
      type: object
      required: [amount, currency]
      properties:
        amount:
          type: number
          example: 49.99
        currency:
          type: string
          example: USD

    Charge:
      type: object
      properties:
        id:
          type: string
          format: uuid
        amount:
          type: number
          example: 49.99
        currency:
          type: string
          example: USD
        status:
          type: string
          enum: [pending, succeeded, failed]
          example: succeeded
        createdAt:
          type: string
          format: date-time

  responses:
    BadRequest:
      description: Invalid request.
      content:
        application/json:
          schema:
            type: object
            properties:
              error: { type: string, example: bad_request }
              message: { type: string }
    Unauthorized:
      description: Missing or invalid token.
      content:
        application/json:
          schema:
            type: object
            properties:
              error: { type: string, example: unauthorized }
              message: { type: string }
```

#### Spec tips

- The sandbox server URL **must** follow the pattern `http://localhost:4000/sandbox/{api-slug}/{version}` — this is what the Try-it console calls.
- Use `$ref` freely. The platform dereferences the entire spec before rendering, so cross-file refs work too.
- Add `example:` values to schema properties — the sandbox prefers them over faker-generated values.
- Add `deprecated: true` and `x-sunset: "YYYY-MM-DD"` to an operation to show the deprecation banner and version tab badges.

---

### 6.4 Configure the sidebar (`nav.config.json`)

Edit `content/apis/payments/nav.config.json`:

```json
{
  "sections": [
    {
      "title": "Getting Started",
      "items": [
        { "title": "Introduction",   "file": "guides/getting-started.mdx" },
        { "title": "Authentication", "file": "guides/authentication.mdx" }
      ]
    },
    {
      "title": "API Reference",
      "openapi": "versions/v{version}/openapi.yaml",
      "groupBy": "tags",
      "order": ["Charges", "Refunds"]
    }
  ]
}
```

| Field | Description |
|---|---|
| `sections[].title` | Section heading in the sidebar |
| `sections[].items[].file` | Path to an MDX guide, relative to the API folder |
| `sections[].openapi` | Path to the spec — `{version}` is replaced with the active version |
| `sections[].groupBy` | Set to `"tags"` to group endpoints by their OpenAPI tag |
| `sections[].order` | Controls the order of tag groups |

---

### 6.5 Write guides (MDX)

Guides are **MDX files** (Markdown + JSX components) stored in `content/apis/payments/guides/`.

```mdx
---
title: Getting Started
description: Make your first API call in under 5 minutes.
---

# Getting Started

Welcome to the Payments API. This guide walks you through authentication and your first charge.

<Callout type="info">
  All requests must use HTTPS and include a valid Bearer token.
</Callout>

## 1. Get your credentials

Head to the [dashboard](https://dashboard.yourcompany.com) and copy your Client ID and Client Secret.

## 2. Request an access token

```bash
curl -X POST https://api.yourcompany.com/oauth/token \
  -H 'Content-Type: application/json' \
  -d '{"client_id":"<your_id>","client_secret":"<your_secret>"}'
```

## 3. Make a charge

```bash
curl -X POST https://api.yourcompany.com/v1/charges \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"amount": 49.99, "currency": "USD"}'
```
```

#### Available MDX components

| Component | Usage |
|---|---|
| `<Callout type="info">` | Blue info box |
| `<Callout type="warning">` | Amber warning box |
| `<Callout type="danger">` | Red danger/critical box |
| `<Callout type="success">` | Green success box |
| `<Tabs>` / `<Tab label="...">` | Tabbed code blocks |
| `<ImageBlock src="../images/diagram.png" alt="..." />` | Responsive image from the `images/` folder |

#### Adding images

Place image files in `content/apis/payments/images/` and reference them with a relative path:

```mdx
<ImageBlock src="../images/payment-flow.png" alt="Payment authorisation flow" />
```

---

### 6.6 Define webhook events (`x-webhooks`)

If your API fires webhooks, document the event schemas using the `x-webhooks` extension at the top level of your spec. This powers the **"Publishes Domain Event"** section on endpoint pages and drives synthetic payload generation in the sandbox.

#### Step 1 — Add the event schema

```yaml
components:
  schemas:
    ChargeSucceededEvent:
      type: object
      required: [id, type, timestamp, api_version, data]
      properties:
        id:
          type: string
          example: "evt_charge_abc123"
        type:
          type: string
          enum: ["charge.succeeded"]
          example: "charge.succeeded"
        timestamp:
          type: string
          format: date-time
          example: "2026-06-08T14:22:00Z"
        api_version:
          type: string
          example: "v1"
        data:
          type: object
          properties:
            chargeId: { type: string, format: uuid }
            amount:   { type: number, example: 49.99 }
            currency: { type: string, example: "USD" }
            status:   { type: string, example: "succeeded" }
```

#### Step 2 — Register it in `x-webhooks`

```yaml
x-webhooks:
  charge.succeeded:
    post:
      summary: "Charge succeeded"
      description: "Fired when a payment charge completes successfully."
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ChargeSucceededEvent"
            examples:
              basic:
                summary: "Successful charge"
                value:
                  id: "evt_charge_abc123"
                  type: "charge.succeeded"
                  timestamp: "2026-06-08T14:22:00Z"
                  api_version: "v1"
                  data:
                    chargeId: "550e8400-e29b-41d4-a716-446655440001"
                    amount: 49.99
                    currency: "USD"
                    status: "succeeded"
```

#### Step 3 — Link the operation to the event

Add `x-webhook-event` to the operation that triggers the event:

```yaml
paths:
  /charges:
    post:
      operationId: create-charge
      x-webhook-event: "charge.succeeded"   # ← links this endpoint to the event
      ...
```

The platform will:
- Show a **"Publishes Domain Event"** section on the endpoint page with the full schema
- Generate a synthetic payload from the schema when the endpoint is called via Try-it
- Merge your request body fields into the `data` object of the delivered event

---

## 7. Register Your API with the Site

Edit `content/site.config.json` to add your API slug:

```json
{
  "siteName": "Your Company Developer Docs",
  "logo": "/logo.svg",
  "apis": ["payments", "example"],
  "defaultApi": "payments"
}
```

| Field | Description |
|---|---|
| `siteName` | Displayed in the browser tab and site header |
| `logo` | Path to your logo — place the file in `frontend/public/` |
| `apis` | List of folder names under `content/apis/` — controls landing page order |
| `defaultApi` | The API the landing page highlights as primary |

The landing page auto-discovers all folders listed in `apis` and shows a card for each one with the endpoint count, version count, and description from `api.config.json`.

---

## 8. Manage Versions

### Add a new version

```bash
mkdir -p content/apis/payments/versions/v2
cp content/apis/payments/versions/v1/openapi.yaml \
   content/apis/payments/versions/v2/openapi.yaml
```

Edit the new spec, then update `api.config.json`:

```json
{
  "defaultVersion": "v2",
  "versions": ["v2", "v1"]
}
```

> List versions **newest first** in the `versions` array — this controls the order of the version dropdown.

### Mark an old version as deprecated

In the old spec (`versions/v1/openapi.yaml`), add to each operation you are deprecating:

```yaml
deprecated: true
x-sunset: "2026-12-31"
x-deprecation-notice: "Migrate to v2 — see the migration guide."
```

The platform will:
- Show a red **DEPRECATED** badge on the v1 tab of that endpoint
- Display a deprecation banner with the sunset date and migration notice
- Show the **v2 (LATEST)** tab first

### Per-endpoint versioning

Versions apply at the individual endpoint level, not the whole API. An endpoint that exists in both v1 and v2 shows both version tabs. An endpoint only in v2 shows a single tab. The sidebar always reflects the latest version's endpoints.

---

## 9. Generate and Serve SDKs

The platform can auto-generate client SDKs in Python, Java, TypeScript, C#, and Go from your OpenAPI spec and serve them as `.zip` downloads.

### Run the generator

```bash
make generate-sdks
```

This requires Docker. The script:
1. Scans every API folder in `content/apis/`
2. Calls `openapi-generator-cli` for each version and language
3. Injects a `SANDBOX_QUICKSTART.md` with pre-configured sandbox credentials
4. Writes `.zip` files to `frontend/public/sdks/{api}/{version}/{language}.zip`

### Re-generate after spec changes

Run `make generate-sdks` whenever you update your OpenAPI spec. The frontend serves the files statically so no restart is needed.

### Download UI

The SDK download page is available at:

```
http://localhost:3000/{api}/{version}/sdks
```

It shows a card for each language with a download button. SDKs that have not been generated yet are shown as unavailable.

---

## 10. Environment Variables Reference

Copy `.env.example` to `.env` and adjust as needed.

| Variable | Default | Description |
|---|---|---|
| `MOCK_CLIENT_ID` | `sandbox_client_id_abc123` | Client ID accepted by the sandbox OAuth endpoint |
| `MOCK_CLIENT_SECRET` | `sandbox_secret_xyz789` | Client secret accepted by the sandbox OAuth endpoint |
| `MOCK_JWT_SECRET` | `sandbox_jwt_signing_secret_change_in_prod` | Secret used to sign and verify sandbox JWTs — **change this in production** |
| `NEXT_PUBLIC_SANDBOX_URL` | `http://localhost:4000` | URL the browser uses to call the sandbox (must be publicly reachable in production) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Canonical URL for the documentation site |
| `CONTENT_PATH` | `/app/content` | Filesystem path where the `content/` folder is mounted inside containers |

### Production values

At minimum, change these before deploying:

```bash
MOCK_JWT_SECRET=<strong-random-string-min-32-chars>
NEXT_PUBLIC_SANDBOX_URL=https://sandbox.api.yourcompany.com
NEXT_PUBLIC_SITE_URL=https://docs.yourcompany.com
```

---

## 11. Sandbox Credentials

The sandbox ships with pre-configured mock credentials for the Try-it console. Developers copy these directly from the interface.

| Field | Value |
|---|---|
| Client ID | `sandbox_client_id_abc123` |
| Client Secret | `sandbox_secret_xyz789` |
| Token endpoint | `POST /oauth/token` |

The sandbox validates these credentials and returns a short-lived JWT. The JWT is then used as `Authorization: Bearer <token>` for subsequent API calls.

These are **mock credentials** — they grant no access to any real system. You can change them by updating `MOCK_CLIENT_ID` and `MOCK_CLIENT_SECRET` in `.env`.

### Sandbox routing

The sandbox automatically routes requests to the correct spec based on the URL:

```
POST http://localhost:4000/sandbox/payments/v1/charges
                           ──────── ───────  ──
                           api slug  version  path in spec
```

No configuration is needed — as long as the OpenAPI spec exists at `content/apis/{api}/versions/{version}/openapi.yaml`, the sandbox serves it.

---

## 12. Deploy to Production

### Option A — Docker Compose on a VPS

The simplest deployment. SSH into your server, clone your repo, and run:

```bash
# Set production values
cp .env.example .env
nano .env   # update MOCK_JWT_SECRET, NEXT_PUBLIC_SANDBOX_URL, NEXT_PUBLIC_SITE_URL

# Build and start
make build
make up-d
```

Set up a reverse proxy (nginx or Caddy) to point your domain at port 3000 (frontend) and optionally expose port 4000 (sandbox) under a subdomain.

**Example nginx config:**

```nginx
server {
    server_name docs.yourcompany.com;
    location / { proxy_pass http://localhost:3000; }
}

server {
    server_name sandbox.yourcompany.com;
    location / { proxy_pass http://localhost:4000; }
}
```

### Option B — Docker Compose with a managed registry

Build images locally and push to a registry (ECR, GHCR, Docker Hub), then pull and run on your server:

```bash
# Build
docker build -t ghcr.io/your-org/api-docs-frontend:latest ./frontend
docker build -t ghcr.io/your-org/api-docs-sandbox:latest ./sandbox

# Push
docker push ghcr.io/your-org/api-docs-frontend:latest
docker push ghcr.io/your-org/api-docs-sandbox:latest

# On the server — pull and start with docker compose
docker compose pull
docker compose up -d
```

### Option C — Static site (frontend only)

If you don't need the Try-it console or webhook simulation, you can export the frontend as a static site:

```bash
cd frontend
NEXT_PUBLIC_SANDBOX_URL="" npm run build
```

Deploy the `frontend/out/` folder to any static host (Vercel, Netlify, Cloudflare Pages, S3).

> Note: Search (Cmd+K), code samples, and all reference page rendering still work in static mode. Only Try-it and SDK download require the sandbox to be running.

### Keeping content up to date

Because `content/` is mounted as a volume, you can update specs and guides **without rebuilding images**:

```bash
# Pull latest content
git pull

# Restart only the frontend to clear the spec cache
docker compose restart frontend
```

---

## 13. Remove the Example API

Once you have added your own API, remove the example:

1. Delete the folder:
   ```bash
   rm -rf content/apis/example
   ```

2. Remove it from `content/site.config.json`:
   ```json
   {
     "apis": ["payments"],
     "defaultApi": "payments"
   }
   ```

3. If running in dev mode, the frontend will hot-reload and the landing page will update immediately.

---

## 14. Troubleshooting

### The page shows "API not found"

- Check that the folder name in `content/apis/` exactly matches the slug in `content/site.config.json → apis`.
- Check that `api.config.json` exists in the API folder.
- If using Docker, confirm the `content/` volume is mounted: `docker compose exec frontend ls /app/content/apis`.

### Endpoints are not showing in the sidebar

- Check that `nav.config.json → sections[].openapi` path resolves to an existing spec file.
- Check that operations in the spec have `tags:` set — only tagged operations appear in the sidebar when `groupBy: "tags"` is used.
- Confirm the spec is valid YAML (`npx js-yaml content/apis/{api}/versions/{version}/openapi.yaml`).

### Try-it returns "No operation matched"

- Confirm the sandbox server URL in your spec matches `http://localhost:4000/sandbox/{api-slug}/{version}`.
- Verify the api slug in the URL matches the `content/apis/` folder name exactly (case-sensitive).
- Check sandbox logs: `docker compose logs sandbox`.

### Webhook event is not delivered

- The sandbox only delivers webhooks when a URL is entered in the "Webhook Delivery" section of the Try-it console.
- The endpoint must have `x-webhook-event:` set in the spec — only those endpoints show the webhook delivery form.
- If using customer OAuth, confirm the token endpoint is publicly reachable from the sandbox server.

### SDK generation fails

- Confirm Docker is running: `docker info`.
- The `openapi-generator-cli` Docker image is pulled on first run — this may take a minute on a slow connection.
- Run `bash scripts/generate-sdks.sh` directly to see verbose error output.
- Check that your spec passes OpenAPI validation: `npx @apidevtools/swagger-parser validate content/apis/{api}/versions/{version}/openapi.yaml`.

### TypeScript errors after editing config files

Config files (`api.config.json`, `nav.config.json`, `site.config.json`) are JSON, not TypeScript. You should not get TypeScript errors from them. If you do, check that the JSON is well-formed and matches the expected shape documented in this guide.
