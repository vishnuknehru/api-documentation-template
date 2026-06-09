import { redirect } from "next/navigation";
import { getApiConfig, getNavConfig } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function ApiVersionRoot({
  params,
}: {
  params: { api: string; version: string };
}) {
  const { api, version } = params;

  try {
    const navConfig = getNavConfig(api);
    // Find the first guide item in the nav to redirect to
    for (const section of navConfig.sections) {
      if (section.items) {
        const firstGuide = section.items.find((item) => item.file);
        if (firstGuide) {
          const slug = firstGuide.file!.replace(/^guides\//, "").replace(/\.mdx$/, "");
          redirect(`/${api}/${version}/guides/${slug}`);
        }
      }
    }
  } catch {
    // fallback
  }

  redirect(`/${api}/${version}/guides/getting-started`);
}
