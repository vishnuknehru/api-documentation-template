import type { FastifyInstance } from "fastify";
import { validateCredentials, signToken } from "../middleware/auth";

export async function oauthRoutes(app: FastifyInstance) {
  // POST /oauth/token — client credentials flow
  app.post<{
    Body: {
      grant_type?: string;
      client_id: string;
      client_secret: string;
    };
  }>("/oauth/token", async (req, reply) => {
    const { client_id, client_secret } = req.body;

    if (!client_id || !client_secret) {
      return reply.status(400).send({
        error: "invalid_request",
        message: "client_id and client_secret are required.",
      });
    }

    if (!validateCredentials(client_id, client_secret)) {
      return reply.status(401).send({
        error: "invalid_client",
        message:
          "Invalid client credentials. For sandbox use: client_id=sandbox_client_id_abc123",
      });
    }

    const access_token = signToken({
      sub: "sandbox",
      client_id,
    });

    return reply.status(200).send({
      access_token,
      token_type: "Bearer",
      expires_in: 3600,
      scope: "*",
    });
  });

  // POST /oauth/revoke — invalidate token (no-op for sandbox)
  app.post("/oauth/revoke", async (_req, reply) => {
    return reply.status(200).send({ revoked: true });
  });
}
