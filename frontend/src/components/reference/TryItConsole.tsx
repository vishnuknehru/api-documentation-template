"use client";

import { useState } from "react";
import { Play, Key, Webhook, ChevronDown, ChevronUp, Check, AlertCircle, Settings } from "lucide-react";
import type { OpenAPIOperation, HttpMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TryItConsoleProps {
  api: string;
  version: string;
  method: HttpMethod;
  path: string;
  operation: OpenAPIOperation;
}

export function TryItConsole({ api, version, method, path, operation }: TryItConsoleProps) {
  const sandboxBase = process.env.NEXT_PUBLIC_SANDBOX_URL ?? "http://localhost:4000";

  // ── Sandbox auth (to call the sandbox API) ──────────────────────────────────
  const [clientId, setClientId] = useState(
    process.env.NEXT_PUBLIC_MOCK_CLIENT_ID ?? "sandbox_client_id_abc123"
  );
  const [clientSecret, setClientSecret] = useState("sandbox_secret_xyz789");
  const [token, setToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // ── Request ─────────────────────────────────────────────────────────────────
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [bodyValue, setBodyValue] = useState("");
  const [response, setResponse] = useState<{
    status: number;
    statusText: string;
    body: unknown;
    latencyMs: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  // ── Publish ──────────────────────────────────────────────────────────────────
  const [showWebhook, setShowWebhook] = useState(!!operation["x-webhook-event"]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookOAuthEndpoint, setWebhookOAuthEndpoint] = useState("");
  const [webhookOAuthClientId, setWebhookOAuthClientId] = useState("");
  const [webhookOAuthClientSecret, setWebhookOAuthClientSecret] = useState("");
  const [showWebhookOAuth, setShowWebhookOAuth] = useState(false);
  const [webhookDispatched, setWebhookDispatched] = useState(false);

  const requiresAuth = !!operation.security?.length;
  const params = operation.parameters ?? [];
  const hasBody = ["post", "put", "patch"].includes(method);
  const hasWebhookEvent = !!operation["x-webhook-event"];
  const publishDomain = getPublishDomain(operation);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  async function getToken() {
    setTokenLoading(true);
    setTokenError(null);
    try {
      const res = await fetch(`${sandboxBase}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to get token");
      setToken(data.access_token);
    } catch (e) {
      setTokenError((e as Error).message);
    } finally {
      setTokenLoading(false);
    }
  }

  async function sendRequest() {
    if (hasWebhookEvent && !webhookUrl.trim()) {
      setRequestError("Enter a publish endpoint URL before sending this publish-enabled request.");
      return;
    }

    setLoading(true);
    setRequestError(null);
    setResponse(null);
    setWebhookDispatched(false);
    try {
      let resolvedPath = path;
      for (const [key, val] of Object.entries(paramValues)) {
        resolvedPath = resolvedPath.replace(`{${key}}`, encodeURIComponent(val));
      }
      const queryParams = params
        .filter((p) => p.in === "query" && paramValues[p.name])
        .map((p) => `${p.name}=${encodeURIComponent(paramValues[p.name])}`)
        .join("&");

      const url = `${sandboxBase}/sandbox/${api}/${version}${resolvedPath}${queryParams ? `?${queryParams}` : ""}`;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      if (hasWebhookEvent && webhookUrl.trim()) {
        headers["X-Webhook-Delivery-Url"] = webhookUrl.trim();
        if (webhookOAuthEndpoint) headers["X-Webhook-OAuth-Endpoint"] = webhookOAuthEndpoint;
        if (webhookOAuthClientId) headers["X-Webhook-Client-Id"] = webhookOAuthClientId;
        if (webhookOAuthClientSecret) headers["X-Webhook-Client-Secret"] = webhookOAuthClientSecret;
      }

      const start = Date.now();
      const res = await fetch(url, {
        method: method.toUpperCase(),
        headers,
        body: hasBody && bodyValue ? bodyValue : undefined,
      });
      const latencyMs = Date.now() - start;

      let body: unknown;
      try { body = await res.json(); } catch { body = await res.text(); }

      setResponse({ status: res.status, statusText: res.statusText, body, latencyMs });
      if (hasWebhookEvent && webhookUrl.trim() && res.ok) {
        setWebhookDispatched(true);
      }
    } catch (e) {
      setRequestError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const statusColor = response
    ? response.status >= 200 && response.status < 300 ? "#10b981"
    : response.status >= 400 ? "#ef4444"
    : "#f59e0b"
    : "";

  return (
    <div className="space-y-4">
      {/* ── Sandbox auth ─────────────────────────────────────────────────────── */}
      {requiresAuth && (
        <section className="rounded-lg border p-4" style={{ borderColor: "var(--border)", background: "var(--bg-primary)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Key size={14} style={{ color: "var(--text-muted)" }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Sandbox Authentication
            </span>
            {token && (
              <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <Check size={11} /> Token active
              </span>
            )}
          </div>
          <div className="space-y-2 mb-3">
            <InputField label="Client ID" value={clientId} onChange={setClientId} mono />
            <InputField label="Client Secret" value={clientSecret} onChange={setClientSecret} type="password" mono />
          </div>
          {tokenError && (
            <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
              <AlertCircle size={11} /> {tokenError}
            </p>
          )}
          <button
            onClick={getToken}
            disabled={tokenLoading}
            className="w-full py-1.5 rounded text-xs font-medium"
            style={{ background: "var(--accent)", color: "var(--accent-contrast)", opacity: tokenLoading ? 0.7 : 1 }}
          >
            {tokenLoading ? "Getting token..." : "Get Token"}
          </button>
          {token && (
            <div className="mt-2 p-2 rounded text-xs font-mono break-all" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
              {token.substring(0, 40)}...
            </div>
          )}
        </section>
      )}

      {/* ── Parameters ───────────────────────────────────────────────────────── */}
      {params.length > 0 && (
        <section className="rounded-lg border p-4" style={{ borderColor: "var(--border)", background: "var(--bg-primary)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
            Parameters
          </p>
          <div className="space-y-2">
            {params.map((param) => (
              <InputField
                key={param.name}
                label={param.name}
                sublabel={`${param.in}${param.required ? " · required" : ""}`}
                value={paramValues[param.name] ?? ""}
                onChange={(v) => setParamValues((prev) => ({ ...prev, [param.name]: v }))}
                placeholder={param.schema?.example ? String(param.schema.example) : param.name}
                mono
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Request body ─────────────────────────────────────────────────────── */}
      {hasBody && (
        <section className="rounded-lg border p-4" style={{ borderColor: "var(--border)", background: "var(--bg-primary)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>
            Request Body (JSON)
          </p>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            Fields you provide here will appear in the response and the publish payload.
          </p>
          <textarea
            value={bodyValue}
            onChange={(e) => setBodyValue(e.target.value)}
            rows={5}
            className="w-full text-xs font-mono rounded border p-2 resize-y"
            style={{
              background: "var(--bg-tertiary)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
              outline: "none",
            }}
            placeholder={'{\n  "name": "Alice Johnson",\n  "email": "alice@example.com"\n}'}
          />
        </section>
      )}

      {/* ── Publish section (only for endpoints with x-webhook-event) ────────── */}
      {hasWebhookEvent && (
        <section className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => setShowWebhook(!showWebhook)}
            className="w-full flex items-center gap-2 px-4 py-3 text-left"
            style={{ background: "var(--bg-primary)" }}
          >
            <Webhook size={14} style={{ color: "#059669" }} />
            <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
              Publish {publishDomain}
            </span>
            {showWebhook
              ? <ChevronUp size={13} className="ml-auto" style={{ color: "var(--text-muted)" }} />
              : <ChevronDown size={13} className="ml-auto" style={{ color: "var(--text-muted)" }} />
            }
          </button>

          {showWebhook && (
            <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "var(--border)", background: "var(--bg-primary)" }}>
              <p className="text-xs pt-3" style={{ color: "var(--text-secondary)" }}>
                Provide a publish endpoint for this request. The sandbox posts the{" "}
                <code className="font-mono" style={{ color: "var(--accent)" }}>
                  {operation["x-webhook-event"]}
                </code>{" "}
                payload to this URL after the REST request succeeds, without storing the endpoint in memory.
              </p>

              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-secondary)" }}>
                  Publish Endpoint URL <span className="text-red-500">required</span>
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-server.com/publish"
                  className="w-full text-xs font-mono rounded border px-2 py-1.5"
                  style={{
                    background: "var(--bg-tertiary)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <button
                  onClick={() => setShowWebhookOAuth(!showWebhookOAuth)}
                  className="flex items-center gap-1.5 text-xs mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Settings size={11} />
                  {showWebhookOAuth ? "Hide" : "Configure"} publish authentication
                  {showWebhookOAuth ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </button>

                {showWebhookOAuth && (
                  <div
                    className="rounded-lg border p-3 space-y-2"
                    style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
                  >
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Provide your OAuth endpoint and credentials. The sandbox will call it to obtain a token and include it as{" "}
                      <code className="font-mono">Authorization: Bearer</code> when posting to your publish endpoint.
                    </p>
                    <InputField
                      label="OAuth Token Endpoint"
                      value={webhookOAuthEndpoint}
                      onChange={setWebhookOAuthEndpoint}
                      placeholder="https://auth.example.com/oauth/token"
                      mono
                    />
                    <InputField
                      label="Client ID"
                      value={webhookOAuthClientId}
                      onChange={setWebhookOAuthClientId}
                      placeholder="your_client_id"
                      mono
                    />
                    <InputField
                      label="Client Secret"
                      value={webhookOAuthClientSecret}
                      onChange={setWebhookOAuthClientSecret}
                      type="password"
                      placeholder="your_client_secret"
                      mono
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Send button ──────────────────────────────────────────────────────── */}
      <button
        onClick={sendRequest}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm"
        style={{ background: "var(--accent)", color: "var(--accent-contrast)", opacity: loading ? 0.7 : 1 }}
      >
        <Play size={14} />
        {loading ? "Sending..." : `Send ${method.toUpperCase()} Request`}
      </button>

      {/* ── Request error ────────────────────────────────────────────────────── */}
      {requestError && (
        <div className="p-3 rounded-lg text-xs text-red-500" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertCircle size={12} className="inline mr-1" />
          {requestError}
        </div>
      )}

      {/* ── Response ─────────────────────────────────────────────────────────── */}
      {response && (
        <section className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <div
            className="flex items-center gap-3 px-4 py-2.5 border-b"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
          >
            <span className="text-sm font-bold" style={{ color: statusColor }}>{response.status}</span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{response.statusText}</span>
            <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>{response.latencyMs}ms</span>
          </div>
          <pre
            className="p-4 overflow-x-auto text-xs font-mono"
            style={{ background: "var(--code-bg)", color: "var(--text-primary)", margin: 0 }}
          >
            {JSON.stringify(response.body, null, 2)}
          </pre>
          {webhookDispatched && webhookUrl && (
            <div
              className="px-4 py-2 text-xs flex items-center gap-1.5 border-t"
              style={{ borderColor: "var(--border)", background: "var(--bg-secondary)", color: "var(--text-muted)" }}
            >
              <Check size={11} className="text-emerald-500" />
              <span>Publish delivery sent to <code className="font-mono">{webhookUrl}</code></span>
            </div>
          )}
        </section>
      )}

    </div>
  );
}

// ─── Input Field helper ────────────────────────────────────────────────────────

function InputField({
  label,
  sublabel,
  value,
  onChange,
  placeholder,
  type = "text",
  mono = false,
}: {
  label: string;
  sublabel?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          {label}
        </label>
        {sublabel && (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{sublabel}</span>
        )}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? label}
        className={cn("w-full rounded border px-2.5 py-1.5 text-xs", mono && "font-mono")}
        style={{
          background: "var(--bg-tertiary)",
          borderColor: "var(--border)",
          color: "var(--text-primary)",
          outline: "none",
        }}
      />
    </div>
  );
}

function getPublishDomain(operation: OpenAPIOperation): string {
  const tag = operation.tags?.[0]?.trim();
  if (tag) {
    return tag.endsWith("s") ? tag.slice(0, -1) : tag;
  }

  const eventName = operation["x-webhook-event"] ?? "";
  const domain = eventName.split(".")[0];
  if (!domain) return "Domain";
  return domain.charAt(0).toUpperCase() + domain.slice(1);
}
