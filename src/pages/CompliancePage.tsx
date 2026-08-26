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
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/lib/toast';
import { api } from '@/lib/api';
import { archiveConfig, formatDate, cn } from '@/lib/utils';
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
  const { documents, updateDocument, departments, refreshData } = useStore();
  const { toast } = useToast();
  const [tab, setTab] = useState<'records' | 'retention' | 'legal-hold' | 'frameworks'>('records');
  const [retentionPolicies, setRetentionPolicies] = useState<RetentionPolicy[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<RetentionPolicy | null>(null);
  const [form, setForm] = useState({ name: '', documentType: 'other', retentionYears: 7, jurisdiction: '', sector: '' });
  const [holdPickerFor, setHoldPickerFor] = useState<string | null>(null);

  const loadRetentionPolicies = useCallback(async () => {
    try {
      const data = await api.get('/api/data/retention-policies');
      if (data.policies) setRetentionPolicies(data.policies);
    } catch {}
  }, []);

  useEffect(() => { loadRetentionPolicies(); }, [loadRetentionPolicies]);

  const resetForm = () => { setForm({ name: '', documentType: 'other', retentionYears: 7, jurisdiction: '', sector: '' }); setEditing(null); setShowCreate(false); };

  const savePolicy = async () => {
    if (!form.name.trim()) { toast('warning', 'Policy name is required'); return; }
    try {
      if (editing) {
        await api.patch(`/api/data/retention-policies/${editing.id}`, { name: form.name.trim(), documentType: form.documentType, retentionYears: Number(form.retentionYears), jurisdiction: form.jurisdiction || null, sector: form.sector || null });
        toast('success', 'Policy updated');
      } else {
        await api.post('/api/data/retention-policies', { name: form.name.trim(), documentType: form.documentType, retentionYears: Number(form.retentionYears), jurisdiction: form.jurisdiction || null, sector: form.sector || null });
        toast('success', 'Policy created');
      }
      resetForm();
      await loadRetentionPolicies();
    } catch (e: unknown) { toast('error', e instanceof Error ? e.message : 'Failed to save policy'); }
  };

  const deletePolicy = async (id: string) => {
    if (!window.confirm('Delete this retention policy?')) return;
    try {
      await api.delete(`/api/data/retention-policies/${id}`);
      setRetentionPolicies((p) => p.filter((x) => x.id !== id));
      toast('success', 'Policy deleted');
    } catch (e: unknown) { toast('error', e instanceof Error ? e.message : 'Delete failed'); }
  };

  const autoApply = async () => {
    if (retentionPolicies.length === 0) { toast('warning', 'No policies to apply'); return; }
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
    if (patched > 0) { toast('success', `Applied retention to ${patched} document(s)`); refreshData(); }
    else toast('info', 'No documents needed updating');
  };

  const toggleHold = async (doc: Document) => {
    const next = !doc.legalHold;
    try {
      await updateDocument(doc.id, { legalHold: next } as any);
      toast('success', next ? 'Legal hold placed' : 'Legal hold released');
    } catch (e: unknown) { toast('error', e instanceof Error ? e.message : 'Failed to toggle legal hold'); }
  };

  const onHold = documents.filter((d) => d.legalHold);
  const archived = documents.filter((d) => d.archiveState === 'archived');
  const active = documents.filter((d) => d.archiveState === 'active');
  const expiring = documents.filter((d) => d.expiresAt && new Date(d.expiresAt).getTime() - Date.now() < 60 * 86400000);
  const hasActiveRetention = retentionPolicies.some((p) => p.isActive !== false);
  const hasLegalHoldCapability = true;

  const frameworkCards = [
    { name: 'ISO 15489', desc: 'Records Management', ready: documents.length > 0, detail: documents.length > 0 ? `${active.length} active records tracked` : 'No records yet' },
    { name: 'ISO 27001', desc: 'Information Security', ready: true, detail: 'SHA-256 hashing, access control, encrypted transport' },
    { name: 'ISO 27701', desc: 'Privacy Information Management', ready: true, detail: 'Retention policies + legal hold guard deletion' },
    { name: 'GDPR Principles', desc: 'Data protection (where applicable)', ready: hasActiveRetention && hasLegalHoldCapability, detail: hasActiveRetention ? 'Active retention policy configured' : 'Configure a retention policy to complete' },
  ];

  const tabs = [
    { key: 'records' as const, label: 'Records', icon: Archive },
    { key: 'retention' as const, label: 'Retention Policies', icon: Clock },
    { key: 'legal-hold' as const, label: 'Legal Hold', icon: Shield },
    { key: 'frameworks' as const, label: 'Frameworks', icon: Scale },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Compliance Center</h1>
        <p className="mt-1 text-sm text-neutral-500">Records management, retention policies, legal hold, and compliance frameworks.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBox icon={<FileText className="h-4 w-4" />} label="Active Records" value={active.length} color="bg-success-50 text-success-600" />
        <StatBox icon={<Archive className="h-4 w-4" />} label="Archived" value={archived.length} color="bg-neutral-100 text-neutral-600" />
        <StatBox icon={<Shield className="h-4 w-4" />} label="Legal Hold" value={onHold.length} color="bg-error-50 text-error-600" />
        <StatBox icon={<Clock className="h-4 w-4" />} label="Expiring Soon" value={expiring.length} color="bg-warning-50 text-warning-600" />
      </div>

      <div className="flex items-center gap-1 overflow-x-auto border-b border-neutral-200">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
                tab === t.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-900'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'records' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>All Records</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" icon={<Archive className="h-3.5 w-3.5" />} onClick={async () => {
                const ids = documents.filter((d) => d.archiveState === 'active').slice(0, 10).map((d) => d.id);
                if (ids.length === 0) { toast('info', 'No active records to archive'); return; }
                for (const id of ids) await updateDocument(id, { archiveState: 'archived' } as any);
                toast('success', `Archived ${ids.length} record(s)`);
              }}>Bulk Archive</Button>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {documents.length === 0 ? (
              <EmptyState icon={<FileText className="h-8 w-8" />} title="No records yet" description="Upload documents to start managing records." />
            ) : (
              <div className="divide-y divide-neutral-50">
                {documents.map((doc) => (
                  <button key={doc.id} onClick={() => onOpenDocument(doc)} className="flex w-full items-center gap-3 px-5 py-3 hover:bg-neutral-50 transition-colors text-left">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100">
                      <FileText className="h-4 w-4 text-neutral-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">{doc.title}</p>
                      <p className="text-xs text-neutral-400">Modified {formatDate(doc.modifiedAt)}</p>
                    </div>
                    <Badge variant="neutral" className={archiveConfig[doc.archiveState].color}>
                      {archiveConfig[doc.archiveState].label}
                    </Badge>
                    {doc.legalHold && <Shield className="h-4 w-4 text-error-500" />}
                    {doc.expiresAt && (
                      <span className="text-xs text-neutral-400 hidden sm:inline">Expires {formatDate(doc.expiresAt)}</span>
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
            <CardTitle>Retention Policies</CardTitle>
            <div className="flex gap-2">
              {retentionPolicies.length > 0 && (
                <Button variant="ghost" size="sm" onClick={autoApply}>Auto-apply to records</Button>
              )}
              <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => { resetForm(); setShowCreate(true); }}>Create Policy</Button>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {retentionPolicies.length === 0 ? (
              <EmptyState icon={<Clock className="h-8 w-8" />} title="No retention policies" description="Create retention policies to manage document lifecycle." action={<Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>Create Policy</Button>} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50/50">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500">Policy</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500">Document Type</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500">Retention</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 hidden md:table-cell">Jurisdiction</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 hidden md:table-cell">Sector</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-neutral-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {retentionPolicies.map((policy) => (
                      <tr key={policy.id} className="hover:bg-neutral-50">
                        <td className="px-5 py-3 text-sm font-medium text-neutral-900">{policy.name}</td>
                        <td className="px-5 py-3 text-sm"><Badge variant="neutral">{policy.documentType || 'all'}</Badge></td>
                        <td className="px-5 py-3 text-sm text-neutral-600">{policy.retentionYears} years</td>
                        <td className="px-5 py-3 text-sm text-neutral-500 hidden md:table-cell">{policy.jurisdiction || '—'}</td>
                        <td className="px-5 py-3 text-sm text-neutral-500 hidden md:table-cell">{policy.sector || '—'}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setEditing(policy); setForm({ name: policy.name, documentType: policy.documentType || 'other', retentionYears: policy.retentionYears, jurisdiction: policy.jurisdiction || '', sector: policy.sector || '' }); setShowCreate(true); }}>Edit</Button>
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
              <Button variant="outline" size="sm" icon={<Lock className="h-3.5 w-3.5" />} onClick={() => setHoldPickerFor('pick')}>Place Hold</Button>
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
                  <option value="">Select document…</option>
                  {documents.filter((d) => !d.legalHold).slice(0, 50).map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
                </select>
                <Button variant="ghost" size="sm" icon={<X className="h-3.5 w-3.5" />} onClick={() => setHoldPickerFor(null)}>Cancel</Button>
              </div>
            )}
          </div>
          {onHold.length === 0 ? (
            <Card>
              <EmptyState icon={<Shield className="h-8 w-8" />} title="No documents on legal hold" description="Legal hold prevents documents from being deleted or disposed, even if retention policies would normally allow it." />
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
                        <Badge variant="error">Legal Hold</Badge>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">Hold active since {formatDate(doc.modifiedAt)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => onOpenDocument(doc)}>View</Button>
                      <Button variant="ghost" size="sm" icon={<Check className="h-3.5 w-3.5" />} onClick={() => toggleHold(doc)}>Release</Button>
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
                  <p className="text-sm font-medium text-neutral-900">Compliance-Ready Architecture</p>
                  <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                    SADI PRO provides a compliance-ready architecture with configurable policies, audit capabilities, and records management controls.
                    This does not constitute legal compliance certification. Consult your legal team for jurisdiction-specific requirements.
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
                    <Badge variant={fw.ready ? 'success' : 'neutral'} dot>{fw.ready ? 'Ready' : 'Setup needed'}</Badge>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Modal open={showCreate} onClose={resetForm} title={editing ? 'Edit Retention Policy' : 'Create Retention Policy'} footer={<><Button variant="outline" onClick={resetForm}>Cancel</Button><Button onClick={savePolicy}>{editing ? 'Save' : 'Create'}</Button></>}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Policy name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Invoices - 7 years" className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Document type</label>
              <select value={form.documentType} onChange={(e) => setForm((f) => ({ ...f, documentType: e.target.value }))} className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-sm">
                <option value="other">All types</option>
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
              <label className="block text-xs font-medium text-neutral-700 mb-1">Retention (years)</label>
              <input type="number" min={1} max={100} value={form.retentionYears} onChange={(e) => setForm((f) => ({ ...f, retentionYears: Number(e.target.value) }))} className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Jurisdiction (optional)</label>
              <input value={form.jurisdiction} onChange={(e) => setForm((f) => ({ ...f, jurisdiction: e.target.value }))} placeholder="e.g. MA, EU" className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Sector (optional)</label>
              <input value={form.sector} onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))} placeholder="e.g. finance" className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none" />
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
