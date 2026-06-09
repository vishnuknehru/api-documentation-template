import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { oauthRoutes } from "./routes/oauth";
import { webhookRoutes } from "./routes/webhooks";
import { apiRoutes } from "./routes/api";

const PORT = parseInt(process.env.PORT ?? "4000", 10);

async function build() {
  const app = Fastify({
    logger: process.env.NODE_ENV !== "production",
  });

  // ── Plugins ──────────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await app.register(helmet, { contentSecurityPolicy: false });

  // ── Health check ──────────────────────────────────────────────────────────────
  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "api-docs-sandbox",
  }));

  // ── Routes ────────────────────────────────────────────────────────────────────
  await oauthRoutes(app);
  await webhookRoutes(app);
  await apiRoutes(app);

  return app;
}

async function start() {
  try {
    const app = await build();
    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`\n  Sandbox running at http://0.0.0.0:${PORT}`);
    console.log(`  Mock OAuth:  POST http://localhost:${PORT}/oauth/token`);
    console.log(`  Webhooks:    POST http://localhost:${PORT}/sandbox/webhooks`);
    console.log(`  API mock:    http://localhost:${PORT}/sandbox/{api}/{version}/*\n`);
  } catch (err) {
    console.error("Failed to start sandbox:", err);
    process.exit(1);
  }
}

start();
