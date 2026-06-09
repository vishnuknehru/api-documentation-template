import type { FastifyInstance } from "fastify";
import { webhookCache } from "../services/cache";
import { faker } from "@faker-js/faker";
import type { WebhookRegistration } from "../services/webhookSender";

export async function webhookRoutes(app: FastifyInstance) {
  // POST /sandbox/webhooks — register a webhook
  app.post<{
    Body: {
      url: string;
      events?: string[];
      oauthEndpoint?: string;
      oauthClientId?: string;
      oauthClientSecret?: string;
    };
  }>("/sandbox/webhooks", async (req, reply) => {
    const { url, events = ["*"], oauthEndpoint, oauthClientId, oauthClientSecret } = req.body;

    if (!url) {
      return reply.status(400).send({
        error: "invalid_request",
        message: "url is required.",
      });
    }

    const id = faker.string.uuid();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const registration: WebhookRegistration = {
      id,
      url,
      events,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      ...(oauthEndpoint ? { oauthEndpoint } : {}),
      ...(oauthClientId ? { oauthClientId } : {}),
      ...(oauthClientSecret ? { oauthClientSecret } : {}),
    };

    webhookCache.set(id, registration);

    return reply.status(201).send(registration);
  });

  // GET /sandbox/webhooks — list registered webhooks
  app.get("/sandbox/webhooks", async (_req, reply) => {
    const keys = webhookCache.keys();
    const data = keys
      .map((k) => webhookCache.get<WebhookRegistration>(k))
      .filter(Boolean);

    return reply.status(200).send({ data });
  });

  // DELETE /sandbox/webhooks/:id — unregister a webhook
  app.delete<{ Params: { id: string } }>(
    "/sandbox/webhooks/:id",
    async (req, reply) => {
      const { id } = req.params;
      const exists = webhookCache.has(id);

      if (!exists) {
        return reply.status(404).send({
          error: "not_found",
          message: `Webhook ${id} not found or already expired.`,
        });
      }

      webhookCache.del(id);
      return reply.status(204).send();
    }
  );
}
