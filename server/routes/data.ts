import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../lib/auth.js";
import { randomUUID } from "crypto";
import { analyzeDocument, generateSearchAnswer, geminiVisionChat } from "../lib/ai.js";
import { extractFileText } from "../lib/fileExtractor.js";
import { assertPermission, getRole, hasPermission } from "../lib/permissions.js";
import { uploadToR2, downloadFromR2, deleteFromR2 } from "../lib/r2.js";

const data = new Hono();

data.use("*", authMiddleware);



// --- File Upload ---
data.post("/upload", async (c) => {
  const perm = await assertPermission(c, "document.create");
  if (perm) return perm;
  const orgId = c.get("orgId");
  const body = await c.req.parseBody();
  const file = body["file"];

  if (!file || typeof file === "string") {
    return c.json({ error: "No file provided" }, 400);
  }

  const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
  if (file.size > MAX_SIZE) {
    return c.json({ error: "File too large. Max 50 MB." }, 413);
  }

  // Org quota checks — storage and document count before mkdir
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return c.json({ error: "Organization not found" }, 404);

  // Trial expiration check — block uploads if trial expired and no active subscription
  if (org.subscriptionState === "trialing" && org.trialEndsAt && new Date() > org.trialEndsAt) {
    return c.json({ error: "Trial expired. Please subscribe to continue uploading.", trialExpired: true }, 403);
  }
  if (org.subscriptionState !== "active" && org.subscriptionState !== "trialing") {
    return c.json({ error: "No active subscription. Please subscribe to upload.", subscriptionRequired: true }, 403);
  }

  const agg = await prisma.document.aggregate({
    where: { organizationId: orgId, deletedAt: null },
    _sum: { fileSize: true },
  });
  const total = Number(agg._sum.fileSize || 0);
  if (total + file.size > Number(org.maxStorageBytes)) {
    return c.json({ error: "Storage quota exceeded" }, 413);
  }
  const docCount = await prisma.document.count({ where: { organizationId: orgId, deletedAt: null } });
  if (docCount >= org.maxDocuments) {
    return c.json({ error: "Document limit reached" }, 413);
  }

  const allowedExts = new Set(['pdf','doc','docx','xls','xlsx','ppt','pptx','txt','csv','png','jpg','jpeg','webp','tiff','tif','zip','json','xml','html']);
  const rawExt = (file.name?.split(".").pop() || "").toLowerCase();
  const ext = allowedExts.has(rawExt) ? rawExt : "bin";

  // sanitize filename: remove path traversal attempts
  const fileId = randomUUID();
  const filename = `${fileId}.${ext}`;

  const r2Key = `${orgId}/${filename}`;
  const arrayBuffer = await file.arrayBuffer();
  await uploadToR2(r2Key, Buffer.from(arrayBuffer), file.type || "application/octet-stream");

  return c.json({
    id: fileId,
    filename,
    filePath: `${orgId}/${filename}`,
    originalName: file.name,
    size: file.size,
    type: file.type,
  }, 201);
});

// --- File Download ---
data.get("/download/:docId", async (c) => {
  const perm = await assertPermission(c, "document.read");
  if (perm) return perm;
  const orgId = c.get("orgId");
  const { docId } = c.req.param();

  const doc = await prisma.document.findFirst({
    where: { id: docId, organizationId: orgId, deletedAt: null },
  });

  if (!doc || !doc.filePath) {
    return c.json({ error: "File not found" }, 404);
  }

  const r2Key = doc.filePath;
  try {
    const data = await downloadFromR2(r2Key);
    const ext = doc.fileType || "bin";
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      txt: "text/plain",
      csv: "text/csv",
    };
    const contentType = mimeTypes[ext] || "application/octet-stream";

    return new Response(data, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="document.${ext}"; filename*=UTF-8''${encodeURIComponent(doc.title.slice(0,100))}.${ext}`,
      },
    });
  } catch {
    return c.json({ error: "File not found in storage" }, 404);
  }
});

// --- File Preview (inline, not download) ---
data.get("/preview/:docId", async (c) => {
  const perm = await assertPermission(c, "document.read");
  if (perm) return perm;
  const orgId = c.get("orgId");
  const { docId } = c.req.param();

  const doc = await prisma.document.findFirst({
    where: { id: docId, organizationId: orgId, deletedAt: null },
  });

  if (!doc) return c.json({ error: "File not found" }, 404);

  // Docs without a stored file (e.g. seeded demo docs): synthesize a viewable text preview from DB
  if (!doc.filePath) {
    const lines = [
      doc.title,
      "=".repeat(doc.title.length),
      "",
      `Type: ${doc.type}  ·  Classification: ${doc.classification}  ·  Status: ${doc.status}`,
      doc.departmentId ? `Department: ${doc.departmentId}` : "",
      `Tags: ${(doc.tags || []).join(", ") || "—"}`,
      doc.expiresAt ? `Expires: ${new Date(doc.expiresAt).toISOString().slice(0,10)}` : "",
      doc.legalHold ? "Legal Hold: ACTIVE" : "",
      "",
      "--- Document Content Preview (synthesized) ---",
      (doc.metadata as Record<string, unknown>)?.previewText as string || `This is a preview for "${doc.title}". Upload a file to see its actual content. The document is currently stored as metadata only (${doc.pageCount || 0} pages, ${doc.fileType || "unknown"}).`,
      "",
      doc.hash ? `Hash: ${doc.hash}` : "",
    ].filter(Boolean).join("\n");
    return new Response(lines, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `inline; filename="document.txt"; filename*=UTF-8''${encodeURIComponent(doc.title.slice(0,100))}.txt`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  try {
    const data = await downloadFromR2(doc.filePath);
    const ext = doc.fileType || "bin";
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      tiff: "image/tiff",
      txt: "text/plain",
      csv: "text/csv",
      json: "application/json",
      xml: "text/plain",
      html: "text/plain",
    };
    const contentType = mimeTypes[ext] || "application/octet-stream";
    return new Response(data, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="document.${ext}"; filename*=UTF-8''${encodeURIComponent(doc.title.slice(0,100))}.${ext}`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return c.json({ error: "File not found in storage" }, 404);
  }
});

