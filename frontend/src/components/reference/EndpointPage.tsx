"use client";

import { useState } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import type { HttpMethod } from "@/lib/types";
import type { OperationVersionEntry } from "@/lib/openapi";
import { EndpointCard } from "./EndpointCard";
import { CodeSample } from "./CodeSample";
import { TryItConsole } from "./TryItConsole";
import { cn } from "@/lib/utils";

interface EndpointPageProps {
  api: string;
  currentVersion: string;
  tag: string;
  versionEntries: OperationVersionEntry[];
}

type RightPanelTab = "code" | "tryit";

export function EndpointPage({ api, currentVersion, tag, versionEntries }: EndpointPageProps) {
  const [rightTab, setRightTab] = useState<RightPanelTab>("code");

  // Default to the latest version tab; fall back to the URL version
  const latestEntry = versionEntries.find((e) => e.isLatest) ?? versionEntries[versionEntries.length - 1];
  const [activeVersion, setActiveVersion] = useState<string>(
    versionEntries.find((e) => e.version === currentVersion)?.version ?? latestEntry?.version ?? currentVersion
  );

  const active = versionEntries.find((e) => e.version === activeVersion) ?? versionEntries[0];
  if (!active) return null;

  const { method, path, operation } = active;
  const isDeprecated = !!operation.deprecated;
  const sunsetDate = active.sunsetDate;
  const deprecationNotice = active.deprecationNotice;
  const showVersionTabs = versionEntries.length > 1;

  return (
    <div className="flex gap-0 min-h-[calc(100vh-3.5rem)]">
      {/* Left: endpoint documentation */}
      <div className="flex-1 min-w-0 max-w-2xl px-6 py-8 border-r" style={{ borderColor: "var(--border)" }}>
        {/* Breadcrumb */}
        <nav className="mb-6 text-xs" style={{ color: "var(--text-muted)" }}>
          <span className="capitalize">{tag}</span>
          <span className="mx-2">›</span>
          <span style={{ color: "var(--text-primary)" }}>
            {operation.summary ?? path}
          </span>
        </nav>

        {/* Title + method */}
        <div className="flex items-center gap-3 mb-2">
          <span
            className="method-badge"
            style={{ background: methodBg(method), color: methodFg(method) }}
          >
            {method.toUpperCase()}
          </span>
          <code className="font-mono text-sm" style={{ color: "var(--text-primary)" }}>
            {path}
          </code>
        </div>

        {operation.summary && (
          <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
            {operation.summary}
          </h1>
        )}

        {/* Per-endpoint version tabs */}
        {showVersionTabs && (
          <div className="flex items-center gap-2 mb-6 mt-4">
            <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Version:</span>
            <div className="flex items-center gap-1.5">
              {versionEntries.map((entry) => {
                const isActive = entry.version === activeVersion;
                const isEntryDeprecated = !!entry.operation.deprecated;
                return (
                  <button
                    key={entry.version}
                    onClick={() => setActiveVersion(entry.version)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                    )}
                    style={{
                      background: isActive ? "var(--accent)" : "var(--bg-secondary)",
                      color: isActive ? "var(--accent-contrast)" : isEntryDeprecated ? "var(--text-muted)" : "var(--text-secondary)",
                      borderColor: isActive ? "var(--accent)" : "var(--border)",
                    }}
                  >
                    {entry.version}
                    {entry.isLatest && (
                      <span
                        className="text-[9px] font-bold px-1 py-0.5 rounded"
                        style={{
                          background: isActive ? "rgba(255,255,255,0.25)" : "var(--accent-muted)",
                          color: isActive ? "var(--accent-contrast)" : "var(--accent)",
                        }}
                      >
                        LATEST
                      </span>
                    )}
                    {isEntryDeprecated && !entry.isLatest && (
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded"
                        style={{
                          background: isActive ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.1)",
                          color: isActive ? "#fca5a5" : "#ef4444",
                        }}
                      >
                        DEPRECATED
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Deprecation banner */}
        {isDeprecated && (
          <div
            className="mb-6 rounded-lg p-4 border"
            style={{
              background: "rgba(239,68,68,0.06)",
              borderColor: "rgba(239,68,68,0.25)",
            }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm font-semibold" style={{ color: "#ef4444" }}>
                    Deprecated
                  </span>
                  {sunsetDate && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      <Clock size={11} />
                      Sunset: {formatSunsetDate(sunsetDate)}
                    </span>
                  )}
                </div>
                {deprecationNotice && (
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {deprecationNotice}
                  </p>
                )}
                {!deprecationNotice && (
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    This version is deprecated. Migrate to the latest version before the sunset date.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {operation.description && (
          <p className="mb-8 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {operation.description}
          </p>
        )}

        <EndpointCard
          method={method}
          path={path}
          operation={operation}
          spec={null as never}
          webhookEvent={active.webhookEvent}
        />
      </div>

      {/* Right: code samples / try-it */}
      <div className="hidden lg:flex w-96 xl:w-[440px] flex-shrink-0 flex-col">
        {/* Tab bar */}
        <div
          className="flex border-b sticky top-14 z-10"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
        >
          {(["code", "tryit"] as RightPanelTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setRightTab(tab)}
              className="px-4 py-3 text-xs font-medium border-b-2 transition-colors"
              style={{
                color: rightTab === tab ? "var(--accent)" : "var(--text-secondary)",
                borderBottomColor: rightTab === tab ? "var(--accent)" : "transparent",
                background: "transparent",
              }}
            >
              {tab === "code" ? "Code Samples" : "Try it"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4" style={{ background: "var(--bg-secondary)" }}>
          {rightTab === "code" ? (
            <CodeSample
              method={method}
              path={path}
              operation={operation}
              apiVersion={activeVersion}
            />
          ) : (
            <TryItConsole
              api={api}
              version={activeVersion}
              method={method}
              path={path}
              operation={operation}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function formatSunsetDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function methodBg(method: HttpMethod): string {
  const map: Record<HttpMethod, string> = {
    get: "rgba(5,150,105,0.12)",
    post: "rgba(15,118,110,0.12)",
    put: "rgba(217,119,6,0.12)",
    patch: "rgba(13,148,136,0.12)",
    delete: "rgba(220,38,38,0.12)",
    head: "rgba(107,114,128,0.12)",
    options: "rgba(107,114,128,0.12)",
  };
  return map[method] ?? map.get;
}

function methodFg(method: HttpMethod): string {
  const map: Record<HttpMethod, string> = {
    get: "#047857",
    post: "#0f766e",
    put: "#b45309",
    patch: "#0d9488",
    delete: "#dc2626",
    head: "#6b7280",
    options: "#6b7280",
  };
  return map[method] ?? map.get;
}
