import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  FileText,
  Download,
  Loader2,
  Share2,
  Trash2,
  Shield,
  Clock,
  Tag,
  History,
  Activity,
  Lock,
  Sparkles,
  AlertTriangle,
  Calendar,
  Building2,
  Hash,
  CheckCircle2,
  XCircle,
  ChevronRight,
  User as UserIcon,
  X,
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useStore } from '@/store/StoreContext';
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';
import {
  statusConfig,
  typeConfig,
  classificationConfig,
  archiveConfig,
  approvalConfig,
  languageConfig,
  getLanguageLabel,
  roleConfig,
  formatBytes,
  formatDate,
  timeAgo,
  cn,
} from '@/lib/utils';
import { useToast } from '@/lib/toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DocumentPreview } from '@/components/DocumentPreview';
import { ReasoningTrace } from '@/components/ReasoningTrace';
import { DocumentAskAI } from '@/components/DocumentAskAI';
import { WorkflowStepper } from '@/components/WorkflowStepper';
import type { Document } from '@/types';

interface DocumentDetailPageProps {
  document: Document;
  onBack: () => void;
  onOpenDocument: (doc: Document) => void;
}

type Tab = 'overview' | 'metadata' | 'insights' | 'versions' | 'activity' | 'permissions' | 'retention' | 'signatures' | 'translate';

