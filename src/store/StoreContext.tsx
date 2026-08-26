import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Document, ProcessingJob, NotificationItem, ActivityEvent, User, Department, UsageStats } from '@/types';
import { generateId, generateHash } from '@/lib/utils';
import { getPlanByTier } from '@/lib/billing';

interface StoreContextValue {
  documents: Document[];
  jobs: ProcessingJob[];
  activity: ActivityEvent[];
  notifications: NotificationItem[];
  currentUser: User;
  departments: Department[];
  users: User[];
  usage: UsageStats;
  isAuthenticated: boolean;
  isLoading: boolean;
  addDocuments: (files: File[]) => Promise<void>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  retryJob: (jobId: string) => Promise<void>;
  cancelJob: (jobId: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  addNotification: (n: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  searchDocuments: (query: string) => Document[];
  refreshData: () => Promise<void>;
  addDepartment: (name: string, color: string) => Promise<void>;
  updateDepartment: (id: string, name: string, color: string) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbDocument(row: Record<string, any>): Document {
  return {
    id: row.id,
    title: row.title,
    type: row.type || 'other',
    typeConfidence: row.typeConfidence || 0,
    language: row.language || 'unknown',
    departmentId: row.departmentId,
    classification: row.classification || 'internal',
    archiveState: row.archiveState || 'active',
    approvalState: row.approvalState || 'draft',
    status: row.status || 'completed',
    fileSize: row.fileSize || 0,
    fileType: row.fileType || 'unknown',
    uploadedBy: row.uploadedBy || 'Unknown',
    uploadedAt: row.uploadedAt || row.createdAt,
    modifiedAt: row.modifiedAt || row.createdAt,
    tags: row.tags || [],
    version: row.version || 1,
    versions: [],
    hash: row.hash || '',
    pageCount: row.pageCount || 0,
    ocrCompleted: row.ocrCompleted || false,
    embeddingCompleted: row.embeddingCompleted || false,
    insight: row.insight || (row.metadata && typeof row.metadata === 'object' ? (row.metadata as any).insight : null) || null,
    relatedDocIds: row.relatedDocIds || [],
    retentionYears: row.retentionYears,
    expiresAt: row.expiresAt,
    legalHold: row.legalHold || false,
    sharedWith: row.sharedWith || [],
    metadata: row.metadata || {},
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbProfile(row: Record<string, any>): User {
  return {
    id: row.id,
    email: row.email,
    name: row.fullName || row.email,
    avatarColor: row.avatarColor || '#2563eb',
    role: row.role || 'viewer',
    departmentId: row.departmentId,
    organizationId: row.organizationId,
  };
}

const EMPTY_USER: User = {
  id: '',
  email: '',
  name: 'Unknown',
  avatarColor: '#6b7280',
  role: 'viewer',
  departmentId: null,
  organizationId: '',
};

const EMPTY_USAGE: UsageStats = {
  storageUsedGB: 0,
  storageLimitGB: 0.2,
  documentCount: 0,
  documentLimit: 500,
  userCount: 0,
  userLimit: 5,
  aiTokensUsed: 0,
  aiTokensLimit: 0,
  ocrPagesUsed: 0,
  ocrPagesLimit: 0,
  planTier: 'starter',
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [usage, setUsage] = useState<UsageStats>(EMPTY_USAGE);
  const [isLoading, setIsLoading] = useState(true);

  const activeUser = auth.user || EMPTY_USER;

  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.organizationId) {
      refreshData();
    } else {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthenticated, auth.user?.organizationId]);

  const refreshData = useCallback(async () => {
    if (!auth.user?.organizationId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const orgId = auth.user.organizationId;

      const [docsResult, jobsResult, activityResult, notifResult, deptResult, usersResult, orgResult] = await Promise.allSettled([
        api.get(`/api/data/documents?orgId=${orgId}`),
        api.get(`/api/data/jobs?orgId=${orgId}`),
        api.get(`/api/data/activity?orgId=${orgId}`),
        api.get(`/api/data/notifications?orgId=${orgId}&userId=${auth.user.id}`),
        api.get(`/api/data/departments?orgId=${orgId}`),
        api.get(`/api/data/users?orgId=${orgId}`),
        api.get(`/api/data/organization?orgId=${orgId}`),
      ]);

      const docsData = docsResult.status === 'fulfilled' ? docsResult.value : { documents: [] };
      const jobsData = jobsResult.status === 'fulfilled' ? jobsResult.value : { jobs: [] };
      const activityData = activityResult.status === 'fulfilled' ? activityResult.value : { activity: [] };
      const notifData = notifResult.status === 'fulfilled' ? notifResult.value : { notifications: [] };
      const deptData = deptResult.status === 'fulfilled' ? deptResult.value : { departments: [] };
      const usersData = usersResult.status === 'fulfilled' ? usersResult.value : { users: [] };
      const orgData = orgResult.status === 'fulfilled' ? orgResult.value : { organization: null };

      if (docsData.documents) setDocuments(docsData.documents.map(mapDbDocument));
      if (jobsData.jobs) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setJobs(jobsData.jobs.map((j: any) => ({
          id: j.id,
          documentId: j.documentId || '',
          documentName: j.documentName || '',
          stage: j.stage,
          progress: j.progress,
          startedAt: j.startedAt,
          error: j.error,
        })));
      }
      if (activityData.activity) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setActivity(activityData.activity.map((a: any) => ({
          id: a.id,
          action: a.action,
          resource: a.resource || '',
          user: a.userName || activeUser.name,
          timestamp: a.createdAt,
          icon: a.icon || 'activity',
        })));
      }
      if (notifData.notifications) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setNotifications(notifData.notifications.map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          timestamp: n.createdAt,
          read: n.read,
        })));
      }
      if (deptData.departments) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setDepartments(deptData.departments.map((d: any) => ({
          id: d.id,
          name: d.name,
          color: d.color || '#2563eb',
          memberCount: 0,
          documentCount: 0,
          organizationId: d.organizationId,
        })));
      }
      if (usersData.users) {
        setUsers(usersData.users.map(mapDbProfile));
      }

      const docCount = docsData.documents?.length || 0;
      const storageBytes = docsData.documents?.reduce((sum: number, d: Record<string, unknown>) => sum + ((d.fileSize as number) || 0), 0) || 0;
      const userCount = usersData.users?.length || 0;
      const org = orgData.organization;
      const plan = getPlanByTier(org?.planTier || 'starter');
      const storageGB = storageBytes / (1024 * 1024 * 1024);
      setUsage({
        storageUsedGB: Math.round(storageGB * 100) / 100,
        storageLimitGB: plan.maxStorageGB,
        documentCount: docCount,
        documentLimit: plan.maxDocuments,
        userCount: userCount,
        userLimit: plan.maxUsers || 5,
        aiTokensUsed: 0,
        aiTokensLimit: 0,
        ocrPagesUsed: 0,
        ocrPagesLimit: 0,
        planTier: org?.planTier || 'starter',
      });
    } catch (err) {
      console.error('Failed to refresh data:', err);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user]);

  const addNotification = useCallback((n: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: NotificationItem = {
      ...n,
      id: generateId('n'),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    if (auth.user?.organizationId && auth.user?.id) {
      import('@/lib/notifications').then((mod) =>
        mod.createNotification(auth.user!.organizationId, auth.user!.id, {
          type: n.type,
          title: n.title,
          message: n.message,
        }).catch(() => {})
      );
    }
  }, [auth.user]);

  const addDocuments = useCallback(async (files: File[]) => {
    addNotification({
      type: 'info',
      title: 'Upload started',
      message: `${files.length} document${files.length > 1 ? 's' : ''} queued for processing.`,
    });

    if (auth.user?.organizationId) {
      try {
        const { hashFile } = await import('@/lib/security');
        for (const file of files) {
          const hash = await hashFile(file);
          const formData = new FormData();
          formData.append('file', file);
          const uploadResult = await api.upload('/api/data/upload', formData);

          const metadata = {
            title: file.name.replace(/\.[^/.]+$/, ''),
            type: 'other' as const,
            status: 'queued' as const,
            fileSize: file.size,
            fileType: file.name.split('.').pop()?.toLowerCase() || 'unknown',
            classification: 'internal' as const,
            tags: [] as string[],
            filePath: uploadResult.filePath,
            hash,
          };

          await api.post('/api/data/documents', { documents: [metadata] });
        }
        await refreshData();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'One or more files failed to upload.';
        if (msg.includes('already exists')) {
          addNotification({ type: 'warning', title: 'Duplicate file', message: msg });
        } else {
          console.error('Failed to upload documents:', err);
          addNotification({ type: 'error', title: 'Upload failed', message: msg });
        }
      }
    }
  }, [auth.user, addNotification, refreshData]);

  const updateDocument = useCallback(async (id: string, updates: Partial<Document>) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates, modifiedAt: new Date().toISOString() } : d))
    );

    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.type) dbUpdates.type = updates.type;
      if (updates.classification) dbUpdates.classification = updates.classification;
      if (updates.archiveState) dbUpdates.archiveState = updates.archiveState;
      if (updates.approvalState) dbUpdates.approvalState = updates.approvalState;
      if (updates.departmentId !== undefined) dbUpdates.departmentId = updates.departmentId;
      if (updates.tags) dbUpdates.tags = updates.tags;
      if (updates.legalHold !== undefined) dbUpdates.legalHold = updates.legalHold;
      if (updates.retentionYears !== undefined) dbUpdates.retentionYears = updates.retentionYears;
      if (updates.metadata) dbUpdates.metadata = updates.metadata;

      await api.patch(`/api/data/documents/${id}`, dbUpdates);
    } catch (err) {
      console.error('Failed to update document:', err);
    }
  }, []);

  const deleteDocument = useCallback(async (id: string) => {
    const target = documents.find((d) => d.id === id);
    if (target?.legalHold) {
      addNotification({ type: 'warning', title: 'Legal hold', message: 'Cannot delete a document under legal hold.' });
      return;
    }
    const prev = documents;
    setDocuments((p) => p.map((d) => (d.id === id ? { ...d, archiveState: 'pending_disposal' as const } : d)));
    addNotification({
      type: 'info',
      title: 'Document moved to trash',
      message: 'The document has been moved to trash and will be disposed per retention policy.',
    });
    try {
      await api.patch(`/api/data/documents/${id}`, { archiveState: 'pending_disposal' });
    } catch (err: unknown) {
      setDocuments(prev);
      const msg = err instanceof Error ? err.message : 'Failed to delete document.';
      addNotification({ type: 'error', title: 'Delete failed', message: msg });
    }
  }, [documents, addNotification]);

  const retryJob = useCallback(async (jobId: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, stage: 'queued', progress: 0, error: null } : j))
    );

    try {
      await api.patch(`/api/data/jobs/${jobId}`, { stage: 'queued', progress: 0, error: null });
    } catch (err) {
      console.error('Failed to retry job:', err);
    }
  }, []);

  const cancelJob = useCallback(async (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));

    try {
      await api.delete(`/api/data/jobs/${jobId}`);
    } catch (err) {
      console.error('Failed to cancel job:', err);
    }
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

    try {
      await api.patch(`/api/data/notifications/${id}/read`, {});
    } catch (err) {
      console.error('Failed to mark notification:', err);
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await api.patch('/api/data/notifications/read-all', {});
    } catch (err) {
      console.error('Failed to mark all notifications:', err);
    }
  }, []);

  const searchDocuments = useCallback((query: string): Document[] => {
    if (!query.trim()) return documents;
    const lower = query.toLowerCase();
    return documents.filter((d) =>
      d.title.toLowerCase().includes(lower) ||
      d.tags.some((t) => t.toLowerCase().includes(lower)) ||
      d.type.toLowerCase().includes(lower)
    );
  }, [documents]);

  const addDepartment = useCallback(async (name: string, color: string) => {
    if (!auth.user?.organizationId) return;
    const id = generateId('dept');
    try {
      await api.post('/api/data/departments', { id, name, color, organizationId: auth.user.organizationId });
      setDepartments((prev) => [...prev, { id, name, color, memberCount: 0, documentCount: 0, organizationId: auth.user!.organizationId! }]);
    } catch (err) {
      console.error('Failed to add department:', err);
    }
  }, [auth.user]);

  const updateDepartment = useCallback(async (id: string, name: string, color: string) => {
    try {
      await api.patch(`/api/data/departments/${id}`, { name, color });
      setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, name, color } : d)));
    } catch (err) {
      console.error('Failed to update department:', err);
    }
  }, []);

  const deleteDepartment = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/data/departments/${id}`);
      setDepartments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error('Failed to delete department:', err);
    }
  }, []);

  return (
    <StoreContext.Provider
      value={{
        documents,
        jobs,
        activity,
        notifications,
        currentUser: activeUser,
        departments,
        users,
        usage,
        isAuthenticated: auth.isAuthenticated,
        isLoading,
        addDocuments,
        updateDocument,
        deleteDocument,
        retryJob,
        cancelJob,
        markNotificationRead,
        markAllNotificationsRead,
        addNotification,
        searchDocuments,
        refreshData,
        addDepartment,
        updateDepartment,
        deleteDepartment,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
