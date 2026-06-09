"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";

interface VersionSwitcherProps {
  currentApi: string;
  currentVersion: string;
  versions: string[];
}

export function VersionSwitcher({ currentApi, currentVersion, versions }: VersionSwitcherProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function navigate(version: string) {
    // Replace the version segment in the current path
    const newPath = pathname.replace(
      `/${currentApi}/${currentVersion}/`,
      `/${currentApi}/${version}/`
    );
    router.push(newPath);
    setOpen(false);
  }

  if (versions.length <= 1) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-7 px-2.5 rounded border text-xs font-mono font-medium transition-colors"
        style={{
          background: "var(--bg-primary)",
          borderColor: "var(--border)",
          color: "var(--text-secondary)",
        }}
      >
        <span>{currentVersion}</span>
        <ChevronDown
          size={11}
          className="transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 rounded-lg border shadow-lg z-50 overflow-hidden"
          style={{
            background: "var(--bg-primary)",
            borderColor: "var(--border)",
            minWidth: 100,
          }}
        >
          {versions.map((v) => {
            const isActive = v === currentVersion;
            return (
              <button
                key={v}
                onClick={() => navigate(v)}
                className="w-full flex items-center justify-between gap-3 px-3 py-2 text-xs font-mono text-left transition-colors"
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
                <span>{v}</span>
                {isActive && <Check size={11} style={{ color: "var(--accent)" }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