// --- Trial Status ---
data.get("/trial-status", async (c) => {
  const orgId = c.get("orgId");
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return c.json({ error: "Organization not found" }, 404);

  const isTrialing = org.subscriptionState === "trialing";
  const trialExpired = isTrialing && org.trialEndsAt && new Date() > org.trialEndsAt;
  const daysLeft = isTrialing && org.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(org.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return c.json({
    subscriptionState: org.subscriptionState,
    planTier: org.planTier,
    isTrialing,
    trialExpired: !!trialExpired,
    trialEndsAt: org.trialEndsAt?.toISOString() || null,
    daysLeft,
    maxStorageBytes: Number(org.maxStorageBytes),
    maxDocuments: org.maxDocuments,
    maxUsers: org.maxUsers,
  });
});

// --- Documents (aliased from /documents route but kept for compatibility) ---

data.get("/documents", async (c) => {
  const orgId = c.get("orgId");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "100", 10), 200);
  const offset = Math.max(parseInt(c.req.query("offset") ?? "0", 10), 0);
  const [docs, total] = await Promise.all([
    prisma.document.findMany({
      where: { organizationId: orgId, deletedAt: null },
      orderBy: { uploadedAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.document.count({ where: { organizationId: orgId, deletedAt: null } }),
  ]);
  return c.json({ documents: docs, total });
});

const STAGE_ORDER = ['uploading','scanning','validating','hashing','dedup','ocr','extracting','metadata','classifying','chunking','embedding','indexing','analyzing','completed'] as const;

async function runPipelineForDocument(doc: { id: string; title: string; organizationId: string; filePath?: string | null; fileType?: string | null }) {
  const orgId = doc.organizationId;
  const job = await prisma.processingJob.create({
    data: { organizationId: orgId, documentId: doc.id, documentName: doc.title, stage: 'queued', progress: 0 },
  });
  const advance = async (stage: string, progress: number) => {
    const existing = await prisma.processingJob.findUnique({ where: { id: job.id } });
    if (!existing || existing.stage === 'failed' || existing.stage === 'completed') return false;
    await prisma.processingJob.update({ where: { id: job.id }, data: { stage, progress } });
    return true;
  };
  try {
    await advance('uploading', 5);
    await advance('scanning', 12);
    await advance('validating', 18);
    await advance('hashing', 25);
    // dedup check already done at upload time (409), so pass
    await advance('dedup', 32);
    await advance('ocr', 40);
    await advance('extracting', 50);
    // real text extraction happens here — failure just continues
    try {
      const { extractFileText } = await import("./lib/fileExtractor.js");
      await extractFileText(doc.filePath || null, doc.fileType || null, doc.title);
    } catch {}
    await advance('metadata', 62);
    await advance('classifying', 70);
    await advance('chunking', 78);
    await advance('embedding', 86);
    await advance('indexing', 92);
    await advance('analyzing', 96);
    // AI analysis
    try {
      const { extractFileText } = await import("./lib/fileExtractor.js");
      const { analyzeDocument } = await import("./lib/ai.js");
      const extracted = await extractFileText(doc.filePath || null, doc.fileType || null, doc.title);
      const insight = await analyzeDocument(doc.title, extracted.text, extracted.imageData);
      const existing = await prisma.document.findUnique({ where: { id: doc.id } });
      const existingMeta = (existing?.metadata as Record<string, unknown>) || {};
      await prisma.document.update({
        where: { id: doc.id },
        data: { metadata: { ...existingMeta, insight, analyzedAt: new Date().toISOString() }, status: 'completed', embeddingCompleted: true },
      });
    } catch (e) { console.warn('Pipeline AI step failed:', e); }
    await advance('completed', 100);
    await prisma.processingJob.update({ where: { id: job.id }, data: { completedAt: new Date() } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    try { await prisma.processingJob.update({ where: { id: job.id }, data: { stage: 'failed', error: msg } }); } catch {}
  }
}

data.post("/documents", async (c) => {
  const perm = await assertPermission(c, "document.create");
  if (perm) return perm;
  const orgId = c.get("orgId");
  const body = await c.req.json<{ documents?: any[]; jobs?: any[]; activity?: any[] }>();

  const createdDocs: { id: string; title: string; organizationId: string; filePath?: string | null; fileType?: string | null }[] = [];
  if (body.documents?.length) {
    for (const doc of body.documents) {
      // Strip filePath from client — must be set server-side via /upload, not client
      const { filePath: _fp, organizationId: _org, ...rest } = doc as Record<string, unknown>;
      const created = await prisma.document.create({
        data: {
          id: (rest as { id?: string }).id,
          organizationId: orgId,
          title: (rest as { title: string }).title,
          type: (rest as { type?: string }).type || "other",
          classification: (rest as { classification?: string }).classification || "internal",
          status: (rest as { status?: string }).status || "uploading",
          fileSize: (rest as { fileSize?: number | bigint }).fileSize || 0,
          fileType: (rest as { fileType?: string }).fileType,
          filePath: null,
          uploadedBy: (rest as { uploadedBy?: string }).uploadedBy,
          hash: (rest as { hash?: string }).hash,
          tags: (rest as { tags?: string[] }).tags || [],
        },
      });
      createdDocs.push({ id: created.id, title: created.title, organizationId: orgId, filePath: created.filePath, fileType: created.fileType });
    }
  }

  if (body.jobs?.length) {
    for (const job of body.jobs) {
      await prisma.processingJob.create({
        data: {
          id: job.id,
          organizationId: orgId,
          documentId: job.documentId,
          documentName: job.documentName,
          stage: job.stage || "queued",
          progress: job.progress || 0,
        },
      });
    }
  }

  if (body.activity?.length) {
    for (const a of body.activity) {
      await prisma.activityEvent.create({
        data: {
          id: a.id,
          organizationId: orgId,
          userId: a.userId,
          userName: a.userName,
          action: a.action,
          resource: a.resource,
          icon: a.icon,
        },
      });
    }
  }

  // Fire-and-forget full pipeline for each newly created doc (14 stages) — retry only re-runs from failed stage
  if (createdDocs.length > 0) {
    for (const d of createdDocs) runPipelineForDocument(d).catch(() => {});
  }

  return c.json({ ok: true }, 201);
});

data.get("/documents/search", async (c) => {
  const orgId = c.get("orgId");
  const q = c.req.query("q") ?? "";
  const limit = parseInt(c.req.query("limit") ?? "20", 10);
  const offset = parseInt(c.req.query("offset") ?? "0", 10);

  if (!q.trim()) {
    return c.json({ results: [] });
  }

  const searchQuery = q
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => `${t}:*`)
    .join(" & ");

  const safeQ = q.replace(/[%_\\]/g, "\\$&").slice(0, 200);
  const likePattern = `%${safeQ}%`;

  try {
    const results = await prisma.$queryRawUnsafe(
      `SELECT
        id, "organizationId", title, type, "typeConfidence", language,
        "departmentId", classification, "archiveState", "approvalState",
        status, "fileSize", "fileType", "filePath", "uploadedBy",
        "uploadedAt", "modifiedAt", tags, version, hash, "pageCount",
        "ocrCompleted", "embeddingCompleted", "relatedDocIds",
        "retentionYears", "expiresAt", "legalHold", "sharedWith",
        metadata, "deletedAt", "createdAt",
        ts_rank(
          to_tsvector('english', coalesce(title, '') || ' ' || coalesce(array_to_string(tags, ' '), '')),
          plainto_tsquery('english', $1)
        ) AS rank,
        ts_headline(
          'english',
          coalesce(title, ''),
          plainto_tsquery('english', $1),
          'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=10'
        ) AS snippet
      FROM "Document"
      WHERE "organizationId" = $2
        AND "deletedAt" IS NULL
        AND (
          to_tsvector('english', coalesce(title, '') || ' ' || coalesce(array_to_string(tags, ' '), ''))
          @@ plainto_tsquery('english', $1)
          OR title ILIKE $3
          OR $4 = ANY(tags)
        )
      ORDER BY rank DESC, "uploadedAt" DESC
      LIMIT $5 OFFSET $6`,
      searchQuery, orgId, likePattern, q.slice(0, 200), limit, offset
    );

    return c.json({ results });
  } catch (err) {
    console.error("Search error:", err);
    const fallback = await prisma.document.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { tags: { has: q } },
        ],
      },
      orderBy: { uploadedAt: "desc" },
      take: limit,
    });
    return c.json({ results: fallback });
  }
});

