import { useState } from 'react';
import {
  ArrowLeft,
  FileText,
  Download,
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
import type { Document } from '@/types';

interface DocumentDetailPageProps {
  document: Document;
  onBack: () => void;
  onOpenDocument: (doc: Document) => void;
}

type Tab = 'overview' | 'metadata' | 'insights' | 'versions' | 'activity' | 'permissions' | 'retention' | 'signatures' | 'translate';

export function DocumentDetailPage({ document: doc, onBack, onOpenDocument }: DocumentDetailPageProps) {
  const { t } = useTranslation();
  const { documents, departments, users, updateDocument, deleteDocument, refreshData } = useStore();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('overview');
  const [showShare, setShowShare] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [confirm, setConfirm] = useState<{open:boolean; message:string; onConfirm:()=>void}>({open:false,message:'',onConfirm:()=>{}});
  const [retentionSuggestion, setRetentionSuggestion] = useState<any>(null);
  const [loadingRetention, setLoadingRetention] = useState(false);
  const [signatures, setSignatures] = useState<any[]>([]);
  const [loadingSignatures, setLoadingSignatures] = useState(false);
  const [translation, setTranslation] = useState('');
  const [translating, setTranslating] = useState(false);
  const [translationLang, setTranslationLang] = useState<'ar' | 'fr' | 'en'>('fr');

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
    { key: 'retention', label: 'Rétention', icon: Clock },
    { key: 'signatures', label: 'Signatures', icon: CheckCircle2 },
    { key: 'translate', label: 'Traduction', icon: FileText },
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
    if (!doc.filePath) {
      toast('warning', t('noDocuments'));
      return;
    }
    try {
      const token = localStorage.getItem('sadi_token');
      const res = await fetch(`/api/data/download/${doc.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.title}.${doc.fileType || 'bin'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
              <span className="text-xs text-neutral-500">{languageConfig[doc.language]}</span>
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
                <CardTitle>Gestion de la Rétention</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-neutral-200 p-4">
                    <p className="text-sm font-medium text-neutral-700">Durée de rétention</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">{doc.retentionYears || 'Non définie'} ans</p>
                  </div>
                  <div className="rounded-lg border border-neutral-200 p-4">
                    <p className="text-sm font-medium text-neutral-700">Expire le</p>
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
                        const data = await api.get(`/api/data/documents/${doc.id}/retention-suggestion`);
                        setRetentionSuggestion(data.suggestion);
                      } catch (e) { toast('error', t('error')); }
                      setLoadingRetention(false);
                    }}
                    disabled={loadingRetention}
                  >
                    {loadingRetention ? 'Analyse...' : 'Suggestion IA'}
                  </Button>
                </div>

                {retentionSuggestion && (
                  <div className="rounded-lg border border-primary-200 bg-primary-50/30 p-4">
                    <p className="text-sm font-medium text-primary-900">Suggestion IA</p>
                    <p className="text-sm text-primary-700 mt-1">{retentionSuggestion.reason}</p>
                    <p className="text-xs text-primary-600 mt-2">
                      Rétention suggérée: {retentionSuggestion.retentionYears} ans | Confiance: {Math.round((retentionSuggestion.confidence || 0) * 100)}%
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}

        {tab === 'signatures' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Signatures Électroniques</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-neutral-300 mx-auto" />
                  <p className="text-sm text-neutral-500 mt-3">Gestion des signatures électroniques</p>
                  <p className="text-xs text-neutral-400 mt-1">Workflow de signature avec traçabilité complète</p>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {tab === 'translate' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Traduction IA</CardTitle>
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
            <CardBody className="flex flex-col items-center justify-center py-16">
              {showPreview ? (
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-neutral-900">{t('view')}</p>
                    <button onClick={() => setShowPreview(false)} className="text-neutral-400 hover:text-neutral-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                        <FileText className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 truncate">{doc.title}</p>
                        <p className="text-xs text-neutral-400">{typeConfig[doc.type].label}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-md bg-white border border-neutral-100 p-2">
                        <p className="text-neutral-400">{t('classification')}</p>
                        <p className="font-medium text-neutral-900 mt-0.5">{classificationConfig[doc.classification].label}</p>
                      </div>
                      <div className="rounded-md bg-white border border-neutral-100 p-2">
                        <p className="text-neutral-400">{t('status')}</p>
                        <p className="font-medium text-neutral-900 mt-0.5">{statusConfig[doc.status].label}</p>
                      </div>
                      <div className="rounded-md bg-white border border-neutral-100 p-2">
                        <p className="text-neutral-400">{t('documents')}</p>
                        <p className="font-medium text-neutral-900 mt-0.5">{doc.pageCount}</p>
                      </div>
                      <div className="rounded-md bg-white border border-neutral-100 p-2">
                        <p className="text-neutral-400">{t('fileSize')}</p>
                        <p className="font-medium text-neutral-900 mt-0.5">{formatBytes(doc.fileSize)}</p>
                      </div>
                      <div className="rounded-md bg-white border border-neutral-100 p-2">
                        <p className="text-neutral-400">{t('version')}</p>
                        <p className="font-medium text-neutral-900 mt-0.5">v{doc.version}</p>
                      </div>
                      <div className="rounded-md bg-white border border-neutral-100 p-2">
                        <p className="text-neutral-400">{t('language')}</p>
                        <p className="font-medium text-neutral-900 mt-0.5">{languageConfig[doc.language]}</p>
                      </div>
                    </div>
                    {doc.tags.length > 0 && (
                      <div>
                        <p className="text-neutral-400 text-xs mb-1">{t('tags')}</p>
                        <div className="flex flex-wrap gap-1">
                          {doc.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-700">#{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex h-20 w-16 items-center justify-center rounded-lg bg-neutral-100">
                    <FileText className="h-10 w-10 text-neutral-300" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-neutral-600">{t('view')}</p>
                  <p className="mt-1 text-xs text-neutral-400 text-center max-w-xs">
                    {t('view')} — {doc.pageCount} {t('documents')}
                  </p>
                  <Button variant="outline" size="sm" className="mt-4" icon={<FileText className="h-3.5 w-3.5" />} onClick={() => setShowPreview(true)}>
                    {t('view')}
                  </Button>
                </>
              )}
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

            {(doc.filePath || doc.fileType) && (
              <Card>
                <CardHeader><CardTitle>{t('view')}</CardTitle></CardHeader>
                <CardBody>
                  <DocumentPreview docId={doc.id} fileType={doc.fileType} title={doc.title} />
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
              {Object.entries(doc.metadata).length === 0 ? (
                <p className="text-sm text-neutral-400">{t('noDocuments')}</p>
              ) : (
                Object.entries(doc.metadata).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between border-b border-neutral-50 pb-2">
                    <span className="text-sm text-neutral-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-sm font-medium text-neutral-900">
                      {typeof value === 'object' && value !== null
                        ? Array.isArray(value) ? value.join(', ') : JSON.stringify(value)
                        : String(value ?? '')}
                    </span>
                  </div>
                ))
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
                    icon={<Sparkles className="h-3.5 w-3.5" />}
                    onClick={async () => {
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
                      }
                    }}
                  >
                    {t('aiInsights')}
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
