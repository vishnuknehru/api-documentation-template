"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { ApiConfig } from "@/lib/types";

interface ApiSwitcherProps {
  currentApi: string;
  currentVersion: string;
  apis: Array<{ slug: string; config: ApiConfig }>;
}

export function ApiSwitcher({ currentApi, currentVersion, apis }: ApiSwitcherProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  const current = apis.find((a) => a.slug === currentApi);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function navigate(slug: string, config: ApiConfig) {
    const version = config.defaultVersion;
    router.push(`/${slug}/${version}/guides/getting-started`);
    setOpen(false);
  }

  if (!current) return null;

  const IconName = toPascalCase(current.config.icon);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[IconName] ?? LucideIcons.BookOpen;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left"
        style={{
          background: open ? "var(--sidebar-item-hover)" : "transparent",
          color: "var(--text-primary)",
        }}
        onMouseEnter={(e) => {
          if (!open) (e.currentTarget as HTMLElement).style.background = "var(--sidebar-item-hover)";
        }}
        onMouseLeave={(e) => {
          if (!open) (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        <div
          className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center"
          style={{ background: hexWithOpacity(current.config.color, 0.12) }}
        >
          <Icon size={13} style={{ color: current.config.color }} />
        </div>
        <span className="flex-1 truncate">{current.config.name}</span>
        <ChevronDown
          size={14}
          className="flex-shrink-0 transition-transform"
          style={{
            color: "var(--text-muted)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-lg z-50 overflow-hidden"
          style={{
            background: "var(--bg-primary)",
            borderColor: "var(--border)",
          }}
        >
          {apis.map(({ slug, config }) => {
            const ItemIconName = toPascalCase(config.icon);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ItemIcon = (LucideIcons as any)[ItemIconName] ?? LucideIcons.BookOpen;
            const isActive = slug === currentApi;

            return (
              <button
                key={slug}
                onClick={() => navigate(slug, config)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors"
                style={{
                  background: isActive ? "var(--sidebar-item-active-bg)" : "transparent",
                  color: isActive ? "var(--sidebar-item-active-text)" : "var(--text-primary)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.background = "var(--sidebar-item-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <div
                  className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center"
                  style={{ background: hexWithOpacity(config.color, 0.12) }}
                >
                  <ItemIcon size={13} style={{ color: config.color }} />
                </div>
                <span className="flex-1 truncate">{config.name}</span>
                {isActive && <Check size={13} style={{ color: "var(--accent)" }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function hexWithOpacity(hex: string, opacity: number): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  } catch {
    return `rgba(99, 102, 241, ${opacity})`;
  }
}
