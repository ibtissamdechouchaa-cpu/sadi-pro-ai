import { PrismaClient } from "@prisma/client";
import { analyzeDocument } from "./ai.js";

export async function calculateComplianceScore(
  prisma: PrismaClient,
  frameworkId: string,
  organizationId: string
): Promise<{
  overallStatus: string;
  score: number;
  totalRequirements: number;
  compliantCount: number;
  partialCount: number;
  nonCompliantCount: number;
  unassessedCount: number;
  notApplicableCount: number;
  criticalGaps: number;
}> {
  const requirements = await prisma.complianceRequirement.findMany({
    where: { frameworkId },
    include: {
      evidence: {
        where: { organizationId },
      },
    },
  });

  let compliantCount = 0;
  let partialCount = 0;
  let nonCompliantCount = 0;
  let unassessedCount = 0;
  let notApplicableCount = 0;
  let criticalGaps = 0;

  for (const req of requirements) {
    if (req.evidence.length === 0) {
      unassessedCount++;
      if (req.severity === "CRITICAL") {
        criticalGaps++;
      }
      continue;
    }

    const statuses = req.evidence.map((e) => e.status);

    if (statuses.includes("NOT_APPLICABLE")) {
      notApplicableCount++;
      continue;
    }

    if (statuses.includes("SUPPORTED")) {
      compliantCount++;
      continue;
    }

    if (statuses.includes("CONTRADICTED")) {
      nonCompliantCount++;
      if (req.severity === "CRITICAL") {
        criticalGaps++;
      }
      continue;
    }

    if (statuses.includes("PARTIAL")) {
      partialCount++;
      if (req.severity === "CRITICAL") {
        criticalGaps++;
      }
      continue;
    }

    unassessedCount++;
    if (req.severity === "CRITICAL") {
      criticalGaps++;
    }
  }

  const totalRequirements = requirements.length;
  const scorableTotal = totalRequirements - notApplicableCount;
  const score =
    scorableTotal > 0
      ? Math.round(((compliantCount * 1 + partialCount * 0.5) / scorableTotal) * 10000) / 100
      : 0;

  let overallStatus = "NOT_ASSESSED";
  if (score >= 90) overallStatus = "COMPLIANT";
  else if (score >= 50) overallStatus = "PARTIALLY_COMPLIANT";
  else if (scorableTotal > 0) overallStatus = "NON_COMPLIANT";

  await prisma.complianceAssessment.create({
    data: {
      frameworkId,
      organizationId,
      overallStatus,
      score,
      totalRequirements,
      compliantCount,
      partialCount,
      nonCompliantCount,
      unassessedCount,
      notApplicableCount,
      criticalGaps,
    },
  });

  return {
    overallStatus,
    score,
    totalRequirements,
    compliantCount,
    partialCount,
    nonCompliantCount,
    unassessedCount,
    notApplicableCount,
    criticalGaps,
  };
}

