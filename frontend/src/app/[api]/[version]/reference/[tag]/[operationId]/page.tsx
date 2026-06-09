import { notFound } from "next/navigation";
import { getOpenApiSpecPath, apiExists, versionExists, getApiConfig } from "@/lib/content";
import { loadSpec, getOperation, getOperationVersions } from "@/lib/openapi";
import { EndpointPage } from "@/components/reference/EndpointPage";

export const dynamic = "force-dynamic";

interface ReferencePageProps {
  params: { api: string; version: string; tag: string; operationId: string };
}

export default async function ReferencePage({ params }: ReferencePageProps) {
  const { api, version, tag, operationId } = params;

  if (!apiExists(api) || !versionExists(api, version)) {
    notFound();
  }

  const apiConfig = getApiConfig(api);

  // Load the current-version spec to confirm the operation exists
  const specPath = getOpenApiSpecPath(api, version);
  let currentSpec;
  try {
    currentSpec = await loadSpec(specPath);
  } catch {
    notFound();
  }

  const found = getOperation(currentSpec, operationId);
  if (!found) {
    notFound();
  }

  // Load operation data across all versions
  const versionEntries = await getOperationVersions(
    api,
    operationId,
    apiConfig.versions,
    apiConfig.defaultVersion,
    (v) => getOpenApiSpecPath(api, v)
  );

  // Fallback: if cross-version loading failed, at least show current version
  const entries = versionEntries.length > 0 ? versionEntries : [{
    version,
    isLatest: version === apiConfig.defaultVersion,
    method: found.method,
    path: found.path,
    operation: found.operation,
  }];

  return (
    <EndpointPage
      api={api}
      currentVersion={version}
      tag={tag}
      versionEntries={entries}
    />
  );
}
