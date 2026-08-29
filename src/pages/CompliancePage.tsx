import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Archive,
  Clock,
  AlertTriangle,
  FileText,
  Scale,
  Plus,
  Trash2,
  Check,
  X,
  Lock,
  RefreshCw,
  Search,
  BookOpen,
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/lib/toast';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { archiveConfig, formatDate, cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Document } from '@/types';

interface CompliancePageProps {
  onOpenDocument: (doc: Document) => void;
  onNavigate?: (page: string) => void;
}

interface RetentionPolicy {
  id: string;
  name: string;
  documentType: string;
  retentionYears: number;
  departmentId: string | null;
  jurisdiction: string | null;
  sector: string | null;
  isActive?: boolean;
}

interface ComplianceFramework {
  id: string;
  name: string;
  nameAr?: string;
  code: string;
  type: string;
  jurisdiction?: string;
  version?: string;
  description?: string;
  status: string;
  _count?: { requirements: number };
  latestAssessment?: {
    score: number;
    overallStatus: string;
    totalRequirements: number;
    compliantCount: number;
    partialCount: number;
    nonCompliantCount: number;
    unassessedCount: number;
    criticalGaps: number;
  } | null;
}

interface DashboardStats {
  totalLegalReferences: number;
  verifiedLegalReferences: number;
  unverifiedLegalReferences: number;
  totalArticles: number;
  activeLegalHolds: number;
  totalComplianceRequirements: number;
  overallScore: number;
  frameworkScores: Array<{ name: string; score: number; status: string }>;
  expiringDocuments: number;
  pendingDisposals: number;
}

