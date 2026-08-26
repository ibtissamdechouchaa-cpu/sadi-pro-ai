import { useEffect, useState, useCallback } from 'react';
import { Activity, Clock } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface AuditEntry {
  id: string;
  action: string;
  resourceType: string | null;
  resourceName: string | null;
  userId: string | null;
  createdAt: string;
}

export function ActivityPage() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.get('/api/data/audit-logs');
      if (data.logs) setEntries(data.logs);
      else if (data.auditLogs) setEntries(data.auditLogs);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{t('activity')} & {t('auditLogs')}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t('auditLogs')} — {t('activity')}</p>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('auditLogs')}</CardTitle></CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-neutral-400">{t('loading')}</div>
          ) : entries.length === 0 ? (
            <EmptyState icon={<Activity className="h-8 w-8" />} title={t('activity')} description={t('activity')} />
          ) : (
            <div className="divide-y divide-neutral-50">
              {entries.map((e) => (
                <div key={e.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                    <Activity className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-900">
                      <span className="font-medium">{e.action}</span>
                      {e.resourceName && <span className="text-neutral-500"> — {e.resourceName}</span>}
                      {e.resourceType && <span className="text-neutral-400"> ({e.resourceType})</span>}
                    </p>
                    <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" />{timeAgo(e.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
