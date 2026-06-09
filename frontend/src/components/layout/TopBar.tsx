"use client";

import Link from "next/link";
import { Search, Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface TopBarProps {
  siteName?: string;
  showSearch?: boolean;
  onMenuToggle?: () => void;
  menuOpen?: boolean;
  logoHref?: string;
}

export function TopBar({
  siteName = "Developer Docs",
  showSearch = true,
  onMenuToggle,
  menuOpen = false,
  logoHref = "/",
}: TopBarProps) {
  return (
    <header
      className="sticky top-0 z-50 flex items-center h-14 px-4 gap-3"
      style={{
        background: "var(--topbar-bg)",
        borderBottom: "1px solid var(--topbar-border)",
      }}
    >
      {/* Mobile hamburger */}
      {onMenuToggle && (
        <button
          onClick={onMenuToggle}
          aria-label="Toggle sidebar"
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      )}

      {/* Logo / Site name */}
      <Link
        href={logoHref}
        className="flex items-center gap-2 font-semibold text-sm"
        style={{ color: "var(--text-primary)" }}
      >
        <span className="text-base font-bold">{siteName}</span>
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search trigger */}
      {showSearch && (
        <button
          className="hidden md:flex items-center gap-2 h-8 px-3 rounded-lg border text-sm transition-colors"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border)",
            color: "var(--text-muted)",
            minWidth: 200,
          }}
          onClick={() => {
            // Search modal will be wired up in Phase 8
            document.dispatchEvent(new CustomEvent("open-search"));
          }}
        >
          <Search size={14} />
          <span>Search docs...</span>
          <span
            className="ml-auto text-xs px-1.5 py-0.5 rounded border font-mono"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-muted)",
              background: "var(--bg-primary)",
            }}
          >
            ⌘K
          </span>
        </button>
      )}

      {/* Theme toggle */}
      <ThemeToggle />
    </header>
  );
}