export async function analyzeDocumentCompliance(
  prisma: PrismaClient,
  documentId: string,
  organizationId: string
): Promise<{
  documentType: string;
  detectedPersonalData: string[];
  possibleLegalReferences: Array<{
    referenceNumber: string;
    title: string;
    confidence: number;
  }>;
  retentionCandidates: Array<{
    documentType: string;
    retentionYears: number;
    confidence: number;
    legalBasis: string;
  }>;
  complianceRequirements: Array<{
    code: string;
    title: string;
    status: string;
    confidence: number;
  }>;
  confidence: number;
  requiresHumanReview: boolean;
}> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  const meta = document.metadata as Record<string, unknown>;
  const extractedText =
    (meta?.extractedText as string) ||
    (meta?.ocrText as string) ||
    document.description ||
    document.title;

  const aiResult = await analyzeDocument(document.title, extractedText);

  const detectedPersonalData: string[] = [];
  const personalDataKeywords = [
    "nom",
    "prénom",
    "date de naissance",
    "adresse",
    "email",
    "téléphone",
    "numéro de sécurité sociale",
    "CIN",
    "passport",
    "اسم",
    "تاريخ الميلاد",
    "العنوان",
    "رقم الهاتف",
    "البطاقة التعريفية",
  ];
  const lowerText = extractedText.toLowerCase();
  for (const kw of personalDataKeywords) {
    if (lowerText.includes(kw.toLowerCase())) {
      detectedPersonalData.push(kw);
    }
  }

  const activeLegalRefs = await prisma.legalReference.findMany({
    where: {
      OR: [
        { status: "ACTIVE" },
        { status: "PARTIALLY_AMENDED" },
      ],
    },
    select: {
      referenceNumber: true,
      title: true,
      titleAr: true,
      keywords: true,
      domain: true,
    },
  });

  const possibleLegalReferences: Array<{
    referenceNumber: string;
    title: string;
    confidence: number;
  }> = [];

  for (const ref of activeLegalRefs) {
    let confidence = 0;
    const refTitle = (ref.title || "").toLowerCase();
    const refTitleAr = (ref.titleAr || "").toLowerCase();

    if (aiResult.suggestedTags?.some((tag) => refTitle.includes(tag.toLowerCase()))) {
      confidence += 0.3;
    }
    if (aiResult.suggestedTags?.some((tag) => refTitleAr.includes(tag.toLowerCase()))) {
      confidence += 0.3;
    }
    if (ref.keywords.some((kw) => lowerText.includes(kw.toLowerCase()))) {
      confidence += 0.2;
    }
    if (
      aiResult.documentType === "legal" ||
      aiResult.documentType === "policy"
    ) {
      confidence += 0.1;
    }

    if (confidence > 0.2) {
      possibleLegalReferences.push({
        referenceNumber: ref.referenceNumber,
        title: ref.title,
        confidence: Math.min(confidence, 1),
      });
    }
  }

  possibleLegalReferences.sort((a, b) => b.confidence - a.confidence);

  const retentionCandidates: Array<{
    documentType: string;
    retentionYears: number;
    confidence: number;
    legalBasis: string;
  }> = [];

  const docType = aiResult.documentType || "other";
  const retentionDefaults: Record<string, { years: number; basis: string }> = {
    contract: { years: 10, basis: "Obligation contractuelle - Article 157 du Code Civil" },
    invoice: { years: 10, basis: "Code General des Impots - Art. 38" },
    report: { years: 5, basis: "Reglement interne - Duree de conservation standard" },
    certificate: { years: 50, basis: "Loi sur les archives - Valeur historique" },
    legal: { years: 50, basis: "Loi 91-10 sur les archives - Valeur permanente" },
    hr: { years: 5, basis: "Code du travail - Duree minimale post-emploi" },
    financial: { years: 10, basis: "Code General des Impots - Obligation legale" },
    policy: { years: 10, basis: "Politique interne - Conservation reglementaire" },
    letter: { years: 5, basis: "Reglement interne - Correspondance" },
    other: { years: 5, basis: "Reglement interne - Conservation par defaut" },
  };

  const defaultRet = retentionDefaults[docType] || retentionDefaults["other"];
  retentionCandidates.push({
    documentType: docType,
    retentionYears: aiResult.retentionYearsSuggested || defaultRet.years,
    confidence: aiResult.confidence,
    legalBasis: defaultRet.basis,
  });

  const activeRequirements = await prisma.complianceRequirement.findMany({
    where: {
      framework: { status: "active" },
    },
    select: {
      code: true,
      title: true,
      description: true,
      evidenceType: true,
    },
  });

  const complianceRequirements: Array<{
    code: string;
    title: string;
    status: string;
    confidence: number;
  }> = [];

  for (const req of activeRequirements) {
    let confidence = 0;
    let status = "UNASSESSED";

    const reqDesc = (req.description || "").toLowerCase();
    if (
      req.evidenceType === "DOCUMENT" &&
      (docType === "contract" || docType === "certificate")
    ) {
      confidence += 0.3;
      status = "POTENTIALLY_APPLICABLE";
    }

    if (
      req.title.toLowerCase().includes(docType) ||
      reqDesc.includes(docType)
    ) {
      confidence += 0.4;
      status = "POTENTIALLY_APPLICABLE";
    }

    if (confidence > 0.3) {
      complianceRequirements.push({
        code: req.code,
        title: req.title,
        status,
        confidence: Math.min(confidence, 1),
      });
    }
  }

  const requiresHumanReview =
    detectedPersonalData.length > 0 ||
    aiResult.confidence < 0.6 ||
    (aiResult.risks && aiResult.risks.length > 0);

  return {
    documentType: docType,
    detectedPersonalData,
    possibleLegalReferences: possibleLegalReferences.slice(0, 10),
    retentionCandidates,
    complianceRequirements: complianceRequirements.slice(0, 20),
    confidence: aiResult.confidence,
    requiresHumanReview,
  };
}

export async function getGapAnalysis(
  prisma: PrismaClient,
  frameworkId: string,
  organizationId: string
): Promise<
  Array<{
    requirementId: string;
    code: string;
    title: string;
    severity: string;
    currentState: string;
    expectedState: string;
    gapDescription: string;
    risk: string;
    recommendation: string;
    priority: string;
    hasEvidence: boolean;
  }>