export function CompliancePage({ onOpenDocument, onNavigate }: CompliancePageProps) {
  const { t, locale } = useTranslation();
  const { documents, updateDocument, departments, refreshData } = useStore();
  const { toast } = useToast();
  const [tab, setTab] = useState<'records' | 'retention' | 'legal-hold' | 'frameworks' | 'legal-kb' | 'disposal'>('records');
  const [retentionPolicies, setRetentionPolicies] = useState<RetentionPolicy[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<RetentionPolicy | null>(null);
  const [form, setForm] = useState({ name: '', documentType: 'other', retentionYears: 7, jurisdiction: '', sector: '' });
  const [holdPickerFor, setHoldPickerFor] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{open:boolean; message:string; onConfirm:()=>void}>({open:false,message:'',onConfirm:()=>{}});
  const [legalRefs, setLegalRefs] = useState<any[]>([]);
  const [loadingLegalRefs, setLoadingLegalRefs] = useState(false);
  const [disposals, setDisposals] = useState<any[]>([]);

  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [loadingFrameworks, setLoadingFrameworks] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [assessing, setAssessing] = useState<string | null>(null);

  const loadDisposals = useCallback(async () => {
    try { const d = await api.get('/api/data/disposal-requests') as { requests: any[] }; setDisposals(d.requests || []); } catch {}
  }, []);
  useEffect(() => { if (tab === 'disposal') loadDisposals(); }, [tab, loadDisposals]);

  const loadRetentionPolicies = useCallback(async () => {
    try {
      const data = await api.get('/api/data/retention-policies');
      if (data.policies) setRetentionPolicies(data.policies);
    } catch {}
  }, []);

  useEffect(() => { loadRetentionPolicies(); }, [loadRetentionPolicies]);

  const loadLegalRefs = useCallback(async () => {
    setLoadingLegalRefs(true);
    try {
      const data = await api.get('/api/compliance/legal-references') as { references: any[]; total: number };
      if (data.references) setLegalRefs(data.references);
    } catch { try { const data = await api.get('/api/data/legal-references') as { references: any[] }; if (data.references) setLegalRefs(data.references); } catch {} }
    setLoadingLegalRefs(false);
  }, []);

  useEffect(() => { if (tab === 'legal-kb') loadLegalRefs(); }, [tab, loadLegalRefs]);

  const loadFrameworks = useCallback(async () => {
    setLoadingFrameworks(true);
    try {
      const data = await api.get('/api/compliance/frameworks') as { frameworks: ComplianceFramework[] };
      if (data.frameworks) setFrameworks(data.frameworks);
    } catch {}
    setLoadingFrameworks(false);
  }, []);

  useEffect(() => { if (tab === 'frameworks') loadFrameworks(); }, [tab, loadFrameworks]);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await api.get('/api/compliance/dashboard') as DashboardStats;
      setDashboardStats(data);
    } catch {}
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const runAssessment = async (frameworkId: string) => {
    setAssessing(frameworkId);
    try {
      await api.post(`/api/compliance/frameworks/${frameworkId}/assess`);
      toast('success', t('complianceAssessment'));
      await loadFrameworks();
      await loadDashboard();
    } catch (e: unknown) { toast('error', e instanceof Error ? e.message : t('error')); }
    setAssessing(null);
  };

  const resetForm = () => { setForm({ name: '', documentType: 'other', retentionYears: 7, jurisdiction: '', sector: '' }); setEditing(null); setShowCreate(false); };

  const savePolicy = async () => {
    if (!form.name.trim()) { toast('warning', t('error')); return; }
    try {
      if (editing) {
        await api.patch(`/api/data/retention-policies/${editing.id}`, { name: form.name.trim(), documentType: form.documentType, retentionYears: Number(form.retentionYears), jurisdiction: form.jurisdiction || null, sector: form.sector || null });
        toast('success', t('success'));
      } else {
        await api.post('/api/data/retention-policies', { name: form.name.trim(), documentType: form.documentType, retentionYears: Number(form.retentionYears), jurisdiction: form.jurisdiction || null, sector: form.sector || null });
        toast('success', t('success'));
      }
      resetForm();
      await loadRetentionPolicies();
    } catch (e: unknown) { toast('error', e instanceof Error ? e.message : t('error')); }
  };

  const deletePolicy = async (id: string) => {
    setConfirm({
      open: true,
      message: `${t('delete')} ${t('retentionPolicies')}?`,
      onConfirm: async () => {
        try {
          await api.delete(`/api/data/retention-policies/${id}`);
          setRetentionPolicies((p) => p.filter((x) => x.id !== id));
          toast('success', t('documentDeleted'));
        } catch (e: unknown) { toast('error', e instanceof Error ? e.message : t('error')); }
      },
    });
  };

  const autoApply = async () => {
    if (retentionPolicies.length === 0) { toast('warning', t('noDocuments')); return; }
    let patched = 0;
    for (const doc of documents) {
      const match = retentionPolicies.find((p) => !p.documentType || p.documentType === doc.type || p.documentType === 'other');
      if (!match) continue;
      if (doc.legalHold) continue;
      if (doc.expiresAt) continue;
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + match.retentionYears);
      try {
        await updateDocument(doc.id, { expiresAt: expiresAt.toISOString() } as any);
        patched++;
      } catch {}
    }
    if (patched > 0) { toast('success', `${patched} ${t('documents')} ${t('success')}`); refreshData(); }
    else toast('info', t('noDocuments'));
  };

  const toggleHold = async (doc: Document) => {
    const next = !doc.legalHold;
    try {
      await updateDocument(doc.id, { legalHold: next } as any);
      toast('success', next ? t('legalHolds') : t('legalHolds'));
    } catch (e: unknown) { toast('error', e instanceof Error ? e.message : t('error')); }
  };

  const onHold = documents.filter((d) => d.legalHold);
  const archived = documents.filter((d) => d.archiveState === 'archived');
  const active = documents.filter((d) => d.archiveState === 'active');
  const expiring = documents.filter((d) => d.expiresAt && new Date(d.expiresAt).getTime() - Date.now() < 60 * 86400000);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success-600';
    if (score >= 50) return 'text-warning-600';
    return 'text-error-600';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLIANT': return <Badge variant="success" dot>{t('compliant')}</Badge>;
      case 'PARTIALLY_COMPLIANT': return <Badge variant="warning" dot>{t('partiallyCompliant')}</Badge>;
      case 'NON_COMPLIANT': return <Badge variant="error" dot>{t('nonCompliant')}</Badge>;
      default: return <Badge variant="neutral" dot>{t('notAssessed')}</Badge>;
    }
  };

  const tabs = [
    { key: 'records' as const, label: t('recordsManagement'), icon: Archive },
    { key: 'retention' as const, label: t('retentionPolicies'), icon: Clock },
    { key: 'legal-hold' as const, label: t('legalHolds'), icon: Shield },
    { key: 'frameworks' as const, label: t('compliance'), icon: Scale },
    { key: 'legal-kb' as const, label: t('legalKnowledgeBase'), icon: FileText },
    { key: 'disposal' as const, label: t('disposalQueue'), icon: Trash2 },
  ];

  return (
    <div className="space-y-5">
      <ConfirmDialog open={confirm.open} title={t('confirm')} message={confirm.message} confirmLabel={t('delete')} onConfirm={()=>{confirm.onConfirm(); setConfirm({...confirm,open:false})}} onCancel={()=>setConfirm({...confirm,open:false})} />
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{t('compliance')}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t('recordsManagement')} {t('retentionPolicies')} {t('legalHolds')} {t('compliance')}.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBox icon={<FileText className="h-4 w-4" />} label={t('recordsManagement')} value={active.length} color="bg-success-50 text-success-600" />
        <StatBox icon={<Archive className="h-4 w-4" />} label={t('auditLogs')} value={archived.length} color="bg-neutral-100 text-neutral-600" />
        <StatBox icon={<Shield className="h-4 w-4" />} label={t('legalHolds')} value={dashboardStats?.activeLegalHolds ?? onHold.length} color="bg-error-50 text-error-600" />
        <StatBox icon={<Clock className="h-4 w-4" />} label={t('expiringSoon')} value={dashboardStats?.expiringDocuments ?? expiring.length} color="bg-warning-50 text-warning-600" />
      </div>

      <div className="flex items-center gap-1 overflow-x-auto border-b border-neutral-200">
        {tabs.map((tItem) => {
          const Icon = tItem.icon;
          return (
            <button
              key={tItem.key}
              onClick={() => setTab(tItem.key)}
              className={cn(
                'flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
                tab === tItem.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-900'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tItem.label}
            </button>
          );
        })}
      </div>

      {tab === 'records' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('recordsManagement')}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" icon={<Archive className="h-3.5 w-3.5" />} onClick={async () => {
                const ids = documents.filter((d) => d.archiveState === 'active').slice(0, 10).map((d) => d.id);
                if (ids.length === 0) { toast('info', t('noDocuments')); return; }
                for (const id of ids) await updateDocument(id, { archiveState: 'archived' } as any);
                toast('success', `${ids.length} ${t('success')}`);
              }}>{t('auditLogs')}</Button>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {documents.length === 0 ? (
              <EmptyState icon={<FileText className="h-8 w-8" />} title={t('noDocuments')} description={t('noDocuments')} />
            ) : (
              <div className="divide-y divide-neutral-50">
                {documents.map((doc) => (
                  <button key={doc.id} onClick={() => onOpenDocument(doc)} className="flex w-full items-center gap-3 px-5 py-3 hover:bg-neutral-50 transition-colors text-left">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100">
                      <FileText className="h-4 w-4 text-neutral-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">{doc.title}</p>
                      <p className="text-xs text-neutral-400">{t('uploadedAt')} {formatDate(doc.modifiedAt)}</p>
                    </div>
                    <Badge variant="neutral" className={archiveConfig[doc.archiveState].color}>
                      {archiveConfig[doc.archiveState].label}
                    </Badge>
                    {doc.legalHold && <Shield className="h-4 w-4 text-error-500" />}
                    {doc.expiresAt && (
                      <span className="text-xs text-neutral-400 hidden sm:inline">{t('expiringSoon')} {formatDate(doc.expiresAt)}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'retention' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('retentionPolicies')}</CardTitle><InfoTooltip text={t('retentionPolicies')} />
            <div className="flex gap-2">
              {retentionPolicies.length > 0 && (
                <Button variant="ghost" size="sm" onClick={autoApply}>{t('confirm')}</Button>
              )}
              <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => { resetForm(); setShowCreate(true); }}>{t('save')}</Button>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {retentionPolicies.length === 0 ? (
              <EmptyState icon={<Clock className="h-8 w-8" />} title={t('retentionPolicies')} description={t('retentionPolicies')} action={<Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>{t('save')}</Button>} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50/50">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500">{t('retentionPolicies')}</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500">{t('documentType')}</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500">{t('retentionPolicies')}</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 hidden md:table-cell">{t('compliance')}</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 hidden md:table-cell">{t('department')}</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-neutral-500">{t('edit')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {retentionPolicies.map((policy) => (
                      <tr key={policy.id} className="hover:bg-neutral-50">
                        <td className="px-5 py-3 text-sm font-medium text-neutral-900">{policy.name}</td>
                        <td className="px-5 py-3 text-sm"><Badge variant="neutral">{policy.documentType || 'all'}</Badge></td>
                        <td className="px-5 py-3 text-sm text-neutral-600">{policy.retentionYears} {t('retentionPolicies')}</td>
                        <td className="px-5 py-3 text-sm text-neutral-500 hidden md:table-cell">{policy.jurisdiction || '—'}</td>
                        <td className="px-5 py-3 text-sm text-neutral-500 hidden md:table-cell">{policy.sector || '—'}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setEditing(policy); setForm({ name: policy.name, documentType: policy.documentType || 'other', retentionYears: policy.retentionYears, jurisdiction: policy.jurisdiction || '', sector: policy.sector || '' }); setShowCreate(true); }}>{t('edit')}</Button>
                            <Button variant="ghost" size="sm" onClick={() => deletePolicy(policy.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'legal-hold' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            {holdPickerFor === null ? (
              <Button variant="outline" size="sm" icon={<Lock className="h-3.5 w-3.5" />} onClick={() => setHoldPickerFor('pick')}>{t('legalHolds')}</Button>
            ) : (
              <div className="flex gap-2">
                <select onChange={async (e) => {
                  const id = e.target.value;
                  if (!id) return;
                  const doc = documents.find((d) => d.id === id);
                  if (!doc) return;
                  await toggleHold(doc);
                  setHoldPickerFor(null);
                }} defaultValue="" className="h-9 rounded-lg border border-neutral-200 px-3 text-sm">
                  <option value="">{t('search')}...</option>
                  {documents.filter((d) => !d.legalHold).slice(0, 50).map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
                </select>
                <Button variant="ghost" size="sm" icon={<X className="h-3.5 w-3.5" />} onClick={() => setHoldPickerFor(null)}>{t('cancel')}</Button>
              </div>
            )}
          </div>
          {onHold.length === 0 ? (
            <Card>
              <EmptyState icon={<Shield className="h-8 w-8" />} title={t('legalHolds')} description={t('legalHolds')} />
            </Card>
          ) : (
            onHold.map((doc) => (
              <Card key={doc.id} className="border-error-200">
                <CardBody>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-error-50">
                      <Shield className="h-5 w-5 text-error-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-neutral-900">{doc.title}</h3>
                        <Badge variant="error">{t('legalHolds')}</Badge>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">{t('uploadedAt')} {formatDate(doc.modifiedAt)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => onOpenDocument(doc)}>{t('view')}</Button>
                      <Button variant="ghost" size="sm" icon={<Check className="h-3.5 w-3.5" />} onClick={() => toggleHold(doc)}>{t('close')}</Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === 'frameworks' && (
        <div className="space-y-4">
          {dashboardStats && (
            <Card className="border-primary-200 bg-primary-50/30">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Scale className="h-5 w-5 text-primary-600" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{t('overallScore')}</p>
                      <p className="text-xs text-neutral-500">{dashboardStats.totalComplianceRequirements} {t('complianceFrameworks')}</p>
                    </div>
                  </div>
                  <div className={cn('text-2xl font-bold', getScoreColor(dashboardStats.overallScore))}>
                    {Math.round(dashboardStats.overallScore)}%
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {loadingFrameworks ? (
            <div className="text-center py-8 text-neutral-500">{t('loading')}</div>
          ) : frameworks.length === 0 ? (
            <Card>
              <EmptyState icon={<Scale className="h-8 w-8" />} title={t('complianceFrameworks')} description={t('complianceFrameworks')} />
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {frameworks.map((fw) => {
                const score = fw.latestAssessment?.score ?? 0;
                const status = fw.latestAssessment?.overallStatus ?? 'NOT_ASSESSED';
                const reqCount = fw._count?.requirements ?? 0;
                return (
                  <Card key={fw.id}>
                    <CardBody>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${score >= 80 ? 'bg-success-50' : score >= 50 ? 'bg-warning-50' : 'bg-neutral-100'}`}>
                            <Scale className={`h-5 w-5 ${score >= 80 ? 'text-success-600' : score >= 50 ? 'text-warning-600' : 'text-neutral-400'}`} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-neutral-900">{locale === 'ar' && fw.nameAr ? fw.nameAr : fw.name}</p>
                            <p className="text-xs text-neutral-500">{fw.code} · {fw.type} · {fw.jurisdiction || 'International'}</p>
                            {fw.version && <p className="text-[11px] text-neutral-400 mt-0.5">v{fw.version}</p>}
                            <div className="flex items-center gap-3 mt-2">
                              {getStatusBadge(status)}
                              {fw.latestAssessment && (
                                <span className={cn('text-sm font-bold', getScoreColor(score))}>{Math.round(score)}%</span>
                              )}
                              <span className="text-xs text-neutral-400">{reqCount} {locale === 'ar' ? 'متطلب' : 'requirements'}</span>
                            </div>
                            {fw.latestAssessment && (
                              <div className="flex gap-2 mt-2 text-[11px] text-neutral-500">
                                <span className="text-success-600">{fw.latestAssessment.compliantCount} ✓</span>
                                <span className="text-warning-600">{fw.latestAssessment.partialCount} ~</span>
                                <span className="text-error-600">{fw.latestAssessment.nonCompliantCount} ✗</span>
                                <span>{fw.latestAssessment.unassessedCount} ?</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button variant="outline" size="sm" onClick={() => runAssessment(fw.id)} disabled={assessing === fw.id}>
                            {assessing === fw.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Scale className="h-3.5 w-3.5" />}
                            {t('runAssessment')}
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}

          {onNavigate && (
            <Card className="border-primary-200 bg-primary-50/30">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Search className="h-5 w-5 text-primary-600" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{t('legalResearch')}</p>
                      <p className="text-xs text-neutral-500">{t('legalResearchDesc')}</p>
                    </div>
                  </div>
                  <Button size="sm" icon={<BookOpen className="h-3.5 w-3.5" />} onClick={() => onNavigate('legal-research')}>
                    {t('legalResearch')}
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {tab === 'legal-kb' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('legalKnowledgeBase')} — Algérie</CardTitle>
                  <p className="text-sm text-neutral-500 mt-1">{t('legalKnowledgeBaseDesc')}</p>
                </div>
                {onNavigate && (
                  <Button size="sm" icon={<Search className="h-3.5 w-3.5" />} onClick={() => onNavigate('legal-research')}>
                    {t('legalResearch')}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardBody>
              {loadingLegalRefs ? (
                <div className="text-center py-8 text-neutral-500">{t('loading')}</div>
              ) : legalRefs.length === 0 ? (
                <EmptyState icon={<FileText className="h-8 w-8" />} title={t('noDocuments')} description={t('noDocuments')} action={
                  onNavigate ? <Button size="sm" icon={<Search className="h-3.5 w-3.5" />} onClick={() => onNavigate('legal-research')}>{t('legalResearch')}</Button> : undefined
                } />
              ) : (
                <div className="space-y-3">
                  {legalRefs.map((ref) => {
                    const title = locale === 'ar' ? (ref.titleAr || ref.title) : locale === 'fr' ? (ref.titleFr || ref.title) : (ref.titleEn || ref.title);
                    const statusColor = ref.status === 'ACTIVE' ? 'success' : ref.status === 'UNVERIFIED' ? 'warning' : ref.status === 'REPEALED' ? 'error' : 'neutral';
                    return (
                    <div key={ref.id} className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={ref.referenceType === 'law' ? 'primary' : ref.referenceType === 'circular' ? 'warning' : ref.referenceType === 'international_standard' ? 'success' : 'neutral'}>
                              {ref.referenceType === 'law' ? (locale === 'ar' ? 'قانون' : 'Loi') : ref.referenceType === 'circular' ? (locale === 'ar' ? 'منشور' : 'Circulaire') : ref.referenceType === 'international_standard' ? (locale === 'ar' ? 'معيار' : 'Norme') : (locale === 'ar' ? 'قرار' : 'Décision')}
                            </Badge>
                            <span className="text-xs text-neutral-500">{ref.referenceNumber}</span>
                            <Badge variant={statusColor as any}>{ref.status}</Badge>
                            {ref.domain && <Badge variant="neutral">{ref.domain}</Badge>}
                            {ref.jurisdiction && <span className="text-[11px] text-neutral-400">{ref.jurisdiction}</span>}
                          </div>
                          <h3 className="text-sm font-semibold text-neutral-900 mt-2">{title}</h3>
                          {(ref.description || ref.summaryAr) && (
                            <p className="text-xs text-neutral-600 mt-1">{locale === 'ar' ? (ref.summaryAr || ref.description) : ref.description}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {ref.retentionRules?.minYears && (
                              <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                                {t('retention')}: {ref.retentionRules.minYears}-{ref.retentionRules.maxYears || ref.retentionRules.minYears} {locale==='ar'?'سنوات':locale==='fr'?'ans':'years'}
                              </span>
                            )}
                            {ref.officialSource && (
                              <span className="text-xs bg-success-50 text-success-600 px-2 py-0.5 rounded">{ref.officialSource}</span>
                            )}
                            {ref.keywords?.slice(0, 3).map((kw: string) => (
                              <span key={kw} className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded">{kw}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'disposal' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('disposalQueue')}</CardTitle>
              <Button variant="outline" size="sm" onClick={loadDisposals}>{t('refresh')}</Button>
            </CardHeader>
            <CardBody className="p-0">
              {disposals.length === 0 ? <div className="text-center py-12 text-sm text-neutral-500">{t('noDocuments')}</div> : (
                <div className="divide-y divide-neutral-100">
                  {disposals.map((r: { id: string; documentId: string; status: string; reason: string; requestedByName: string; createdAt: string }) => (
                    <div key={r.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{r.documentId.slice(0,8)}… <span className="text-xs text-neutral-500">{r.reason || '—'}</span></p>
                        <p className="text-xs text-neutral-400">{t('by')} {r.requestedByName} · {formatDate(r.createdAt)} · {r.status}</p>
                      </div>
                      {r.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={async()=>{ await api.patch(`/api/data/disposal-requests/${r.id}/approve`, {action:'approve'}); toast('success', t('approve')); loadDisposals(); }}>{t('approve')}</Button>
                          <Button size="sm" variant="outline" onClick={async()=>{ await api.patch(`/api/data/disposal-requests/${r.id}/approve`, {action:'reject'}); toast('success', t('reject')); loadDisposals(); }}>{t('reject')}</Button>
                        </div>
                      )}
                      {r.status !== 'pending' && <Badge variant={r.status==='approved'?'success':'neutral'}>{r.status}</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
          <Card className="border-warning-200 bg-warning-50/20"><CardBody><p className="text-xs text-warning-800"><strong>Audit:</strong> Every disposal logs: document, requester, reason, date, approver, time, policy, result. After DISPOSED, AuditLog retained even after file deletion.</p></CardBody></Card>
        </div>
      )}

      <Modal open={showCreate} onClose={resetForm} title={editing ? t('edit') : t('save')} footer={<><Button variant="outline" onClick={resetForm}>{t('cancel')}</Button><Button onClick={savePolicy}>{editing ? t('save') : t('save')}</Button></>}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">{t('retentionPolicies')}</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={t('retentionPolicies')} className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">{t('documentType')}</label>
              <select value={form.documentType} onChange={(e) => setForm((f) => ({ ...f, documentType: e.target.value }))} className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-sm">
                <option value="other">{t('allDocuments')}</option>
                <option value="invoice">Invoice</option>
                <option value="contract">Contract</option>
                <option value="report">Report</option>
                <option value="certificate">Certificate</option>
                <option value="policy">Policy</option>
                <option value="legal">Legal</option>
                <option value="financial">Financial</option>
                <option value="technical">Technical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">{t('retentionPolicies')}</label>
              <input type="number" min={1} max={100} value={form.retentionYears} onChange={(e) => setForm((f) => ({ ...f, retentionYears: Number(e.target.value) }))} className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">{t('compliance')} ({t('close')})</label>
              <input value={form.jurisdiction} onChange={(e) => setForm((f) => ({ ...f, jurisdiction: e.target.value }))} placeholder={t('compliance')} className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">{t('department')} ({t('close')})</label>
              <input value={form.sector} onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))} placeholder={t('department')} className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StatBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardBody className="flex items-center gap-3">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', color)}>
          {icon}
        </div>
        <div>
          <p className="text-xl font-bold text-neutral-900">{value}</p>
          <p className="text-xs text-neutral-500">{label}</p>
        </div>
      </CardBody>
    </Card>
  );
}
