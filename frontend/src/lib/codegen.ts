import type { OpenAPIOperation, HttpMethod } from "./types";

interface CodegenOptions {
  method: HttpMethod;
  path: string;
  operation: OpenAPIOperation;
  baseUrl?: string;
  token?: string;
}

export function generateCurl(opts: CodegenOptions): string {
  const { method, path, operation, baseUrl = "https://api.example.com", token } = opts;
  const lines: string[] = [];

  lines.push(`curl -X ${method.toUpperCase()} \\`);
  lines.push(`  '${baseUrl}${path}' \\`);

  if (token) {
    lines.push(`  -H 'Authorization: Bearer ${token}' \\`);
  } else if (operation.security?.length) {
    lines.push(`  -H 'Authorization: Bearer YOUR_TOKEN' \\`);
  }

  if (["post", "put", "patch"].includes(method) && operation.requestBody) {
    const content = operation.requestBody.content;
    const jsonMedia = content["application/json"];
    if (jsonMedia?.schema) {
      lines.push(`  -H 'Content-Type: application/json' \\`);
      const body = generateExampleBody(jsonMedia.schema);
      lines.push(`  -d '${JSON.stringify(body, null, 2)}'`);
    }
  } else {
    // Remove trailing backslash from last header line
    const last = lines[lines.length - 1];
    if (last.endsWith(" \\")) {
      lines[lines.length - 1] = last.slice(0, -2);
    }
  }

  return lines.join("\n");
}

export function generateJavaScript(opts: CodegenOptions): string {
  const { method, path, operation, baseUrl = "https://api.example.com", token } = opts;
  const hasBody = ["post", "put", "patch"].includes(method) && !!operation.requestBody;
  const bodySchema = operation.requestBody?.content?.["application/json"]?.schema;
  const body = hasBody && bodySchema ? generateExampleBody(bodySchema) : null;

  const authHeader = operation.security?.length
    ? `\n  'Authorization': \`Bearer ${token ?? "YOUR_TOKEN"}\`,`
    : "";

  return `const response = await fetch('${baseUrl}${path}', {
  method: '${method.toUpperCase()}',
  headers: {${authHeader}
    'Content-Type': 'application/json',
  },${
    body
      ? `\n  body: JSON.stringify(${JSON.stringify(body, null, 4)
          .split("\n")
          .join("\n  ")}),`
      : ""
  }
});

const data = await response.json();
console.log(data);`;
}

export function generatePython(opts: CodegenOptions): string {
  const { method, path, operation, baseUrl = "https://api.example.com", token } = opts;
  const hasBody = ["post", "put", "patch"].includes(method) && !!operation.requestBody;
  const bodySchema = operation.requestBody?.content?.["application/json"]?.schema;
  const body = hasBody && bodySchema ? generateExampleBody(bodySchema) : null;

  const authHeader = operation.security?.length
    ? `\n    "Authorization": f"Bearer ${token ?? "YOUR_TOKEN"}",`
    : "";

  return `import requests

headers = {${authHeader}
    "Content-Type": "application/json",
}
${body ? `\npayload = ${JSON.stringify(body, null, 4)}\n` : ""}
response = requests.${method.toLowerCase()}(
    "${baseUrl}${path}",
    headers=headers,${body ? "\n    json=payload," : ""}
)

print(response.json())`;
}

export function generateTypeScript(opts: CodegenOptions): string {
  const { method, path, operation, baseUrl = "https://api.example.com", token } = opts;
  const hasBody = ["post", "put", "patch"].includes(method) && !!operation.requestBody;
  const bodySchema = operation.requestBody?.content?.["application/json"]?.schema;
  const body = hasBody && bodySchema ? generateExampleBody(bodySchema) : null;

  const authHeader = operation.security?.length
    ? `\n  'Authorization': \`Bearer ${token ?? "YOUR_TOKEN"}\`,`
    : "";

  return `interface ApiResponse {
  // Response shape from the spec
  [key: string]: unknown;
}

const response = await fetch('${baseUrl}${path}', {
  method: '${method.toUpperCase()}',
  headers: {${authHeader}
    'Content-Type': 'application/json',
  },${
    body
      ? `\n  body: JSON.stringify(${JSON.stringify(body, null, 4)
          .split("\n")
          .join("\n  ")}),`
      : ""
  }
});

const data: ApiResponse = await response.json();
console.log(data);`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateExampleBody(schema: import("./types").JSONSchema): unknown {
  if (!schema) return {};

  if (schema.example !== undefined) return schema.example;

  if (schema.type === "object" && schema.properties) {
    const obj: Record<string, unknown> = {};
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      obj[key] = generateExampleBody(propSchema);
    }
    return obj;
  }

  if (schema.type === "array") {
    return schema.items ? [generateExampleBody(schema.items)] : [];
  }

  if (schema.enum) return schema.enum[0];

  switch (schema.type) {
    case "string":
      return schema.format === "email" ? "user@example.com"
        : schema.format === "date-time" ? "2026-06-08T10:00:00Z"
        : schema.format === "uuid" ? "550e8400-e29b-41d4-a716-446655440000"
        : "string";
    case "integer":
    case "number":
      return 0;
    case "boolean":
      return true;
    default:
      return null;
  }
}
