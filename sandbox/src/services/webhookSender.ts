import { webhookCache } from "./cache";
import { signToken } from "../middleware/auth";
import fetch from "node-fetch";
import { faker } from "@faker-js/faker";

export interface WebhookRegistration {
  id: string;
  url: string;
  events: string[];
  createdAt: string;
  expiresAt: string;
  // Customer-supplied OAuth credentials for authenticating webhook delivery
  oauthEndpoint?: string;
  oauthClientId?: string;
  oauthClientSecret?: string;
}

interface DeliveryResult {
  webhookId: string;
  url: string;
  status: number;
  latencyMs: number;
  error?: string;
}

export async function fireWebhooks(
  event: string,
  responseData: unknown,
  requestInput: Record<string, unknown> | null = null,
  apiVersion = "v1",
  // Pre-generated payload from the webhook event schema; if provided this is
  // sent as-is (with an envelope wrapper). Falls back to wrapping responseData.
  schemaPayload: unknown = null
): Promise<DeliveryResult[]> {
  const keys = webhookCache.keys();
  const results: DeliveryResult[] = [];

  // When a schema-driven payload was generated from x-webhooks it already IS
  // the complete event envelope (has its own id, type, data, etc.) — send it
  // directly. Otherwise fall back to a standard wrapper around the REST response.
  const payload = schemaPayload ?? {
    id: `evt_${faker.string.alphanumeric(12)}`,
    type: event,
    api_version: apiVersion,
    created_at: new Date().toISOString(),
    livemode: false,
    data: {
      object: responseData,
      request_input: requestInput ?? null,
    },
  };

  for (const key of keys) {
    const registration = webhookCache.get<WebhookRegistration>(key);
    if (!registration) continue;
    if (!matchesEvent(registration.events, event)) continue;

    deliverWebhook(registration, payload).then((result) => {
      if (result) results.push(result);
    });
  }

  return results;
}

async function resolveToken(registration: WebhookRegistration): Promise<string> {
  // If the customer registered their own OAuth endpoint, call it to get a token
  if (registration.oauthEndpoint && registration.oauthClientId && registration.oauthClientSecret) {
    try {
      const res = await fetch(registration.oauthEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: registration.oauthClientId,
          client_secret: registration.oauthClientSecret,
          grant_type: "client_credentials",
        }),
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const body = await res.json() as Record<string, unknown>;
        const token = body.access_token ?? body.token ?? body.id_token;
        if (typeof token === "string") return token;
      }
    } catch {
      // Fall through to sandbox-signed token on any error
    }
  }

  // Fallback: sandbox-signed delivery token (verifiable by the developer using the sandbox JWT secret)
  return signToken({ webhookDelivery: true, url: registration.url });
}

async function deliverWebhook(
  registration: WebhookRegistration,
  payload: unknown
): Promise<DeliveryResult | null> {
  const token = await resolveToken(registration);
  const start = Date.now();

  try {
    const res = await fetch(registration.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Sandbox-Event": "true",
        "X-Webhook-Id": registration.id,
        "X-Webhook-Signature": signToken({ webhookId: registration.id, ts: Date.now() }),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    return {
      webhookId: registration.id,
      url: registration.url,
      status: res.status,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      webhookId: registration.id,
      url: registration.url,
      status: 0,
      latencyMs: Date.now() - start,
      error: (err as Error).message,
    };
  }
}

function matchesEvent(subscribed: string[], event: string): boolean {
  return subscribed.includes("*") || subscribed.includes(event);
}

export async function fireWebhookDirect(
  url: string,
  payload: unknown,
  oauthEndpoint?: string,
  oauthClientId?: string,
  oauthClientSecret?: string,
): Promise<void> {
  const tempRegistration: WebhookRegistration = {
    id: `tmp_${faker.string.alphanumeric(8)}`,
    url,
    events: ["*"],
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    ...(oauthEndpoint ? { oauthEndpoint } : {}),
    ...(oauthClientId ? { oauthClientId } : {}),
    ...(oauthClientSecret ? { oauthClientSecret } : {}),
  };
  await deliverWebhook(tempRegistration, payload);
}
