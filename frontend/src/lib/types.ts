// ─── Content Config Types ──────────────────────────────────────────────────────

export interface SiteConfig {
  siteName: string;
  logo?: string;
  apis: string[];
  defaultApi: string;
}

export interface ApiConfig {
  name: string;
  description: string;
  icon: string;
  defaultVersion: string;
  versions: string[];
  color: string;
}

export interface NavItem {
  title: string;
  file?: string;
  href?: string;
}

export interface NavSection {
  title: string;
  items?: NavItem[];
  openapi?: string;
  groupBy?: "tags";
  order?: string[];
}

export interface NavConfig {
  sections: NavSection[];
}

// ─── Computed Nav Tree Types ───────────────────────────────────────────────────

export interface NavGuideItem {
  type: "guide";
  title: string;
  slug: string;
  href: string;
}

export interface NavEndpointItem {
  type: "endpoint";
  title: string;
  method: HttpMethod;
  path: string;
  operationId: string;
  href: string;
  summary?: string;
}

export interface NavWebhookItem {
  type: "webhook";
  title: string;
  eventName: string;
  operationId: string;
  href: string;
}

export interface NavTagGroup {
  type: "tag-group";
  title: string;
  items: Array<NavEndpointItem | NavWebhookItem>;
}

export interface NavSectionNode {
  title: string;
  items: Array<NavGuideItem | NavTagGroup>;
}

export type NavTree = NavSectionNode[];

// ─── OpenAPI Types ────────────────────────────────────────────────────────────

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete" | "head" | "options";

export interface OpenAPIParameter {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  description?: string;
  required?: boolean;
  schema?: JSONSchema;
  example?: unknown;
}

export interface JSONSchema {
  type?: string | string[];
  format?: string;
  description?: string;
  enum?: unknown[];
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  $ref?: string;
  allOf?: JSONSchema[];
  oneOf?: JSONSchema[];
  anyOf?: JSONSchema[];
  nullable?: boolean;
  example?: unknown;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  additionalProperties?: boolean | JSONSchema;
}

export interface OpenAPIOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: OpenAPIParameter[];
  requestBody?: {
    description?: string;
    required?: boolean;
    content: Record<string, { schema?: JSONSchema; examples?: Record<string, unknown> }>;
  };
  responses: Record<string, {
    description?: string;
    content?: Record<string, { schema?: JSONSchema }>;
  }>;
  security?: Record<string, string[]>[];
  deprecated?: boolean;
  "x-sunset"?: string;
  "x-deprecation-notice"?: string;
  "x-webhook-event"?: string;
}

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, Partial<Record<HttpMethod, OpenAPIOperation>>>;
  tags?: Array<{ name: string; description?: string }>;
  components?: {
    schemas?: Record<string, JSONSchema>;
    securitySchemes?: Record<string, unknown>;
  };
  servers?: Array<{ url: string; description?: string }>;
  // OpenAPI 3.0 extension / 3.1 standard — webhook event definitions
  "x-webhooks"?: Record<string, WebhookEventDefinition>;
  webhooks?: Record<string, WebhookEventDefinition>;
}

export interface WebhookEventDefinition {
  post?: {
    summary?: string;
    description?: string;
    requestBody?: {
      required?: boolean;
      content: Record<string, {
        schema?: JSONSchema;
        example?: unknown;
        examples?: Record<string, { summary?: string; value?: unknown }>;
      }>;
    };
  };
}

// ─── API Summary (for landing page) ───────────────────────────────────────────

export interface ApiSummary {
  slug: string;
  config: ApiConfig;
  endpointCount: number;
  specTitle?: string;
}
