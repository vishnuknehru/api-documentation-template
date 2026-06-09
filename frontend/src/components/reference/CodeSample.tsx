"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { OpenAPIOperation, HttpMethod } from "@/lib/types";
import {
  generateCurl,
  generateJavaScript,
  generatePython,
  generateTypeScript,
} from "@/lib/codegen";

interface CodeSampleProps {
  method: HttpMethod;
  path: string;
  operation: OpenAPIOperation;
  apiVersion?: string;
  token?: string;
}

type Language = "curl" | "javascript" | "python" | "typescript";

const LANGUAGES: { id: Language; label: string }[] = [
  { id: "curl", label: "curl" },
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "typescript", label: "TypeScript" },
];

export function CodeSample({
  method,
  path,
  operation,
  apiVersion,
  token,
}: CodeSampleProps) {
  const [lang, setLang] = useState<Language>("curl");
  const [copied, setCopied] = useState(false);

  const sandboxBase =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_SANDBOX_URL ?? "http://localhost:4000"
      : "http://localhost:4000";

  const opts = { method, path, operation, baseUrl: sandboxBase, token };

  const code =
    lang === "curl"
      ? generateCurl(opts)
      : lang === "javascript"
      ? generateJavaScript(opts)
      : lang === "python"
      ? generatePython(opts)
      : generateTypeScript(opts);

  const ext =
    lang === "javascript" ? "javascript"
    : lang === "python" ? "python"
    : lang === "typescript" ? "typescript"
    : "bash";

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: "var(--border)" }}
    >
      {/* Language tabs */}
      <div
        className="flex border-b overflow-x-auto"
        style={{
          background: "var(--bg-tertiary)",
          borderColor: "var(--border)",
        }}
      >
        {LANGUAGES.map((l) => (
          <button
            key={l.id}
            onClick={() => setLang(l.id)}
            className="px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors"
            style={{
              color: lang === l.id ? "var(--accent)" : "var(--text-muted)",
              borderBottomColor: lang === l.id ? "var(--accent)" : "transparent",
              background: "transparent",
            }}
          >
            {l.label}
          </button>
        ))}

        {/* Copy button */}
        <button
          onClick={copy}
          className="ml-auto flex items-center gap-1 px-3 py-2 text-xs transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {/* Code block */}
      <pre
        className="p-4 overflow-x-auto text-xs leading-relaxed font-mono"
        style={{
          background: "var(--code-bg)",
          color: "var(--text-primary)",
          margin: 0,
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
