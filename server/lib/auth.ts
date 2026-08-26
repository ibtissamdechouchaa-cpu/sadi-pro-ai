import type { Context, Next } from "hono";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export interface JwtPayload {
  userId: string;
  orgId: string;
}

declare module "hono" {
  interface ContextVariableMap {
    userId: string;
    orgId: string;
  }
}

export function signToken(userId: string, orgId: string): string {
  return jwt.sign({ userId, orgId }, JWT_SECRET, { expiresIn: "7d" });
}

export async function authMiddleware(c: Context, next: Next) {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid authorization header" }, 401);
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    c.set("userId", payload.userId);
    c.set("orgId", payload.orgId);
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  await next();
}
