"use client";

import Link from "next/link";
import * as LucideIcons from "lucide-react";
import type { ApiSummary } from "@/lib/types";

interface ApiCardProps {
  api: ApiSummary;
}

export function ApiCard({ api }: ApiCardProps) {
  const { slug, config, endpointCount } = api;
  const href = `/${slug}/${config.defaultVersion}/guides/getting-started`;

  // Dynamically pick the icon from lucide-react
  const IconName = toPascalCase(config.icon);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[IconName] ?? LucideIcons.BookOpen;

  return (
    <Link
      href={href}
      className="group block rounded-xl border p-6 transition-all duration-150 hover:shadow-md"
      style={{
        background: "var(--bg-primary)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: hexWithOpacity(config.color, 0.12) }}
        >
          <Icon size={20} style={{ color: config.color }} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h2
            className="font-semibold text-base leading-snug mb-1 group-hover:underline"
            style={{ color: "var(--text-primary)" }}
          >
            {config.name}
          </h2>
          <p
            className="text-sm leading-relaxed line-clamp-2"
            style={{ color: "var(--text-secondary)" }}
          >
            {config.description}
          </p>
        </div>
      </div>

      {/* Footer meta */}
      <div
        className="mt-4 pt-4 flex items-center gap-4 text-xs"
        style={{
          borderTop: "1px solid var(--border)",
          color: "var(--text-muted)",
        }}
      >
        <span>
          {config.versions.length === 1
            ? `v${config.versions[0]}`
            : `${config.versions.length} versions`}
        </span>
        {endpointCount > 0 && (
          <>
            <span>·</span>
            <span>{endpointCount} endpoints</span>
          </>
        )}
        <span className="ml-auto" style={{ color: config.color }}>
          View docs →
        </span>
      </div>
    </Link>
  );
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

function hexWithOpacity(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
