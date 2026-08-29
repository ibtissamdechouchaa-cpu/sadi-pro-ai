import { PrismaClient } from "@prisma/client";

export interface LegalSearchResult {
  referenceNumber: string;
  titleAr: string;
  titleFr: string;
  titleEn: string;
  type: string;
  jurisdiction: string;
  issuingAuthority: string;
  publicationDate: string | null;
  officialSource: string;
  sourceUrl: string;
  status: string;
  summaryAr: string;
  keywords: string[];
  domain: string;
  relevanceScore: number;
  confidence: number;
  articles: Array<{
    articleNumber: string;
    title: string;
    textAr: string;
    obligations: string[];
    prohibitions: string[];
    permissions: string[];
  }>;
  relatedTexts: Array<{ referenceNumber: string; relationType: string }>;
}

export async function searchLegalKnowledgeBase(
  prisma: PrismaClient,
  query: string,
  options: {
    domain?: string;
    jurisdiction?: string;
    status?: string;
    type?: string;
    limit?: number;
  } = {}
): Promise<LegalSearchResult[]> {
  const limit = options.limit || 20;
  const queryLower = query.toLowerCase();

  const where: Record<string, unknown> = {};

  if (options.domain) {
    where.domain = options.domain;
  }
  if (options.jurisdiction) {
    where.jurisdiction = options.jurisdiction;
  }
  if (options.status) {
    where.status = options.status;
  }
  if (options.type) {
    where.referenceType = options.type;
  }

  const references = await prisma.legalReference.findMany({
    where: where as never,
    include: {
      articles: true,
      outgoingRelations: {
        include: {
          targetReference: {
            select: {
              referenceNumber: true,
            },
          },
        },
      },
      incomingRelations: {
        include: {
          sourceReference: {
            select: {
              referenceNumber: true,
            },
          },
        },
      },
    },
  });

  const scored: Array<LegalSearchResult & { rawScore: number }> = [];

  for (const ref of references) {
    let score = 0;
    let confidence = 0.5;

    if (ref.referenceNumber.toLowerCase() === queryLower) {
      score += 50;
      confidence = 0.95;
    } else if (ref.referenceNumber.toLowerCase().includes(queryLower)) {
      score += 40;
      confidence = 0.85;
    }

    const titleLower = (ref.title || "").toLowerCase();
    const titleArLower = (ref.titleAr || "").toLowerCase();
    if (titleLower.includes(queryLower)) {
      score += 30;
      confidence = Math.max(confidence, 0.8);
    }
    if (titleArLower.includes(queryLower)) {
      score += 30;
      confidence = Math.max(confidence, 0.8);
    }

    const keywordMatches = ref.keywords.filter((kw) =>
      kw.toLowerCase().includes(queryLower)
    ).length;
    if (keywordMatches > 0) {
      score += Math.min(keywordMatches * 20, 30);
      confidence = Math.max(confidence, 0.7);
    }

    const subjectLower = (ref.subject || "").toLowerCase();
    if (subjectLower.includes(queryLower)) {
      score += 10;
      confidence = Math.max(confidence, 0.65);
    }

    const summaryLower = (ref.summaryAr || "").toLowerCase();
    if (summaryLower.includes(queryLower)) {
      score += 10;
      confidence = Math.max(confidence, 0.6);
    }

    if (ref.officialSource) {
      score += 10;
      confidence = Math.max(confidence, 0.6);
    }

    if (ref.status === "ACTIVE") {
      score += 5;
    } else if (ref.status === "REPEALED" || ref.status === "SUPERSEDED") {
      score -= 10;
    }

    for (const article of ref.articles) {
      const articleText = (
        (article.textAr || "") +
        " " +
        (article.fullText || "")
      ).toLowerCase();
      if (articleText.includes(queryLower)) {
        score += 5;
        confidence = Math.max(confidence, 0.55);
      }
    }

    if (score === 0) {
      const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 2);
      const allText = [
        ref.referenceNumber,
        ref.title || "",
        ref.titleAr || "",
        ref.titleFr || "",
        ref.subject || "",
        ref.summaryAr || "",
        ...ref.keywords,
      ]
        .join(" ")
        .toLowerCase();
      for (const word of queryWords) {
        if (allText.includes(word)) {
          score += 5;
        }
      }
      if (score > 0) {
        confidence = 0.4;
      }
    }

    if (score > 0) {
      const relatedTexts: Array<{
        referenceNumber: string;
        relationType: string;
      }> = [];

      for (const rel of ref.outgoingRelations) {
        if (rel.targetReference) {
          relatedTexts.push({
            referenceNumber: rel.targetReference.referenceNumber,
            relationType: rel.relationType,
          });
        }
      }
      for (const rel of ref.incomingRelations) {
        if (rel.sourceReference) {
          relatedTexts.push({
            referenceNumber: rel.sourceReference.referenceNumber,
            relationType: rel.relationType,
          });
        }
      }

      scored.push({
        referenceNumber: ref.referenceNumber,
        titleAr: ref.titleAr || "",
        titleFr: ref.titleFr || "",
        titleEn: ref.titleEn || ref.title || "",
        type: ref.referenceType,
        jurisdiction: ref.jurisdiction || "Algeria",
        issuingAuthority: ref.issuingAuthority || "",
        publicationDate: ref.publicationDate?.toISOString() ?? null,
        officialSource: ref.officialSource || "",
        sourceUrl: ref.sourceUrl || "",
        status: ref.status,
        summaryAr: ref.summaryAr || "",
        keywords: ref.keywords,
        domain: ref.domain,
        relevanceScore: score,
        confidence: Math.min(confidence, 1),
        articles: ref.articles.map((a) => ({
          articleNumber: a.articleNumber,
          title: a.title || "",
          textAr: a.textAr || "",
          obligations: a.obligations,
          prohibitions: a.prohibitions,
          permissions: a.permissions,
        })),
        relatedTexts,
        rawScore: score,
      });
    }
  }

  scored.sort((a, b) => b.rawScore - a.rawScore);

  return scored.slice(0, limit);
}

