"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { JSONSchema } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SchemaViewerProps {
  schema: JSONSchema;
  depth?: number;
}

export function SchemaViewer({ schema, depth = 0 }: SchemaViewerProps) {
  const type = resolveType(schema);

  if (type === "object" && schema.properties) {
    return (
      <div
        className={cn(
          "rounded-lg border divide-y text-sm",
          depth > 0 && "mt-2"
        )}
        style={{ borderColor: "var(--border)" }}
      >
        {Object.entries(schema.properties).map(([name, propSchema]) => (
          <SchemaProperty
            key={name}
            name={name}
            schema={propSchema}
            required={schema.required?.includes(name)}
            depth={depth}
          />
        ))}
      </div>
    );
  }

  if (type === "array" && schema.items) {
    return (
      <div>
        <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          array of:
        </span>
        <SchemaViewer schema={schema.items} depth={depth + 1} />
      </div>
    );
  }

  return (
    <div className="px-3 py-2 rounded text-sm font-mono" style={{ color: "var(--text-secondary)" }}>
      {type}
      {schema.format && <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>({schema.format})</span>}
    </div>
  );
}

interface SchemaPropertyProps {
  name: string;
  schema: JSONSchema;
  required?: boolean;
  depth: number;
}

function SchemaProperty({ name, schema, required, depth }: SchemaPropertyProps) {
  const type = resolveType(schema);
  const isExpandable =
    (type === "object" && schema.properties) ||
    (type === "array" && schema.items);
  const [expanded, setExpanded] = useState(depth === 0);

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-2">
        {isExpandable && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 mt-0.5"
            style={{ color: "var(--text-muted)" }}
          >
            <ChevronRight
              size={13}
              className="transition-transform"
              style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
            />
          </button>
        )}
        {!isExpandable && <div className="w-[13px] flex-shrink-0" />}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-sm font-mono font-semibold" style={{ color: "var(--text-primary)" }}>
              {name}
            </code>
            <span className="text-xs font-mono" style={{ color: "var(--accent)" }}>
              {type}
              {schema.format && <span style={{ color: "var(--text-muted)" }}>({schema.format})</span>}
            </span>
            {required && (
              <span className="text-xs font-medium text-red-500">required</span>
            )}
            {schema.nullable && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>nullable</span>
            )}
          </div>

          {schema.description && (
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              {schema.description}
            </p>
          )}

          {schema.enum && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {schema.enum.map((v, i) => (
                <code
                  key={i}
                  className="text-xs font-mono px-1.5 py-0.5 rounded"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                >
                  {String(v)}
                </code>
              ))}
            </div>
          )}

          {schema.example !== undefined && (
            <div className="mt-1.5">
              <span className="text-xs mr-1" style={{ color: "var(--text-muted)" }}>example:</span>
              <code className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                {JSON.stringify(schema.example)}
              </code>
            </div>
          )}

          {isExpandable && expanded && (
            <SchemaViewer schema={schema} depth={depth + 1} />
          )}
        </div>
      </div>
    </div>
  );
}

function resolveType(schema: JSONSchema): string {
  if (schema.allOf || schema.oneOf || schema.anyOf) return "object";
  if (Array.isArray(schema.type)) return schema.type.join(" | ");
  return schema.type ?? "any";
}
