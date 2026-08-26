import "dotenv/config";
import { webcrypto } from "node:crypto";

if (typeof globalThis.crypto === "undefined") {
  (globalThis as any).crypto = webcrypto;
}

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import authRoutes from "./routes/auth.js";
import dataRoutes from "./routes/data.js";
import { rateLimit, trackSession } from "./lib/rateLimit.js";

const app = new Hono();

const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use("*", cors({
  origin: CORS_ORIGIN,
  allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

app.use("*", async (c, next) => {
  // health should never be rate-limited
  if (c.req.path.includes("/health")) return next();
  return rateLimit({ windowMs: 60000, max: 400 })(c, next);
});

app.use("/data/*", async (c, next) => {
  trackSession(c);
  await next();
});

app.onError((err, c) => {
  console.error("Server error:", err);
  return c.json({ error: err.message || "Internal server error" }, 500);
});

app.get("/api/health", async (c) => {
  try {
    const { prisma } = await import("./lib/prisma.js");
    await prisma.$queryRaw`SELECT 1`;
    return c.json({ ok: true, db: "connected", uptime: process.uptime() });
  } catch {
    return c.json({ ok: false, db: "disconnected" }, 503);
  }
});

app.route("/api/auth", authRoutes);
app.route("/api/data", dataRoutes);

if (process.env.NODE_ENV === "production") {
  // Serve built assets first — explicit /assets/* before the SPA fallback,
  // and make sure JS/CSS requests never fall through to index.html.
  app.use("/assets/*", serveStatic({ root: "./dist" }));
  app.use("/*", serveStatic({ root: "./dist" }));
  app.get("*", async (c, next) => {
    if (c.req.path.includes(".")) return c.json({ error: "Not found" }, 404);
    return serveStatic({ path: "./dist/index.html" })(c, next as never);
  });
}

const PORT = parseInt(process.env.PORT || "3001", 10);

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`API server running on http://localhost:${info.port}`);
});
