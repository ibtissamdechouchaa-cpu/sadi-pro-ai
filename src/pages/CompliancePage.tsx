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

export function CompliancePage({ onOpenDocument }: CompliancePageProps) {
  const { t } = useTranslation();
  const { documents, updateDocument, departments, refreshData } = useStore();
  const { toast } = useToast();
  const [tab, setTab] = useState<'records' | 'retention' | 'legal-hold' | 'frameworks'>('records');
  const [retentionPolicies, setRetentionPolicies] = useState<RetentionPolicy[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<RetentionPolicy | null>(null);
  const [form, setForm] = useState({ name: '', documentType: 'other', retentionYears: 7, jurisdiction: '', sector: '' });
  const [holdPickerFor, setHoldPickerFor] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{open:boolean; message:string; onConfirm:()=>void}>({open:false,message:'',onConfirm:()=>{}});
  const [legalRefs, setLegalRefs] = useState<any[]>([]);
  const [loadingLegalRefs, setLoadingLegalRefs] = useState(false);

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
      const data = await api.get('/api/data/legal-references');
      if (data.references) setLegalRefs(data.references);
    } catch {}
    setLoadingLegalRefs(false);
  }, []);

  useEffect(() => { loadLegalRefs(); }, [loadLegalRefs]);

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
  const hasActiveRetention = retentionPolicies.some((p) => p.isActive !== false);
  const hasLegalHoldCapability = true;

  const frameworkCards = [
    { name: 'ISO 15489', desc: t('recordsManagement'), ready: documents.length > 0, detail: documents.length > 0 ? `${active.length} ${t('recordsManagement')}` : t('noDocuments') },
    { name: 'ISO 27001', desc: t('security'), ready: true, detail: t('security') },
    { name: 'ISO 27701', desc: t('security'), ready: true, detail: `${t('retentionPolicies')} + ${t('legalHolds')}` },
    { name: 'GDPR Principles', desc: t('compliance'), ready: hasActiveRetention && hasLegalHoldCapability, detail: hasActiveRetention ? t('retentionPolicies') : t('compliance') },
  ];

  const tabs = [
    { key: 'records' as const, label: t('recordsManagement'), icon: Archive },
    { key: 'retention' as const, label: t('retentionPolicies'), icon: Clock },
    { key: 'legal-hold' as const, label: t('legalHolds'), icon: Shield },
    { key: 'frameworks' as const, label: t('compliance'), icon: Scale },
    { key: 'legal-kb' as const, label: 'Base de données juridique', icon: FileText },
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
        <StatBox icon={<Shield className="h-4 w-4" />} label={t('legalHolds')} value={onHold.length} color="bg-error-50 text-error-600" />
        <StatBox icon={<Clock className="h-4 w-4" />} label={t('expiringSoon')} value={expiring.length} color="bg-warning-50 text-warning-600" />
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
          <Card className="border-warning-200 bg-warning-50/30">
            <CardBody>
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">{t('compliance')} {t('recordsManagement')}</p>
                  <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                    {t('compliance')} {t('recordsManagement')} {t('compliance')}.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {frameworkCards.map((fw) => (
              <Card key={fw.name}>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${fw.ready ? 'bg-success-50' : 'bg-neutral-100'}`}>
                        <Scale className={`h-5 w-5 ${fw.ready ? 'text-success-600' : 'text-neutral-400'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">{fw.name}</p>
                        <p className="text-xs text-neutral-500">{fw.desc}</p>
                        <p className="text-[11px] text-neutral-400 mt-1">{fw.detail}</p>
                      </div>
                    </div>
                    <Badge variant={fw.ready ? 'success' : 'neutral'} dot>{fw.ready ? t('success') : t('error')}</Badge>
                  </div>
                </CardBody>
              </Card>
            ))}
           </div>
        </div>
      )}

      {tab === 'legal-kb' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Base de Connaissances Juridique Algérienne</CardTitle>
              <p className="text-sm text-neutral-500 mt-1">Lois, circulaires et décisions relatives à l'archivage et à la gestion documentaire en Algérie</p>
            </CardHeader>
            <CardBody>
              {loadingLegalRefs ? (
                <div className="text-center py-8 text-neutral-500">Chargement...</div>
              ) : legalRefs.length === 0 ? (
                <EmptyState icon={<FileText className="h-8 w-8" />} title="Aucune référence" description="Aucune référence juridique trouvée" />
              ) : (
                <div className="space-y-3">
                  {legalRefs.map((ref) => (
                    <div key={ref.id} className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={ref.referenceType === 'law' ? 'primary' : ref.referenceType === 'circular' ? 'warning' : 'success'}>
                              {ref.referenceType === 'law' ? 'Loi' : ref.referenceType === 'circular' ? 'Circulaire' : 'Décision'}
                            </Badge>
                            <span className="text-xs text-neutral-500">{ref.referenceNumber}</span>
                          </div>
                          <h3 className="text-sm font-semibold text-neutral-900 mt-2">{ref.title}</h3>
                          {ref.description && <p className="text-xs text-neutral-600 mt-1">{ref.description}</p>}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {ref.retentionRules?.minYears && (
                              <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                                Rétention: {ref.retentionRules.minYears}-{ref.retentionRules.maxYears || ref.retentionRules.minYears} ans
                              </span>
                            )}
                            {ref.retentionRules?.documentTypes?.slice(0, 3).map((dt: string) => (
                              <span key={dt} className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded">{dt}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
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
