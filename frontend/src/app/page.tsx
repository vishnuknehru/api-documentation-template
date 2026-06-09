import { getAllApis, getSiteConfig } from "@/lib/content";
import { ApiCard } from "@/components/landing/ApiCard";
import { TopBar } from "@/components/layout/TopBar";
import { BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default function LandingPage() {
  const apis = getAllApis();

  let siteName = "Developer Docs";
  try {
    siteName = getSiteConfig().siteName;
  } catch {
    // use default
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <TopBar siteName={siteName} showSearch={false} />

      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1
            className="text-4xl font-bold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            {siteName}
          </h1>
          <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
            Choose an API below to get started with documentation, guides, and the
            interactive sandbox.
          </p>
        </div>

        {apis.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {apis.map((api) => (
              <ApiCard key={api.slug} api={api} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-xl border-2 border-dashed p-12 text-center"
      style={{ borderColor: "var(--border)" }}
    >
      <BookOpen
        className="mx-auto mb-4 opacity-40"
        size={40}
        style={{ color: "var(--text-secondary)" }}
      />
      <h2
        className="text-lg font-semibold mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        No APIs yet
      </h2>
      <p
        className="text-sm max-w-sm mx-auto"
        style={{ color: "var(--text-secondary)" }}
      >
        Add an API by creating a folder in{" "}
        <code
          className="px-1.5 py-0.5 rounded text-xs font-mono"
          style={{ background: "var(--bg-tertiary)", color: "var(--accent)" }}
        >
          content/apis/your-api/
        </code>{" "}
        with an <code className="px-1 py-0.5 rounded text-xs font-mono" style={{ background: "var(--bg-tertiary)" }}>api.config.json</code>{" "}
        file, then add its slug to{" "}
        <code className="px-1 py-0.5 rounded text-xs font-mono" style={{ background: "var(--bg-tertiary)" }}>site.config.json</code>.
      </p>
    </div>
  );
}
