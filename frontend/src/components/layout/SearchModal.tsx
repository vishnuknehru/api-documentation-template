"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Zap, X } from "lucide-react";
import { cn, methodColor } from "@/lib/utils";
import type { HttpMethod } from "@/lib/types";

interface SearchResult {
  type: "endpoint" | "guide";
  title: string;
  subtitle: string;
  href: string;
  api: string;
  apiName: string;
  method?: string;
}

export function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setActiveIndex(0);
  }, []);

  // Listen for open-search event and Cmd+K
  useEffect(() => {
    function handleOpen() {
      setOpen(true);
    }
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        close();
      }
    }
    document.addEventListener("open-search", handleOpen);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("open-search", handleOpen);
      document.removeEventListener("keydown", handleKey);
    };
  }, [close]);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setActiveIndex(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard nav within results
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const result = results[activeIndex];
      if (result) {
        router.push(result.href);
        close();
      }
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
    >
      <div
        className="w-full max-w-xl rounded-xl shadow-2xl overflow-hidden"
        style={{
          background: "var(--bg-primary)",
          border: "1px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <Search size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search endpoints, guides..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--text-primary)" }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ color: "var(--text-muted)" }}>
              <X size={14} />
            </button>
          )}
          <kbd
            className="text-xs px-1.5 py-0.5 rounded border font-mono"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--bg-secondary)" }}
          >
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <div className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              Searching...
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {!loading && results.length > 0 && (
            <ul className="py-2">
              {results.map((result, i) => (
                <ResultItem
                  key={`${result.href}-${i}`}
                  result={result}
                  isActive={i === activeIndex}
                  onHover={() => setActiveIndex(i)}
                  onSelect={() => {
                    router.push(result.href);
                    close();
                  }}
                />
              ))}
            </ul>
          )}

          {!query && (
            <div className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              Type to search endpoints and guides
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-3 px-4 py-2 text-xs"
          style={{
            borderTop: "1px solid var(--border)",
            color: "var(--text-muted)",
            background: "var(--bg-secondary)",
          }}
        >
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded border font-mono" style={{ borderColor: "var(--border)" }}>↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded border font-mono" style={{ borderColor: "var(--border)" }}>↵</kbd>
            open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded border font-mono" style={{ borderColor: "var(--border)" }}>Esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}

function ResultItem({
  result,
  isActive,
  onHover,
  onSelect,
}: {
  result: SearchResult;
  isActive: boolean;
  onHover: () => void;
  onSelect: () => void;
}) {
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (isActive) {
      ref.current?.scrollIntoView({ block: "nearest" });
    }
  }, [isActive]);

  return (
    <li
      ref={ref}
      onMouseEnter={onHover}
      onClick={onSelect}
      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
      style={{
        background: isActive ? "var(--sidebar-item-active-bg)" : "transparent",
      }}
    >
      {/* Icon */}
      <span
        className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-xs"
        style={{ background: "var(--bg-tertiary)" }}
      >
        {result.type === "endpoint" ? (
          <Zap size={13} style={{ color: "var(--text-secondary)" }} />
        ) : (
          <FileText size={13} style={{ color: "var(--text-secondary)" }} />
        )}
      </span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {result.type === "endpoint" && result.method && (
            <span
              className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded font-mono",
                methodColor(result.method.toLowerCase() as HttpMethod)
              )}
            >
              {result.method}
            </span>
          )}
          <span
            className="text-sm font-medium truncate"
            style={{ color: isActive ? "var(--sidebar-item-active-text)" : "var(--text-primary)" }}
          >
            {result.title}
          </span>
        </div>
        <div className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
          {result.subtitle}
        </div>
      </div>
    </li>
  );
}
