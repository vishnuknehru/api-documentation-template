import NodeCache from "node-cache";

// Webhook registrations: 24h TTL
const webhookCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

// Spec cache: no TTL (specs rarely change; restart to reload)
const specCache = new NodeCache({ stdTTL: 0 });

// Token cache: 1h TTL
const tokenCache = new NodeCache({ stdTTL: 3600 });

export { webhookCache, specCache, tokenCache };
