import type { OpenAPIOperation, OpenAPISpec, HttpMethod, WebhookEventDefinition } from "@/lib/types";
import { ParameterTable } from "./ParameterTable";
import { SchemaViewer } from "./SchemaViewer";
import { ResponsePanel } from "./ResponsePanel";
import { Shield, Webhook } from "lucide-react";

interface EndpointCardProps {
  method: HttpMethod;
  path: string;
  operation: OpenAPIOperation;
  spec: OpenAPISpec;
  webhookEvent?: { name: string; def: WebhookEventDefinition };
}

export function EndpointCard({ method, path, operation, spec, webhookEvent }: EndpointCardProps) {
  const hasParams = operation.parameters && operation.parameters.length > 0;
  const hasBody = !!operation.requestBody;
  const hasAuth = operation.security && operation.security.length > 0;

  const webhookJsonContent = webhookEvent?.def?.post?.requestBody?.content?.["application/json"];
  const webhookSchema = webhookJsonContent?.schema;
  const webhookSummary = webhookEvent?.def?.post?.summary;
  const webhookDescription = webhookEvent?.def?.post?.description;

  return (
    <div className="space-y-8">
      {/* Auth requirement */}
      {hasAuth && (
        <div
          className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
          style={{
            background: "var(--accent-muted)",
            color: "var(--accent)",
          }}
        >
          <Shield size={14} />
          <span>Requires authentication</span>
        </div>
      )}

      {/* Parameters */}
      {hasParams && (
        <section>
          <SectionTitle>Parameters</SectionTitle>
          <ParameterTable parameters={operation.parameters!} />
        </section>
      )}

      {/* Request body */}
      {hasBody && operation.requestBody && (
        <section>
          <SectionTitle>
            Request Body
            {operation.requestBody.required && (
              <span className="ml-2 text-xs text-red-500">required</span>
            )}
          </SectionTitle>
          {operation.requestBody.description && (
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              {operation.requestBody.description}
            </p>
          )}
          {Object.entries(operation.requestBody.content).map(([contentType, media]) => (
            <div key={contentType}>
              <code className="text-xs font-mono px-2 py-0.5 rounded mb-3 inline-block" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
                {contentType}
              </code>
              {media.schema && <SchemaViewer schema={media.schema} />}
            </div>
          ))}
        </section>
      )}

      {/* Responses */}
      <section>
        <SectionTitle>Responses</SectionTitle>
        <ResponsePanel responses={operation.responses} />
      </section>

      {/* Publish event fired by this endpoint */}
      {webhookEvent && (
        <section id="webhook-event" className="scroll-mt-20">
          <SectionTitle>Publishes Domain Event</SectionTitle>
          <div
            className="rounded-lg border overflow-hidden"
            style={{ borderColor: "var(--border)" }}
          >
            <div
              className="flex items-center gap-3 px-4 py-3 border-b"
              style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border)",
              }}
            >
              <Webhook size={14} style={{ color: "#059669", flexShrink: 0 }} />
              <code
                className="text-sm font-mono font-medium"
                style={{ color: "var(--accent)" }}
              >
                {webhookEvent.name}
              </code>
              {webhookSummary && (
                <span
                  className="text-xs ml-auto"
                  style={{ color: "var(--text-muted)" }}
                >
                  {webhookSummary}
                </span>
              )}
            </div>

            <div className="px-4 py-4 space-y-4">
              {webhookDescription && (
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {webhookDescription}
                </p>
              )}

              <div
                className="text-xs rounded px-3 py-2"
                style={{
                  background: "var(--accent-muted)",
                  color: "var(--text-secondary)",
                }}
              >
                When this endpoint is called in the sandbox, the platform delivers a&nbsp;
                <code className="font-mono" style={{ color: "var(--accent)" }}>
                  {webhookEvent.name}
                </code>
                &nbsp;event to the configured publish URL. Request body fields you provide
                are merged into the event&apos;s{" "}
                <code className="font-mono" style={{ color: "var(--accent)" }}>data</code> object.
              </div>

              {webhookSchema && (
                <div>
                  <p
                    className="text-xs font-semibold uppercase tracking-wide mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Publish Payload Schema
                  </p>
                  <SchemaViewer schema={webhookSchema} />
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-sm font-semibold uppercase tracking-wide mb-3"
      style={{ color: "var(--text-muted)" }}
    >
      {children}
    </h2>
  );
}
