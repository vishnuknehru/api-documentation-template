import { NextRequest, NextResponse } from "next/server";
import { getApiConfig, getNavConfig, getAllApis, getSiteConfig, getOpenApiSpecPath } from "@/lib/content";
import { loadSpec } from "@/lib/openapi";
import { buildNavTree } from "@/lib/nav";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const api = searchParams.get("api") ?? "";
  const version = searchParams.get("version") ?? "";

  try {
    const [apiConfig, navConfig, allApisRaw] = await Promise.all([
      getApiConfig(api),
      getNavConfig(api),
      getAllApis(),
    ]);

    // Always build the nav from the default (latest) version so sidebar always
    // reflects the current API surface. Per-endpoint version tabs handle older versions.
    const navVersion = apiConfig.defaultVersion;
    const specPath = getOpenApiSpecPath(api, navVersion);
    let spec = null;
    try {
      spec = await loadSpec(specPath);
    } catch {
      // spec not available yet
    }

    const navTree = buildNavTree(navConfig, api, navVersion, spec);

    const allApis = allApisRaw.map(({ slug, config }) => ({ slug, config }));

    let siteName = "Developer Docs";
    try {
      siteName = getSiteConfig().siteName;
    } catch {
      // use default
    }

    return NextResponse.json({ navTree, apiConfig, allApis, siteName });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load nav data", detail: String(err) },
      { status: 500 }
    );
  }
}
