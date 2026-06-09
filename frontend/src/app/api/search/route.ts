import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

function getContentRoot(): string {
  return process.env.CONTENT_PATH ?? path.join(process.cwd(), "..", "content");
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

interface SearchResult {
  type: "endpoint" | "guide";
  title: string;
  subtitle: string;
  href: string;
  api: string;
  apiName: string;
  method?: string;
}

interface ApiConfig {
  name: string;
  versions: string[];
  defaultVersion: string;
}

interface SiteConfig {
  apis: string[];
}

interface NavConfig {
  sections: Array<{
    title: string;
    items?: Array<{ title: string; file?: string }>;
    openapi?: string;
    groupBy?: string;
    order?: string[];
  }>;
}

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").toLowerCase().trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const contentRoot = getContentRoot();
  const siteConfigPath = path.join(contentRoot, "site.config.json");
  if (!fs.existsSync(siteConfigPath)) {
    return NextResponse.json({ results: [] });
  }

  const site = readJson<SiteConfig>(siteConfigPath);
  const results: SearchResult[] = [];

  for (const apiSlug of site.apis) {
    const apiConfigPath = path.join(contentRoot, "apis", apiSlug, "api.config.json");
    if (!fs.existsSync(apiConfigPath)) continue;

    const apiConfig = readJson<ApiConfig>(apiConfigPath);
    const apiName = apiConfig.name;
    const version = apiConfig.defaultVersion;

    // Index guides from nav.config.json
    const navConfigPath = path.join(contentRoot, "apis", apiSlug, "nav.config.json");
    if (fs.existsSync(navConfigPath)) {
      const navConfig = readJson<NavConfig>(navConfigPath);
      for (const section of navConfig.sections) {
        for (const item of section.items ?? []) {
          if (!item.file) continue;
          const title = item.title ?? "";
          if (title.toLowerCase().includes(q)) {
            // Strip leading "guides/" prefix — the URL already includes /guides/
            const slug = item.file.replace(/^guides\//, "").replace(/\.mdx$/, "");
            results.push({
              type: "guide",
              title,
              subtitle: `${apiName} · ${section.title}`,
              href: `/${apiSlug}/${version}/guides/${slug}`,
              api: apiSlug,
              apiName,
            });
          }
        }
      }
    }

    // Index endpoints from OpenAPI spec
    const specPath = path.join(contentRoot, "apis", apiSlug, "versions", version, "openapi.yaml");
    if (!fs.existsSync(specPath)) continue;

    try {
      const yaml = require("js-yaml");
      const spec = yaml.load(fs.readFileSync(specPath, "utf-8")) as {
        paths?: Record<string, Record<string, {
          operationId?: string;
          summary?: string;
          description?: string;
          tags?: string[];
        }>>;
      };

      const methods = ["get", "post", "put", "patch", "delete"];

      for (const [endpointPath, pathItem] of Object.entries(spec.paths ?? {})) {
        for (const method of methods) {
          const op = pathItem[method];
          if (!op) continue;

          const summary = op.summary ?? "";
          const opId = op.operationId ?? "";
          const tag = (op.tags ?? [])[0] ?? "default";

          const searchableText = `${summary} ${endpointPath} ${opId} ${method}`.toLowerCase();
          if (!searchableText.includes(q)) continue;

          results.push({
            type: "endpoint",
            title: summary || `${method.toUpperCase()} ${endpointPath}`,
            subtitle: `${apiName} · ${tag}`,
            href: `/${apiSlug}/${version}/reference/${encodeURIComponent(tag.toLowerCase())}/${opId}`,
            api: apiSlug,
            apiName,
            method: method.toUpperCase(),
          });
        }
      }
    } catch {
      // Skip if spec parsing fails
    }
  }

  // Limit to 20 results
  return NextResponse.json({ results: results.slice(0, 20) });
}