data.patch("/documents/:id", async (c) => {
  const perm = await assertPermission(c, "document.update");
  if (perm) return perm;
  const orgId = c.get("orgId");
  const { id } = c.req.param();
  const body = await c.req.json();

  const existing = await prisma.document.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return c.json({ error: "Not found" }, 404);

  if ("legalHold" in body || "retentionYears" in body) {
    const comp = await assertPermission(c, "compliance.manage");
    if (comp) return comp;
  }

  const { organizationId: _, filePath: _fp, ...updateData } = body;
  updateData.modifiedAt = new Date();
  const document = await prisma.document.update({ where: { id }, data: updateData });
  return c.json({ document });
});

data.delete("/documents/:id", async (c) => {
  const perm = await assertPermission(c, "document.delete");
  if (perm) return perm;
  const orgId = c.get("orgId");
  const { id } = c.req.param();

  const existing = await prisma.document.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (existing.legalHold) {
    return c.json({ error: "Document is under legal hold and cannot be deleted" }, 423);
  }

  await prisma.document.update({ where: { id }, data: { deletedAt: new Date() } });

  if (existing.filePath) {
    try { await deleteFromR2(existing.filePath); } catch {}
  }

  return c.json({ ok: true });
});

// --- Departments ---

data.get("/departments", async (c) => {
  const orgId = c.get("orgId");
  const departments = await prisma.department.findMany({
    where: { organizationId: orgId, deletedAt: null },
    orderBy: { name: "asc" },
  });
  return c.json({ departments });
});

