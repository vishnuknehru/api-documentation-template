"use client";

import { Download, ExternalLink } from "lucide-react";
import type { ApiConfig } from "@/lib/types";

interface SdkDownloadPageProps {
  api: string;
  version: string;
  apiConfig: ApiConfig;
}

interface SdkEntry {
  language: string;
  label: string;
  icon: string;
  packageManager: string;
  installCmd: string;
  filename: string;
  color: string;
}

const SDK_ENTRIES: SdkEntry[] = [
  {
    language: "python",
    label: "Python",
    icon: "🐍",
    packageManager: "pip",
    installCmd: "pip install ./{api}-client",
    filename: "python.zip",
    color: "#3776ab",
  },
  {
    language: "java",
    label: "Java",
    icon: "☕",
    packageManager: "Maven / Gradle",
    installCmd: "See README inside the SDK",
    filename: "java.zip",
    color: "#e76f00",
  },
  {
    language: "typescript",
    label: "TypeScript",
    icon: "📦",
    packageManager: "npm",
    installCmd: "npm install ./{api}-client",
    filename: "typescript.zip",
    color: "#3178c6",
  },
  {
    language: "csharp",
    label: "C# / .NET",
    icon: "🔷",
    packageManager: "NuGet",
    installCmd: "See README inside the SDK",
    filename: "csharp.zip",
    color: "#512bd4",
  },
  {
    language: "go",
    label: "Go",
    icon: "🐹",
    packageManager: "go modules",
    installCmd: "go get ./{api}-client",
    filename: "go.zip",
    color: "#00add8",
  },
];

export function SdkDownloadPage({ api, version, apiConfig }: SdkDownloadPageProps) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
        Download SDK
      </h1>
      <p className="mb-8" style={{ color: "var(--text-secondary)" }}>
        Client libraries for <strong>{apiConfig.name}</strong> {version} — auto-generated from
        the OpenAPI spec. Each SDK is pre-configured for the sandbox environment.
      </p>

      {/* Sandbox config callout */}
      <div
        className="rounded-lg border p-4 mb-8 text-sm"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border)",
        }}
      >
        <p className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
          Sandbox credentials (pre-configured in each SDK)
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["Base URL", `http://localhost:4000/sandbox/${api}/${version}`],
            ["Client ID", "sandbox_client_id_abc123"],
            ["Client Secret", "sandbox_secret_xyz789"],
          ].map(([label, value]) => (
            <div key={label}>
              <span className="block text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>
                {label}
              </span>
              <code
                className="text-xs font-mono px-2 py-0.5 rounded"
                style={{
                  background: "var(--bg-primary)",
                  color: "var(--accent)",
                  border: "1px solid var(--border)",
                }}
              >
                {value}
              </code>
            </div>
          ))}
        </div>
      </div>

      {/* SDK list */}
      <div className="space-y-3">
        {SDK_ENTRIES.map((sdk) => {
          const downloadUrl = `/sdks/${api}/${version}/${sdk.filename}`;
          const installCmd = sdk.installCmd.replace(/{api}/g, api);

          return (
            <div
              key={sdk.language}
              className="flex items-center gap-4 p-4 rounded-lg border"
              style={{
                background: "var(--bg-primary)",
                borderColor: "var(--border)",
              }}
            >
              <span className="text-2xl flex-shrink-0">{sdk.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm mb-0.5" style={{ color: "var(--text-primary)" }}>
                  {sdk.label}
                </div>
                <code
                  className="text-xs font-mono"
                  style={{ color: "var(--text-muted)" }}
                >
                  {installCmd}
                </code>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className="text-xs px-2 py-1 rounded border"
                  style={{
                    color: "var(--text-secondary)",
                    borderColor: "var(--border)",
                  }}
                >
                  {sdk.packageManager}
                </span>
                <a
                  href={downloadUrl}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: "var(--accent-muted)",
                    color: "var(--accent)",
                  }}
                >
                  <Download size={13} />
                  Download
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-xs" style={{ color: "var(--text-muted)" }}>
        SDKs are generated from the OpenAPI spec using{" "}
        <code className="font-mono">openapi-generator-cli</code>. Run{" "}
        <code className="font-mono">make generate-sdks</code> after updating your spec to
        regenerate.
      </p>
    </div>
  );
}
