import { Trash2, RotateCcw, FileText } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useStore } from '@/store/StoreContext';
import { formatBytes, timeAgo } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export function TrashPage() {
  const { t } = useTranslation();
  const { documents, updateDocument } = useStore();
  const trashed = documents.filter((d) => d.archiveState === 'pending_disposal' || d.status === 'failed');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{t('trash')}</h1>
        <p className="mt-1 text-sm text-neutral-500">{trashed.length} {t('documents')} {t('trash')} — {t('retentionPolicies')}</p>
      </div>

      {trashed.length === 0 ? (
        <Card>
          <EmptyState icon={<Trash2 className="h-8 w-8" />} title={t('trash')} description={t('documentDeleted')} />
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>{t('documentDeleted')}</CardTitle></CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-neutral-50">
              {trashed.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                    <FileText className="h-4 w-4 text-neutral-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{doc.title}</p>
                    <p className="text-xs text-neutral-400">{formatBytes(doc.fileSize)} · {timeAgo(doc.modifiedAt)}</p>
                  </div>
                  <Button variant="outline" size="sm" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={() => updateDocument(doc.id, { archiveState: 'active' } as unknown as Record<string, unknown>)}>
                    {t('back')}
                  </Button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
