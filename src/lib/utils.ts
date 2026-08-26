import type { DocStatus, DocType, ClassificationLevel, ArchiveState, ApprovalState, Language, RoleKey } from '@/types';

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export const statusConfig: Record<DocStatus, { label: string; labelKey: string; color: string; dot: string }> = {
  uploading: { label: 'Uploading', labelKey: 'statusUploading', color: 'bg-primary-50 text-primary-700', dot: 'bg-primary-500' },
  queued: { label: 'Queued', labelKey: 'statusQueued', color: 'bg-neutral-100 text-neutral-600', dot: 'bg-neutral-400' },
  processing: { label: 'Processing', labelKey: 'statusProcessing', color: 'bg-accent-50 text-accent-700', dot: 'bg-accent-500' },
  extracting: { label: 'Extracting', labelKey: 'statusExtracting', color: 'bg-accent-50 text-accent-700', dot: 'bg-accent-500' },
  indexing: { label: 'Indexing', labelKey: 'statusIndexing', color: 'bg-accent-50 text-accent-700', dot: 'bg-accent-500' },
  analyzing: { label: 'Analyzing', labelKey: 'statusAnalyzing', color: 'bg-warning-50 text-warning-700', dot: 'bg-warning-500' },
  completed: { label: 'Completed', labelKey: 'statusCompleted', color: 'bg-success-50 text-success-700', dot: 'bg-success-500' },
  failed: { label: 'Failed', labelKey: 'statusFailed', color: 'bg-error-50 text-error-700', dot: 'bg-error-500' },
  quarantined: { label: 'Quarantined', labelKey: 'statusQuarantined', color: 'bg-error-50 text-error-700', dot: 'bg-error-500' },
};

export function getStatusLabel(status: DocStatus, t: (key: string) => string): string {
  const cfg = statusConfig[status];
  return cfg ? t(cfg.labelKey as never) || cfg.label : status;
}

export const typeConfig: Record<DocType, { label: string; labelKey: string; icon: string }> = {
  contract: { label: 'Contract', labelKey: 'typeContract', icon: 'file-text' },
  invoice: { label: 'Invoice', labelKey: 'typeInvoice', icon: 'receipt' },
  report: { label: 'Report', labelKey: 'typeReport', icon: 'bar-chart-3' },
  certificate: { label: 'Certificate', labelKey: 'typeCertificate', icon: 'award' },
  letter: { label: 'Letter', labelKey: 'typeLetter', icon: 'mail' },
  id: { label: 'ID Document', labelKey: 'typeId', icon: 'id-card' },
  policy: { label: 'Policy', labelKey: 'typePolicy', icon: 'book-open' },
  legal: { label: 'Legal Document', labelKey: 'typeLegal', icon: 'scale' },
  hr: { label: 'HR Document', labelKey: 'typeHr', icon: 'users' },
  financial: { label: 'Financial', labelKey: 'typeFinancial', icon: 'dollar-sign' },
  technical: { label: 'Technical', labelKey: 'typeTechnical', icon: 'code' },
  other: { label: 'Other', labelKey: 'typeOther', icon: 'file' },
};

export function getTypeLabel(type: DocType, t: (key: string) => string): string {
  const cfg = typeConfig[type];
  return cfg ? t(cfg.labelKey as never) || cfg.label : type;
}

export const classificationConfig: Record<ClassificationLevel, { label: string; labelKey: string; color: string }> = {
  public: { label: 'Public', labelKey: 'classificationPublic', color: 'bg-success-50 text-success-700 border-success-200' },
  internal: { label: 'Internal', labelKey: 'classificationInternal', color: 'bg-primary-50 text-primary-700 border-primary-200' },
  confidential: { label: 'Confidential', labelKey: 'classificationConfidential', color: 'bg-warning-50 text-warning-700 border-warning-200' },
  highly_confidential: { label: 'Highly Confidential', labelKey: 'classificationHighlyConfidential', color: 'bg-error-50 text-error-700 border-error-200' },
};

export function getClassificationLabel(level: ClassificationLevel, t: (key: string) => string): string {
  const cfg = classificationConfig[level];
  return cfg ? t(cfg.labelKey as never) || cfg.label : level;
}