export async function verifyLegalSource(
  prisma: PrismaClient,
  referenceId: string
): Promise<{
  verified: boolean;
  officialSource: string | null;
  sourceUrl: string | null;
  status: string;
  confidence: number;
}> {
  const reference = await prisma.legalReference.findUnique({
    where: { id: referenceId },
  });

  if (!reference) {
    return {
      verified: false,
      officialSource: null,
      sourceUrl: null,
      status: "NOT_FOUND",
      confidence: 0,
    };
  }

  let confidence = 0;
  let verified = false;

  if (reference.officialSource) {
    confidence += 0.4;
    const officialSources = [
      "journal officiel",
      "official journal",
      "official gazette",
      "JORADP",
      "legislation.dz",
      "assemblee-nationale.dz",
      "ccs.dz",
      "bofip",
    ];
    const srcLower = reference.officialSource.toLowerCase();
    for (const os of officialSources) {
      if (srcLower.includes(os.toLowerCase())) {
        confidence += 0.3;
        break;
      }
    }
  }

  if (reference.sourceUrl) {
    confidence += 0.2;
    const urlLower = reference.sourceUrl.toLowerCase();
    if (
      urlLower.includes("gov.dz") ||
      urlLower.includes("org.dz") ||
      urlLower.includes("立法")
    ) {
      confidence += 0.1;
    }
  }

  if (reference.status === "ACTIVE") {
    confidence += 0.1;
  }

  verified = confidence >= 0.5;

  return {
    verified,
    officialSource: reference.officialSource || null,
    sourceUrl: reference.sourceUrl || null,
    status: reference.status,
    confidence: Math.min(confidence, 1),
  };
}

