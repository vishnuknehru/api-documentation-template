import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.MOCK_JWT_SECRET ?? "sandbox_jwt_signing_secret_change_in_prod";

const MOCK_CLIENT_ID = process.env.MOCK_CLIENT_ID ?? "sandbox_client_id_abc123";
const MOCK_CLIENT_SECRET = process.env.MOCK_CLIENT_SECRET ?? "sandbox_secret_xyz789";

export interface TokenPayload {
  sub?: string;
  client_id?: string;
  webhookDelivery?: boolean;
  webhookId?: string;
  ts?: number;
  url?: string;
  iat?: number;
  exp?: number;
}

export function validateCredentials(clientId: string, clientSecret: string): boolean {
  return clientId === MOCK_CLIENT_ID && clientSecret === MOCK_CLIENT_SECRET;
}

export function signToken(payload: Omit<TokenPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.substring(7);
}
