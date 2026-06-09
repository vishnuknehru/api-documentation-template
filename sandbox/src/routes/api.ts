import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { loadSpec, specExists } from "../services/specLoader";
import { generateFromSchema } from "../services/responseGen";
import { fireWebhooks, fireWebhookDirect } from "../services/webhookSender";
import { extractBearerToken, verifyToken } from "../middleware/auth";

type HTTPMethod = "get" | "post" | "put" | "patch" | "delete" | "head" | "options";

interface WebhookEventDef {
  post?: {
    requestBody?: {
      content?: {
        "application/json"?: {
          schema?: unknown;
          example?: unknown;
          examples?: Record<string, { value?: unknown; summary?: string }>;
        };
      };
    };
  };
}

interface OpenAPIOperation {
  operationId?: string;
  responses?: Record<string, {
    description?: string;
    content?: Record<string, { schema?: unknown }>;
  }>;
  security?: unknown[];
  parameters?: Array<{ name: string; in: string; required?: boolean }>;
  "x-webhook-event"?: string;
}

interface OpenAPISpec {
  paths?: Record<string, Record<HTTPMethod, OpenAPIOperation>>;
  "x-webhooks"?: Record<string, WebhookEventDef>;
  webhooks?: Record<string, WebhookEventDef>; // OpenAPI 3.1 standard key
}

function matchPath(specPath: string, requestPath: string): Record<string, string> | null {
  const specParts = specPath.split("/").filter(Boolean);
  const reqParts = requestPath.split("/").filter(Boolean);
  if (specParts.length !== reqParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < specParts.length; i++) {
    const sp = specParts[i];
    const rp = reqParts[i];
    if (sp.startsWith("{") && sp.endsWith("}")) {
      params[sp.slice(1, -1)] = rp;
    } else if (sp !== rp) {
      return null;
    }
  }
  return params;
}

function findOperation(spec: OpenAPISpec, method: string, path: string) {
  for (const [specPath, pathItem] of Object.entries(spec.paths ?? {})) {
    const params = matchPath(specPath, path);
    if (params === null) continue;
    const op = pathItem[method.toLowerCase() as HTTPMethod];
    if (!op) continue;
    return { operation: op, pathParams: params, specPath };
  }
  return null;
}

// Resolve the webhook event definition from x-webhooks or webhooks sections
function resolveWebhookEventDef(spec: OpenAPISpec, eventName: string): WebhookEventDef | null {
  return (
    (spec["x-webhooks"] ?? {})[eventName] ??
    (spec.webhooks ?? {})[eventName] ??
    null
  );
}

// Generate the webhook payload from the event definition's schema or example
function generateWebhookPayload(
  eventDef: WebhookEventDef,
  requestInput: Record<string, unknown> | null
): unknown | null {
  const jsonContent = eventDef.post?.requestBody?.content?.["application/json"];
  if (!jsonContent) return null;

  let payload: unknown = null;

  // 1. Try schema-driven generation first
  if (jsonContent.schema) {
    try {
      payload = generateFromSchema(jsonContent.schema as Parameters<typeof generateFromSchema>[0]);
    } catch {
      payload = null;
    }
  }

  // 2. Fall back to first available example if schema generation failed or no schema
  if (payload === null) {
    if (jsonContent.example !== undefined) {
      payload = JSON.parse(JSON.stringify(jsonContent.example)); // deep clone
    } else if (jsonContent.examples) {
      const firstExample = Object.values(jsonContent.examples)[0];
      if (firstExample?.value !== undefined) {
        payload = JSON.parse(JSON.stringify(firstExample.value));
      }
    }
  }

  // 3. Merge request input into payload.data so user-provided fields are reflected
  if (requestInput && payload && typeof payload === "object" && !Array.isArray(payload)) {
    const p = payload as Record<string, unknown>;
    if (p.data !== undefined && typeof p.data === "object" && p.data !== null) {
      // Shallow merge request fields into the data object
      p.data = { ...(p.data as Record<string, unknown>), ...requestInput };
    }
  }

  return payload;
}

