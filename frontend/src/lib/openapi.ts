import fs from "fs";
import yaml from "js-yaml";
import type { OpenAPISpec, HttpMethod, OpenAPIOperation, WebhookEventDefinition } from "./types";

const specCache = new Map<string, OpenAPISpec>();

export async function loadSpec(specPath: string): Promise<OpenAPISpec> {
  if (specCache.has(specPath)) {
    return specCache.get(specPath)!;
  }

  if (!fs.existsSync(specPath)) {
    throw new Error(`OpenAPI spec not found: ${specPath}`);
  }

  const raw = fs.readFileSync(specPath, "utf-8");
  let parsed: unknown;

  if (specPath.endsWith(".yaml") || specPath.endsWith(".yml")) {
    parsed = yaml.load(raw);
  } else {
    parsed = JSON.parse(raw);
  }

  // Basic $ref dereferencing (inline only — external $ref support via swagger-parser below)
  let spec: OpenAPISpec;
  try {
    const SwaggerParser = (await import("@apidevtools/swagger-parser")).default;
    spec = (await SwaggerParser.dereference(specPath)) as OpenAPISpec;
  } catch {
    // Fallback to raw parsed spec if swagger-parser fails
    spec = parsed as OpenAPISpec;
  }

  specCache.set(specPath, spec);
  return spec;
}

export function getSpecTags(spec: OpenAPISpec): Array<{ name: string; description?: string }> {
  const definedTags = spec.tags ?? [];
  const usedTagNames = new Set<string>();

  for (const pathItem of Object.values(spec.paths ?? {})) {
    const methods: HttpMethod[] = ["get", "post", "put", "patch", "delete", "head", "options"];
    for (const method of methods) {
      const op = pathItem[method];
      if (op?.tags) {
        op.tags.forEach((t) => usedTagNames.add(t));
      }
    }
  }

  // Merge defined tags + used-but-not-defined tags
  const result = [...definedTags];
  for (const name of Array.from(usedTagNames)) {
    if (!result.find((t) => t.name === name)) {
      result.push({ name });
    }
  }

  return result;
}

export function getOperationsByTag(
  spec: OpenAPISpec,
  tagName: string
): Array<{
  method: HttpMethod;
  path: string;
  operationId: string;
  summary?: string;
  description?: string;
  webhookEventName?: string;
  webhookEventTitle?: string;
}> {
  const results = [];
  const methods: HttpMethod[] = ["get", "post", "put", "patch", "delete", "head", "options"];

  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const method of methods) {
      const op = pathItem[method];
      if (!op) continue;
      if (!op.tags?.includes(tagName)) continue;

      const webhookEventName = op["x-webhook-event"];
      const webhookDef = webhookEventName
        ? ((spec["x-webhooks"] ?? {})[webhookEventName] ?? (spec.webhooks ?? {})[webhookEventName])
        : undefined;

      results.push({
        method,
        path,
        operationId: op.operationId ?? `${method}-${path.replace(/\W/g, "-")}`,
        summary: op.summary,
        description: op.description,
        webhookEventName,
        webhookEventTitle: webhookEventName ? eventTitle(webhookEventName, webhookDef?.post?.summary) : undefined,
      });
    }
  }

  return results;
}

function eventTitle(eventName: string, summary?: string): string {
  if (summary && !/changed$/i.test(summary.trim())) return summary.trim();
  return eventName
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export interface OperationVersionEntry {
  version: string;
  isLatest: boolean;
  method: HttpMethod;
  path: string;
  operation: OpenAPIOperation;
  sunsetDate?: string;
  deprecationNotice?: string;
  webhookEvent?: {
    name: string;
    def: WebhookEventDefinition;
  };
}

export async function getOperationVersions(
  apiSlug: string,
  operationId: string,
  allVersions: string[],
  defaultVersion: string,
  getSpecPath: (version: string) => string
): Promise<OperationVersionEntry[]> {
  const entries: OperationVersionEntry[] = [];

  for (const version of allVersions) {
    const specPath = getSpecPath(version);
    if (!fs.existsSync(specPath)) continue;

    let spec: OpenAPISpec;
    try {
      spec = await loadSpec(specPath);
    } catch {
      continue;
    }

    const found = getOperation(spec, operationId);
    if (!found) continue;

    const webhookEventName = found.operation["x-webhook-event"];
    const webhookDef = webhookEventName
      ? ((spec["x-webhooks"] ?? {})[webhookEventName] ?? (spec.webhooks ?? {})[webhookEventName])
      : undefined;

    entries.push({
      version,
      isLatest: version === defaultVersion,
      method: found.method,
      path: found.path,
      operation: found.operation,
      sunsetDate: (found.operation as OpenAPIOperation & { "x-sunset"?: string })["x-sunset"],
      deprecationNotice: (found.operation as OpenAPIOperation & { "x-deprecation-notice"?: string })["x-deprecation-notice"],
      webhookEvent: webhookEventName && webhookDef
        ? { name: webhookEventName, def: webhookDef }
        : undefined,
    });
  }

  // Sort: latest version first (leftmost tab), then newest-to-oldest
  return entries.sort((a, b) => {
    if (a.isLatest !== b.isLatest) return a.isLatest ? -1 : 1;
    return b.version.localeCompare(a.version);
  });
}

export function getOperation(
  spec: OpenAPISpec,
  operationId: string
): {
  method: HttpMethod;
  path: string;
  operation: NonNullable<OpenAPISpec["paths"][string][HttpMethod]>;
} | null {
  const methods: HttpMethod[] = ["get", "post", "put", "patch", "delete", "head", "options"];

  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const method of methods) {
      const op = pathItem[method];
      if (!op) continue;

      const id = op.operationId ?? `${method}-${path.replace(/\W/g, "-")}`;
      if (id === operationId) {
        return { method, path, operation: op };
      }
    }
  }

  return null;
}