> {
  const requirements = await prisma.complianceRequirement.findMany({
    where: { frameworkId },
    include: {
      evidence: {
        where: { organizationId },
      },
      gaps: {
        where: { organizationId },
      },
    },
  });

  const gaps: Array<{
    requirementId: string;
    code: string;
    title: string;
    severity: string;
    currentState: string;
    expectedState: string;
    gapDescription: string;
    risk: string;
    recommendation: string;
    priority: string;
    hasEvidence: boolean;
  }> = [];

  for (const req of requirements) {
    const hasEvidence = req.evidence.length > 0;
    const existingGap = req.gaps[0];

    if (existingGap) {
      gaps.push({
        requirementId: req.id,
        code: req.code,
        title: req.title,
        severity: req.severity,
        currentState: existingGap.currentState || "Unknown",
        expectedState: existingGap.expectedState || "Full compliance",
        gapDescription: existingGap.gapDescription || "Gap identified",
        risk: existingGap.risk,
        recommendation: existingGap.recommendation || "Review and remediate",
        priority: existingGap.priority,
        hasEvidence,
      });
      continue;
    }

    let currentState = "UNASSESSED";
    let gapDescription = "";
    let risk = "MEDIUM";
    let priority = "MEDIUM";
    let recommendation = "";

    if (!hasEvidence) {
      currentState = "No evidence collected";
      gapDescription = `No compliance evidence has been provided for requirement ${req.code}. Documentation or system configuration proof is needed.`;
      risk = req.severity === "CRITICAL" ? "CRITICAL" : "HIGH";
      priority = req.severity === "CRITICAL" ? "CRITICAL" : "HIGH";
      recommendation = `Collect and submit evidence for requirement ${req.code}: ${req.title}. Consult implementation guidance for acceptable evidence types.`;
    } else {
      const statuses = req.evidence.map((e) => e.status);

      if (statuses.includes("CONTRADICTED")) {
        currentState = "Evidence contradicts requirement";
        gapDescription = `Existing evidence contradicts the requirement ${req.code}. Current implementation does not meet the expected standard.`;
        risk = "CRITICAL";
        priority = "CRITICAL";
        recommendation = `Immediately address the contradiction found in evidence for ${req.code}. Review and correct the non-compliant implementation.`;
      } else if (statuses.includes("PARTIAL")) {
        currentState = "Partially compliant";
        gapDescription = `Some evidence exists for requirement ${req.code} but full compliance has not been demonstrated.`;
        risk = "HIGH";
        priority = "HIGH";
        recommendation = `Supplement existing evidence for ${req.code} to achieve full compliance. Review implementation guidance for additional requirements.`;
      } else if (
        statuses.every((s) => s === "MISSING" || s === "UNVERIFIED")
      ) {
        currentState = "Evidence submitted but not verified";
        gapDescription = `Evidence has been submitted for ${req.code} but verification status is pending or missing.`;
        risk = "MEDIUM";
        priority = "MEDIUM";
        recommendation = `Verify and validate submitted evidence for ${req.code}. Ensure evidence meets the required standard.`;
      } else {
        continue;
      }
    }

    if (!req.mandatory) {
      if (risk === "CRITICAL") risk = "HIGH";
      if (priority === "CRITICAL") priority = "HIGH";
    }

    gaps.push({
      requirementId: req.id,
      code: req.code,
      title: req.title,
      severity: req.severity,
      currentState,
      expectedState: req.description || "Full compliance with requirement",
      gapDescription,
      risk,
      recommendation,
      priority,
      hasEvidence,
    });

    const existingForReq = await prisma.complianceGap.findFirst({
      where: {
        requirementId: req.id,
        organizationId,
      },
    });

    if (!existingForReq) {
      await prisma.complianceGap.create({
        data: {
          requirementId: req.id,
          organizationId,
          currentState,
          expectedState: req.description || "Full compliance with requirement",
          gapDescription,
          risk,
          recommendation,
          priority,
        },
      });
    }
  }

  gaps.sort((a, b) => {
    const priorityOrder: Record<string, number> = {
      CRITICAL: 0,
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
    };
    return (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4);
  });

  return gaps;
}

export async function generateComplianceReport(
  prisma: PrismaClient,
  organizationId: string
): Promise<{
  frameworks: Array<{ name: string; score: number; status: string }>;
  overallScore: number;
  totalRequirements: number;
  compliantCount: number;
  gapCount: number;
  criticalGaps: number;
  lastAssessment: Date | null;
}> {
  const frameworks = await prisma.complianceFramework.findMany({
    where: { status: "active" },
    include: {
      requirements: true,
    },
  });

  const frameworkResults: Array<{
    name: string;
    score: number;
    status: string;
  }> = [];

  let totalRequirements = 0;
  let totalCompliant = 0;
  let totalGaps = 0;
  let totalCriticalGaps = 0;
  let lastAssessment: Date | null = null;

  for (const fw of frameworks) {
    const result = await calculateComplianceScore(
      prisma,
      fw.id,
      organizationId
    );

    frameworkResults.push({
      name: fw.name,
      score: result.score,
      status: result.overallStatus,
    });

    totalRequirements += result.totalRequirements;
    totalCompliant += result.compliantCount;
    totalGaps +=
      result.nonCompliantCount + result.unassessedCount + result.partialCount;
    totalCriticalGaps += result.criticalGaps;
  }

  const latestAssessment = await prisma.complianceAssessment.findFirst({
    where: { organizationId },
    orderBy: { assessedAt: "desc" },
    select: { assessedAt: true },
  });
  lastAssessment = latestAssessment?.assessedAt ?? null;

  const overallScore =
    frameworkResults.length > 0
      ? Math.round(
          (frameworkResults.reduce((sum, f) => sum + f.score, 0) /
            frameworkResults.length) *
            100
        ) / 100
      : 0;

  return {
    frameworks: frameworkResults,
    overallScore,
    totalRequirements,
    compliantCount: totalCompliant,
    gapCount: totalGaps,
    criticalGaps: totalCriticalGaps,
    lastAssessment,
  };
}
