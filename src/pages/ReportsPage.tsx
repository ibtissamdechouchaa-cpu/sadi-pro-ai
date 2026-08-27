import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, FileText, Shield, Archive, Calendar, Download } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useStore } from '@/store/StoreContext';
import { formatDate, cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

type Alert = { id: string; title: string; type: string; expiresAt: string; daysLeft: number; urgency: string; classification: string };

function priorityFor(a: Alert, doc?: { type?: string; priority?: string }) {
  // Score based on spec: expiration + confidentiality + legal value + type + disposal risk
  let score = 0;
  if (a.daysLeft <= 1) score += 40;
  else if (a.daysLeft <= 7) score += 30;
  else if (a.daysLeft <= 15) score += 20;
  else if (a.daysLeft <= 30) score += 10;
  if (['restricted', 'highly_confidential', 'confidential'].includes(a.classification)) score += 20;
  if (['legal', 'contract', 'certificate'].includes(a.type)) score += 15;
  if (doc?.priority === 'critical') score += 20;
  else if (doc?.priority === 'high') score += 10;
  if (score >= 60) return { label: 'CRITICAL', color: 'bg-red-600 text-white', order: 4 };
  if (score >= 40) return { label: 'HIGH', color: 'bg-orange-500 text-white', order: 3 };
  if (score >= 20) return { label: 'MEDIUM', color: 'bg-amber-500 text-white', order: 2 };
  return { label: 'LOW', color: 'bg-emerald-500 text-white', order: 1 };
}

function recommendedAction(p: string, days: number) {
  if (days <= 0) return 'DISPOSE / REVIEW';
  if (p === 'CRITICAL') return 'TRANSFER_TO_ARCHIVE';
  if (p === 'HIGH') return 'REVIEW';
  if (days <= 7) return 'REVIEW';
  return 'KEEP';
}

export function ReportsPage() {
  const { t } = useTranslation();
  const { documents } = useStore();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  useEffect(() => {
    api.get('/api/data/retention-alerts').then((d: { alerts: Alert[] }) => setAlerts(d.alerts || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filteredAlerts = alerts.filter((a) => filterType==='all' || a.type===filterType);
  const enriched = filteredAlerts.map((a) => {
    const doc = documents.find((dd) => dd.id === a.id) as unknown as { type?: string; priority?: string; ownerUserId?: string } | undefined;
    const pri = priorityFor(a, doc);
    return { ...a, pri, action: recommendedAction(pri.label, a.daysLeft), owner: (documents.find((dd) => dd.id === a.id) as any)?.uploadedBy || '—' };
  }).filter((e)=> filterPriority==='all' || e.pri.label===filterPriority).sort((a, b) => b.pri.order - a.pri.order || a.daysLeft - b.daysLeft);

  const exportCSV = () => {
    const rows = [['Document','Category','Owner','Retention','Expiration','DaysRemaining','Priority','RecommendedAction'], ...enriched.map((e) => [e.title, e.type, e.owner, '-', e.expiresAt.slice(0,10), String(e.daysLeft), e.pri.label, e.action])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const ael = document.createElement('a'); ael.href = url; ael.download = `reports-expiring-${new Date().toISOString().slice(0,10)}.csv`; ael.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('expiringDocs')}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t('retentionManagement')} — {t('priority')} & {t('classification')} & {t('documentType')}</p>
        </div>
        <Button variant="outline" icon={<Download className="h-4 w-4" />} onClick={exportCSV}>{t('export')} CSV</Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card><CardBody className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600"><AlertTriangle className="h-4 w-4" /></div><div><p className="text-xl font-bold">{enriched.filter((e)=>e.pri.label==='CRITICAL').length}</p><p className="text-xs text-neutral-500">Critical</p></div></CardBody></Card>
        <Card><CardBody className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600"><Clock className="h-4 w-4" /></div><div><p className="text-xl font-bold">{enriched.filter((e)=>e.daysLeft<=7 && e.daysLeft>0).length}</p><p className="text-xs text-neutral-500">≤7 days</p></div></CardBody></Card>
        <Card><CardBody className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-50 text-warning-600"><Shield className="h-4 w-4" /></div><div><p className="text-xl font-bold">{enriched.filter((e)=>['confidential','restricted','highly_confidential'].includes(e.classification)).length}</p><p className="text-xs text-neutral-500">Confidential</p></div></CardBody></Card>
        <Card><CardBody className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600"><Archive className="h-4 w-4" /></div><div><p className="text-xl font-bold">{enriched.length}</p><p className="text-xs text-neutral-500">Total expiring</p></div></CardBody></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Expiring Documents — Priority Sorted</CardTitle>
            <div className="flex gap-2 mt-2">
              <select value={filterType} onChange={(e)=> setFilterType(e.target.value)} className="h-8 rounded border border-neutral-200 px-2 text-xs"><option value="all">All types</option><option value="contract">Contract</option><option value="legal">Legal</option><option value="invoice">Invoice</option><option value="report">Report</option></select>
              <select value={filterPriority} onChange={(e)=> setFilterPriority(e.target.value)} className="h-8 rounded border border-neutral-200 px-2 text-xs"><option value="all">All priority</option><option value="CRITICAL">CRITICAL</option><option value="HIGH">HIGH</option><option value="MEDIUM">MEDIUM</option><option value="LOW">LOW</option></select>
            </div>
          </div>
          <Badge variant="warning">{enriched.length} documents</Badge>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? <p className="text-sm text-neutral-400 text-center py-8">Loading...</p> : enriched.length === 0 ? (
            <div className="text-center py-12"><FileText className="h-8 w-8 text-neutral-300 mx-auto" /><p className="text-sm text-neutral-500 mt-2">{t('noDocuments')}</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-xs text-neutral-500">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Document</th>
                    <th className="text-left px-3 py-2 font-medium">Category</th>
                    <th className="text-left px-3 py-2 font-medium">Owner</th>
                    <th className="text-left px-3 py-2 font-medium">Retention</th>
                    <th className="text-left px-3 py-2 font-medium">Expiration</th>
                    <th className="text-left px-3 py-2 font-medium">Days</th>
                    <th className="text-left px-3 py-2 font-medium">Priority</th>
                    <th className="text-left px-3 py-2 font-medium">Recommended Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {enriched.map((e) => (
                    <tr key={e.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium text-neutral-900 max-w-[220px] truncate">{e.title}</td>
                      <td className="px-3 py-2 text-neutral-600">{e.type}</td>
                      <td className="px-3 py-2 text-neutral-600">{e.owner}</td>
                      <td className="px-3 py-2 text-neutral-600">{e.expiresAt ? '-' : '-'}</td>
                      <td className="px-3 py-2 text-neutral-600 flex items-center gap-1"><Calendar className="h-3 w-3 text-neutral-400" />{formatDate(e.expiresAt)}</td>
                      <td className="px-3 py-2"><span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', e.daysLeft<=1?'bg-red-100 text-red-700': e.daysLeft<=7?'bg-orange-100 text-orange-700':'bg-neutral-100 text-neutral-600')}>{e.daysLeft}d</span></td>
                      <td className="px-3 py-2"><span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold', e.pri.color)}>{e.pri.label}</span></td>
                      <td className="px-3 py-2"><Badge variant={e.action==='TRANSFER_TO_ARCHIVE'?'primary':e.action==='REVIEW'?'warning':'neutral'}>{e.action}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
