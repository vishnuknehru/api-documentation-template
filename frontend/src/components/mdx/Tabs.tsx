"use client";

import { useState, Children, isValidElement } from "react";
import { cn } from "@/lib/utils";

interface TabProps {
  label: string;
  children: React.ReactNode;
}

export function Tab({ children }: TabProps) {
  return <>{children}</>;
}

interface TabsProps {
  children: React.ReactNode;
}

export function Tabs({ children }: TabsProps) {
  const tabs = Children.toArray(children).filter(
    (child): child is React.ReactElement<TabProps> =>
      isValidElement(child) && typeof (child.props as TabProps).label === "string"
  );

  const [active, setActive] = useState(0);

  if (tabs.length === 0) return null;

  return (
    <div className="not-prose my-6 rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
      {/* Tab bar */}
      <div
        className="flex border-b overflow-x-auto"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border)",
        }}
      >
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
              i === active
                ? "border-accent"
                : "border-transparent"
            )}
            style={{
              color: i === active ? "var(--accent)" : "var(--text-secondary)",
              borderBottomColor: i === active ? "var(--accent)" : "transparent",
            }}
          >
            {(tab.props as TabProps).label}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      <div className="p-4" style={{ background: "var(--bg-primary)" }}>
        {(tabs[active].props as TabProps).children}
      </div>
    </div>
  );
}
