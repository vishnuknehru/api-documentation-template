import path from "path";
import fs from "fs";
import type {
  SiteConfig,
  ApiConfig,
  NavConfig,
  ApiSummary,
} from "./types";

function getContentRoot(): string {
  return process.env.CONTENT_PATH ?? path.join(process.cwd(), "..", "content");
}

function contentPath(...segments: string[]): string {
  return path.join(getContentRoot(), ...segments);
}

function readJson<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

export function getSiteConfig(): SiteConfig {
  return readJson<SiteConfig>(contentPath("site.config.json"));
}

export function getApiConfig(apiSlug: string): ApiConfig {
  return readJson<ApiConfig>(contentPath("apis", apiSlug, "api.config.json"));
}

export function getNavConfig(apiSlug: string): NavConfig {
  return readJson<NavConfig>(contentPath("apis", apiSlug, "nav.config.json"));
}

export function apiExists(apiSlug: string): boolean {
  try {
    const p = contentPath("apis", apiSlug, "api.config.json");
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

export function versionExists(apiSlug: string, version: string): boolean {
  try {
    const p = contentPath("apis", apiSlug, "versions", version, "openapi.yaml");
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

export function getOpenApiSpecPath(apiSlug: string, version: string): string {
  return contentPath("apis", apiSlug, "versions", version, "openapi.yaml");
}

export function getGuidePath(apiSlug: string, slug: string[]): string {
  return contentPath("apis", apiSlug, "guides", `${slug.join("/")}.mdx`);
}

export function guideExists(apiSlug: string, slug: string[]): boolean {
  return fs.existsSync(getGuidePath(apiSlug, slug));
}

export function listGuides(apiSlug: string): string[] {
  const guidesDir = contentPath("apis", apiSlug, "guides");
  if (!fs.existsSync(guidesDir)) return [];
  return fs
    .readdirSync(guidesDir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export function getAllApis(): ApiSummary[] {
  let site: SiteConfig;
  try {
    site = getSiteConfig();
  } catch {
    return [];
  }

  return site.apis
    .filter((slug) => apiExists(slug))
    .map((slug) => {
      const config = getApiConfig(slug);
      // Count endpoints across all versions
      let endpointCount = 0;
      try {
        const specPath = getOpenApiSpecPath(slug, config.defaultVersion);
        if (fs.existsSync(specPath)) {
          const raw = fs.readFileSync(specPath, "utf-8");
          const yaml = require("js-yaml");
          const spec = yaml.load(raw) as { paths?: Record<string, unknown> };
          if (spec.paths) {
            endpointCount = Object.values(spec.paths).reduce((acc: number, pathItem) => {
              const methods = ["get", "post", "put", "patch", "delete", "head", "options"];
              return acc + methods.filter((m) => (pathItem as Record<string, unknown>)[m]).length;
            }, 0);
          }
        }
      } catch {
        // spec might not exist yet
      }
      return { slug, config, endpointCount };
    });
}