export function DocumentDetailPage({ document: doc, onBack, onOpenDocument }: DocumentDetailPageProps) {
  const { t, locale } = useTranslation();
  const { documents, departments, users, updateDocument, deleteDocument, refreshData } = useStore();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('overview');
  const [showShare, setShowShare] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [aiStatus, setAiStatus] = useState<{ configured: boolean; message: string } | null>(null);
  
  const [confirm, setConfirm] = useState<{open:boolean; message:string; onConfirm:()=>void}>({open:false,message:'',onConfirm:()=>{}});
  const [retentionSuggestion, setRetentionSuggestion] = useState<any>(null);
  const [loadingRetention, setLoadingRetention] = useState(false);
  const [signatures, setSignatures] = useState<any[]>([]);
  const [loadingSignatures, setLoadingSignatures] = useState(false);
  const [translation, setTranslation] = useState('');
  const [translating, setTranslating] = useState(false);
  const [translationLang, setTranslationLang] = useState<'ar' | 'fr' | 'en'>('fr');
  const [processingAI, setProcessingAI] = useState(false);

  useEffect(() => {
    if (tab === 'signatures') {
      setLoadingSignatures(true);
      api.get(`/api/data/documents/${doc.id}/signatures`).then((d: unknown) => setSignatures((d as { signatures: unknown[] }).signatures as never[])).catch(() => {}).finally(() => setLoadingSignatures(false));
    }
    if (tab === 'insights' && !aiStatus) {
      fetch('/api/ai-status').then(r => r.json()).then(setAiStatus).catch(() => setAiStatus({ configured: false, message: 'Unable to check AI status.' }));
    }
  }, [tab, doc.id, aiStatus]);

  const department = departments.find((d) => d.id === doc.departmentId);
  const relatedDocs = documents.filter((d) => doc.relatedDocIds.includes(d.id));
  // sharedWith stores emails, not IDs — match by email or ID
  const sharedUsers = users.filter((u) => doc.sharedWith.includes(u.email) || doc.sharedWith.includes(u.id));

  const tabs: { key: Tab; label: string; icon: typeof FileText }[] = [
    { key: 'overview', label: t('view'), icon: FileText },
    { key: 'metadata', label: t('metadata'), icon: Tag },
    { key: 'insights', label: t('aiInsightsDoc'), icon: Sparkles },
    { key: 'versions', label: t('versions'), icon: History },
    { key: 'activity', label: t('activity'), icon: Activity },
    { key: 'permissions', label: t('permissions'), icon: Lock },
    { key: 'retention', label: t('retentionManagement'), icon: Clock },
    { key: 'signatures', label: t('signatures'), icon: CheckCircle2 },
    { key: 'translate', label: t('translate'), icon: FileText },
  ];

  const handleShare = async () => {
    const email = shareEmail.trim();
    if (!email) return;
    const newSharedWith = [...doc.sharedWith, email];
    await api.patch(`/api/data/documents/${doc.id}`, { sharedWith: newSharedWith });
    updateDocument(doc.id, { sharedWith: newSharedWith });
    setShareEmail('');
    setShowShare(false);
  };

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('sadi_token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/data/download/${doc.id}`, { headers });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cd = res.headers.get('Content-Disposition') || '';
        const m = cd.match(/filename\*?=(?:UTF-8''|")?([^";\n]+)/);
        a.download = m ? decodeURIComponent(m[1].replace(/"/g, '')) : `${doc.title}.${doc.fileType || 'bin'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        return;
      }
      if (res.status === 404) {
        // Fallback: try preview as text download for docs without stored file
        const pr = await fetch(`/api/data/preview/${doc.id}`, { headers });
        if (pr.ok) {
          const blob = await pr.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = blob.type.includes('html') ? `${doc.title}.html` : `${doc.title}.txt`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 2000);
          return;
        }
      }
      throw new Error('Download failed');
    } catch (err) {
      console.error('Download failed:', err);
      toast('error', t('error'));
    }
  };

  const handleRestore = async (versionNumber: number) => {
    await api.patch(`/api/data/documents/${doc.id}`, { version: versionNumber });
    updateDocument(doc.id, { version: versionNumber });
  };

  const handleDelete = async () => {
    if (doc.legalHold) { toast('warning', t('legalHolds')); return; }
    setConfirm({
      open: true,
      message: `${t('delete')} "${doc.title}"?`,
      onConfirm: async () => {
        try {
          await deleteDocument(doc.id);
          toast('success', t('documentDeleted'));
          onBack();
        } catch (e: unknown) {
          toast('error', e instanceof Error ? e.message : t('error'));
        }
      },
    });
  };

  return (
    <div className="space-y-5">
      <ConfirmDialog open={confirm.open} title={t('confirm')} message={confirm.message} confirmLabel={t('delete')} onConfirm={()=>{confirm.onConfirm(); setConfirm({...confirm,open:false})}} onCancel={()=>setConfirm({...confirm,open:false})} />
      {/* Breadcrumb / back */}
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
          <ArrowLeft className="h-4 w-4" /> {t('back')} {t('documents')}
        </button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
            <FileText className="h-7 w-7 text-neutral-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-900 truncate">{doc.title}</h1>
              {doc.legalHold && (
                <Badge variant="error" className="shrink-0">
                  <Shield className="h-3 w-3" /> {t('legalHolds')}
                </Badge>
              )}
            </div>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <Badge variant="neutral" className={statusConfig[doc.status].color} dot>
                {statusConfig[doc.status].label}
              </Badge>
              <Badge variant="neutral">{typeConfig[doc.type].label}</Badge>
              <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium', classificationConfig[doc.classification].color)}>
                {classificationConfig[doc.classification].label}
              </span>
              <span className="text-xs text-neutral-400">·</span>
              <span className="text-xs text-neutral-500">{formatBytes(doc.fileSize)}</span>
              <span className="text-xs text-neutral-400">·</span>
              <span className="text-xs text-neutral-500">{doc.pageCount} {t('documents')}</span>
              <span className="text-xs text-neutral-400">·</span>
              <span className="text-xs text-neutral-500">{getLanguageLabel(doc.language, t)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 relative">
          <div>
            <Button variant="outline" size="sm" icon={<Share2 className="h-3.5 w-3.5" />} onClick={() => setShowShare(!showShare)}>
              {t('export')}
            </Button>
            {showShare && (
              <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-neutral-200 bg-white p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-neutral-900">{t('export')} {t('documents')}</p>
                  <button onClick={() => setShowShare(false)} className="text-neutral-400 hover:text-neutral-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    placeholder={t('email')}
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleShare()}
                    className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
                  />
                  <Button variant="primary" size="sm" onClick={handleShare}>
                    {t('save')}
                  </Button>
                </div>
                {doc.sharedWith.length > 0 && (
                  <div className="mt-3 border-t border-neutral-100 pt-3 space-y-2">
                    <p className="text-xs text-neutral-400">{t('team')}:</p>
                    {doc.sharedWith.map((email) => (
                      <div key={email} className="flex items-center gap-2 text-xs text-neutral-600">
                        <div className="h-5 w-5 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-[10px] font-medium">
                          {email[0].toUpperCase()}
                        </div>
                        {email}
                      </div>
                    ))}
                  </div>
            )}
          </div>
        )}

        {tab === 'retention' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('retentionManagement')}</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-neutral-200 p-4">
                    <p className="text-sm font-medium text-neutral-700">{t('retention')}</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">{doc.retentionYears ? `${doc.retentionYears} ${locale==='ar'?'سنوات':locale==='fr'?'ans':'years'}` : (locale==='ar'?'غير محددة':locale==='fr'?'Non définie':'Not defined')}</p>
                  </div>
                  <div className="rounded-lg border border-neutral-200 p-4">
                    <p className="text-sm font-medium text-neutral-700">{t('expiration')}</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">{doc.expiresAt ? formatDate(doc.expiresAt) : 'N/A'}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setLoadingRetention(true);
                      try {
                        const data = await api.get(`/api/data/documents/${doc.id}/retention-suggestion?lang=${locale}`);
                        setRetentionSuggestion(data.suggestion);
                      } catch (e) { toast('error', t('error')); }
                      setLoadingRetention(false);
                    }}
                    disabled={loadingRetention}
                  >
                    {loadingRetention ? t('loading') : t('retentionSuggestion')}
                  </Button>
                </div>

                {retentionSuggestion && (
                  <div className="rounded-lg border border-primary-200 bg-primary-50/30 p-4 space-y-3">
                    <p className="text-sm font-medium text-primary-900">{t('retentionSuggestion')}</p>
                    <p className="text-sm text-primary-700 mt-1">{retentionSuggestion.reason}</p>
                    <p className="text-xs text-primary-600">{t('retention')}: {retentionSuggestion.retentionYears} {locale==='ar'?'سنوات':locale==='fr'?'ans':'years'} | {t('confidence')}: {Math.round((retentionSuggestion.confidence || 0) * 100)}% | {t('applicableRule')}: {retentionSuggestion.applicableRule || '—'} | {t('recommendedAction')}: {retentionSuggestion.action || '—'}</p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button size="sm" onClick={async () => {
                        try { await api.patch(`/api/data/documents/${doc.id}/retention`, { retentionYears: retentionSuggestion.retentionYears, reason: `Accepted AI suggestion: ${retentionSuggestion.reason}` }); toast('success', t('accept')); await refreshData(); } catch { toast('error', t('error')); }
                      }}>{t('accept')}</Button>
                      <Button variant="outline" size="sm" onClick={async () => {
                        const v = prompt(locale==='ar'?'تعديل سنوات الاحتفاظ:':locale==='fr'?'Modifier retention:':'Modify retention years:', String(retentionSuggestion.retentionYears));
                        if (!v) return;
                        try { await api.patch(`/api/data/documents/${doc.id}/retention`, { retentionYears: Number(v), reason: 'Modified by user' }); toast('success', t('modify')); await refreshData(); } catch { toast('error', t('error')); }
                      }}>{t('modify')}</Button>
                      <Button variant="ghost" size="sm" onClick={async () => {
                        try { await api.post('/api/data/compliance-check/' + doc.id, {}); toast('success', t('reject')); await api.patch(`/api/data/documents/${doc.id}/retention`, { retentionYears: doc.retentionYears || 5, reason: 'Rejected AI, kept current' }); } catch { toast('error', t('error')); }
                      }}>{t('reject')}</Button>
                      <Button variant="ghost" size="sm" onClick={async () => {
                        try { const r = await api.post(`/api/data/compliance-check/${doc.id}`) as { traceability: Array<{ referenceNumber: string; title: string }> }; toast('success', `${t('traceability')}: ${r.traceability?.[0]?.referenceNumber || '—'}`); } catch { toast('error', t('error')); }
                      }}>{t('traceability')}</Button>
                    </div>
                  </div>
                )}
                <div className="rounded-lg border border-neutral-200 p-4">
                  <p className="text-xs font-medium text-neutral-700 mb-2">{locale==='ar'?'تحديث يدوي':'Mise à jour manuelle'}</p>
                  <div className="flex items-center gap-2">
                    <input id="manualRet" type="number" placeholder={locale==='ar'?'سنوات':locale==='fr'?'Ans':'Years'} className="h-9 w-24 rounded-lg border border-neutral-200 px-3 text-sm" defaultValue={doc.retentionYears ?? ''} />
                    <Button size="sm" variant="outline" onClick={async () => {
                      const el = document.getElementById('manualRet') as HTMLInputElement;
                      const v = Number(el.value);
                      if (!v) return;
                      try { await api.patch(`/api/data/documents/${doc.id}/retention`, { retentionYears: v, reason: 'Manual update' }); toast('success', t('save')); await refreshData(); } catch { toast('error', t('error')); }
                    }}>{t('save')}</Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {tab === 'signatures' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t('electronicSignature')}</CardTitle>
                <Button variant="outline" size="sm" onClick={async () => {
                  setLoadingSignatures(true);
                  try { const d = await api.get(`/api/data/documents/${doc.id}/signatures`) as { signatures: any[] }; setSignatures(d.signatures); } catch {} setLoadingSignatures(false);
                }}>{loadingSignatures ? '...' : 'Refresh'}</Button>
              </CardHeader>
              <CardBody className="space-y-3">
                <div className="flex gap-2">
                  <input id="sigEmail" placeholder="signer@email.com" className="flex-1 h-9 rounded-lg border border-neutral-200 px-3 text-sm" />
                  <input id="sigName" placeholder="Name" className="w-32 h-9 rounded-lg border border-neutral-200 px-3 text-sm" />
                  <Button size="sm" onClick={async ()=>{
                    const email = (document.getElementById('sigEmail') as HTMLInputElement).value.trim();
                    const name = (document.getElementById('sigName') as HTMLInputElement).value.trim() || email;
                    if(!email) return;
                    try { await api.post(`/api/data/documents/${doc.id}/signatures`, { signers: [{ email, name, order: signatures.length + 1 }] }); toast('success','Signer added'); const d = await api.get(`/api/data/documents/${doc.id}/signatures`) as { signatures: any[] }; setSignatures(d.signatures); } catch{ toast('error', t('error'))}
                  }}>Add Signer</Button>
                </div>
                {signatures.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-neutral-300 mx-auto" />
                    <p className="text-sm text-neutral-500 mt-3">No signatures — add signers to start workflow</p>
                    <p className="text-xs text-neutral-400 mt-1">NOT_REQUIRED → PENDING → IN_PROGRESS → SIGNED/REJECTED/EXPIRED · Traçabilité: Signer/Date/Version</p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {signatures.map((s: { id: string; signerName: string; signerEmail: string; order: number; status: string; signedAt?: string; documentVersion: number }) => (
                      <div key={s.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{s.signerName} <span className="text-xs text-neutral-500">#{s.order} · v{s.documentVersion}</span></p>
                          <p className="text-xs text-neutral-500">{s.signerEmail} · {s.status}{s.signedAt ? ` · ${formatDate(s.signedAt)}` : ''}</p>
                        </div>
                        <div className="flex gap-1">
                          {s.status === 'pending' && <><Button size="sm" variant="outline" onClick={async ()=>{ await api.patch(`/api/data/signatures/${s.id}/sign`, { action: 'sign' }); const d = await api.get(`/api/data/documents/${doc.id}/signatures`) as { signatures: any[] }; setSignatures(d.signatures); toast('success','Signed') }}>Sign</Button><Button size="sm" variant="ghost" onClick={async ()=>{ await api.patch(`/api/data/signatures/${s.id}/sign`, { action: 'reject' }); const d = await api.get(`/api/data/documents/${doc.id}/signatures`) as { signatures: any[] }; setSignatures(d.signatures); }}>Reject</Button></>}
                          {s.status !== 'pending' && <Badge variant={s.status==='signed'?'success': s.status==='rejected'?'error':'neutral'}>{s.status}</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-neutral-400">Document signatureState: { (doc as { signatureState?: string }).signatureState || 'not_required' } · v{doc.version} locked after SIGNED · new edit creates new version</p>
              </CardBody>
            </Card>
          </div>
        )}

        {tab === 'translate' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('translate')} IA</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex items-center gap-2">
                  <select
                    value={translationLang}
                    onChange={(e) => setTranslationLang(e.target.value as 'ar' | 'fr' | 'en')}
                    className="h-9 rounded-lg border border-neutral-200 px-3 text-sm"
                  >
                    <option value="ar">Arabe</option>
                    <option value="fr">Français</option>
                    <option value="en">Anglais</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setTranslating(true);
                      try {
                        const data = await api.post(`/api/data/documents/${doc.id}/translate`, { targetLang: translationLang });
                        setTranslation(data.translation);
                      } catch (e) { toast('error', t('error')); }
                      setTranslating(false);
                    }}
                    disabled={translating}
                  >
                    {translating ? 'Traduction...' : 'Traduire'}
                  </Button>
                </div>

                {translation && (
                  <div className="rounded-lg border border-neutral-200 p-4 bg-neutral-50">
                    <p className="text-sm text-neutral-900 whitespace-pre-wrap">{translation}</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}
          </div>
          <Button variant="outline" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={handleDownload}>
            {t('download')}
          </Button>
          <Button variant="ghost" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={handleDelete}>
            {t('delete')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: document preview */}
        <div className="lg:col-span-1">
          <Card>
            <CardBody className="p-3">
              <DocumentPreview docId={doc.id} fileType={doc.fileType} title={doc.title} />
            </CardBody>
          </Card>
        </div>

      {/* Right: tabs */}
      <div className="lg:col-span-2 space-y-4">
        {/* Tab bar */}
        <div role="tablist" className="flex items-center gap-1 overflow-x-auto border-b border-neutral-200">
          {tabs.map((tabItem) => {
            const Icon = tabItem.icon;
            return (
              <button
                key={tabItem.key}
                role="tab"
                aria-selected={tab === tabItem.key}
                onClick={() => setTab(tabItem.key)}
                className={cn(
                  'flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap focus-ring',
                  tab === tabItem.key
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-200'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tabItem.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {tab === 'overview' && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Workflow</CardTitle></CardHeader>
              <CardBody>
                <WorkflowStepper approvalState={doc.approvalState} archiveState={doc.archiveState} status={doc.status} />
                <div className="flex flex-wrap gap-2 mt-3">
                  {doc.approvalState === 'draft' && <Button size="sm" onClick={async()=>{ await api.patch(`/api/data/documents/${doc.id}/status`, {status:'pending_review'}); toast('success','Sent for review'); await refreshData(); }}>Send for Review</Button>}
                  {doc.approvalState === 'pending_review' && <><Button size="sm" variant="outline" onClick={async()=>{ await api.patch(`/api/data/documents/${doc.id}/status`, {status:'approved'}); toast('success','Approved'); await refreshData(); }}>Approve</Button><Button size="sm" variant="ghost" onClick={async()=>{ await api.patch(`/api/data/documents/${doc.id}/status`, {status:'rejected'}); toast('error','Rejected'); await refreshData(); }}>Reject</Button></>}
                  {doc.approvalState === 'approved' && <Button size="sm" onClick={async()=>{ await api.post(`/api/data/documents/${doc.id}/signatures`, {signers:[{email:doc.uploadedBy || 'signer@example.com', name:'Signer', order:1}]}); toast('success','Sent for signature'); await refreshData(); }}>Send for Signature</Button>}
                  {(doc.approvalState === 'approved' || doc.approvalState === 'signed') && doc.archiveState !== 'permanent_archive' && <Button size="sm" variant="outline" onClick={async()=>{ await api.patch(`/api/data/documents/${doc.id}/permanent-archive`, {}); toast('success','Moved to Permanent Archive'); await refreshData(); }}>To Permanent Archive</Button>}
                  {doc.archiveState === 'active' && <Button size="sm" variant="outline" onClick={async()=>{ await api.post('/api/data/disposal-requests', {documentId:doc.id, reason:'Retention expired'}); toast('success','Disposal requested'); await refreshData(); }}>Request Disposal</Button>}
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardHeader><CardTitle>{t('metadata')}</CardTitle></CardHeader>
              <CardBody className="grid grid-cols-2 gap-4">
                <InfoRow icon={<FileText className="h-3.5 w-3.5" />} label={t('documentType')} value={typeConfig[doc.type].label} />
                <InfoRow icon={<Building2 className="h-3.5 w-3.5" />} label={t('department')} value={department?.name || t('noDocuments')} />
                <InfoRow icon={<UserIcon className="h-3.5 w-3.5" />} label={t('fullName')} value={doc.uploadedBy} />
                <InfoRow icon={<Clock className="h-3.5 w-3.5" />} label={t('uploadedAt')} value={formatDate(doc.uploadedAt)} />
                <InfoRow icon={<Clock className="h-3.5 w-3.5" />} label={t('uploadedAt')} value={formatDate(doc.modifiedAt)} />
                <div className="flex items-start gap-2">
                  <Hash className="h-3.5 w-3.5 text-neutral-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-500">SHA-256</p>
                    <p className="text-xs font-mono text-neutral-900 break-all" title={doc.hash || t('processing')}>
                      {doc.hash ? `${doc.hash.slice(0, 16)}…${doc.hash.slice(-8)}` : t('processing')}
                    </p>
                    {doc.hash && doc.hash.length === 64 && <span className="text-[10px] text-success-600">✓ {t('success')}</span>}
                  </div>
                  {doc.hash && (
                    <button onClick={() => { navigator.clipboard.writeText(doc.hash); toast('success', t('success')); }} className="text-xs text-primary-600 hover:text-primary-700 shrink-0">{t('view')}</button>
                  )}
                </div>
                <InfoRow icon={<Tag className="h-3.5 w-3.5" />} label={t('version')} value={`v${doc.version}`} />
                <InfoRow icon={<Activity className="h-3.5 w-3.5" />} label={t('status')} value={statusConfig[doc.status].label} />
              </CardBody>
            </Card>

            {doc.tags.length > 0 && (
              <Card>
                <CardHeader><CardTitle>{t('tags')}</CardTitle></CardHeader>
                <CardBody className="flex flex-wrap gap-2">
                  {doc.tags.map((tag) => (
                    <Badge key={tag} variant="default">#{tag}</Badge>
                  ))}
                </CardBody>
              </Card>
            )}

            {relatedDocs.length > 0 && (
              <Card>
                <CardHeader><CardTitle>{t('allDocuments')}</CardTitle></CardHeader>
                <CardBody className="p-0">
                  <div className="divide-y divide-neutral-50">
                    {relatedDocs.map((rel) => (
                      <button
                        key={rel.id}
                        onClick={() => onOpenDocument(rel)}
                        className="flex w-full items-center gap-3 px-5 py-3 hover:bg-neutral-50 transition-colors text-left"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100">
                          <FileText className="h-4 w-4 text-neutral-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">{rel.title}</p>
                          <p className="text-xs text-neutral-400">{typeConfig[rel.type].label} · {formatBytes(rel.fileSize)}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-neutral-300" />
                      </button>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        )}

        {tab === 'metadata' && (
          <Card>
            <CardHeader><CardTitle>{t('metadata')}</CardTitle></CardHeader>
            <CardBody className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <InfoRow icon={<FileText className="h-3.5 w-3.5" />} label={t('documentType')} value={typeConfig[doc.type].label} />
                <InfoRow icon={<Building2 className="h-3.5 w-3.5" />} label={t('department')} value={department?.name || '—'} />
                <InfoRow icon={<UserIcon className="h-3.5 w-3.5" />} label={t('fullName')} value={doc.uploadedBy || '—'} />
                <InfoRow icon={<Clock className="h-3.5 w-3.5" />} label={t('uploadedAt')} value={formatDate(doc.uploadedAt)} />
                <InfoRow icon={<Clock className="h-3.5 w-3.5" />} label={t('modifiedAt') || t('uploadedAt')} value={formatDate(doc.modifiedAt)} />
                <InfoRow icon={<Tag className="h-3.5 w-3.5" />} label={t('version')} value={`v${doc.version}`} />
                <InfoRow icon={<Activity className="h-3.5 w-3.5" />} label={t('status')} value={statusConfig[doc.status].label} />
                <InfoRow icon={<Shield className="h-3.5 w-3.5" />} label={t('classification')} value={classificationConfig[doc.classification].label} />
              </div>
              {Object.keys(doc.metadata).length > 0 && (
                <>
                  <div className="pt-3 border-t border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">{t('metadata')}</p>
                    <div className="space-y-2">
                      {Object.entries(doc.metadata)
                        .filter(([key]) => !['insight', 'analysis', 'processedAt', 'analyzedAt'].includes(key))
                        .map(([key, value]) => {
                          const displayValue = typeof value === 'object' && value !== null
                            ? Array.isArray(value) ? value.join(', ') : null
                            : String(value ?? '');
                          if (displayValue === null || displayValue === '[object Object]') return null;
                          return (
                            <div key={key} className="flex items-center justify-between border-b border-neutral-50 pb-2">
                              <span className="text-sm text-neutral-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <span className="text-sm font-medium text-neutral-900 truncate max-w-[200px]" title={displayValue}>{displayValue}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </>
              )}
              {doc.insight && (
                <>
                  <div className="pt-3">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">{t('aiInsights')}</p>
                    <div className="space-y-2">
                      {doc.insight.keyEntities.map((entity: unknown, i: number) => {
                        const e = entity as { type?: string; value?: string; confidence?: number } | string;
                        const isStr = typeof e === 'string';
                        const value = isStr ? e : String(e.value ?? e);
                        const type = isStr ? 'entity' : String(e.type ?? 'entity');
                        const conf = isStr ? 0.7 : Number((e as { confidence?: number }).confidence ?? 0.7);
                        return (
                          <div key={i} className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-neutral-400">{type}</span>
                              <span className="text-sm font-medium text-neutral-900">{value}</span>
                            </div>
                            <Badge variant={conf > 0.9 ? 'success' : 'warning'}>
                              {Number.isFinite(conf) ? `${Math.round(conf * 100)}%` : '—'}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        )}

        {tab === 'insights' && (
          <div className="space-y-4">
            {aiStatus && !aiStatus.configured && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">{locale === 'ar' ? 'مفتاح AI غير مُعد' : 'AI non configuré'}</p>
                    <p className="text-xs text-amber-700 mt-1">
                      {locale === 'ar'
                        ? 'لا يوجد مزود ذكاء اصطناعي مُعد. التحليل يعمل بتقنية بحتة (بدون AI حقيقي). لإعداد Gemini المجاني: '
                        : 'Aucun fournisseur IA configuré. L\'analyse utilise des heuristiques. Pour Gemini gratuit : '}
                      <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" className="underline font-medium">aistudio.google.com/apikey</a>
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      {locale === 'ar'
                        ? '→ أضف GEMINI_API_KEY في Render Environment'
                        : '→ Ajoutez GEMINI_API_KEY dans Render Environment'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {doc.insight?.reasoning && doc.insight.reasoning.length > 0 && (
              <ReasoningTrace steps={doc.insight.reasoning} summary={doc.insight.reasoningSummary} defaultOpen={false} />
            )}
            {doc.insight ? (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary-600" />
                        <CardTitle>{t('aiInsightsDoc')}</CardTitle>
                      </div>
                      <Badge variant={doc.insight.confidence > 0.9 ? 'success' : 'warning'}>
                        {Math.round(doc.insight.confidence * 100)}% {t('success')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <p className="text-sm text-neutral-700 leading-relaxed">{doc.insight.summary}</p>
                  </CardBody>
                </Card>

                {doc.insight.importantDates.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-accent-600" />
                        <CardTitle>{t('uploadedAt')}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardBody className="space-y-2">
                      {doc.insight.importantDates.map((d: unknown, i: number) => {
                        const isObj = typeof d === 'object' && d !== null && 'date' in (d as Record<string, unknown>);
                        const dateStr = isObj ? String((d as { date: string }).date) : String(d);
                        const label = isObj ? String((d as { label?: string }).label || dateStr) : dateStr;
                        const conf = isObj ? Number((d as { confidence?: number }).confidence ?? 0.6) : 0.5;
                        return (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm text-neutral-600">{label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-neutral-900">{formatDate(dateStr)}</span>
                              <Badge variant={conf > 0.9 ? 'success' : 'warning'}>
                                {Number.isFinite(conf) ? `${Math.round(conf * 100)}%` : '—'}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </CardBody>
                  </Card>
                )}

                {doc.insight.risks.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning-600" />
                        <CardTitle>{t('error')}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardBody className="space-y-2">
                      {doc.insight.risks.map((risk, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-lg bg-warning-50 px-3 py-2">
                          <AlertTriangle className="h-4 w-4 text-warning-600 shrink-0 mt-0.5" />
                          <p className="text-sm text-neutral-700">{risk}</p>
                        </div>
                      ))}
                    </CardBody>
                  </Card>
                )}

                {doc.insight.missingInfo.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-error-600" />
                        <CardTitle>{t('error')}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardBody className="space-y-2">
                      {doc.insight.missingInfo.map((info, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-lg bg-error-50 px-3 py-2">
                          <XCircle className="h-4 w-4 text-error-600 shrink-0 mt-0.5" />
                          <p className="text-sm text-neutral-700">{info}</p>
                        </div>
                      ))}
                    </CardBody>
                  </Card>
                )}

                {doc.insight.suggestedTags.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle>{t('tags')}</CardTitle></CardHeader>
                    <CardBody>
                      <div className="flex flex-wrap gap-2">
                        {doc.insight.suggestedTags.map((tag) => {
                          const alreadyAdded = doc.tags.includes(tag);
                          return (
                            <button
                              key={tag}
                              onClick={() => {
                                if (!alreadyAdded) {
                                  updateDocument(doc.id, { tags: [...doc.tags, tag] });
                                }
                              }}
                              disabled={alreadyAdded}
                              className={cn(
                                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                                alreadyAdded
                                  ? 'border-success-200 bg-success-50 text-success-700'
                                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700'
                              )}
                            >
                              {alreadyAdded && <CheckCircle2 className="h-3 w-3" />}
                              #{tag}
                            </button>
                          );
                        })}
                      </div>
                    </CardBody>
                  </Card>
                )}
                <DocumentAskAI docId={doc.id} />
              </>
            ) : (
              <>
              <DocumentAskAI docId={doc.id} />
              <Card>
                <CardBody className="flex flex-col items-center py-16">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 mb-4">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-medium text-neutral-600">{t('aiInsights')}</p>
                  <p className="mt-1 text-xs text-neutral-400 max-w-sm text-center mb-4">
                    {t('aiInsights')}
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={processingAI}
                    icon={processingAI ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    onClick={async () => {
                      setProcessingAI(true);
                      try {
                        const token = localStorage.getItem('sadi_token');
                        const res = await fetch(`/api/data/documents/${doc.id}/process`, {
                          method: 'POST',
                          headers: token ? { Authorization: `Bearer ${token}` } : {},
                        });
                        if (res.ok) {
                          toast('success', t('success'));
                          await refreshData();
                        } else {
                          toast('error', t('error'));
                        }
                      } catch {
                        toast('error', t('error'));
                      } finally {
                        setProcessingAI(false);
                      }
                    }}
                  >
                    {processingAI ? (locale === 'ar' ? 'جاري التحليل...' : 'Analyse en cours...') : t('aiInsights')}
                  </Button>
                </CardBody>
              </Card>
              </>
            )}
          </div>
        )}


        {tab === 'versions' && (
          <Card>
            <CardHeader><CardTitle>{t('versions')}</CardTitle></CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-neutral-50">
                {(doc.versions.length > 0 ? [...doc.versions] : [{ version: doc.version, changes: t('uploadSuccess'), uploadedBy: doc.uploadedBy, uploadedAt: doc.uploadedAt, fileSize: doc.fileSize }]).reverse().map((v) => (
                  <div key={v.version} className="flex items-start gap-3 px-5 py-4">
                    <div className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                      v.version === doc.version ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-500'
                    )}>
                      v{v.version}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900">{v.changes}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar name={v.uploadedBy} size="sm" />
                        <span className="text-xs text-neutral-500">{v.uploadedBy}</span>
                        <span className="text-xs text-neutral-300">·</span>
                        <span className="text-xs text-neutral-400">{formatDate(v.uploadedAt)}</span>
                        <span className="text-xs text-neutral-300">·</span>
                        <span className="text-xs text-neutral-400">{formatBytes(v.fileSize)}</span>
                      </div>
                    </div>
                    {v.version === doc.version ? (
                      <Badge variant="success">{t('success')}</Badge>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => handleRestore(v.version)}>
                        {t('back')}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {tab === 'activity' && (
          <Card>
            <CardHeader><CardTitle>{t('activity')}</CardTitle></CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-neutral-50">
                {[
                  { action: t('uploadSuccess'), user: doc.uploadedBy, date: doc.uploadedAt, icon: FileText },
                  { action: t('processing'), user: 'SADI AI', date: new Date(new Date(doc.uploadedAt).getTime() + 90_000).toISOString(), icon: FileText },
                  { action: t('aiInsights'), user: 'SADI AI', date: doc.modifiedAt, icon: Sparkles },
                  ...(doc.legalHold ? [{ action: t('legalHolds'), user: 'Amira Benali', date: doc.modifiedAt, icon: Shield }] : []),
                ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((event, i) => {
                  const Icon = event.icon;
                  return (
                    <div key={i} className="flex items-start gap-3 px-5 py-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                        <Icon className="h-4 w-4 text-neutral-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-neutral-700">{event.action}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">{event.user} · {timeAgo(event.date)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        )}

        {tab === 'permissions' && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>{t('permissions')}</CardTitle></CardHeader>
              <CardBody className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-neutral-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-neutral-500" />
                    <span className="text-sm font-medium text-neutral-700">{t('classification')}</span>
                  </div>
                  <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium', classificationConfig[doc.classification].color)}>
                    {classificationConfig[doc.classification].label}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-neutral-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-neutral-500" />
                    <span className="text-sm font-medium text-neutral-700">{t('status')}</span>
                  </div>
                  <Badge variant="neutral" className={archiveConfig[doc.archiveState].color}>
                    {archiveConfig[doc.archiveState].label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-neutral-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-neutral-500" />
                    <span className="text-sm font-medium text-neutral-700">{t('confirm')}</span>
                  </div>
                  <Badge variant="neutral" className={approvalConfig[doc.approvalState].color}>
                    {approvalConfig[doc.approvalState].label}
                  </Badge>
                </div>
                {doc.retentionYears && (
                  <div className="flex items-center justify-between rounded-lg border border-neutral-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-neutral-500" />
                      <span className="text-sm font-medium text-neutral-700">{t('retentionPolicies')}</span>
                    </div>
                    <span className="text-sm font-medium text-neutral-900">{doc.retentionYears} {t('retentionPolicies')}</span>
                  </div>
                )}
                {doc.expiresAt && (
                  <div className="flex items-center justify-between rounded-lg border border-neutral-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-neutral-500" />
                      <span className="text-sm font-medium text-neutral-700">{t('expiringSoon')}</span>
                    </div>
                    <span className="text-sm font-medium text-neutral-900">{formatDate(doc.expiresAt)}</span>
                  </div>
                )}
              </CardBody>
            </Card>

            {sharedUsers.length > 0 && (
              <Card>
                <CardHeader><CardTitle>{t('team')}</CardTitle></CardHeader>
                <CardBody className="space-y-2">
                  {sharedUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-3">
                      <Avatar name={user.name} color={user.avatarColor} size="sm" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-neutral-900">{user.name}</p>
                        <p className="text-xs text-neutral-400">{user.email}</p>
                      </div>
                      <Badge variant="neutral" className={roleConfig[user.role].color}>
                        {roleConfig[user.role].label}
                      </Badge>
                    </div>
                  ))}
                </CardBody>
              </Card>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-neutral-400">{icon}</span>
      <span className="text-xs text-neutral-500">{label}</span>
      <span className="ml-auto text-sm font-medium text-neutral-900 truncate max-w-[60%]">{value}</span>
    </div>
  );
}
