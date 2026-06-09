"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Download,
  Webhook,
} from "lucide-react";
import { ApiSwitcher } from "./ApiSwitcher";
import { VersionSwitcher } from "./VersionSwitcher";
import { cn } from "@/lib/utils";
import type { NavTree, NavSectionNode, NavGuideItem, NavTagGroup, NavEndpointItem, NavWebhookItem, ApiConfig, HttpMethod } from "@/lib/types";

interface SidebarProps {
  currentApi: string;
  currentVersion: string;
  navTree: NavTree;
  apiConfig: ApiConfig;
  allApis: Array<{ slug: string; config: ApiConfig }>;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  currentApi,
  currentVersion,
  navTree,
  apiConfig,
  allApis,
  isOpen = true,
  onClose,
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {onClose && isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "docs-sidebar flex flex-col",
          isOpen ? "open" : ""
        )}
      >
        {/* Sticky header: API switcher + version */}
        <div
          className="sticky top-0 z-10 p-3 space-y-2"
          style={{ background: "var(--sidebar-bg)" }}
        >
          <ApiSwitcher
            currentApi={currentApi}
            currentVersion={currentVersion}
            apis={allApis}
          />
          <div className="flex items-center justify-between px-1">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Version
            </span>
            <VersionSwitcher
              currentApi={currentApi}
              currentVersion={currentVersion}
              versions={apiConfig.versions}
            />
          </div>
          <div style={{ borderBottom: "1px solid var(--border)", marginTop: 8 }} />
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {navTree.map((section) => (
            <NavSectionBlock
              key={section.title}
              section={section}
              currentApi={currentApi}
              currentVersion={currentVersion}
            />
          ))}
        </nav>

        {/* SDK download pinned footer */}
        <div
          className="p-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <Link
            href={`/${currentApi}/${currentVersion}/sdks`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--sidebar-item-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <Download size={13} />
            <span>Download SDKs</span>
          </Link>
        </div>
      </aside>
    </>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function NavSectionBlock({
  section,
  currentApi,
  currentVersion,
}: {
  section: NavSectionNode;
  currentApi: string;
  currentVersion: string;
}) {
  return (
    <div className="mb-6">
      <div
        className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-muted)" }}
      >
        {section.title}
      </div>
      {section.items.map((item, i) => {
        if (item.type === "guide") {
          return (
            <GuideLink
              key={item.href}
              item={item}
            />
          );
        }
        if (item.type === "tag-group") {
          return (
            <TagGroup
              key={item.title}
              group={item}
            />
          );
        }
        return null;
      })}
    </div>
  );
}

// ─── Guide link ───────────────────────────────────────────────────────────────

function GuideLink({ item }: { item: NavGuideItem }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Link
      href={item.href}
      className="flex items-center px-3 py-1.5 rounded-md text-sm mb-0.5 transition-colors"
      style={{
        background: isActive ? "var(--sidebar-item-active-bg)" : "transparent",
        color: isActive ? "var(--sidebar-item-active-text)" : "var(--text-secondary)",
        fontWeight: isActive ? 500 : 400,
      }}
      onMouseEnter={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--sidebar-item-hover)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      {item.title}
    </Link>
  );
}

// ─── Tag group (collapsible) ──────────────────────────────────────────────────

function TagGroup({ group }: { group: NavTagGroup }) {
  const pathname = usePathname();
  const isAnyActive = group.items.some(
    (item) => pathname === item.href.split("#")[0] || pathname.startsWith(item.href.split("#")[0])
  );
  const [expanded, setExpanded] = useState(isAnyActive);

  return (
    <div className="mb-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors text-left"
        style={{ color: "var(--text-secondary)" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "var(--sidebar-item-hover)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        <ChevronRight
          size={12}
          className="flex-shrink-0 transition-transform"
          style={{
            color: "var(--text-muted)",
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
          }}
        />
        <span className="font-medium">{group.title}</span>
        <span
          className="ml-auto text-xs px-1.5 py-0.5 rounded-full"
          style={{
            background: "var(--bg-tertiary)",
            color: "var(--text-muted)",
          }}
        >
          {group.items.length}
        </span>
      </button>

      {expanded && (
        <div className="ml-3 border-l pl-2 mt-0.5 space-y-0.5" style={{ borderColor: "var(--border)" }}>
          {group.items.map((item) =>
            item.type === "webhook" ? (
              <WebhookLink key={item.href} item={item} />
            ) : (
              <EndpointLink key={item.href} item={item} />
            )
          )}
        </div>
      )}
    </div>
  );
}

// ─── Endpoint link ────────────────────────────────────────────────────────────

function EndpointLink({ item }: { item: NavEndpointItem }) {
  const pathname = usePathname();
  const hash = useLocationHash();
  const isActive = pathname === item.href && hash !== "#webhook-event";

  return (
    <Link
      href={item.href}
      className="flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors"
      style={{
        background: isActive ? "var(--sidebar-item-active-bg)" : "transparent",
        color: isActive ? "var(--sidebar-item-active-text)" : "var(--text-secondary)",
      }}
      onMouseEnter={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--sidebar-item-hover)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <span
        className="flex-shrink-0 inline-flex w-11 items-center justify-center rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase"
        style={{
          background: methodTone(item.method).background,
          color: methodTone(item.method).color,
        }}
      >
        {item.method}
      </span>
      <span className="truncate">{item.title || item.path}</span>
    </Link>
  );
}

function WebhookLink({ item }: { item: NavWebhookItem }) {
  const pathname = usePathname();
  const hash = useLocationHash();
  const [baseHref] = item.href.split("#");
  const isActive = pathname === baseHref && hash === "#webhook-event";

  return (
    <Link
      href={item.href}
      className="flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors"
      style={{
        background: isActive ? "var(--sidebar-item-active-bg)" : "transparent",
        color: isActive ? "var(--sidebar-item-active-text)" : "var(--text-secondary)",
      }}
      onMouseEnter={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--sidebar-item-hover)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <span
        className="flex-shrink-0 inline-flex w-11 items-center justify-center rounded px-1.5 py-0.5"
        title="Webhook event"
        style={{
          background: "rgba(5,150,105,0.12)",
          color: "#059669",
        }}
      >
        <Webhook size={12} strokeWidth={2.2} />
      </span>
      <span className="truncate font-medium">{item.title}</span>
    </Link>
  );
}

function useLocationHash(): string {
  const [hash, setHash] = useState("");

  useEffect(() => {
    function syncHash() {
      setHash(window.location.hash);
    }

    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  return hash;
}

function methodTone(method: HttpMethod): { background: string; color: string } {
  const tones: Record<HttpMethod, { background: string; color: string }> = {
    get: { background: "rgba(5,150,105,0.12)", color: "#047857" },
    post: { background: "rgba(15,118,110,0.12)", color: "#0f766e" },
    put: { background: "rgba(217,119,6,0.12)", color: "#b45309" },
    patch: { background: "rgba(13,148,136,0.12)", color: "#0f766e" },
    delete: { background: "rgba(220,38,38,0.12)", color: "#dc2626" },
    head: { background: "rgba(107,114,128,0.12)", color: "#6b7280" },
    options: { background: "rgba(107,114,128,0.12)", color: "#6b7280" },
  };
  return tones[method] ?? tones.get;
}