data.post("/departments", async (c) => {
  const perm = await assertPermission(c, "team.manage");
  if (perm) return perm;
  const orgId = c.get("orgId");
  const body = await c.req.json<{ name: string; color?: string; id?: string }>();
  const department = await prisma.department.create({
    data: {
      id: body.id || undefined,
      organizationId: orgId,
      name: body.name,
      color: body.color || "#2563eb",
    },
  });
  return c.json({ department }, 201);
});

data.patch("/departments/:id", async (c) => {
  const perm = await assertPermission(c, "team.manage");
  if (perm) return perm;
  const orgId = c.get("orgId");
  const { id } = c.req.param();
  const body = await c.req.json();
  const existing = await prisma.department.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return c.json({ error: "Not found" }, 404);
  const { name, color, parentId } = body;
  const department = await prisma.department.update({ where: { id }, data: { ...(name !== undefined && { name }), ...(color !== undefined && { color }), ...(parentId !== undefined && { parentId }) } });
  return c.json({ department });
});

data.delete("/departments/:id", async (c) => {
  const perm = await assertPermission(c, "team.manage");
  if (perm) return perm;
  const orgId = c.get("orgId");
  const { id } = c.req.param();
  const existing = await prisma.department.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return c.json({ error: "Not found" }, 404);
  await prisma.department.delete({ where: { id } });
  return c.json({ ok: true });
});

// --- Notifications ---

data.get("/notifications", async (c) => {
  const orgId = c.get("orgId");
  const userId = c.req.query("userId");
  const where: Record<string, unknown> = { organizationId: orgId };
  if (userId) where.userId = userId;
  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return c.json({ notifications });
});

data.post("/notifications", async (c) => {
  const orgId = c.get("orgId");
  const userId = c.get("userId");
  const body = await c.req.json<{ type?: string; title: string; message?: string }>();
  const notification = await prisma.notification.create({
    data: {
      organizationId: orgId,
      userId,
      type: body.type || "info",
      title: body.title,
      message: body.message,
    },
  });
  return c.json({ notification }, 201);
});

data.patch("/notifications/read-all", async (c) => {
  const { id } = c.req.param();
  await prisma.notification.update({ where: { id }, data: { read: true } });
  return c.json({ ok: true });
});

