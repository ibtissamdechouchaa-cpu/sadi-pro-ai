import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../lib/auth.js";
import { assertPermission } from "../lib/permissions.js";
import {
  calculateComplianceScore,
  analyzeDocumentCompliance,
  getGapAnalysis,
  generateComplianceReport,
} from "../lib/compliance.js";
import {
  searchLegalKnowledgeBase,
  verifyLegalSource,
  importLegalReference,
  detectLegalRelations,
  extractRetentionRules,
  getLegalResearchStats,
  saveSearchHistory,
  getSearchHistory,
} from "../lib/legalResearch.js";
import {
  searchInternetLegal,
  scrapeLegalDocument,
  getAvailableSources,
} from "../lib/webScraper.js";
import { randomUUID } from "crypto";

const compliance = new Hono();

compliance.use("*", authMiddleware);

// ============================================
// INTERNET LEGAL SEARCH
// ============================================

compliance.get("/internet-search/sources", async (c) => {
  try {
    const sources = getAvailableSources();
    return c.json({ sources });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.post("/internet-search", async (c) => {
  try {
    const orgId = c.get("orgId");
    const userId = c.get("userId");
    const body = await c.req.json<{
      query: string;
      sources?: string[];
      maxResults?: number;
      importResults?: boolean;
    }>();

    if (!body.query?.trim()) {
      return c.json({ error: "query is required" }, 400);
    }

    const webResults = await searchInternetLegal(body.query, {
      sources: body.sources,
      maxResults: body.maxResults,
    });

    let importedCount = 0;
    let duplicateCount = 0;

    if (body.importResults && webResults.results.length > 0) {
      for (const result of webResults.results) {
        const lawNum = result.title.match(
          /(\d{2,3}[-–]\d{2})/
        );
        if (lawNum) {
          const importResult = await importLegalReference(
            prisma,
            {
              referenceNumber: lawNum[1].replace("–", "-"),
              title: result.title,
              referenceType: result.type === "other" ? "other" : result.type,
              officialSource: result.source,
              sourceUrl: result.url,
              publicationDate: result.date ? new Date(result.date) : undefined,
              domain: "OTHER",
            },
            orgId,
            userId
          );
          if (importResult.isDuplicate) {
            duplicateCount++;
          } else {
            importedCount++;
          }
        }
      }
    }

    await saveSearchHistory(
      prisma,
      userId,
      orgId,
      `[WEB] ${body.query}`,
      { sources: body.sources, maxResults: body.maxResults },
      webResults.results.length,
      webResults.searchedSources
    ).catch(() => {});

    return c.json({
      results: webResults.results,
      searchedSources: webResults.searchedSources,
      errors: webResults.errors,
      imported: importedCount,
      duplicates: duplicateCount,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.post("/internet-search/scrape", async (c) => {
  try {
    const body = await c.req.json<{ url: string }>();
    if (!body.url?.trim()) {
      return c.json({ error: "url is required" }, 400);
    }

    const doc = await scrapeLegalDocument(body.url);
    if (!doc) {
      return c.json({ error: "Failed to scrape document" }, 404);
    }

    return c.json({ document: doc });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.post("/internet-search/import-scraped", async (c) => {
  try {
    const perm = await assertPermission(c, "compliance.manage");
    if (perm) return perm;
    const orgId = c.get("orgId");
    const userId = c.get("userId");

    const body = await c.req.json<{
      url: string;
      domain?: string;
    }>();

    if (!body.url?.trim()) {
      return c.json({ error: "url is required" }, 400);
    }

    const doc = await scrapeLegalDocument(body.url);
    if (!doc) {
      return c.json({ error: "Failed to scrape document" }, 404);
    }

    const result = await importLegalReference(
      prisma,
      {
        referenceNumber: doc.referenceNumber,
        title: doc.title,
        titleAr: doc.titleAr,
        referenceType: doc.referenceType,
        officialSource: doc.source,
        sourceUrl: doc.url,
        fullText: doc.fullText,
        publicationDate: doc.publicationDate ? new Date(doc.publicationDate) : undefined,
        keywords: doc.keywords,
        domain: body.domain || "OTHER",
      },
      orgId,
      userId
    );

    return c.json({
      id: result.id,
      isDuplicate: result.isDuplicate,
      document: doc,
    }, result.isDuplicate ? 200 : 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// ============================================
// LEGAL KNOWLEDGE BASE
// ============================================

compliance.get("/legal-references", async (c) => {
  try {
    const orgId = c.get("orgId");
    const domain = c.req.query("domain") || undefined;
    const status = c.req.query("status") || undefined;
    const type = c.req.query("type") || undefined;
    const jurisdiction = c.req.query("jurisdiction") || undefined;
    const search = c.req.query("search") || undefined;
    const page = Math.max(parseInt(c.req.query("page") ?? "1", 10), 1);
    const limit = Math.min(parseInt(c.req.query("limit") ?? "20", 10), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      OR: [{ organizationId: orgId }, { organizationId: null }],
    };

    if (domain) where.domain = domain;
    if (status) where.status = status;
    if (type) where.referenceType = type;
    if (jurisdiction) where.jurisdiction = jurisdiction;
    if (search) {
      where.OR = [
        { organizationId: orgId },
        { organizationId: null },
        {
          AND: [
            {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { titleAr: { contains: search, mode: "insensitive" } },
                { titleFr: { contains: search, mode: "insensitive" } },
                { referenceNumber: { contains: search, mode: "insensitive" } },
              ],
            },
          ],
        },
      ];
    }

    const [references, total] = await Promise.all([
      prisma.legalReference.findMany({
        where: where as never,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        include: {
          _count: { select: { articles: true, outgoingRelations: true, incomingRelations: true } },
        },
      }),
      prisma.legalReference.count({ where: where as never }),
    ]);

    return c.json({ references, total });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.get("/legal-references/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const reference = await prisma.legalReference.findUnique({
      where: { id },
      include: {
        articles: true,
        outgoingRelations: {
          include: { targetReference: { select: { id: true, referenceNumber: true, title: true } } },
        },
        incomingRelations: {
          include: { sourceReference: { select: { id: true, referenceNumber: true, title: true } } },
        },
        versions: { orderBy: { version: "desc" } },
      },
    });

    if (!reference) return c.json({ error: "Legal reference not found" }, 404);
    return c.json({ reference });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.post("/legal-references", async (c) => {
  try {
    const perm = await assertPermission(c, "compliance.manage");
    if (perm) return perm;
    const orgId = c.get("orgId");
    const userId = c.get("userId");

    const body = await c.req.json<{
      referenceNumber: string;
      titleAr?: string;
      titleFr?: string;
      titleEn?: string;
      referenceType: string;
      domain?: string;
      jurisdiction?: string;
      issuingAuthority?: string;
      publicationDate?: string;
      officialGazetteNumber?: string;
      officialSource?: string;
      sourceUrl?: string;
      fullText?: string;
      keywords?: string[];
      articles?: Array<{
        articleNumber: string;
        title?: string;
        textAr?: string;
        textFr?: string;
        obligations?: string[];
        prohibitions?: string[];
        permissions?: string[];
      }>;
    }>();

    if (!body.referenceNumber?.trim()) {
      return c.json({ error: "referenceNumber is required" }, 400);
    }
    if (!body.referenceType?.trim()) {
      return c.json({ error: "referenceType is required" }, 400);
    }

    const existing = await prisma.legalReference.findFirst({
      where: { referenceNumber: body.referenceNumber, referenceType: body.referenceType },
    });

    if (existing) {
      return c.json({ error: "Duplicate reference", existingId: existing.id }, 409);
    }

    const reference = await prisma.legalReference.create({
      data: {
        referenceNumber: body.referenceNumber,
        referenceType: body.referenceType,
        title: body.titleEn || body.titleFr || body.titleAr || body.referenceNumber,
        titleAr: body.titleAr,
        titleFr: body.titleFr,
        titleEn: body.titleEn,
        jurisdiction: body.jurisdiction || "Algeria",
        issuingAuthority: body.issuingAuthority,
        publicationDate: body.publicationDate ? new Date(body.publicationDate) : null,
        officialGazetteNumber: body.officialGazetteNumber,
        officialSource: body.officialSource,
        sourceUrl: body.sourceUrl,
        fullText: body.fullText,
        keywords: body.keywords || [],
        domain: body.domain || "OTHER",
        organizationId: orgId,
        status: "UNVERIFIED",
      },
    });

    if (body.articles && body.articles.length > 0) {
      await prisma.legalArticle.createMany({
        data: body.articles.map((a) => ({
          legalReferenceId: reference.id,
          articleNumber: a.articleNumber,
          title: a.title,
          textAr: a.textAr,
          textFr: a.textFr,
          obligations: a.obligations || [],
          prohibitions: a.prohibitions || [],
          permissions: a.permissions || [],
        })),
      });
    }

    await prisma.legalReferenceVersion.create({
      data: {
        legalReferenceId: reference.id,
        version: 1,
        fullText: body.fullText,
        sourceUrl: body.sourceUrl,
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: orgId,
        userId,
        action: "LEGAL_REFERENCE_CREATED",
        entityType: "LegalReference",
        resourceId: reference.id,
        resourceName: body.referenceNumber,
        metadata: { referenceType: body.referenceType, domain: body.domain },
      },
    });

    return c.json({ reference }, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.patch("/legal-references/:id", async (c) => {
  try {
    const perm = await assertPermission(c, "compliance.manage");
    if (perm) return perm;
    const orgId = c.get("orgId");
    const userId = c.get("userId");
    const { id } = c.req.param();
    const body = await c.req.json();

    const existing = await prisma.legalReference.findFirst({
      where: { id, OR: [{ organizationId: orgId }, { organizationId: null }] },
    });
    if (!existing) return c.json({ error: "Legal reference not found" }, 404);

    const { organizationId: _org, ...safeBody } = body;
    if (safeBody.publicationDate) safeBody.publicationDate = new Date(safeBody.publicationDate);
    safeBody.updatedAt = new Date();

    const reference = await prisma.legalReference.update({ where: { id }, data: safeBody });

    const newVersion = existing.version + 1;
    await prisma.legalReferenceVersion.create({
      data: {
        legalReferenceId: id,
        version: newVersion,
        fullText: safeBody.fullText || existing.fullText,
        sourceUrl: safeBody.sourceUrl || existing.sourceUrl,
        changeSummary: `Updated fields: ${Object.keys(safeBody).join(", ")}`,
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: orgId,
        userId,
        action: "LEGAL_REFERENCE_UPDATED",
        entityType: "LegalReference",
        resourceId: id,
        resourceName: reference.referenceNumber,
        metadata: { fields: Object.keys(safeBody), version: newVersion },
      },
    });

    return c.json({ reference });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.post("/legal-references/:id/verify", async (c) => {
  try {
    const perm = await assertPermission(c, "compliance.manage");
    if (perm) return perm;
    const orgId = c.get("orgId");
    const userId = c.get("userId");
    const { id } = c.req.param();

    const existing = await prisma.legalReference.findFirst({
      where: { id, OR: [{ organizationId: orgId }, { organizationId: null }] },
    });
    if (!existing) return c.json({ error: "Legal reference not found" }, 404);

    const reference = await prisma.legalReference.update({
      where: { id },
      data: {
        status: "ACTIVE",
        verifiedAt: new Date(),
        verifiedBy: userId,
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: orgId,
        userId,
        action: "LEGAL_REFERENCE_VERIFIED",
        entityType: "LegalReference",
        resourceId: id,
        resourceName: reference.referenceNumber,
      },
    });

    return c.json({ reference });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.get("/legal-references/:id/articles", async (c) => {
  try {
    const { id } = c.req.param();
    const reference = await prisma.legalReference.findUnique({ where: { id } });
    if (!reference) return c.json({ error: "Legal reference not found" }, 404);

    const articles = await prisma.legalArticle.findMany({
      where: { legalReferenceId: id },
      orderBy: { articleNumber: "asc" },
    });

    return c.json({ articles });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.post("/legal-references/:id/articles", async (c) => {
  try {
    const perm = await assertPermission(c, "compliance.manage");
    if (perm) return perm;
    const orgId = c.get("orgId");
    const userId = c.get("userId");
    const { id } = c.req.param();

    const reference = await prisma.legalReference.findFirst({
      where: { id, OR: [{ organizationId: orgId }, { organizationId: null }] },
    });
    if (!reference) return c.json({ error: "Legal reference not found" }, 404);

    const body = await c.req.json<{
      articleNumber: string;
      title?: string;
      textAr?: string;
      textFr?: string;
      textEn?: string;
      fullText?: string;
      keywords?: string[];
      obligations?: string[];
      prohibitions?: string[];
      permissions?: string[];
      penalties?: string[];
    }>();

    if (!body.articleNumber?.trim()) {
      return c.json({ error: "articleNumber is required" }, 400);
    }

    const article = await prisma.legalArticle.create({
      data: {
        legalReferenceId: id,
        articleNumber: body.articleNumber,
        title: body.title,
        textAr: body.textAr,
        textFr: body.textFr,
        textEn: body.textEn,
        fullText: body.fullText,
        keywords: body.keywords || [],
        obligations: body.obligations || [],
        prohibitions: body.prohibitions || [],
        permissions: body.permissions || [],
        penalties: body.penalties || [],
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: orgId,
        userId,
        action: "LEGAL_ARTICLE_ADDED",
        entityType: "LegalArticle",
        resourceId: article.id,
        resourceName: `${reference.referenceNumber} - Art. ${body.articleNumber}`,
        metadata: { legalReferenceId: id },
      },
    });

    return c.json({ article }, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.get("/legal-references/:id/relations", async (c) => {
  try {
    const { id } = c.req.param();
    const reference = await prisma.legalReference.findUnique({ where: { id } });
    if (!reference) return c.json({ error: "Legal reference not found" }, 404);

    const [outgoing, incoming] = await Promise.all([
      prisma.legalRelation.findMany({
        where: { sourceReferenceId: id },
        include: { targetReference: { select: { id: true, referenceNumber: true, title: true } } },
      }),
      prisma.legalRelation.findMany({
        where: { targetReferenceId: id },
        include: { sourceReference: { select: { id: true, referenceNumber: true, title: true } } },
      }),
    ]);

    return c.json({ outgoing, incoming });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.post("/legal-references/:id/detect-relations", async (c) => {
  try {
    const perm = await assertPermission(c, "compliance.manage");
    if (perm) return perm;
    const { id } = c.req.param();

    const reference = await prisma.legalReference.findUnique({ where: { id } });
    if (!reference) return c.json({ error: "Legal reference not found" }, 404);

    const relations = await detectLegalRelations(prisma, id);
    return c.json({ relations });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// ============================================
// LEGAL RESEARCH
// ============================================

compliance.post("/legal-research", async (c) => {
  try {
    const orgId = c.get("orgId");
    const userId = c.get("userId");
    const body = await c.req.json<{
      query: string;
      domain?: string;
      jurisdiction?: string;
      status?: string;
      type?: string;
      limit?: number;
    }>();

    if (!body.query?.trim()) {
      return c.json({ error: "query is required" }, 400);
    }

    const results = await searchLegalKnowledgeBase(prisma, body.query, {
      domain: body.domain,
      jurisdiction: body.jurisdiction,
      status: body.status,
      type: body.type,
      limit: body.limit,
    });

    const stats = await getLegalResearchStats(prisma, orgId);

    await saveSearchHistory(prisma, userId, orgId, body.query, {
      domain: body.domain,
      jurisdiction: body.jurisdiction,
      status: body.status,
      type: body.type,
    }, results.length, []).catch(() => {});

    return c.json({ results, stats });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.post("/legal-research/import", async (c) => {
  try {
    const perm = await assertPermission(c, "compliance.manage");
    if (perm) return perm;
    const orgId = c.get("orgId");
    const userId = c.get("userId");

    const body = await c.req.json<{
      referenceNumber: string;
      titleAr?: string;
      titleFr?: string;
      titleEn?: string;
      referenceType: string;
      jurisdiction?: string;
      issuingAuthority?: string;
      publicationDate?: string;
      officialGazetteNumber?: string;
      officialSource?: string;
      sourceUrl?: string;
      fullText?: string;
      keywords?: string[];
      domain?: string;
      articles?: Array<{
        articleNumber: string;
        title?: string;
        textAr?: string;
        textFr?: string;
        obligations?: string[];
        prohibitions?: string[];
        permissions?: string[];
      }>;
    }>();

    if (!body.referenceNumber?.trim()) {
      return c.json({ error: "referenceNumber is required" }, 400);
    }

    const result = await importLegalReference(
      prisma,
      {
        referenceNumber: body.referenceNumber,
        titleAr: body.titleAr,
        titleFr: body.titleFr,
        titleEn: body.titleEn,
        referenceType: body.referenceType,
        jurisdiction: body.jurisdiction,
        issuingAuthority: body.issuingAuthority,
        publicationDate: body.publicationDate ? new Date(body.publicationDate) : undefined,
        officialGazetteNumber: body.officialGazetteNumber,
        officialSource: body.officialSource,
        sourceUrl: body.sourceUrl,
        fullText: body.fullText,
        keywords: body.keywords,
        domain: body.domain,
        articles: body.articles,
      },
      orgId,
      userId
    );

    return c.json({ id: result.id, isDuplicate: result.isDuplicate }, result.isDuplicate ? 200 : 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.get("/legal-research/stats", async (c) => {
  try {
    const orgId = c.get("orgId");
    const stats = await getLegalResearchStats(prisma, orgId);
    return c.json({ stats });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.post("/legal-research/history", async (c) => {
  try {
    const orgId = c.get("orgId");
    const userId = c.get("userId");
    const body = await c.req.json<{
      query: string;
      filters?: Record<string, unknown>;
      resultsCount?: number;
      searchedSources?: string[];
    }>();

    if (!body.query?.trim()) {
      return c.json({ error: "query is required" }, 400);
    }

    await saveSearchHistory(
      prisma,
      userId,
      orgId,
      body.query,
      body.filters || {},
      body.resultsCount || 0,
      body.searchedSources || []
    );

    return c.json({ ok: true }, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.get("/legal-research/history", async (c) => {
  try {
    const orgId = c.get("orgId");
    const userId = c.get("userId");
    const limit = Math.min(parseInt(c.req.query("limit") ?? "20", 10), 100);

    const history = await getSearchHistory(prisma, orgId, userId, limit);
    return c.json({ history });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// ============================================
// COMPLIANCE FRAMEWORKS
// ============================================

compliance.get("/frameworks", async (c) => {
  try {
    const frameworks = await prisma.complianceFramework.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { requirements: true } },
        assessments: {
          orderBy: { assessedAt: "desc" },
          take: 1,
        },
      },
    });

    return c.json({ frameworks });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.get("/frameworks/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const framework = await prisma.complianceFramework.findUnique({
      where: { id },
      include: {
        requirements: { orderBy: { code: "asc" } },
        assessments: { orderBy: { assessedAt: "desc" }, take: 1 },
      },
    });

    if (!framework) return c.json({ error: "Framework not found" }, 404);
    return c.json({ framework });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.post("/frameworks", async (c) => {
  try {
    const perm = await assertPermission(c, "compliance.manage");
    if (perm) return perm;

    const body = await c.req.json<{
      name: string;
      nameAr?: string;
      nameFr?: string;
      code: string;
      type: string;
      jurisdiction?: string;
      version?: string;
      description?: string;
    }>();

    if (!body.name?.trim()) return c.json({ error: "name is required" }, 400);
    if (!body.code?.trim()) return c.json({ error: "code is required" }, 400);
    if (!body.type?.trim()) return c.json({ error: "type is required" }, 400);

    const existingCode = await prisma.complianceFramework.findUnique({ where: { code: body.code } });
    if (existingCode) return c.json({ error: "Framework code already exists" }, 409);

    const framework = await prisma.complianceFramework.create({
      data: {
        name: body.name,
        nameAr: body.nameAr,
        nameFr: body.nameFr,
        code: body.code,
        type: body.type,
        jurisdiction: body.jurisdiction,
        version: body.version,
        description: body.description,
      },
    });

    return c.json({ framework }, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.patch("/frameworks/:id", async (c) => {
  try {
    const perm = await assertPermission(c, "compliance.manage");
    if (perm) return perm;

    const { id } = c.req.param();
    const existing = await prisma.complianceFramework.findUnique({ where: { id } });
    if (!existing) return c.json({ error: "Framework not found" }, 404);

    const body = await c.req.json();
    const { code: _code, ...safeBody } = body;

    const framework = await prisma.complianceFramework.update({ where: { id }, data: safeBody });
    return c.json({ framework });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// ============================================
// COMPLIANCE REQUIREMENTS
// ============================================

compliance.get("/frameworks/:frameworkId/requirements", async (c) => {
  try {
    const { frameworkId } = c.req.param();
    const framework = await prisma.complianceFramework.findUnique({ where: { id: frameworkId } });
    if (!framework) return c.json({ error: "Framework not found" }, 404);

    const requirements = await prisma.complianceRequirement.findMany({
      where: { frameworkId },
      orderBy: { code: "asc" },
      include: {
        _count: { select: { evidence: true } },
        evidence: {
          select: { status: true },
        },
      },
    });

    return c.json({ requirements });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.post("/frameworks/:frameworkId/requirements", async (c) => {
  try {
    const perm = await assertPermission(c, "compliance.manage");
    if (perm) return perm;

    const { frameworkId } = c.req.param();
    const framework = await prisma.complianceFramework.findUnique({ where: { id: frameworkId } });
    if (!framework) return c.json({ error: "Framework not found" }, 404);

    const body = await c.req.json<{
      code: string;
      title: string;
      titleAr?: string;
      description?: string;
      category?: string;
      severity?: string;
      mandatory?: boolean;
      evidenceType?: string;
      implementationGuidance?: string;
      legalReferenceId?: string;
      articleId?: string;
    }>();

    if (!body.code?.trim()) return c.json({ error: "code is required" }, 400);
    if (!body.title?.trim()) return c.json({ error: "title is required" }, 400);

    const requirement = await prisma.complianceRequirement.create({
      data: {
        frameworkId,
        code: body.code,
        title: body.title,
        titleAr: body.titleAr,
        description: body.description,
        category: body.category,
        severity: body.severity || "MEDIUM",
        mandatory: body.mandatory ?? true,
        evidenceType: body.evidenceType,
        implementationGuidance: body.implementationGuidance,
        legalReferenceId: body.legalReferenceId,
        articleId: body.articleId,
      },
    });

    return c.json({ requirement }, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.patch("/requirements/:id", async (c) => {
  try {
    const perm = await assertPermission(c, "compliance.manage");
    if (perm) return perm;

    const { id } = c.req.param();
    const existing = await prisma.complianceRequirement.findUnique({ where: { id } });
    if (!existing) return c.json({ error: "Requirement not found" }, 404);

    const body = await c.req.json();
    const { frameworkId: _fw, ...safeBody } = body;

    const requirement = await prisma.complianceRequirement.update({ where: { id }, data: safeBody });
    return c.json({ requirement });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// ============================================
// COMPLIANCE EVIDENCE
// ============================================

compliance.get("/requirements/:requirementId/evidence", async (c) => {
  try {
    const orgId = c.get("orgId");
    const { requirementId } = c.req.param();
    const requirement = await prisma.complianceRequirement.findUnique({ where: { id: requirementId } });
    if (!requirement) return c.json({ error: "Requirement not found" }, 404);

    const evidence = await prisma.complianceEvidence.findMany({
      where: { requirementId, organizationId: orgId },
      orderBy: { createdAt: "desc" },
    });

    return c.json({ evidence });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.post("/requirements/:requirementId/evidence", async (c) => {
  try {
    const perm = await assertPermission(c, "compliance.manage");
    if (perm) return perm;
    const orgId = c.get("orgId");

    const { requirementId } = c.req.param();
    const requirement = await prisma.complianceRequirement.findUnique({ where: { id: requirementId } });
    if (!requirement) return c.json({ error: "Requirement not found" }, 404);

    const body = await c.req.json<{
      evidenceType: string;
      description: string;
      documentId?: string;
      policyId?: string;
      confidence?: number;
    }>();

    if (!body.evidenceType?.trim()) return c.json({ error: "evidenceType is required" }, 400);
    if (!body.description?.trim()) return c.json({ error: "description is required" }, 400);

    const evidence = await prisma.complianceEvidence.create({
      data: {
        requirementId,
        organizationId: orgId,
        evidenceType: body.evidenceType,
        description: body.description,
        documentId: body.documentId,
        policyId: body.policyId,
        confidence: body.confidence ?? 0,
      },
    });

    return c.json({ evidence }, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.delete("/evidence/:id", async (c) => {
  try {
    const perm = await assertPermission(c, "compliance.manage");
    if (perm) return perm;
    const orgId = c.get("orgId");

    const { id } = c.req.param();
    const existing = await prisma.complianceEvidence.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) return c.json({ error: "Evidence not found" }, 404);

    await prisma.complianceEvidence.delete({ where: { id } });
    return c.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// ============================================
// COMPLIANCE ASSESSMENT
// ============================================

compliance.post("/frameworks/:frameworkId/assess", async (c) => {
  try {
    const perm = await assertPermission(c, "compliance.view");
    if (perm) return perm;
    const orgId = c.get("orgId");

    const { frameworkId } = c.req.param();
    const framework = await prisma.complianceFramework.findUnique({ where: { id: frameworkId } });
    if (!framework) return c.json({ error: "Framework not found" }, 404);

    const assessment = await calculateComplianceScore(prisma, frameworkId, orgId);
    return c.json({ assessment });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.get("/assessments", async (c) => {
  try {
    const orgId = c.get("orgId");
    const assessments = await prisma.complianceAssessment.findMany({
      where: { organizationId: orgId },
      orderBy: { assessedAt: "desc" },
      include: { framework: { select: { id: true, name: true, code: true } } },
    });

    return c.json({ assessments });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.get("/gap-analysis/:frameworkId", async (c) => {
  try {
    const perm = await assertPermission(c, "compliance.view");
    if (perm) return perm;
    const orgId = c.get("orgId");

    const { frameworkId } = c.req.param();
    const framework = await prisma.complianceFramework.findUnique({ where: { id: frameworkId } });
    if (!framework) return c.json({ error: "Framework not found" }, 404);

    const gaps = await getGapAnalysis(prisma, frameworkId, orgId);
    return c.json({ gaps });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.get("/report", async (c) => {
  try {
    const perm = await assertPermission(c, "compliance.view");
    if (perm) return perm;
    const orgId = c.get("orgId");

    const report = await generateComplianceReport(prisma, orgId);
    return c.json({ report });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// ============================================
// DOCUMENT COMPLIANCE ANALYSIS
// ============================================

compliance.post("/documents/:documentId/analyze", async (c) => {
  try {
    const perm = await assertPermission(c, "compliance.view");
    if (perm) return perm;
    const orgId = c.get("orgId");

    const { documentId } = c.req.param();
    const doc = await prisma.document.findFirst({
      where: { id: documentId, organizationId: orgId, deletedAt: null },
    });
    if (!doc) return c.json({ error: "Document not found" }, 404);

    const analysis = await analyzeDocumentCompliance(prisma, documentId, orgId);
    return c.json({ analysis });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// ============================================
// LEGAL HOLDS
// ============================================

compliance.get("/legal-holds", async (c) => {
  try {
    const orgId = c.get("orgId");
    const holds = await prisma.legalHoldRecord.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { documents: true } },
      },
    });

    return c.json({ holds });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.post("/legal-holds", async (c) => {
  try {
    const perm = await assertPermission(c, "compliance.manage");
    if (perm) return perm;
    const orgId = c.get("orgId");
    const userId = c.get("userId");

    const body = await c.req.json<{
      name: string;
      reason?: string;
      caseReference?: string;
      documentIds?: string[];
    }>();

    if (!body.name?.trim()) return c.json({ error: "name is required" }, 400);

    const profile = await prisma.profile.findUnique({ where: { id: userId } });

    const hold = await prisma.legalHoldRecord.create({
      data: {
        organizationId: orgId,
        name: body.name,
        reason: body.reason,
        caseReference: body.caseReference,
        createdBy: userId,
        createdByName: profile?.fullName || userId,
      },
    });

    if (body.documentIds && body.documentIds.length > 0) {
      const docs = await prisma.document.findMany({
        where: { id: { in: body.documentIds }, organizationId: orgId },
      });

      for (const doc of docs) {
        await prisma.legalHoldDocument.create({
          data: {
            holdId: hold.id,
            documentId: doc.id,
            organizationId: orgId,
            addedBy: userId,
          },
        });

        await prisma.document.update({
          where: { id: doc.id },
          data: { legalHold: true, legalHoldRecordId: hold.id },
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        organizationId: orgId,
        userId,
        action: "LEGAL_HOLD_CREATED",
        entityType: "LegalHoldRecord",
        resourceId: hold.id,
        resourceName: body.name,
        metadata: { caseReference: body.caseReference, documentCount: body.documentIds?.length || 0 },
      },
    });

    return c.json({ hold }, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.patch("/legal-holds/:id/release", async (c) => {
  try {
    const perm = await assertPermission(c, "compliance.manage");
    if (perm) return perm;
    const orgId = c.get("orgId");
    const userId = c.get("userId");
    const { id } = c.req.param();

    const hold = await prisma.legalHoldRecord.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!hold) return c.json({ error: "Legal hold not found" }, 404);
    if (hold.status !== "ACTIVE") return c.json({ error: "Hold is not active" }, 400);

    const profile = await prisma.profile.findUnique({ where: { id: userId } });

    const updated = await prisma.legalHoldRecord.update({
      where: { id },
      data: {
        status: "RELEASED",
        releasedBy: userId,
        releasedByName: profile?.fullName || userId,
        releasedAt: new Date(),
      },
    });

    const holdDocs = await prisma.legalHoldDocument.findMany({
      where: { holdId: id, removedAt: null },
    });

    for (const hd of holdDocs) {
      await prisma.document.update({
        where: { id: hd.documentId },
        data: { legalHold: false, legalHoldRecordId: null },
      });

      await prisma.legalHoldDocument.update({
        where: { id: hd.id },
        data: { removedBy: userId, removedAt: new Date() },
      });
    }

    await prisma.auditLog.create({
      data: {
        organizationId: orgId,
        userId,
        action: "LEGAL_HOLD_RELEASED",
        entityType: "LegalHoldRecord",
        resourceId: id,
        resourceName: hold.name,
        metadata: { releasedDocuments: holdDocs.length },
      },
    });

    return c.json({ hold: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.patch("/legal-holds/:id/cancel", async (c) => {
  try {
    const perm = await assertPermission(c, "compliance.manage");
    if (perm) return perm;
    const orgId = c.get("orgId");
    const userId = c.get("userId");
    const { id } = c.req.param();

    const hold = await prisma.legalHoldRecord.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!hold) return c.json({ error: "Legal hold not found" }, 404);
    if (hold.status !== "ACTIVE") return c.json({ error: "Hold is not active" }, 400);

    const updated = await prisma.legalHoldRecord.update({
      where: { id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    const holdDocs = await prisma.legalHoldDocument.findMany({
      where: { holdId: id, removedAt: null },
    });

    for (const hd of holdDocs) {
      await prisma.document.update({
        where: { id: hd.documentId },
        data: { legalHold: false, legalHoldRecordId: null },
      });

      await prisma.legalHoldDocument.update({
        where: { id: hd.id },
        data: { removedBy: userId, removedAt: new Date() },
      });
    }

    await prisma.auditLog.create({
      data: {
        organizationId: orgId,
        userId,
        action: "LEGAL_HOLD_CANCELLED",
        entityType: "LegalHoldRecord",
        resourceId: id,
        resourceName: hold.name,
      },
    });

    return c.json({ hold: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.post("/legal-holds/:id/documents", async (c) => {
  try {
    const perm = await assertPermission(c, "compliance.manage");
    if (perm) return perm;
    const orgId = c.get("orgId");
    const userId = c.get("userId");
    const { id } = c.req.param();

    const hold = await prisma.legalHoldRecord.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!hold) return c.json({ error: "Legal hold not found" }, 404);
    if (hold.status !== "ACTIVE") return c.json({ error: "Hold is not active" }, 400);

    const body = await c.req.json<{ documentIds: string[] }>();
    if (!body.documentIds?.length) return c.json({ error: "documentIds is required" }, 400);

    const docs = await prisma.document.findMany({
      where: { id: { in: body.documentIds }, organizationId: orgId },
    });

    const added: string[] = [];
    for (const doc of docs) {
      const existingLink = await prisma.legalHoldDocument.findFirst({
        where: { holdId: id, documentId: doc.id, removedAt: null },
      });

      if (!existingLink) {
        await prisma.legalHoldDocument.create({
          data: {
            holdId: id,
            documentId: doc.id,
            organizationId: orgId,
            addedBy: userId,
          },
        });

        await prisma.document.update({
          where: { id: doc.id },
          data: { legalHold: true, legalHoldRecordId: id },
        });

        added.push(doc.id);
      }
    }

    return c.json({ added });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.delete("/legal-holds/:id/documents/:docId", async (c) => {
  try {
    const perm = await assertPermission(c, "compliance.manage");
    if (perm) return perm;
    const orgId = c.get("orgId");
    const userId = c.get("userId");
    const { id, docId } = c.req.param();

    const hold = await prisma.legalHoldRecord.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!hold) return c.json({ error: "Legal hold not found" }, 404);

    const link = await prisma.legalHoldDocument.findFirst({
      where: { holdId: id, documentId: docId, removedAt: null },
    });
    if (!link) return c.json({ error: "Document not linked to this hold" }, 404);

    await prisma.legalHoldDocument.update({
      where: { id: link.id },
      data: { removedBy: userId, removedAt: new Date() },
    });

    await prisma.document.update({
      where: { id: docId },
      data: { legalHold: false, legalHoldRecordId: null },
    });

    return c.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// ============================================
// RETENTION RULE CANDIDATES
// ============================================

compliance.get("/retention-candidates", async (c) => {
  try {
    const orgId = c.get("orgId");
    const candidates = await prisma.retentionRuleCandidate.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      include: {
        legalReference: { select: { id: true, referenceNumber: true, title: true } },
      },
    });

    return c.json({ candidates });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.post("/retention-candidates/:id/approve", async (c) => {
  try {
    const perm = await assertPermission(c, "compliance.manage");
    if (perm) return perm;
    const orgId = c.get("orgId");
    const userId = c.get("userId");
    const { id } = c.req.param();

    const candidate = await prisma.retentionRuleCandidate.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!candidate) return c.json({ error: "Candidate not found" }, 404);
    if (candidate.status === "APPROVED") return c.json({ error: "Already approved" }, 400);

    await prisma.retentionRuleCandidate.update({
      where: { id },
      data: { status: "APPROVED", approvedBy: userId, approvedAt: new Date() },
    });

    const retentionYears = candidate.retentionUnit === "permanent"
      ? 999
      : candidate.retentionUnit === "months"
        ? Math.ceil((candidate.retentionPeriod || 12) / 12)
        : candidate.retentionUnit === "days"
          ? Math.ceil((candidate.retentionPeriod || 365) / 365)
          : candidate.retentionPeriod || 1;

    const policy = await prisma.retentionPolicy.create({
      data: {
        organizationId: orgId,
        name: `Retention: ${candidate.documentType || "general"} - ${retentionYears}y`,
        documentType: candidate.documentType,
        retentionYears,
        retentionUnit: candidate.retentionUnit,
        triggerEvent: candidate.triggerEvent,
        legalReferenceId: candidate.legalReferenceId,
        articleId: candidate.articleId,
        dispositionAction: candidate.dispositionAction || "review",
        reviewRequired: candidate.dispositionAction === "review",
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: orgId,
        userId,
        action: "RETENTION_CANDIDATE_APPROVED",
        entityType: "RetentionRuleCandidate",
        resourceId: id,
        resourceName: candidate.documentType || "candidate",
        metadata: { policyId: policy.id, retentionYears },
      },
    });

    return c.json({ candidate: await prisma.retentionRuleCandidate.findUnique({ where: { id } }), policy });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

compliance.post("/retention-candidates/:id/reject", async (c) => {
  try {
    const perm = await assertPermission(c, "compliance.manage");
    if (perm) return perm;
    const orgId = c.get("orgId");
    const userId = c.get("userId");
    const { id } = c.req.param();

    const candidate = await prisma.retentionRuleCandidate.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!candidate) return c.json({ error: "Candidate not found" }, 404);
    if (candidate.status === "REJECTED") return c.json({ error: "Already rejected" }, 400);

    await prisma.retentionRuleCandidate.update({
      where: { id },
      data: { status: "REJECTED" },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: orgId,
        userId,
        action: "RETENTION_CANDIDATE_REJECTED",
        entityType: "RetentionRuleCandidate",
        resourceId: id,
        resourceName: candidate.documentType || "candidate",
      },
    });

    return c.json({ candidate: await prisma.retentionRuleCandidate.findUnique({ where: { id } }) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// ============================================
// COMPLIANCE DASHBOARD STATS
// ============================================

compliance.get("/dashboard", async (c) => {
  try {
    const orgId = c.get("orgId");

    const [
      totalLegalReferences,
      verifiedLegalReferences,
      unverifiedLegalReferences,
      totalArticles,
      activeLegalHolds,
      totalComplianceRequirements,
      expiringDocuments,
      pendingDisposals,
      recentSearches,
    ] = await Promise.all([
      prisma.legalReference.count({
        where: { OR: [{ organizationId: orgId }, { organizationId: null }] },
      }),
      prisma.legalReference.count({
        where: { OR: [{ organizationId: orgId }, { organizationId: null }], status: "ACTIVE" },
      }),
      prisma.legalReference.count({
        where: { OR: [{ organizationId: orgId }, { organizationId: null }], status: "UNVERIFIED" },
      }),
      prisma.legalArticle.count({
        where: {
          legalReference: { OR: [{ organizationId: orgId }, { organizationId: null }] },
        },
      }),
      prisma.legalHoldRecord.count({
        where: { organizationId: orgId, status: "ACTIVE" },
      }),
      prisma.complianceRequirement.count(),
      prisma.document.count({
        where: {
          organizationId: orgId,
          deletedAt: null,
          expiresAt: { not: null, lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.disposalRequest.count({
        where: { organizationId: orgId, status: "pending" },
      }),
      prisma.legalSearchHistory.count({
        where: { organizationId: orgId },
      }),
    ]);

    const frameworkScores: Array<{ name: string; score: number; status: string }> = [];
    let overallScore = 0;

    try {
      const report = await generateComplianceReport(prisma, orgId);
      overallScore = report.overallScore;
      for (const fw of report.frameworks) {
        frameworkScores.push({ name: fw.name, score: fw.score, status: fw.status });
      }
    } catch {
      const frameworks = await prisma.complianceFramework.findMany({ where: { status: "active" } });
      for (const fw of frameworks) {
        const latest = await prisma.complianceAssessment.findFirst({
          where: { frameworkId: fw.id, organizationId: orgId },
          orderBy: { assessedAt: "desc" },
        });
        frameworkScores.push({
          name: fw.name,
          score: latest?.score ?? 0,
          status: latest?.overallStatus ?? "NOT_ASSESSED",
        });
      }
      if (frameworkScores.length > 0) {
        overallScore = Math.round(
          (frameworkScores.reduce((s, f) => s + f.score, 0) / frameworkScores.length) * 100
        ) / 100;
      }
    }

    const domainCounts: Record<string, number> = {};
    try {
      const refs = await prisma.legalReference.findMany({
        where: { OR: [{ organizationId: orgId }, { organizationId: null }] },
        select: { domain: true },
      });
      for (const r of refs) {
        domainCounts[r.domain] = (domainCounts[r.domain] || 0) + 1;
      }
    } catch {}

    return c.json({
      totalLegalReferences,
      verifiedLegalReferences,
      unverifiedLegalReferences,
      totalArticles,
      activeLegalHolds,
      totalComplianceRequirements,
      overallScore,
      frameworkScores,
      expiringDocuments,
      pendingDisposals,
      recentSearches,
      domainCounts,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

export default compliance;