export async function importLegalReference(
  prisma: PrismaClient,
  data: {
    referenceNumber: string;
    titleAr?: string;
    titleFr?: string;
    titleEn?: string;
    referenceType: string;
    jurisdiction?: string;
    issuingAuthority?: string;
    publicationDate?: Date;
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
  },
  organizationId: string,
  userId?: string
): Promise<{ id: string; isDuplicate: boolean }> {
  const existing = await prisma.legalReference.findFirst({
    where: {
      referenceNumber: data.referenceNumber,
      referenceType: data.referenceType,
    },
  });

  if (existing) {
    return { id: existing.id, isDuplicate: true };
  }

  const reference = await prisma.legalReference.create({
    data: {
      referenceNumber: data.referenceNumber,
      referenceType: data.referenceType,
      title: data.titleEn || data.titleFr || data.titleAr || data.referenceNumber,
      titleAr: data.titleAr,
      titleFr: data.titleFr,
      titleEn: data.titleEn,
      jurisdiction: data.jurisdiction || "Algeria",
      issuingAuthority: data.issuingAuthority,
      publicationDate: data.publicationDate,
      officialGazetteNumber: data.officialGazetteNumber,
      officialSource: data.officialSource,
      sourceUrl: data.sourceUrl,
      fullText: data.fullText,
      keywords: data.keywords || [],
      domain: data.domain || "OTHER",
      organizationId,
      status: "UNVERIFIED",
    },
  });

  if (data.articles && data.articles.length > 0) {
    await prisma.legalArticle.createMany({
      data: data.articles.map((article) => ({
        legalReferenceId: reference.id,
        articleNumber: article.articleNumber,
        title: article.title,
        textAr: article.textAr,
        textFr: article.textFr,
        obligations: article.obligations || [],
        prohibitions: article.prohibitions || [],
        permissions: article.permissions || [],
      })),
    });
  }

  await prisma.legalReferenceVersion.create({
    data: {
      legalReferenceId: reference.id,
      version: 1,
      fullText: data.fullText,
      sourceUrl: data.sourceUrl,
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId,
      userId,
      action: "LEGAL_REFERENCE_IMPORTED",
      entityType: "LegalReference",
      resourceId: reference.id,
      resourceName: data.referenceNumber,
      metadata: {
        referenceType: data.referenceType,
        domain: data.domain,
        articleCount: data.articles?.length || 0,
      },
    },
  });

  return { id: reference.id, isDuplicate: false };
}

export async function detectLegalRelations(
  prisma: PrismaClient,
  referenceId: string
): Promise<
  Array<{
    targetReferenceId: string;
    relationType: string;
    confidence: number;
    description: string;
  }>
