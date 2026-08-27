import "dotenv/config";
import { webcrypto } from "node:crypto";
import { existsSync, readFileSync } from "fs";

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

// Security headers without new deps
app.use("*", async (c, next) => {
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  await next();
});

const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use("*", cors({
  origin: CORS_ORIGIN,
  allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

app.use("*", async (c, next) => {
  // health should never be rate-limited — exact match only to avoid bypassing rate limits on other paths
  if (c.req.path === "/api/health") {
    c.header("Cache-Control", "no-store");
    return next();
  }
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
  c.header("Cache-Control", "no-store");
  try {
    const { prisma } = await import("./lib/prisma.js");
    await prisma.$queryRaw`SELECT 1`;
    const r2Configured = Boolean(process.env.R2_ENDPOINT && process.env.R2_BUCKET && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);
    return c.json({ ok: true, db: "connected", r2: r2Configured ? "configured" : "local-fallback", uptime: process.uptime() });
  } catch {
    return c.json({ ok: false, db: "disconnected" }, 503);
  }
});

function readSecretForStatus(name: string): string {
  if (process.env[name]) return process.env[name] as string;
  try { const p = `/etc/secrets/${name}`; if (existsSync(p)) return readFileSync(p, "utf8").trim(); } catch {}
  try { const p2 = `/etc/secrets/${name}.txt`; if (existsSync(p2)) return readFileSync(p2, "utf8").trim(); } catch {}
  for (const fname of ["r2-secrets.env", ".env", "secrets.env"]) {
    try {
      const p3 = `/etc/secrets/${fname}`;
      if (existsSync(p3)) {
        const c = readFileSync(p3, "utf8");
        const m = c.match(new RegExp(`^${name}=([^\r\n]+)`, "m"));
        if (m) return m[1].trim().replace(/^["']|["']$/g, "");
      }
    } catch {}
  }
  return "";
}
process.on('unhandledRejection', (reason) => console.error('[unhandledRejection]', reason));
process.on('uncaughtException', (err) => console.error('[uncaughtException]', err));

app.get("/api/r2-status", async (c) => {
  c.header("Cache-Control", "no-store");
  const endpointRaw = readSecretForStatus("R2_ENDPOINT");
  const bucket = readSecretForStatus("R2_BUCKET");
  const hasKey = Boolean(readSecretForStatus("R2_ACCESS_KEY_ID"));
  const hasSecret = Boolean(readSecretForStatus("R2_SECRET_ACCESS_KEY"));
  let endpointNormalized = endpointRaw.trim().replace(/\/+$/, "");
  if (bucket && endpointNormalized.endsWith(`/${bucket}`)) endpointNormalized = endpointNormalized.slice(0, -(bucket.length + 1));
  if (!bucket && endpointNormalized.endsWith("/sadi-pro-doc")) endpointNormalized = endpointNormalized.slice(0, -"/sadi-pro-doc".length);
  const isConfigured = Boolean(endpointRaw && bucket && hasKey && hasSecret);
  let probe: any = null;
  if (isConfigured) {
    try {
      const { S3Client: S3 } = await import("@aws-sdk/client-s3");
      const client = new S3({ region: "auto", endpoint: endpointNormalized, credentials: { accessKeyId: readSecretForStatus("R2_ACCESS_KEY_ID"), secretAccessKey: readSecretForStatus("R2_SECRET_ACCESS_KEY") } });
      const res: any = await client.send(new (await import("@aws-sdk/client-s3")).ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }));
      probe = { ok: true, keyCount: res.KeyCount ?? 0 };
    } catch (e: any) {
      probe = { ok: false, error: e?.message?.slice(0, 200) || String(e).slice(0,200) };
    }
  }
  return c.json({ isR2Configured: isConfigured, hasEndpoint: Boolean(endpointRaw), endpointRaw, endpointNormalized, bucket, hasKey, hasSecret, probe, r2: isConfigured ? "configured" : "local-fallback" });
});

// AI status check — no auth required
app.get("/api/ai-status", async (c) => {
  const hasGemini = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const configured = hasGemini || hasOpenAI;
  const providers = [];
  if (hasGemini) providers.push("Gemini");
  if (hasOpenAI) providers.push("OpenAI");
  return c.json({
    configured,
    providers,
    hasGemini,
    hasOpenAI,
    message: configured
      ? `AI مُعد: ${providers.join(" + ")}`
      : "⚠️ لا يوجد مزود AI. أضف GEMINI_API_KEY في Render Environment. مجاني: https://aistudio.google.com/apikey",
  });
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

// Retention cron: 30/15/7/1/0 day alerts + auto pending_disposal (runs hourly, also on startup)
async function retentionCron() {
  try {
    const { prisma } = await import("./lib/prisma.js");
    const orgs = await prisma.organization.findMany({ select: { id: true } });
    const now = new Date();
    for (const org of orgs) {
      const docs = await prisma.document.findMany({ where: { organizationId: org.id, deletedAt: null, expiresAt: { not: null }, archiveState: { notIn: ["disposed","permanent_archive"] } } });
      for (const doc of docs) {
        const daysLeft = Math.ceil((new Date(doc.expiresAt!).getTime() - now.getTime()) / (1000*60*60*24));
        if (daysLeft <= 0 && doc.archiveState !== "pending_disposal") {
          await prisma.document.update({ where: { id: doc.id }, data: { archiveState: "pending_disposal" } });
          try { await prisma.auditLog.create({ data: { organizationId: org.id, action: "RETENTION_EXPIRED_AUTO", resourceType: "document", resourceId: doc.id, resourceName: doc.title, metadata: { daysLeft, auto: true } } }); } catch {}
          try {
            const admins = await prisma.profile.findMany({ where: { organizationId: org.id, role: { in: ["owner","admin","manager"] }, isActive: true }, take: 3 });
            for (const adm of admins) {
              await prisma.notification.create({ data: { organizationId: org.id, userId: adm.id, type: "error", title: `Retention expired: ${doc.title}`, message: `انتهت مدة الحفظ المحددة للوثيقة "${doc.title}". يجب مراجعتها واتخاذ قرار الإقصاء وفق القواعد.` } });
            }
          } catch {}
        } else if ([30,15,7,1].includes(daysLeft)) {
          try {
            const exists = await prisma.notification.findFirst({ where: { organizationId: org.id, title: { contains: doc.id.slice(0,8) } } });
            if (!exists) {
              const admins = await prisma.profile.findMany({ where: { organizationId: org.id, isActive: true }, take: 2 });
              for (const adm of admins) {
                await prisma.notification.create({ data: { organizationId: org.id, userId: adm.id, type: daysLeft<=1?"error":daysLeft<=7?"warning":"info", title: `Document expiring in ${daysLeft}d: ${doc.title}`, message: `الوثيقة "${doc.title}" ستنتهي مدة حفظها بتاريخ ${new Date(doc.expiresAt!).toISOString().slice(0,10)}. يرجى مراجعة الوثيقة واتخاذ الإجراء المناسب.` } });
              }
            }
          } catch {}
        }
      }
    }
  } catch (e) { console.warn("retentionCron error", e); }
}
setTimeout(retentionCron, 10000);
setInterval(retentionCron, 3600_000);

// AI startup check
try {
  const { checkAIProviders } = await import("./lib/ai.js");
  checkAIProviders();
} catch {}

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`API server running on http://localhost:${info.port}`);
});