export async function apiRoutes(app: FastifyInstance) {
  app.all<{
    Params: { api: string; version: string; "*": string };
  }>("/sandbox/:api/:version/*", async (req: FastifyRequest, reply: FastifyReply) => {
    const params = req.params as { api: string; version: string; "*": string };
    const { api, version } = params;
    const endpointPath = `/${params["*"]}`.split("?")[0];

    if (!specExists(api, version)) {
      return reply.status(404).send({
        error: "not_found",
        message: `No spec found for API '${api}' version '${version}'.`,
      });
    }

    let spec: OpenAPISpec;
    try {
      spec = (await loadSpec(api, version)) as OpenAPISpec;
    } catch (err) {
      return reply.status(500).send({
        error: "spec_error",
        message: `Failed to load spec: ${(err as Error).message}`,
      });
    }

    // Auth validation
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);
    if (token) {
      try {
        verifyToken(token);
      } catch {
        return reply.status(401).send({
          error: "unauthorized",
          message: "Invalid or expired Bearer token. Use /oauth/token to get a new one.",
        });
      }
    }

    // Match path + method to spec operation
    const found = findOperation(spec, req.method, endpointPath);
    if (!found) {
      return reply.status(404).send({
        error: "not_found",
        message: `No operation matched for ${req.method} ${endpointPath}`,
      });
    }

    const { operation } = found;

    if (operation.security?.length && !token) {
      return reply.status(401).send({
        error: "unauthorized",
        message: "Bearer token required. Use /oauth/token to get one.",
      });
    }

    // Read one-shot webhook headers (must happen before the 204 early return)
    const oneShotUrl = (req.headers["x-webhook-delivery-url"] as string | undefined)?.trim();
    const oneShotOAuthEndpoint = req.headers["x-webhook-oauth-endpoint"] as string | undefined;
    const oneShotClientId = req.headers["x-webhook-client-id"] as string | undefined;
    const oneShotClientSecret = req.headers["x-webhook-client-secret"] as string | undefined;

    // Find first 2xx response schema
    const responses = operation.responses ?? {};
    const successCode = Object.keys(responses).find((code) => {
      const n = parseInt(code, 10);
      return n >= 200 && n < 300;
    }) ?? "200";

    if (parseInt(successCode, 10) === 204) {
      reply.status(204).send();
      // Still fire webhooks for DELETE operations
      const webhookEventName = operation["x-webhook-event"];
      if (webhookEventName) {
        setImmediate(async () => {
          const eventDef = resolveWebhookEventDef(spec, webhookEventName);
          const webhookPayload = eventDef
            ? (generateWebhookPayload(eventDef, null) ?? null)
            : null;
          await fireWebhooks(webhookEventName, null, null, version, webhookPayload).catch(() => {});
          if (oneShotUrl) {
            await fireWebhookDirect(oneShotUrl, webhookPayload, oneShotOAuthEndpoint, oneShotClientId, oneShotClientSecret).catch(() => {});
          }
        });
      }
      return;
    }

    // Parse request body
    let requestInput: Record<string, unknown> | null = null;
    if (req.body && typeof req.body === "object") {
      requestInput = req.body as Record<string, unknown>;
    } else if (typeof req.body === "string" && req.body.trim().startsWith("{")) {
      try {
        requestInput = JSON.parse(req.body) as Record<string, unknown>;
      } catch { /* ignore */ }
    }

    // Generate REST API response (merge request input over faker data)
    const responseSpec = responses[successCode];
    const schema = responseSpec?.content?.["application/json"]?.schema;
    let responseBody: unknown = {};

    if (schema) {
      try {
        const synthetic = generateFromSchema(schema as Parameters<typeof generateFromSchema>[0]);
        if (requestInput && synthetic && typeof synthetic === "object" && !Array.isArray(synthetic)) {
          responseBody = { ...(synthetic as Record<string, unknown>), ...requestInput };
        } else {
          responseBody = synthetic;
        }
      } catch {
        responseBody = requestInput ?? { generated: true };
      }
    } else {
      responseBody = requestInput ?? { message: "OK" };
    }

    reply.status(parseInt(successCode, 10)).send(responseBody);

    const webhookEventName = operation["x-webhook-event"];
    if (webhookEventName) {
      // Async: generate webhook payload from the event schema and fire to registered endpoints
      // plus any one-shot delivery URL provided by the Try It console.
      setImmediate(async () => {
        try {
          // Look up the dedicated webhook event definition
          const eventDef = resolveWebhookEventDef(spec, webhookEventName);
          // Generate from event schema (preferred) -> fall back to wrapping the response body
          const webhookPayload = eventDef
            ? (generateWebhookPayload(eventDef, requestInput) ?? responseBody)
            : responseBody;

          await fireWebhooks(webhookEventName, responseBody, requestInput, version, webhookPayload);
          if (oneShotUrl) {
            await fireWebhookDirect(oneShotUrl, webhookPayload, oneShotOAuthEndpoint, oneShotClientId, oneShotClientSecret);
          }
        } catch { /* silently ignore */ }
      });
    }
  });
}
