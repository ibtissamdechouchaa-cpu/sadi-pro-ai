export type DocStatus =
  | 'uploading'
  | 'queued'
  | 'processing'
  | 'extracting'
  | 'indexing'
  | 'analyzing'
  | 'completed'
  | 'failed'
  | 'quarantined';

export type DocType =
  | 'contract'
  | 'invoice'
  | 'report'
  | 'certificate'
  | 'letter'
  | 'id'
  | 'policy'
  | 'legal'
  | 'hr'
  | 'financial'
  | 'technical'
  | 'other';

export type ClassificationLevel = 'public' | 'internal' | 'confidential' | 'highly_confidential';

export type ArchiveState = 'active' | 'inactive' | 'archived' | 'on_hold' | 'pending_disposal' | 'disposed';

export type ApprovalState = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';

export type Language = 'ar' | 'fr' | 'en' | 'unknown';

export type PlanTier = 'starter' | 'business' | 'professional' | 'enterprise';

export type SubscriptionState = 'trialing' | 'active' | 'past_due' | 'paused' | 'cancelled' | 'expired';

export type RoleKey =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'editor'
  | 'reviewer'
  | 'viewer'
  | 'auditor';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  country: string | null;
  defaultLanguage: Language;
  timezone: string;
  logoUrl: string | null;
  planTier: PlanTier;
  subscriptionState: SubscriptionState;
  trialEndsAt: string | null;
  maxUsers: number;
  maxStorageBytes: number;
  maxDocuments: number;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarColor: string;
  role: RoleKey;
  departmentId: string | null;
  organizationId: string | null;
}

export interface Department {
  id: string;
  name: string;
  color: string;
  memberCount: number;
  documentCount: number;
  organizationId: string;
}

export interface DocVersion {
  version: number;
  uploadedBy: string;
  uploadedAt: string;
  fileSize: number;
  changes: string;
}

export interface DocEntity {
  type: string;
  value: string;
  confidence: number;
}

export interface ReasoningStep {
  step: number;
  title: string;
  thought: string;
}

export interface DocInsight {
  summary: string;
  keyEntities: DocEntity[];
  importantDates: { label: string; date: string; confidence: number }[];
  risks: string[];
  missingInfo: string[];
  suggestedTags: string[];
  confidence: number;
  reasoning?: ReasoningStep[];
  reasoningSummary?: string;
}

export interface ActivityEvent {
  id: string;
  action: string;
  resource: string;
  user: string;
  timestamp: string;
  icon: string;
}

export interface ProcessingJob {
  id: string;
  documentId: string;
  documentName: string;
  stage: DocStatus;
  progress: number;
  startedAt: string;
  error: string | null;
}

export interface Document {
  id: string;
  title: string;
  type: DocType;
  typeConfidence: number;
  language: Language;
  departmentId: string | null;
  classification: ClassificationLevel;
  archiveState: ArchiveState;
  approvalState: ApprovalState;
  status: DocStatus;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
  modifiedAt: string;
  tags: string[];
  version: number;
  versions: DocVersion[];
  hash: string;
  pageCount: number;
  ocrCompleted: boolean;
  embeddingCompleted: boolean;
  insight: DocInsight | null;
  relatedDocIds: string[];
  retentionYears: number | null;
  expiresAt: string | null;
  legalHold: boolean;
  sharedWith: string[];
  metadata: {
    author?: string;
    organization?: string;
    referenceNumber?: string;
    contractNumber?: string;
    parties?: string;
    amount?: string;
    searchRank?: number;
    searchSnippet?: string;
  };
}

export interface NotificationItem {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface PlanConfig {
  tier: PlanTier;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  maxUsers: number | null;
  maxStorageGB: number;
  maxDocuments: number;
  features: string[];
  popular?: boolean;
}

export interface UsageStats {
  storageUsedGB: number;
  storageLimitGB: number;
  documentCount: number;
  documentLimit: number;
  userCount: number;
  userLimit: number;
  aiTokensUsed: number;
  aiTokensLimit: number;
  ocrPagesUsed: number;
  ocrPagesLimit: number;
  planTier: string;
}

export interface SearchResult {
  documentId: string;
  title: string;
  snippet: string;
  score: number;
  matchType: 'keyword' | 'semantic' | 'metadata';
  matchedBecause: string;
  page: number;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  resourceName: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface RetentionPolicy {
  id: string;
  organizationId: string;
  name: string;
  documentType: string | null;
  departmentId: string | null;
  jurisdiction: string | null;
  sector: string | null;
  retentionYears: number;
  dispositionAction: 'delete' | 'archive' | 'review';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LegalHold {
  id: string;
  organizationId: string;
  documentId: string;
  reason: string;
  createdBy: string | null;
  scope: 'document' | 'department' | 'organization';
  releaseDate: string | null;
  releasedAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Collection {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  isAiSuggested: boolean;
  createdBy: string | null;
  documentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeBase {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  documentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  key: string;
  label: string;
  category: string;
}
