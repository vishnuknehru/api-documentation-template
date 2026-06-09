import { notFound } from "next/navigation";
import { getGuidePath, guideExists } from "@/lib/content";
import fs from "fs";
import { MDXRenderer } from "@/components/mdx/MDXRenderer";
import { TableOfContents } from "@/components/layout/TableOfContents";

export const dynamic = "force-dynamic";

interface GuidePageProps {
  params: { api: string; version: string; slug: string[] };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { api, version, slug } = params;

  if (!guideExists(api, slug)) {
    notFound();
  }

  const guidePath = getGuidePath(api, slug);
  const source = fs.readFileSync(guidePath, "utf-8");

  return (
    <div className="flex gap-8 max-w-5xl mx-auto px-6 py-8">
      <article className="flex-1 min-w-0 max-w-3xl">
        <MDXRenderer source={source} apiSlug={api} />
      </article>
      <aside className="hidden xl:block w-56 flex-shrink-0">
        <TableOfContents source={source} />
      </aside>
    </div>
  );
}
