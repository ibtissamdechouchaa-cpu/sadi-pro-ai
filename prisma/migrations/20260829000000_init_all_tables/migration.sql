-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "industry" TEXT,
    "country" TEXT,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "logoUrl" TEXT,
    "planTier" TEXT NOT NULL DEFAULT 'trialing',
    "subscriptionState" TEXT NOT NULL DEFAULT 'trialing',
    "trialEndsAt" TIMESTAMP(3),
    "maxUsers" INTEGER NOT NULL DEFAULT 5,
    "maxStorageBytes" BIGINT NOT NULL DEFAULT 26843545600,
    "maxDocuments" INTEGER NOT NULL DEFAULT 5000,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "avatarColor" TEXT NOT NULL DEFAULT '#2563eb',
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "departmentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "passwordHash" TEXT NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#2563eb',
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'other',
    "typeConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "language" TEXT NOT NULL DEFAULT 'unknown',
    "departmentId" TEXT,
    "ownerUserId" TEXT,
    "classification" TEXT NOT NULL DEFAULT 'internal',
    "archiveState" TEXT NOT NULL DEFAULT 'active',
    "approvalState" TEXT NOT NULL DEFAULT 'draft',
    "status" TEXT NOT NULL DEFAULT 'uploading',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "signatureState" TEXT NOT NULL DEFAULT 'not_required',
    "fileSize" BIGINT NOT NULL DEFAULT 0,
    "fileType" TEXT,
    "filePath" TEXT,
    "storageBucket" TEXT NOT NULL DEFAULT 'documents',
    "uploadedBy" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tags" TEXT[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "hash" TEXT,
    "pageCount" INTEGER NOT NULL DEFAULT 0,
    "ocrCompleted" BOOLEAN NOT NULL DEFAULT false,
    "embeddingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "relatedDocIds" TEXT[],
    "retentionYears" INTEGER,
    "retentionReason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "legalHold" BOOLEAN NOT NULL DEFAULT false,
    "legalHoldRecordId" TEXT,
    "sharedWith" TEXT[],
    "documentNumber" TEXT,
    "issuingAuthority" TEXT,
    "documentDate" TIMESTAMP(3),
    "notes" TEXT,
    "contractNumber" TEXT,
    "institution" TEXT,
    "legalValue" TEXT,
    "historicalValue" TEXT,
    "sourceLanguage" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "uploadedBy" TEXT,
    "uploadedByName" TEXT,
    "filePath" TEXT,
    "fileSize" BIGINT NOT NULL DEFAULT 0,
    "hash" TEXT,
    "changes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisposalRequest" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "requestedByName" TEXT,
    "reason" TEXT,
    "retentionPolicyId" TEXT,
    "legalBasis" TEXT,
    "expirationDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "approvedByName" TEXT,
    "approvedAt" TIMESTAMP(3),
    "disposedAt" TIMESTAMP(3),
    "disposalMethod" TEXT,
    "certificateNumber" TEXT,
    "reviewerId" TEXT,
    "reviewerName" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DisposalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalReference" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "referenceType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "titleFr" TEXT,
    "titleEn" TEXT,
    "jurisdiction" TEXT DEFAULT 'Algeria',
    "issuingAuthority" TEXT,
    "publicationDate" TIMESTAMP(3),
    "effectiveDate" TIMESTAMP(3),
    "officialGazetteNumber" TEXT,
    "officialGazetteDate" TIMESTAMP(3),
    "officialSource" TEXT,
    "sourceUrl" TEXT,
    "date" TIMESTAMP(3),
    "subject" TEXT,
    "description" TEXT,
    "summaryAr" TEXT,
    "summaryFr" TEXT,
    "fullText" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "domain" TEXT NOT NULL DEFAULT 'OTHER',
    "relevanceScore" DOUBLE PRECISION DEFAULT 0,
    "contentHash" TEXT,
    "version" INTEGER DEFAULT 1,
    "supersedes" TEXT,
    "supersededBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "organizationId" TEXT,
    "isGlobal" BOOLEAN DEFAULT false,
    "retentionRules" JSONB NOT NULL DEFAULT '{}',
    "accessRules" JSONB NOT NULL DEFAULT '{}',
    "disposalRules" JSONB NOT NULL DEFAULT '{}',
    "archiveRules" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LegalReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSummary" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "keywords" TEXT[],
    "importantDates" JSONB NOT NULL DEFAULT '[]',
    "parties" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentEmbedding" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT NOT NULL,
    "embedding" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentRetentionEvent" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fromYears" INTEGER,
    "toYears" INTEGER NOT NULL,
    "reason" TEXT,
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentRetentionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalRule" (
    "id" TEXT NOT NULL,
    "referenceId" TEXT,
    "ruleType" TEXT NOT NULL,
    "condition" JSONB NOT NULL DEFAULT '{}',
    "action" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LegalRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentLegalMatch" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "legalReferenceId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "matchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentLegalMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signature" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "signerId" TEXT NOT NULL,
    "signerName" TEXT,
    "signerEmail" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "signedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "ipAddress" TEXT,
    "documentVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Signature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingJob" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "documentId" TEXT,
    "documentName" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'queued',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "resourceName" TEXT,
    "documentId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "icon" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "title" TEXT NOT NULL,
    "message" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetentionPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "documentType" TEXT,
    "departmentId" TEXT,
    "jurisdiction" TEXT,
    "sector" TEXT,
    "retentionYears" INTEGER NOT NULL,
    "retentionUnit" TEXT NOT NULL DEFAULT 'years',
    "triggerEvent" TEXT,
    "legalReferenceId" TEXT,
    "articleId" TEXT,
    "dispositionAction" TEXT NOT NULL DEFAULT 'delete',
    "reviewRequired" BOOLEAN DEFAULT false,
    "legalHoldAllowed" BOOLEAN DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isAiSuggested" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'other',
    "classification" TEXT NOT NULL DEFAULT 'internal',
    "fields" JSONB NOT NULL DEFAULT '{}',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "triggerType" TEXT NOT NULL,
    "conditions" JSONB NOT NULL DEFAULT '{}',
    "actions" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Compliance Engine
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

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");
CREATE UNIQUE INDEX "Department_organizationId_name_key" ON "Department"("organizationId", "name");
CREATE UNIQUE INDEX "ProcessingJob_idempotencyKey_key" ON "ProcessingJob"("idempotencyKey");
CREATE UNIQUE INDEX "ComplianceFramework_code_key" ON "ComplianceFramework"("code");
CREATE INDEX "Document_organizationId_idx" ON "Document"("organizationId");
CREATE INDEX "Document_organizationId_deletedAt_idx" ON "Document"("organizationId", "deletedAt");
CREATE INDEX "Document_status_idx" ON "Document"("status");
CREATE INDEX "Document_departmentId_idx" ON "Document"("departmentId");
CREATE INDEX "Document_uploadedAt_idx" ON "Document"("uploadedAt");
CREATE INDEX "Document_priority_idx" ON "Document"("priority");
CREATE INDEX "Document_archiveState_idx" ON "Document"("archiveState");
CREATE INDEX "Document_expiresAt_idx" ON "Document"("expiresAt");
CREATE INDEX "DocumentVersion_documentId_idx" ON "DocumentVersion"("documentId");
CREATE INDEX "DocumentVersion_organizationId_idx" ON "DocumentVersion"("organizationId");
CREATE INDEX "DisposalRequest_documentId_idx" ON "DisposalRequest"("documentId");
CREATE INDEX "DisposalRequest_organizationId_idx" ON "DisposalRequest"("organizationId");
CREATE INDEX "DisposalRequest_status_idx" ON "DisposalRequest"("status");
CREATE INDEX "LegalReference_referenceType_idx" ON "LegalReference"("referenceType");
CREATE INDEX "LegalReference_organizationId_idx" ON "LegalReference"("organizationId");
CREATE INDEX "LegalReference_status_idx" ON "LegalReference"("status");
CREATE INDEX "LegalReference_domain_idx" ON "LegalReference"("domain");
CREATE INDEX "LegalReference_referenceNumber_idx" ON "LegalReference"("referenceNumber");
CREATE INDEX "DocumentSummary_documentId_idx" ON "DocumentSummary"("documentId");
CREATE INDEX "DocumentSummary_organizationId_idx" ON "DocumentSummary"("organizationId");
CREATE INDEX "DocumentEmbedding_documentId_idx" ON "DocumentEmbedding"("documentId");
CREATE INDEX "DocumentEmbedding_organizationId_idx" ON "DocumentEmbedding"("organizationId");
CREATE INDEX "DocumentRetentionEvent_documentId_idx" ON "DocumentRetentionEvent"("documentId");
CREATE INDEX "LegalRule_referenceId_idx" ON "LegalRule"("referenceId");
CREATE INDEX "DocumentLegalMatch_documentId_idx" ON "DocumentLegalMatch"("documentId");
CREATE INDEX "DocumentLegalMatch_legalReferenceId_idx" ON "DocumentLegalMatch"("legalReferenceId");
CREATE INDEX "Signature_documentId_idx" ON "Signature"("documentId");
CREATE INDEX "Signature_organizationId_idx" ON "Signature"("organizationId");
CREATE INDEX "Signature_status_idx" ON "Signature"("status");
CREATE INDEX "ProcessingJob_organizationId_idx" ON "ProcessingJob"("organizationId");
CREATE INDEX "ProcessingJob_documentId_idx" ON "ProcessingJob"("documentId");
CREATE INDEX "ProcessingJob_stage_idx" ON "ProcessingJob"("stage");
CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");
CREATE INDEX "ActivityEvent_organizationId_idx" ON "ActivityEvent"("organizationId");
CREATE INDEX "ActivityEvent_createdAt_idx" ON "ActivityEvent"("createdAt");
CREATE INDEX "Notification_organizationId_userId_idx" ON "Notification"("organizationId", "userId");
CREATE INDEX "Notification_read_idx" ON "Notification"("read");
CREATE INDEX "RetentionPolicy_organizationId_idx" ON "RetentionPolicy"("organizationId");
CREATE INDEX "DocumentTemplate_organizationId_idx" ON "DocumentTemplate"("organizationId");
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

