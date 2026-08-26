import type { Context, Next } from "hono";

const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit({ windowMs = 60000, max = 100 }: { windowMs?: number; max?: number } = {}) {
  return async (c: Context, next: Next) => {
    const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
    const now = Date.now();
    const entry = requestCounts.get(ip);

    if (!entry || now > entry.resetAt) {
      requestCounts.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count++;
    if (entry.count > max) {
      return c.json({ error: "Too many requests" }, 429);
    }

    return next();
  };
}

const activeSessions = new Map<string, { lastActivity: number; userId: string }>();

export function trackSession(c: Context) {
  const userId = c.get("userId");
  if (userId) {
    activeSessions.set(userId, { lastActivity: Date.now(), userId });
  }
}

export function isSessionExpired(userId: string, timeoutMs: number = 30 * 60 * 1000): boolean {
  const session = activeSessions.get(userId);
  if (!session) return false;
  return Date.now() - session.lastActivity > timeoutMs;
}

setInterval(() => {
  const now = Date.now();
  for (const [userId, session] of activeSessions.entries()) {
    if (now - session.lastActivity > 60 * 60 * 1000) {
      activeSessions.delete(userId);
    }
  }
}, 5 * 60 * 1000);