> {
  const reference = await prisma.legalReference.findUnique({
    where: { id: referenceId },
    select: {
      id: true,
      referenceNumber: true,
      fullText: true,
      title: true,
      titleAr: true,
    },
  });

  if (!reference) {
    return [];
  }

  const allReferences = await prisma.legalReference.findMany({
    where: {
      id: { not: referenceId },
    },
    select: {
      id: true,
      referenceNumber: true,
      title: true,
      titleAr: true,
    },
  });

  const detectedRelations: Array<{
    targetReferenceId: string;
    relationType: string;
    confidence: number;
    description: string;
  }> = [];

  const textToSearch = [
    reference.fullText || "",
    reference.title || "",
    reference.titleAr || "",
  ].join(" ");

  const relationPatterns: Array<{
    pattern: RegExp;
    type: string;
    confidence: number;
    description: string;
  }> = [
    {
      pattern: /amende(?:ment|s)?\s+(?:la|les|du|de|au)\s+/gi,
      type: "AMENDS",
      confidence: 0.7,
      description: "Reference amends another text",
    },
    {
      pattern: /modifi(?:e|é|er)\s+par/gi,
      type: "AMENDED_BY",
      confidence: 0.7,
      description: "Reference is amended by another text",
    },
    {
      pattern: /abroge(?:ment|s)?\s+(?:la|les|du|de|au)\s+/gi,
      type: "REPEALS",
      confidence: 0.7,
      description: "Reference repeals another text",
    },
    {
      pattern: /abro(?:gée?|gé|ger)\s+par/gi,
      type: "REPEALED_BY",
      confidence: 0.7,
      description: "Reference is repealed by another text",
    },
    {
      pattern: /applique(?:\s+les?\s+dispositions)?\s+(?:de|du|la|les)\s+/gi,
      type: "IMPLEMENTS",
      confidence: 0.6,
      description: "Reference implements provisions of another text",
    },
    {
      pattern: /en\s+conformité?\s+(?:avec|de|du)\s+/gi,
      type: "IMPLEMENTS",
      confidence: 0.5,
      description: "Reference is in conformity with another text",
    },
    {
      pattern: /en\s+vigueur?\s+(?:de|du|la)\s+/gi,
      type: "RELATED_TO",
      confidence: 0.4,
      description: "Reference relates to another text",
    },
    {
      pattern: /substitue\s+(?:à|aux|au)\s+/gi,
      type: "SUPERSEDES",
      confidence: 0.65,
      description: "Reference supersedes another text",
    },
    {
      pattern: /rempla(?:ce|çant|cer)\s+(?:la|les|le|l')/gi,
      type: "SUPERSEDES",
      confidence: 0.65,
      description: "Reference replaces another text",
    },
    {
      pattern: /en\s+vigueur?\s+/gi,
      type: "RELATED_TO",
      confidence: 0.3,
      description: "Reference mentions enforcement of another text",
    },
  ];

  const existingRelations = await prisma.legalRelation.findMany({
    where: {
      sourceReferenceId: referenceId,
    },
    select: {
      targetReferenceId: true,
    },
  });
  const existingTargetIds = new Set(
    existingRelations.map((r) => r.targetReferenceId)
  );

  for (const targetRef of allReferences) {
    if (existingTargetIds.has(targetRef.id)) {
      continue;
    }

    const targetPatterns = [
      targetRef.referenceNumber,
      targetRef.title || "",
      targetRef.titleAr || "",
    ];

    let bestMatch: {
      type: string;
      confidence: number;
      description: string;
    } | null = null;

    for (const tp of relationPatterns) {
      const matches = textToSearch.match(tp.pattern);
      if (matches) {
        for (const targetText of targetPatterns) {
          if (
            targetText &&
            textToSearch.toLowerCase().includes(targetText.toLowerCase())
          ) {
            if (!bestMatch || tp.confidence > bestMatch.confidence) {
              bestMatch = {
                type: tp.type,
                confidence: tp.confidence,
                description: tp.description,
              };
            }
          }
        }
      }
    }

    if (bestMatch) {
      detectedRelations.push({
        targetReferenceId: targetRef.id,
        relationType: bestMatch.type,
        confidence: bestMatch.confidence,
        description: `${reference.referenceNumber} ${bestMatch.description} ${targetRef.referenceNumber}`,
      });
    }
  }

  for (const relation of detectedRelations) {
    await prisma.legalRelation.create({
      data: {
        sourceReferenceId: referenceId,
        targetReferenceId: relation.targetReferenceId,
        relationType: relation.relationType,
        confidence: relation.confidence,
        description: relation.description,
      },
    });
  }

  return detectedRelations;
}

export async function extractRetentionRules(
  prisma: PrismaClient,
  legalReferenceId: string
): Promise<
  Array<{
    documentType: string;
    retentionPeriod: number;
    retentionUnit: string;
    triggerEvent: string;
    dispositionAction: string;
    confidence: number;
    evidenceText: string;
    sourcePage: number | null;
  }>
> {
  const reference = await prisma.legalReference.findUnique({
    where: { id: legalReferenceId },
    select: {
      id: true,
      fullText: true,
      title: true,
    },
  });

  if (!reference || !reference.fullText) {
    return [];
  }

  const fullText = reference.fullText;
  const results: Array<{
    documentType: string;
    retentionPeriod: number;
    retentionUnit: string;
    triggerEvent: string;
    dispositionAction: string;
    confidence: number;
    evidenceText: string;
    sourcePage: number | null;
  }> = [];

  const retentionPatterns: Array<{
    pattern: RegExp;
    documentType: string;
    defaultYears: number;
    unit: string;
    confidence: number;
    disposition: string;
  }> = [
    {
      pattern:
        /(?:durée?\s+de\s+conservation|délai\s+de\s+prescription)\s*[:\-]?\s*(\d+)\s*(ans?|années?|mois|jours?)/gi,
      documentType: "general",
      defaultYears: 10,
      unit: "years",
      confidence: 0.7,
      disposition: "review",
    },
    {
      pattern:
        /(?:conserver?|conservation)\s+(?:pendant|durant|pour)\s+(\d+)\s*(ans?|années?|mois|jours?)/gi,
      documentType: "general",
      defaultYears: 10,
      unit: "years",
      confidence: 0.65,
      disposition: "review",
    },
    {
      pattern:
        /(?:archives?\s+(?:courantes?|intermédiaires?|définitives?))\s*[:\-]?\s*(\d+)\s*(ans?|années?)/gi,
      documentType: "archive",
      defaultYears: 30,
      unit: "years",
      confidence: 0.75,
      disposition: "transfer",
    },
    {
      pattern:
        /(?:prescription\s+(?:civile?|commerciale?|pénale?|fiscale?))\s*[:\-]?\s*(\d+)\s*(ans?|années?)/gi,
      documentType: "legal",
      defaultYears: 10,
      unit: "years",
      confidence: 0.8,
      disposition: "disposal",
    },
    {
      pattern:
        /(?:délai\s+de\s+conservation\s+(?:des?\s+)?(?:documents?\s+)?(?:comptables?|financiers?|fiscaux?))\s*[:\-]?\s*(\d+)\s*(ans?|années?)/gi,
      documentType: "financial",
      defaultYears: 10,
      unit: "years",
      confidence: 0.8,
      disposition: "disposal",
    },
    {
      pattern:
        /(?:dossier\s+(?:du\s+)?personnel)\s*[:\-]?\s*(\d+)\s*(ans?|années?)\s*(?:après\s+)?(?:le\s+)?(?:départ|fin|cessation)/gi,
      documentType: "hr",
      defaultYears: 5,
      unit: "years",
      confidence: 0.75,
      disposition: "disposal",
    },
    {
      pattern:
        /(?:conservation\s+permanente|valeur\s+historique|patrimoine\s+culturel)/gi,
      documentType: "heritage",
      defaultYears: 999,
      unit: "permanent",
      confidence: 0.85,
      disposition: "permanent_archive",
    },
    {
      pattern:
        /(?:actes?\s+(?:d'état\s+civil|notariés?))\s*[:\-]?\s*(\d+)\s*(ans?|années?)/gi,
      documentType: "civil_status",
      defaultYears: 50,
      unit: "years",
      confidence: 0.8,
      disposition: "permanent_archive",
    },
  ];

  const unitMap: Record<string, string> = {
    an: "years",
    ans: "years",
    année: "years",
    années: "years",
    mois: "months",
    jour: "days",
    jours: "days",
  };

  for (const patternDef of retentionPatterns) {
    let match;
    const regex = new RegExp(patternDef.pattern.source, patternDef.pattern.flags);
    while ((match = regex.exec(fullText)) !== null) {
      const periodStr = match[1];
      const unitStr = match[2].toLowerCase();
      const period = parseInt(periodStr, 10);
      const unit = unitMap[unitStr] || "years";
      const confidence = patternDef.confidence;

      const contextStart = Math.max(0, match.index - 100);
      const contextEnd = Math.min(fullText.length, match.index + match[0].length + 100);
      const evidenceText = fullText.slice(contextStart, contextEnd).trim();

      const sourcePage = Math.floor(match.index / 3000) + 1;

      results.push({
        documentType: patternDef.documentType,
        retentionPeriod: period || patternDef.defaultYears,
        retentionUnit: unit,
        triggerEvent: "end_of_retention_period",
        dispositionAction: patternDef.disposition,
        confidence,
        evidenceText,
        sourcePage,
      });
    }
  }

  const articles = await prisma.legalArticle.findMany({
    where: { legalReferenceId },
    select: {
      articleNumber: true,
      fullText: true,
      textAr: true,
      retentionRequirements: true,
    },
  });

  for (const article of articles) {
    const articleText = [article.fullText || "", article.textAr || ""].join(" ");
    if (article.retentionRequirements.length > 0) {
      for (const req of article.retentionRequirements) {
        const periodMatch = req.match(/(\d+)\s*(ans?|années?|mois|jours?)/i);
        if (periodMatch) {
          const period = parseInt(periodMatch[1], 10);
          const unit = unitMap[periodMatch[2].toLowerCase()] || "years";
          results.push({
            documentType: "from_article",
            retentionPeriod: period,
            retentionUnit: unit,
            triggerEvent: "article_requirement",
            dispositionAction: "review",
            confidence: 0.8,
            evidenceText: req,
            sourcePage: null,
          });
        }
      }
    }

    const artRetPattern =
      /(?:conserver?|conservation|durée?\s+de\s+conservation)\s*[:\-]?\s*(\d+)\s*(ans?|années?|mois|jours?)/gi;
    let artMatch;
    while ((artMatch = artRetPattern.exec(articleText)) !== null) {
      const period = parseInt(artMatch[1], 10);
      const unit = unitMap[artMatch[2].toLowerCase()] || "years";
      const contextStart = Math.max(0, artMatch.index - 80);
      const contextEnd = Math.min(
        articleText.length,
        artMatch.index + artMatch[0].length + 80
      );
      results.push({
        documentType: "article_based",
        retentionPeriod: period,
        retentionUnit: unit,
        triggerEvent: "article_provision",
        dispositionAction: "review",
        confidence: 0.7,
        evidenceText: articleText.slice(contextStart, contextEnd).trim(),
        sourcePage: null,
      });
    }
  }

  const seen = new Set<string>();
  const uniqueResults = results.filter((r) => {
    const key = `${r.documentType}-${r.retentionPeriod}-${r.retentionUnit}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  for (const result of uniqueResults) {
    await prisma.retentionRuleCandidate.create({
      data: {
        organizationId: "",
        legalReferenceId,
        documentType: result.documentType,
        retentionPeriod: result.retentionPeriod,
        retentionUnit: result.retentionUnit,
        triggerEvent: result.triggerEvent,
        dispositionAction: result.dispositionAction,
        confidence: result.confidence,
        evidenceText: result.evidenceText,
        sourcePage: result.sourcePage,
      },
    });
  }

  return uniqueResults;
}

export async function getLegalResearchStats(
  prisma: PrismaClient,
  organizationId?: string
): Promise<{
  totalReferences: number;
  verifiedReferences: number;
  unverifiedReferences: number;
  totalArticles: number;
  totalRelations: number;
  domainCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  typeCounts: Record<string, number>;
  recentUpdates: number;
}> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const refWhere: Record<string, unknown> = {};
  if (organizationId) {
    refWhere.OR = [
      { organizationId },
      { isGlobal: true },
    ];
  }

  const [
    totalReferences,
    verifiedReferences,
    unverifiedReferences,
    totalArticles,
    totalRelations,
    allRefs,
    recentUpdates,
  ] = await Promise.all([
    prisma.legalReference.count({ where: refWhere as never }),
    prisma.legalReference.count({
      where: { ...refWhere, status: "ACTIVE" } as never,
    }),
    prisma.legalReference.count({
      where: { ...refWhere, status: "UNVERIFIED" } as never,
    }),
    prisma.legalArticle.count({
      where: {
        legalReference: refWhere as never,
      },
    }),
    prisma.legalRelation.count({
      where: {
        sourceReference: refWhere as never,
      },
    }),
    prisma.legalReference.findMany({
      where: refWhere as never,
      select: {
        domain: true,
        status: true,
        referenceType: true,
        updatedAt: true,
      },
    }),
    prisma.legalReference.count({
      where: {
        ...refWhere,
        updatedAt: { gte: thirtyDaysAgo },
      } as never,
    }),
  ]);

  const domainCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};

  for (const ref of allRefs) {
    domainCounts[ref.domain] = (domainCounts[ref.domain] || 0) + 1;
    statusCounts[ref.status] = (statusCounts[ref.status] || 0) + 1;
    typeCounts[ref.referenceType] =
      (typeCounts[ref.referenceType] || 0) + 1;
  }

  return {
    totalReferences,
    verifiedReferences,
    unverifiedReferences,
    totalArticles,
    totalRelations,
    domainCounts,
    statusCounts,
    typeCounts,
    recentUpdates,
  };
}

export async function saveSearchHistory(
  prisma: PrismaClient,
  userId: string | undefined,
  organizationId: string,
  query: string,
  filters: Record<string, unknown>,
  resultsCount: number,
  searchedSources: string[]
): Promise<void> {
  await prisma.legalSearchHistory.create({
    data: {
      userId,
      organizationId,
      query,
      filters: filters as never,
      resultsCount,
      searchedSources,
    },
  });
}

export async function getSearchHistory(
  prisma: PrismaClient,
  organizationId: string,
  userId?: string,
  limit: number = 20
): Promise<
  Array<{
    query: string;
    resultsCount: number;
    timestamp: Date;
  }>
> {
  const where: Record<string, unknown> = { organizationId };
  if (userId) {
    where.userId = userId;
  }

  const history = await prisma.legalSearchHistory.findMany({
    where: where as never,
    orderBy: { timestamp: "desc" },
    take: limit,
    select: {
      query: true,
      resultsCount: true,
      timestamp: true,
    },
  });

  return history;
}