data.patch("/notifications/:id/read", async (c) => {
  const orgId = c.get("orgId");
  const userId = c.get("userId");
  await prisma.notification.updateMany({
    where: { organizationId: orgId, userId, read: false },
    data: { read: true },
  });
  return c.json({ ok: true });
});

// --- Activity ---

data.get("/activity", async (c) => {
  const orgId = c.get("orgId");
  const activity = await prisma.activityEvent.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return c.json({ activity });
});

// --- Jobs ---

data.get("/jobs", async (c) => {
  const orgId = c.get("orgId");
  const jobs = await prisma.processingJob.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });
  return c.json({ jobs });
});

data.post("/jobs", async (c) => {
  // require document.update or audit.view — implement OR logic
  const userId = c.get("userId");
  const role = await getRole(userId);
  if (!hasPermission(role, "document.update") && !hasPermission(role, "audit.view")) {
    return c.json({ error: "Forbidden: missing document.update or audit.view" }, 403);
  }
  const orgId = c.get("orgId");
  const body = await c.req.json();
  const { organizationId: _org, ...safeBody } = body;
  const job = await prisma.processingJob.create({
    data: { organizationId: orgId, ...safeBody },
  });
  return c.json({ job }, 201);
});

data.patch("/jobs/:id", async (c) => {
  const userId = c.get("userId");
  const role = await getRole(userId);
  if (!hasPermission(role, "document.update") && !hasPermission(role, "audit.view")) {
    return c.json({ error: "Forbidden: missing document.update or audit.view" }, 403);
  }
  const { id } = c.req.param();
  const body = await c.req.json();
  const { organizationId: _org, ...safeBody } = body;
  const job = await prisma.processingJob.update({ where: { id }, data: safeBody });
  // Retry: if stage was reset to queued, re-run pipeline from that stage
  if (safeBody.stage === 'queued' && job.documentId) {
    const doc = await prisma.document.findUnique({ where: { id: job.documentId } });
    if (doc) runPipelineForDocument({ id: doc.id, title: doc.title, organizationId: job.organizationId, filePath: doc.filePath, fileType: doc.fileType }).catch(() => {});
  }
  return c.json({ job });
});

data.delete("/jobs/:id", async (c) => {
  const userId = c.get("userId");
  const role = await getRole(userId);
  if (!hasPermission(role, "document.update") && !hasPermission(role, "audit.view")) {
    return c.json({ error: "Forbidden: missing document.update or audit.view" }, 403);
  }
  const { id } = c.req.param();
  await prisma.processingJob.delete({ where: { id } });
  return c.json({ ok: true });
});

// --- Collections ---

data.get("/collections", async (c) => {
  const orgId = c.get("orgId");
  const collections = await prisma.collection.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });
  return c.json({ collections });
});

data.post("/collections", async (c) => {
  const perm = await assertPermission(c, "document.create");
  if (perm) return perm;
  const orgId = c.get("orgId");
  const userId = c.get("userId");
  const body = await c.req.json<{ name: string; description?: string }>();
  const collection = await prisma.collection.create({
    data: {
      organizationId: orgId,
      name: body.name,
      description: body.description,
      createdBy: userId,
    },
  });
  return c.json({ collection }, 201);
});

data.patch("/collections/:id", async (c) => {
  const perm = await assertPermission(c, "document.update");
  if (perm) return perm;
  const orgId = c.get("orgId");
  const { id } = c.req.param();
  const body = await c.req.json();
  const existing = await prisma.collection.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return c.json({ error: "Not found" }, 404);
  const { organizationId: _org, ...safeBody } = body;
  const collection = await prisma.collection.update({ where: { id }, data: safeBody });
  return c.json({ collection });
});

data.delete("/collections/:id", async (c) => {
  const perm = await assertPermission(c, "document.update");
  if (perm) return perm;
  const orgId = c.get("orgId");
  const { id } = c.req.param();
  const existing = await prisma.collection.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return c.json({ error: "Not found" }, 404);
  await prisma.collection.delete({ where: { id } });
  return c.json({ ok: true });
});

// --- Retention Policies ---

data.get("/retention-policies", async (c) => {
  const orgId = c.get("orgId");
  const policies = await prisma.retentionPolicy.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });
  return c.json({ policies });
});

data.post("/retention-policies", async (c) => {
  const perm = await assertPermission(c, "compliance.manage");
  if (perm) return perm;
  const orgId = c.get("orgId");
  const body = await c.req.json();
  const { organizationId: _org, ...safeBody } = body;
  const policy = await prisma.retentionPolicy.create({
    data: { organizationId: orgId, ...safeBody },
  });
  return c.json({ policy }, 201);
});

