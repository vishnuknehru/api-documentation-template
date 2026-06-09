"use client";

import { useState } from "react";
import type { OpenAPIOperation } from "@/lib/types";
import { SchemaViewer } from "./SchemaViewer";
import { cn } from "@/lib/utils";

type Responses = OpenAPIOperation["responses"];

interface ResponsePanelProps {
  responses: Responses;
}

function statusSampleBody(code: string): object | null | undefined {
  const samples: Record<string, object | null> = {
    "200": { data: { id: "550e8400-e29b-41d4-a716-446655440000", created_at: "2026-06-08T10:00:00Z" }, message: "OK" },
    "201": { id: "550e8400-e29b-41d4-a716-446655440000", created_at: "2026-06-08T10:00:00Z" },
    "204": null,
    "400": { error: "bad_request", message: "Invalid request body", details: [{ field: "email", issue: "must be a valid email address" }] },
    "401": { error: "unauthorized", message: "Bearer token is missing or invalid. Use POST /oauth/token to obtain a token." },
    "403": { error: "forbidden", message: "You do not have permission to perform this action." },
    "404": { error: "not_found", message: "The requested resource was not found." },
    "409": { error: "conflict", message: "A resource with this identifier already exists." },
    "422": { error: "unprocessable_entity", message: "Validation failed", errors: [{ field: "role", message: "must be one of: admin, member, viewer" }] },
    "500": { error: "internal_server_error", message: "An unexpected error occurred. Please try again later.", request_id: "req_7f3a9c1b2d4e" },
  };
  if (!(code in samples)) return undefined;
  return samples[code];
}

function statusColor(code: string): string {
  const n = parseInt(code, 10);
  if (n >= 200 && n < 300) return "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950";
  if (n >= 400 && n < 500) return "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950";
  if (n >= 500) return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950";
  return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900";
}

export function ResponsePanel({ responses }: ResponsePanelProps) {
  const codes = Object.entries(responses);
  const [active, setActive] = useState(codes[0]?.[0] ?? "200");
  const currentResponse = responses[active];
  const sampleBody = statusSampleBody(active);

  return (
    <div>
      {/* Status code tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {codes.map(([code]) => (
          <button
            key={code}
            onClick={() => setActive(code)}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors",
              statusColor(code),
              active === code ? "ring-2 ring-offset-1 ring-current" : ""
            )}
          >
            {code}
          </button>
        ))}
      </div>

      {/* Response detail */}
      {currentResponse && (
        <div>
          {currentResponse.description && (
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              {currentResponse.description}
            </p>
          )}
          {currentResponse.content && Object.entries(currentResponse.content).map(([contentType, media]) => (
            <div key={contentType}>
              <code className="text-xs font-mono px-2 py-0.5 rounded mb-3 inline-block" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
                {contentType}
              </code>
              {media.schema && <SchemaViewer schema={media.schema} />}
            </div>
          ))}

          {/* Sample Response */}
          {sampleBody !== undefined && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
                Sample Response
              </p>
              {sampleBody === null ? (
                <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>(No content)</p>
              ) : (
                <pre className="text-xs font-mono rounded p-3 overflow-x-auto" style={{ background: "var(--code-bg, var(--bg-tertiary))", color: "var(--text-secondary)" }}>
                  {JSON.stringify(sampleBody, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
