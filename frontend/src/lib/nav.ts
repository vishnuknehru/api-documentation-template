import type {
  NavConfig,
  NavTree,
  NavSectionNode,
  NavGuideItem,
  NavTagGroup,
  NavEndpointItem,
  NavWebhookItem,
  OpenAPISpec,
  HttpMethod,
} from "./types";
import { slugify, operationHref, guideHref } from "./utils";
import { getSpecTags, getOperationsByTag } from "./openapi";

export function buildNavTree(
  navConfig: NavConfig,
  apiSlug: string,
  version: string,
  spec: OpenAPISpec | null
): NavTree {
  const tree: NavTree = [];

  for (const section of navConfig.sections) {
    const sectionNode: NavSectionNode = {
      title: section.title,
      items: [],
    };

    if (section.items) {
      for (const item of section.items) {
        if (item.file) {
          const slug = item.file.replace(/^guides\//, "").replace(/\.mdx$/, "");
          const guideItem: NavGuideItem = {
            type: "guide",
            title: item.title,
            slug,
            href: guideHref(apiSlug, version, slug),
          };
          sectionNode.items.push(guideItem);
        } else if (item.href) {
          const guideItem: NavGuideItem = {
            type: "guide",
            title: item.title,
            slug: item.href,
            href: item.href,
          };
          sectionNode.items.push(guideItem);
        }
      }
    }

    if (section.openapi && spec) {
      const tags = getSpecTags(spec);

      let orderedTags = tags;
      if (section.order && section.order.length > 0) {
        const orderMap = new Map(section.order.map((t, i) => [t, i]));
        orderedTags = [...tags].sort((a, b) => {
          const ai = orderMap.get(a.name) ?? Number.MAX_SAFE_INTEGER;
          const bi = orderMap.get(b.name) ?? Number.MAX_SAFE_INTEGER;
          return ai - bi;
        });
      }

      for (const tag of orderedTags) {
        const operations = getOperationsByTag(spec, tag.name);
        if (operations.length === 0) continue;

        const endpointItems: Array<NavEndpointItem | NavWebhookItem> = operations.flatMap((op) => {
          const href = operationHref(apiSlug, version, tag.name, op.operationId);
          const endpointItem: NavEndpointItem = {
            type: "endpoint",
            title: op.summary || op.path,
            method: op.method,
            path: op.path,
            operationId: op.operationId,
            href,
            summary: op.summary,
          };

          if (!op.webhookEventName) return [endpointItem];

          const webhookItem: NavWebhookItem = {
            type: "webhook",
            title: op.webhookEventTitle ?? op.webhookEventName,
            eventName: op.webhookEventName,
            operationId: op.operationId,
            href: `${href}#webhook-event`,
          };

          return [endpointItem, webhookItem];
        });

        const tagGroup: NavTagGroup = {
          type: "tag-group",
          title: tag.name,
          items: endpointItems,
        };

        sectionNode.items.push(tagGroup);
      }
    }

    if (sectionNode.items.length > 0) {
      tree.push(sectionNode);
    }
  }

  return tree;
}