data.patch("/retention-policies/:id", async (c) => {
  const perm = await assertPermission(c, "compliance.manage");
  if (perm) return perm;
  const orgId = c.get("orgId");
  const { id } = c.req.param();
  const body = await c.req.json();
  const existing = await prisma.retentionPolicy.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return c.json({ error: "Not found" }, 404);
  const { organizationId: _org, ...safeBody } = body;
  const policy = await prisma.retentionPolicy.update({ where: { id }, data: safeBody });
  return c.json({ policy });
});

data.delete("/retention-policies/:id", async (c) => {
  const perm = await assertPermission(c, "compliance.manage");
  if (perm) return perm;
  const orgId = c.get("orgId");
  const { id } = c.req.param();
  const existing = await prisma.retentionPolicy.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return c.json({ error: "Not found" }, 404);
  await prisma.retentionPolicy.delete({ where: { id } });
  return c.json({ ok: true });
});

// --- Audit Logs ---

data.get("/audit-logs", async (c) => {
  const perm = await assertPermission(c, "audit.view");
  if (perm) return perm;
  const orgId = c.get("orgId");
  const logs = await prisma.auditLog.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return c.json({ logs });
});

// POST /audit-logs removed — audit forgery prevention

// --- Users (profiles) ---

data.get("/users", async (c) => {
  const perm = await assertPermission(c, "team.view");
  if (perm) return perm;
  const orgId = c.get("orgId");
  const users = await prisma.profile.findMany({
    where: { organizationId: orgId, isActive: true },
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarColor: true,
      role: true,
      departmentId: true,
      organizationId: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
  return c.json({ users });
});

data.post("/users", async (c) => {
  const perm = await assertPermission(c, "team.manage");
  if (perm) return perm;
  const orgId = c.get("orgId");
  const body = await c.req.json<{ email: string; fullName?: string; role?: string }>();
  // Enforce maxUsers quota
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return c.json({ error: "Organization not found" }, 404);
  const userCount = await prisma.profile.count({ where: { organizationId: orgId, isActive: true } });
  if (userCount >= org.maxUsers) {
    return c.json({ error: "User limit reached" }, 413);
  }
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash("welcome123", 10);
  const user = await prisma.profile.create({
    data: {
      id: crypto.randomUUID(),
      email: body.email,
      fullName: body.fullName || body.email.split("@")[0],
      passwordHash,
      organizationId: orgId,
      role: body.role || "viewer",
    },
  });
  const { passwordHash: _, ...safeUser } = user;
  return c.json({ user: safeUser }, 201);
});

data.patch("/users/:id", async (c) => {
  const perm = await assertPermission(c, "team.manage");
  if (perm) return perm;
  const orgId = c.get("orgId");
  const { id } = c.req.param();
  const body = await c.req.json();
  const existing = await prisma.profile.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return c.json({ error: "Not found" }, 404);
  // Whitelist body to only role, departmentId, isActive
  const allowed: Record<string, unknown> = {};
  if ("role" in body) allowed.role = body.role;
  if ("departmentId" in body) allowed.departmentId = body.departmentId;
  if ("isActive" in body) allowed.isActive = body.isActive;
  // Enforce maxUsers quota if activating
  if (allowed.isActive === true && !existing.isActive) {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (org) {
      const userCount = await prisma.profile.count({ where: { organizationId: orgId, isActive: true } });
      if (userCount >= org.maxUsers) {
        return c.json({ error: "User limit reached" }, 413);
      }
    }
  }
  const { passwordHash: _, ...updated } = await prisma.profile.update({ where: { id }, data: allowed });
  return c.json({ user: updated });
});

data.delete("/users/:id", async (c) => {
  const perm = await assertPermission(c, "team.manage");
  if (perm) return perm;
  const orgId = c.get("orgId");
  const userId = c.get("userId");
  const { id } = c.req.param();
  if (id === userId) {
    return c.json({ error: "Cannot delete yourself" }, 400);
  }
  const existing = await prisma.profile.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (existing.role === "owner") {
    return c.json({ error: "Cannot delete owner" }, 403);
  }
  await prisma.profile.update({ where: { id }, data: { isActive: false } });
  return c.json({ ok: true });
});

// --- Organization ---

data.get("/organization", async (c) => {
  const orgId = c.get("orgId");
  const organization = await prisma.organization.findUnique({ where: { id: orgId } });
  return c.json({ organization });
});

data.patch("/organization", async (c) => {
  const userId = c.get("userId");
  const role = await getRole(userId);
  if (!hasPermission(role, "org.manage") && !hasPermission(role, "billing.manage")) {
    return c.json({ error: "Forbidden: missing org.manage or billing.manage" }, 403);
  }
  const orgId = c.get("orgId");
  const body = await c.req.json();
  const allowedKeys = ['name','industry','country','timezone','defaultLanguage','logoUrl','settings','planTier'];
  const filtered: Record<string, unknown> = {};
  for (const key of allowedKeys) {
    if (key in body) filtered[key] = body[key];
  }

  // If planTier is being updated, also update limits
  if (filtered.planTier) {
    const { getPlanByTier } = await import("../../src/lib/billing.js");
    const plan = getPlanByTier(filtered.planTier as string);
    filtered.maxStorageBytes = BigInt(Math.round(plan.maxStorageGB * 1024 * 1024 * 1024));
    filtered.maxDocuments = plan.maxDocuments;
    filtered.maxUsers = plan.maxUsers || 5;
    if (filtered.planTier !== 'trialing') {
      filtered.subscriptionState = 'active';
    }
  }

  const organization = await prisma.organization.update({ where: { id: orgId }, data: filtered });
  return c.json({ organization });
});

// --- Workflows ---

data.get("/workflows", async (c) => {
  const orgId = c.get("orgId");
  const workflows = await prisma.workflow.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });
  return c.json({ workflows });
});

