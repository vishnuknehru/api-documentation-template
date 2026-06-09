import path from "path";
import fs from "fs";
import yaml from "js-yaml";
import { specCache } from "./cache";

const CONTENT_ROOT = process.env.CONTENT_PATH ?? path.join(__dirname, "..", "..", "..", "content");

export function getSpecPath(api: string, version: string): string {
  return path.join(CONTENT_ROOT, "apis", api, "versions", version, "openapi.yaml");
}

export async function loadSpec(api: string, version: string): Promise<unknown> {
  const cacheKey = `${api}:${version}`;
  const cached = specCache.get(cacheKey);
  if (cached) return cached;

  const specPath = getSpecPath(api, version);
  if (!fs.existsSync(specPath)) {
    throw new Error(`Spec not found for ${api}/${version} at ${specPath}`);
  }

  const raw = fs.readFileSync(specPath, "utf-8");
  let spec: unknown;

  if (specPath.endsWith(".yaml") || specPath.endsWith(".yml")) {
    spec = yaml.load(raw);
  } else {
    spec = JSON.parse(raw);
  }

  // Dereference $refs if swagger-parser is available
  try {
    const SwaggerParser = require("@apidevtools/swagger-parser");
    spec = await SwaggerParser.default.dereference(specPath);
  } catch {
    // use raw parsed spec
  }

  specCache.set(cacheKey, spec);
  return spec;
}

export function specExists(api: string, version: string): boolean {
  return fs.existsSync(getSpecPath(api, version));
}
