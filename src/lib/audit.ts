import { api } from '@/lib/api';

export enum AuditEventType {
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
  DOCUMENT_DELETE = 'DOCUMENT_DELETE',
  DOCUMENT_UPDATE = 'DOCUMENT_UPDATE',
  DOCUMENT_VIEW = 'DOCUMENT_VIEW',
  DOCUMENT_DOWNLOAD = 'DOCUMENT_DOWNLOAD',
  USER_LOGIN = 'USER_LOGIN',
  USER_SIGNUP = 'USER_SIGNUP',
  USER_LOGOUT = 'USER_LOGOUT',
  SETTINGS_UPDATE = 'SETTINGS_UPDATE',
  DEPARTMENT_CREATE = 'DEPARTMENT_CREATE',
  DEPARTMENT_UPDATE = 'DEPARTMENT_UPDATE',
  DEPARTMENT_DELETE = 'DEPARTMENT_DELETE',
  COLLECTION_CREATE = 'COLLECTION_CREATE',
  COLLECTION_DELETE = 'COLLECTION_DELETE',
  SEARCH = 'SEARCH',
  RETENTION_APPLIED = 'RETENTION_APPLIED',
  LEGAL_HOLD_APPLIED = 'LEGAL_HOLD_APPLIED',
  LEGAL_HOLD_RELEASED = 'LEGAL_HOLD_RELEASED',
}

export async function logAuditEvent(params: {
  organizationId: string;
  userId: string;
  action: AuditEventType;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    await api.post('/api/data/audit-logs', {
      organizationId: params.organizationId,
      userId: params.userId,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId || null,
      resourceName: params.resourceName || null,
      metadata: params.details || {},
      ipAddress: '127.0.0.1',
      userAgent: navigator.userAgent,
    });
  } catch (err) {
    console.warn('Failed to log audit event:', err);
  }
}

export async function getAuditLogs(orgId: string, limit = 50, offset = 0) {
  try {
    const data = await api.get(`/api/data/audit-logs?orgId=${orgId}&limit=${limit}&offset=${offset}`);
    return data.logs || [];
  } catch {
    return [];
  }
}