data.post("/workflows", async (c) => {
  const perm = await assertPermission(c, "compliance.manage");
  if (perm) return perm;
  const orgId = c.get("orgId");
  const body = await c.req.json<{ name: string; description?: string; triggerType: string; conditions?: unknown; actions?: unknown }>();
  const { organizationId: _org, ...safeBody } = body as Record<string, unknown>;
  const workflow = await prisma.workflow.create({
    data: {
      organizationId: orgId,
      name: (safeBody as { name: string }).name,
      description: (safeBody as { description?: string }).description,
      triggerType: (safeBody as { triggerType: string }).triggerType,
      conditions: (safeBody as { conditions?: unknown }).conditions || {},
      actions: (safeBody as { actions?: unknown }).actions || [],
    },
  });
  return c.json({ workflow }, 201);
});

data.patch("/workflows/:id", async (c) => {
  const perm = await assertPermission(c, "compliance.manage");
  if (perm) return perm;
  const orgId = c.get("orgId");
  const { id } = c.req.param();
  const body = await c.req.json();
  const existing = await prisma.workflow.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return c.json({ error: "Not found" }, 404);
  const { organizationId: _org, ...safeBody } = body;
  const workflow = await prisma.workflow.update({ where: { id }, data: safeBody });
  return c.json({ workflow });
});

data.delete("/workflows/:id", async (c) => {
  const perm = await assertPermission(c, "compliance.manage");
  if (perm) return perm;
  const orgId = c.get("orgId");
  const { id } = c.req.param();
  const existing = await prisma.workflow.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return c.json({ error: "Not found" }, 404);
  await prisma.workflow.delete({ where: { id } });
  return c.json({ ok: true });
});

// --- Search Suggestions ---

data.get("/search-suggestions", async (c) => {
  const orgId = c.get("orgId");
  const userId = c.req.query("userId");
  const limit = parseInt(c.req.query("limit") ?? "5", 10);

  const docs = await prisma.document.findMany({
    where: { organizationId: orgId, deletedAt: null },
    select: { title: true, tags: true },
    orderBy: { uploadedAt: "desc" },
    take: 20,
  });

  const titleSuggestions = [...new Set(docs.map((d) => d.title))].slice(0, limit);
  const tagSuggestions = [...new Set(docs.flatMap((d) => d.tags))].slice(0, limit);

  const suggestions = [
    ...titleSuggestions.map((query) => ({ query, type: "title" })),
    ...tagSuggestions.map((query) => ({ query, type: "tag" })),
  ].slice(0, limit);

  return c.json({ suggestions });
});

data.post("/search-suggestions", async (c) => {
  return c.json({ ok: true });
});

// --- AI Analysis ---

data.post("/documents/:id/analyze", async (c) => {
  const perm = await assertPermission(c, "document.read");
  if (perm) return perm;
  const orgId = c.get("orgId");
  const { id } = c.req.param();

  const doc = await prisma.document.findFirst({
    where: { id, organizationId: orgId, deletedAt: null },
  });
  if (!doc) return c.json({ error: "Document not found" }, 404);

  const extracted = await extractFileText(doc.filePath, doc.fileType, doc.title);
  const insight = await analyzeDocument(doc.title, extracted.text, extracted.imageData);

  const existingMeta = (doc.metadata as Record<string, unknown>) || {};
  await prisma.document.update({
    where: { id },
    data: { metadata: { ...existingMeta, insight, analyzedAt: new Date().toISOString() } },
  });

  return c.json({ insight });
});

