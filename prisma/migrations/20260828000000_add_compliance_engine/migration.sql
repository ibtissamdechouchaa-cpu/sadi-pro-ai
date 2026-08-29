-- CreateTable
CREATE TABLE "LegalArticle" (
    "id" TEXT NOT NULL,
    "legalReferenceId" TEXT NOT NULL,
    "articleNumber" TEXT NOT NULL,
    "title" TEXT,
    "textAr" TEXT,
    "textFr" TEXT,
    "textEn" TEXT,
    "fullText" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "obligations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "prohibitions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "penalties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "retentionRequirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "privacyRequirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "securityRequirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "evidenceRequirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "documentRequirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourcePage" INTEGER,
    "sourceLocation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalReferenceVersion" (
    "id" TEXT NOT NULL,
    "legalReferenceId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "contentHash" TEXT,
    "sourceUrl" TEXT,
    "fullText" TEXT,
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "changeSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalReferenceVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalRelation" (
    "id" TEXT NOT NULL,
    "sourceReferenceId" TEXT NOT NULL,
    "targetReferenceId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "description" TEXT,
    "articleNumber" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "nameFr" TEXT,
    "url" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "reliability" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastCheckedAt" TIMESTAMP(3),
    "lastModifiedAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalSearchHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "resultsCount" INTEGER NOT NULL DEFAULT 0,
    "searchedSources" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalSearchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalUpdateAlert" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "legalReferenceId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "changeType" TEXT NOT NULL,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalUpdateAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalReview" (
    "id" TEXT NOT NULL,
    "legalReferenceId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "reviewerName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceFramework" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "nameFr" TEXT,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "jurisdiction" TEXT,
    "version" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceFramework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceRequirement" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "legalReferenceId" TEXT,
    "articleId" TEXT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "description" TEXT,
    "category" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "mandatory" BOOLEAN NOT NULL DEFAULT true,
    "evidenceType" TEXT,
    "implementationGuidance" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNASSESSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceEvidence" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "documentId" TEXT,
    "policyId" TEXT,
    "auditLogId" TEXT,
    "evidenceType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'MISSING',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceAssessment" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assessedBy" TEXT,
    "assessedByName" TEXT,
    "overallStatus" TEXT NOT NULL DEFAULT 'NOT_ASSESSED',
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRequirements" INTEGER NOT NULL DEFAULT 0,
    "compliantCount" INTEGER NOT NULL DEFAULT 0,
    "partialCount" INTEGER NOT NULL DEFAULT 0,
    "nonCompliantCount" INTEGER NOT NULL DEFAULT 0,
    "unassessedCount" INTEGER NOT NULL DEFAULT 0,
    "notApplicableCount" INTEGER NOT NULL DEFAULT 0,
    "criticalGaps" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceGap" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "currentState" TEXT,
    "expectedState" TEXT,
    "gapDescription" TEXT,
    "risk" TEXT NOT NULL DEFAULT 'MEDIUM',
    "recommendation" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'open',
    "assignedTo" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceGap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalHoldRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reason" TEXT,
    "caseReference" TEXT,
    "createdBy" TEXT,
    "createdByName" TEXT,
    "releasedBy" TEXT,
    "releasedByName" TEXT,
    "releasedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalHoldRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalHoldDocument" (
    "id" TEXT NOT NULL,
    "holdId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "addedBy" TEXT,
    "removedBy" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "LegalHoldDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetentionRuleCandidate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "legalReferenceId" TEXT,
    "articleId" TEXT,
    "documentType" TEXT,
    "retentionPeriod" INTEGER,
    "retentionUnit" TEXT NOT NULL DEFAULT 'years',
    "triggerEvent" TEXT,
    "dispositionAction" TEXT NOT NULL DEFAULT 'review',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NEEDS_REVIEW',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "evidenceText" TEXT,
    "sourcePage" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetentionRuleCandidate_pkey" PRIMARY KEY ("id")
);

-- AlterTable: LegalReference
ALTER TABLE "LegalReference" ADD COLUMN "titleAr" TEXT;
ALTER TABLE "LegalReference" ADD COLUMN "titleFr" TEXT;
ALTER TABLE "LegalReference" ADD COLUMN "titleEn" TEXT;
ALTER TABLE "LegalReference" ADD COLUMN "jurisdiction" TEXT DEFAULT 'Algeria';
ALTER TABLE "LegalReference" ADD COLUMN "issuingAuthority" TEXT;
ALTER TABLE "LegalReference" ADD COLUMN "publicationDate" TIMESTAMP(3);
ALTER TABLE "LegalReference" ADD COLUMN "effectiveDate" TIMESTAMP(3);
ALTER TABLE "LegalReference" ADD COLUMN "officialGazetteNumber" TEXT;
ALTER TABLE "LegalReference" ADD COLUMN "officialGazetteDate" TIMESTAMP(3);
ALTER TABLE "LegalReference" ADD COLUMN "officialSource" TEXT;
ALTER TABLE "LegalReference" ADD COLUMN "sourceUrl" TEXT;
ALTER TABLE "LegalReference" ADD COLUMN "summaryAr" TEXT;
ALTER TABLE "LegalReference" ADD COLUMN "summaryFr" TEXT;
ALTER TABLE "LegalReference" ADD COLUMN "fullText" TEXT;
ALTER TABLE "LegalReference" ADD COLUMN "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "LegalReference" ADD COLUMN "domain" TEXT DEFAULT 'OTHER';
ALTER TABLE "LegalReference" ADD COLUMN "relevanceScore" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "LegalReference" ADD COLUMN "contentHash" TEXT;
ALTER TABLE "LegalReference" ADD COLUMN "version" INTEGER DEFAULT 1;
ALTER TABLE "LegalReference" ADD COLUMN "supersedes" TEXT;
ALTER TABLE "LegalReference" ADD COLUMN "supersededBy" TEXT;
ALTER TABLE "LegalReference" ADD COLUMN "verifiedAt" TIMESTAMP(3);
ALTER TABLE "LegalReference" ADD COLUMN "verifiedBy" TEXT;
ALTER TABLE "LegalReference" ADD COLUMN "isGlobal" BOOLEAN DEFAULT false;

-- AlterTable: Document
ALTER TABLE "Document" ADD COLUMN "legalHoldRecordId" TEXT;

-- AlterTable: RetentionPolicy
ALTER TABLE "RetentionPolicy" ADD COLUMN "retentionUnit" TEXT DEFAULT 'years';
ALTER TABLE "RetentionPolicy" ADD COLUMN "triggerEvent" TEXT;
ALTER TABLE "RetentionPolicy" ADD COLUMN "legalReferenceId" TEXT;
ALTER TABLE "RetentionPolicy" ADD COLUMN "articleId" TEXT;
ALTER TABLE "RetentionPolicy" ADD COLUMN "reviewRequired" BOOLEAN DEFAULT false;
ALTER TABLE "RetentionPolicy" ADD COLUMN "legalHoldAllowed" BOOLEAN DEFAULT true;
ALTER TABLE "RetentionPolicy" ADD COLUMN "version" INTEGER DEFAULT 1;

-- AlterTable: DisposalRequest
ALTER TABLE "DisposalRequest" ADD COLUMN "retentionPolicyId" TEXT;
ALTER TABLE "DisposalRequest" ADD COLUMN "legalBasis" TEXT;
ALTER TABLE "DisposalRequest" ADD COLUMN "expirationDate" TIMESTAMP(3);
ALTER TABLE "DisposalRequest" ADD COLUMN "disposalMethod" TEXT;
ALTER TABLE "DisposalRequest" ADD COLUMN "certificateNumber" TEXT;
ALTER TABLE "DisposalRequest" ADD COLUMN "reviewerId" TEXT;
ALTER TABLE "DisposalRequest" ADD COLUMN "reviewerName" TEXT;
ALTER TABLE "DisposalRequest" ADD COLUMN "metadata" JSONB DEFAULT '{}';

-- AlterTable: AuditLog
ALTER TABLE "AuditLog" ADD COLUMN "userName" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "entityType" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "documentId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "oldValue" JSONB;
ALTER TABLE "AuditLog" ADD COLUMN "newValue" JSONB;

-- CreateIndex
CREATE INDEX "LegalArticle_legalReferenceId_idx" ON "LegalArticle"("legalReferenceId");
CREATE INDEX "LegalArticle_articleNumber_idx" ON "LegalArticle"("articleNumber");
CREATE INDEX "LegalReferenceVersion_legalReferenceId_idx" ON "LegalReferenceVersion"("legalReferenceId");
CREATE INDEX "LegalRelation_sourceReferenceId_idx" ON "LegalRelation"("sourceReferenceId");
CREATE INDEX "LegalRelation_targetReferenceId_idx" ON "LegalRelation"("targetReferenceId");
CREATE INDEX "LegalRelation_relationType_idx" ON "LegalRelation"("relationType");
CREATE INDEX "LegalSource_sourceType_idx" ON "LegalSource"("sourceType");
CREATE INDEX "LegalSearchHistory_organizationId_idx" ON "LegalSearchHistory"("organizationId");
CREATE INDEX "LegalSearchHistory_userId_idx" ON "LegalSearchHistory"("userId");
CREATE INDEX "LegalUpdateAlert_organizationId_idx" ON "LegalUpdateAlert"("organizationId");
CREATE INDEX "LegalUpdateAlert_status_idx" ON "LegalUpdateAlert"("status");
CREATE INDEX "LegalReview_legalReferenceId_idx" ON "LegalReview"("legalReferenceId");
CREATE INDEX "LegalReview_organizationId_idx" ON "LegalReview"("organizationId");
CREATE INDEX "LegalReview_status_idx" ON "LegalReview"("status");
CREATE INDEX "ComplianceFramework_type_idx" ON "ComplianceFramework"("type");
CREATE INDEX "ComplianceFramework_jurisdiction_idx" ON "ComplianceFramework"("jurisdiction");
CREATE INDEX "ComplianceRequirement_frameworkId_idx" ON "ComplianceRequirement"("frameworkId");
CREATE INDEX "ComplianceRequirement_status_idx" ON "ComplianceRequirement"("status");
CREATE INDEX "ComplianceRequirement_severity_idx" ON "ComplianceRequirement"("severity");
CREATE INDEX "ComplianceEvidence_requirementId_idx" ON "ComplianceEvidence"("requirementId");
CREATE INDEX "ComplianceEvidence_organizationId_idx" ON "ComplianceEvidence"("organizationId");
CREATE INDEX "ComplianceEvidence_status_idx" ON "ComplianceEvidence"("status");
CREATE INDEX "ComplianceAssessment_frameworkId_idx" ON "ComplianceAssessment"("frameworkId");
CREATE INDEX "ComplianceAssessment_organizationId_idx" ON "ComplianceAssessment"("organizationId");
CREATE INDEX "ComplianceGap_requirementId_idx" ON "ComplianceGap"("requirementId");
CREATE INDEX "ComplianceGap_organizationId_idx" ON "ComplianceGap"("organizationId");
CREATE INDEX "ComplianceGap_status_idx" ON "ComplianceGap"("status");
CREATE INDEX "ComplianceGap_priority_idx" ON "ComplianceGap"("priority");
CREATE INDEX "LegalHoldRecord_organizationId_idx" ON "LegalHoldRecord"("organizationId");
CREATE INDEX "LegalHoldRecord_status_idx" ON "LegalHoldRecord"("status");
CREATE INDEX "LegalHoldDocument_holdId_idx" ON "LegalHoldDocument"("holdId");
CREATE INDEX "LegalHoldDocument_documentId_idx" ON "LegalHoldDocument"("documentId");
CREATE INDEX "LegalHoldDocument_organizationId_idx" ON "LegalHoldDocument"("organizationId");
CREATE INDEX "RetentionRuleCandidate_organizationId_idx" ON "RetentionRuleCandidate"("organizationId");
CREATE INDEX "RetentionRuleCandidate_status_idx" ON "RetentionRuleCandidate"("status");
CREATE INDEX "RetentionRuleCandidate_legalReferenceId_idx" ON "RetentionRuleCandidate"("legalReferenceId");
CREATE INDEX "LegalReference_status_idx" ON "LegalReference"("status");
CREATE INDEX "LegalReference_domain_idx" ON "LegalReference"("domain");
CREATE INDEX "LegalReference_referenceNumber_idx" ON "LegalReference"("referenceNumber");
CREATE INDEX "RetentionPolicy_organizationId_idx" ON "RetentionPolicy"("organizationId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- AddForeignKey
ALTER TABLE "LegalArticle" ADD CONSTRAINT "LegalArticle_legalReferenceId_fkey" FOREIGN KEY ("legalReferenceId") REFERENCES "LegalReference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalReferenceVersion" ADD CONSTRAINT "LegalReferenceVersion_legalReferenceId_fkey" FOREIGN KEY ("legalReferenceId") REFERENCES "LegalReference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalRelation" ADD CONSTRAINT "LegalRelation_sourceReferenceId_fkey" FOREIGN KEY ("sourceReferenceId") REFERENCES "LegalReference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalRelation" ADD CONSTRAINT "LegalRelation_targetReferenceId_fkey" FOREIGN KEY ("targetReferenceId") REFERENCES "LegalReference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceRequirement" ADD CONSTRAINT "ComplianceRequirement_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "ComplianceFramework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceRequirement" ADD CONSTRAINT "ComplianceRequirement_legalReferenceId_fkey" FOREIGN KEY ("legalReferenceId") REFERENCES "LegalReference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceEvidence" ADD CONSTRAINT "ComplianceEvidence_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "ComplianceRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceAssessment" ADD CONSTRAINT "ComplianceAssessment_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "ComplianceFramework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceGap" ADD CONSTRAINT "ComplianceGap_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "ComplianceRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalHoldDocument" ADD CONSTRAINT "LegalHoldDocument_holdId_fkey" FOREIGN KEY ("holdId") REFERENCES "LegalHoldRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetentionRuleCandidate" ADD CONSTRAINT "RetentionRuleCandidate_legalReferenceId_fkey" FOREIGN KEY ("legalReferenceId") REFERENCES "LegalReference"("id") ON DELETE SET NULL ON UPDATE CASCADE;