export const archiveConfig: Record<ArchiveState, { label: string; labelKey: string; color: string }> = {
  active: { label: 'Active', labelKey: 'archiveActive', color: 'bg-success-50 text-success-700' },
  inactive: { label: 'Inactive', labelKey: 'archiveInactive', color: 'bg-neutral-100 text-neutral-600' },
  archived: { label: 'Archived', labelKey: 'archiveArchived', color: 'bg-neutral-100 text-neutral-600' },
  on_hold: { label: 'On Hold', labelKey: 'archiveOnHold', color: 'bg-warning-50 text-warning-700' },
  pending_disposal: { label: 'Pending Disposal', labelKey: 'archivePendingDisposal', color: 'bg-warning-50 text-warning-700' },
  disposed: { label: 'Disposed', labelKey: 'archiveDisposed', color: 'bg-neutral-100 text-neutral-500' },
};

export function getArchiveLabel(state: ArchiveState, t: (key: string) => string): string {
  const cfg = archiveConfig[state];
  return cfg ? t(cfg.labelKey as never) || cfg.label : state;
}

export const approvalConfig: Record<ApprovalState, { label: string; labelKey: string; color: string }> = {
  draft: { label: 'Draft', labelKey: 'approvalDraft', color: 'bg-neutral-100 text-neutral-600' },
  pending_review: { label: 'Pending Review', labelKey: 'approvalPendingReview', color: 'bg-warning-50 text-warning-700' },
  approved: { label: 'Approved', labelKey: 'approvalApproved', color: 'bg-success-50 text-success-700' },
  rejected: { label: 'Rejected', labelKey: 'approvalRejected', color: 'bg-error-50 text-error-700' },
  archived: { label: 'Archived', labelKey: 'approvalArchived', color: 'bg-neutral-100 text-neutral-600' },
};

export function getApprovalLabel(state: ApprovalState, t: (key: string) => string): string {
  const cfg = approvalConfig[state];
  return cfg ? t(cfg.labelKey as never) || cfg.label : state;
}

export const languageConfig: Record<Language, string> = {
  ar: 'Arabic',
  fr: 'French',
  en: 'English',
  unknown: 'Unknown',
};

export const languageLabelKey: Record<Language, string> = {
  ar: 'langAr',
  fr: 'langFr',
  en: 'langEn',
  unknown: 'langUnknown',
};

export function getLanguageLabel(lang: Language, t: (key: string) => string): string {
  const key = languageLabelKey[lang];
  return key ? t(key as never) || languageConfig[lang] : lang;
}

export const roleConfig: Record<RoleKey, { label: string; labelKey: string; color: string }> = {
  owner: { label: 'Owner', labelKey: 'roleOwner', color: 'bg-primary-100 text-primary-700' },
  admin: { label: 'Admin', labelKey: 'roleAdmin', color: 'bg-accent-100 text-accent-700' },
  manager: { label: 'Manager', labelKey: 'roleManager', color: 'bg-success-100 text-success-700' },
  editor: { label: 'Editor', labelKey: 'roleEditor', color: 'bg-warning-100 text-warning-700' },
  reviewer: { label: 'Reviewer', labelKey: 'roleReviewer', color: 'bg-neutral-200 text-neutral-700' },
  viewer: { label: 'Viewer', labelKey: 'roleViewer', color: 'bg-neutral-100 text-neutral-600' },
  auditor: { label: 'Auditor', labelKey: 'roleAuditor', color: 'bg-neutral-200 text-neutral-700' },
};

export function getRoleLabel(role: RoleKey, t: (key: string) => string): string {
  const cfg = roleConfig[role];
  return cfg ? t(cfg.labelKey as never) || cfg.label : role;
}

export function percentage(used: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.round((used / limit) * 100);
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateId(prefix = 'id'): string {
  const uuid = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  return `${prefix}-${uuid}`;
}

export function generateHash(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).slice(2, 18);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain an uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Password must contain a lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Password must contain a number');
  return { valid: errors.length === 0, errors };
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function fileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}