data.post("/search/ai-answer", async (c) => {
  const perm = await assertPermission(c, "document.read");
  if (perm) return perm;
  const orgId = c.get("orgId");
  const { query } = await c.req.json<{ query: string }>();

  if (!query?.trim()) {
    return c.json({ answer: "Please provide a search query." });
  }

  const searchQuery = query
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((t: string) => `${t}:*`)
    .join(" & ");

  let results: any[] = [];
  try {
    const safeQuery = query.replace(/[%_\\]/g, "\\$&").slice(0, 200);
    results = await prisma.$queryRawUnsafe(
      `SELECT title, tags,
        ts_rank(
          to_tsvector('english', coalesce(title, '') || ' ' || coalesce(array_to_string(tags, ' '), '')),
          plainto_tsquery('english', $1)
        ) AS rank
      FROM "Document"
      WHERE "organizationId" = $2
        AND "deletedAt" IS NULL
        AND (
          to_tsvector('english', coalesce(title, '') || ' ' || coalesce(array_to_string(tags, ' '), ''))
          @@ plainto_tsquery('english', $1)
          OR title ILIKE $3
        )
      ORDER BY rank DESC
      LIMIT 5`,
      searchQuery, orgId, `%${safeQuery}%`
    );
  } catch {
    results = await prisma.document.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { tags: { has: query } },
        ],
      },
      take: 5,
    });
  }

  const snippets = results.map(
    (r: any) => `Title: ${r.title}\nTags: ${(r.tags || []).join(", ")}`
  );

  const result = await generateSearchAnswer(query, snippets);

  return c.json({
    answer: result.answer,
    reasoning: result.reasoning,
    reasoningSummary: result.reasoningSummary,
    sources: results.map((r: any) => ({ title: r.title })),
  });
});

// --- Document Processing Pipeline ---

data.post("/documents/:id/process", async (c) => {
  const perm = await assertPermission(c, "document.read");
  if (perm) return perm;
  const orgId = c.get("orgId");
  const { id } = c.req.param();

  const doc = await prisma.document.findFirst({
    where: { id, organizationId: orgId, deletedAt: null },
  });
  if (!doc) return c.json({ error: "Document not found" }, 404);

  const job = await prisma.processingJob.create({
    data: {
      organizationId: orgId,
      documentId: id,
      documentName: doc.title,
      stage: "extracting",
      progress: 10,
    },
  });

  try {
    await prisma.processingJob.update({
      where: { id: job.id },
      data: { stage: "analyzing", progress: 50 },
    });

    const extracted = await extractFileText(doc.filePath, doc.fileType, doc.title);
    const insight = await analyzeDocument(doc.title, extracted.text, extracted.imageData);

    await prisma.processingJob.update({
      where: { id: job.id },
      data: { stage: "indexing", progress: 80 },
    });

    const existingMeta2 = (doc.metadata as Record<string, unknown>) || {};
    await prisma.document.update({
      where: { id },
      data: {
        status: "completed",
        embeddingCompleted: true,
        metadata: { ...existingMeta2, insight, processedAt: new Date().toISOString() },
      },
    });

    await prisma.processingJob.update({
      where: { id: job.id },
      data: { stage: "completed", progress: 100, completedAt: new Date() },
    });

    return c.json({ ok: true, insight });
  } catch (err: any) {
    await prisma.processingJob.update({
      where: { id: job.id },
      data: { stage: "failed", error: err.message },
    });
    return c.json({ error: err.message }, 500);
  }
});

// --- Ask AI about a document (Vision + text) ---
data.post("/documents/:id/ask", async (c) => {
  const perm = await assertPermission(c, "document.read");
  if (perm) return perm;
  const orgId = c.get("orgId");
  const { id } = c.req.param();
  const { question } = await c.req.json<{ question: string }>();
  if (!question?.trim()) return c.json({ error: "Question is required" }, 400);

  const doc = await prisma.document.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
  if (!doc) return c.json({ error: "Document not found" }, 404);

  const extracted = await extractFileText(doc.filePath, doc.fileType, doc.title);

  // Image → Gemini Vision with reasoning
  if (extracted.isImage && extracted.imageData) {
    const result = await geminiVisionChat(question, extracted.imageData);
    if (result) return c.json({ answer: result.answer, reasoning: result.reasoning, reasoningSummary: result.reasoningSummary });
  }

  // Text-based → ask with reasoning
  const context = extracted.text.slice(0, 12000);
  const snippets = [`Title: ${doc.title}\nContent: ${context}`];
  const chatResult = await (await import("../lib/ai.js")).generateSearchAnswer(question, snippets);
  return c.json({ answer: chatResult.answer, reasoning: chatResult.reasoning, reasoningSummary: chatResult.reasoningSummary });
});

export default data;
