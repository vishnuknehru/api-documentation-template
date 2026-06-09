import type { OpenAPIParameter } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ParameterTableProps {
  parameters: OpenAPIParameter[];
}

const locationLabel: Record<string, string> = {
  path: "path",
  query: "query",
  header: "header",
  cookie: "cookie",
};

const locationColor: Record<string, string> = {
  path: "text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950",
  query: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950",
  header: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950",
  cookie: "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900",
};

export function ParameterTable({ parameters }: ParameterTableProps) {
  // Group by location
  const groups: Record<string, OpenAPIParameter[]> = {};
  for (const param of parameters) {
    if (!groups[param.in]) groups[param.in] = [];
    groups[param.in].push(param);
  }

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([location, params]) => (
        <div key={location}>
          <p className="text-xs uppercase tracking-wide font-medium mb-2" style={{ color: "var(--text-muted)" }}>
            {locationLabel[location] ?? location}
          </p>
          <div className="rounded-lg border divide-y" style={{ borderColor: "var(--border)" }}>
            {params.map((param) => (
              <div key={param.name} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-sm font-mono font-semibold" style={{ color: "var(--text-primary)" }}>
                    {param.name}
                  </code>
                  {param.schema?.type && (
                    <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                      {Array.isArray(param.schema.type)
                        ? param.schema.type.join(" | ")
                        : param.schema.type}
                      {param.schema.format ? ` <${param.schema.format}>` : ""}
                    </span>
                  )}
                  {param.required && (
                    <span className="text-xs text-red-500 font-medium">required</span>
                  )}
                </div>
                {param.description && (
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {param.description}
                  </p>
                )}
                {param.schema?.enum && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {param.schema.enum.map((val, i) => (
                      <code
                        key={i}
                        className="text-xs font-mono px-1.5 py-0.5 rounded"
                        style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                      >
                        {String(val)}
                      </code>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
