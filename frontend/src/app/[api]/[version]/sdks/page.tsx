import { getApiConfig, apiExists, versionExists } from "@/lib/content";
import { notFound } from "next/navigation";
import { SdkDownloadPage } from "@/components/sdks/SdkDownloadPage";

export const dynamic = "force-dynamic";

interface SdksPageProps {
  params: { api: string; version: string };
}

export default async function SdksPage({ params }: SdksPageProps) {
  const { api, version } = params;

  if (!apiExists(api) || !versionExists(api, version)) {
    notFound();
  }

  const apiConfig = getApiConfig(api);

  return <SdkDownloadPage api={api} version={version} apiConfig={apiConfig} />;
}
