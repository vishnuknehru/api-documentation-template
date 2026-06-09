"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { SearchModal } from "@/components/layout/SearchModal";

interface DocsLayoutData {
  navTree: import("@/lib/types").NavTree;
  apiConfig: import("@/lib/types").ApiConfig;
  allApis: Array<{ slug: string; config: import("@/lib/types").ApiConfig }>;
  siteName: string;
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ api: string; version: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<DocsLayoutData | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/nav-data?api=${params.api}&version=${params.version}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
    return () => controller.abort();
  }, [params.api, params.version]);

  const siteName = data?.siteName ?? "Developer Docs";

  return (
    <div className="docs-layout">
      {data && (
        <Sidebar
          currentApi={params.api}
          currentVersion={params.version}
          navTree={data.navTree}
          apiConfig={data.apiConfig}
          allApis={data.allApis}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      <div className="docs-main flex flex-col min-h-screen">
        <TopBar
          siteName={siteName}
          showSearch
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          menuOpen={sidebarOpen}
          logoHref="/"
        />
        <main className="flex-1">{children}</main>
      </div>
      <SearchModal />
    </div>
  );
}