-- AddForeignKey
ALTER TABLE "LegalArticle" ADD CONSTRAINT "LegalArticle_legalReferenceId_fkey" FOREIGN KEY ("legalReferenceId") REFERENCES "LegalReference"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LegalReferenceVersion" ADD CONSTRAINT "LegalReferenceVersion_legalReferenceId_fkey" FOREIGN KEY ("legalReferenceId") REFERENCES "LegalReference"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LegalRelation" ADD CONSTRAINT "LegalRelation_sourceReferenceId_fkey" FOREIGN KEY ("sourceReferenceId") REFERENCES "LegalReference"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LegalRelation" ADD CONSTRAINT "LegalRelation_targetReferenceId_fkey" FOREIGN KEY ("targetReferenceId") REFERENCES "LegalReference"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComplianceRequirement" ADD CONSTRAINT "ComplianceRequirement_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "ComplianceFramework"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComplianceRequirement" ADD CONSTRAINT "ComplianceRequirement_legalReferenceId_fkey" FOREIGN KEY ("legalReferenceId") REFERENCES "LegalReference"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ComplianceEvidence" ADD CONSTRAINT "ComplianceEvidence_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "ComplianceRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComplianceAssessment" ADD CONSTRAINT "ComplianceAssessment_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "ComplianceFramework"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComplianceGap" ADD CONSTRAINT "ComplianceGap_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "ComplianceRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LegalHoldDocument" ADD CONSTRAINT "LegalHoldDocument_holdId_fkey" FOREIGN KEY ("holdId") REFERENCES "LegalHoldRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RetentionRuleCandidate" ADD CONSTRAINT "RetentionRuleCandidate_legalReferenceId_fkey" FOREIGN KEY ("legalReferenceId") REFERENCES "LegalReference"("id") ON DELETE SET NULL ON UPDATE CASCADE;
