import { useState, useRef } from 'react';
import { X, FileText, Eye, Upload, Sparkles, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/lib/toast';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { classificationConfig, typeConfig } from '@/lib/utils';
import { WordEditor } from '@/components/WordEditor';
import type { DocType, ClassificationLevel } from '@/types';

const TEMPLATES = [
  { id: 'blank', label: 'Blank', labelAr: 'فارغ', labelFr: 'Vierge' },
  { id: 'contract', label: 'Contract', labelAr: 'عقد', labelFr: 'Contrat' },
  { id: 'report', label: 'Report', labelAr: 'تقرير', labelFr: 'Rapport' },
  { id: 'letter', label: 'Official Letter', labelAr: 'رسالة رسمية', labelFr: 'Lettre Officielle' },
  { id: 'invoice', label: 'Invoice', labelAr: 'فاتورة', labelFr: 'Facture' },
];

type Props = { open: boolean; onClose: () => void; onCreated?: () => void };

export function CreateDocumentModal({ open, onClose, onCreated }: Props) {
  const { t, locale } = useTranslation();
  const { departments, users, refreshData } = useStore();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'form' | 'editor' | 'preview'>('form');
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [editorHtml, setEditorHtml] = useState<string>('');

  const templateHtml = (tpl: string, title: string) => {
    if (tpl === 'contract') return `<h1 style="text-align:center">CONTRAT</h1><p><strong>N°:</strong> DOC-2025-001</p><p><strong>Entre:</strong> [Société A] et [Société B]</p><p style="text-align:justify">Le présent contrat a pour objet... Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p><h2>Article 1 — Objet</h2><p>...</p><h2>Article 2 — Durée</h2><p>...</p><p><br/></p><table style="width:100%;border-collapse:collapse"><tr><td style="border:1px solid #d1d5db;padding:8px">Pour [Société A]</td><td style="border:1px solid #d1d5db;padding:8px">Pour [Société B]</td></tr><tr><td style="border:1px solid #d1d5db;padding:24px"></td><td style="border:1px solid #d1d5db;padding:24px"></td></tr></table>`;
    if (tpl === 'report') return `<h1>${title || 'Rapport'}</h1><p><em>Date: ${new Date().toLocaleDateString(locale==='ar'?'ar-DZ':'fr-FR')} — Auteur: ${users[0]?.name || ''}</em></p><h2>1. Introduction</h2><p>Résumé exécutif...</p><h2>2. Analyse</h2><p>...</p><h2>3. Recommandations</h2><ul><li>...</li></ul>`;
    if (tpl === 'letter') return `<p style="text-align:right">${new Date().toLocaleDateString(locale==='ar'?'ar-DZ':'fr-FR')}<br/>Réf: ${title || 'LETTRE'}</p><p><strong>Objet:</strong> ${title || ''}</p><p>Madame, Monsieur,</p><p style="text-align:justify">Nous avons l'honneur de vous informer... Lorem ipsum dolor sit amet.</p><p>Cordialement,</p><p><br/>[Signature]</p>`;
    if (tpl === 'invoice') return `<h1 style="text-align:center">FACTURE</h1><table style="width:100%;border-collapse:collapse;margin:12px 0"><tr><th style="border:1px solid #d1d5db;padding:8px;background:#f3f4f6">Désignation</th><th style="border:1px solid #d1d5db;padding:8px;background:#f3f4f6">Qté</th><th style="border:1px solid #d1d5db;padding:8px;background:#f3f4f6">PU HT</th><th style="border:1px solid #d1d5db;padding:8px;background:#f3f4f6">Total</th></tr><tr><td style="border:1px solid #d1d5db;padding:8px">Prestation</td><td style="border:1px solid #d1d5db;padding:8px">1</td><td style="border:1px solid #d1d5db;padding:8px">0.00 DZD</td><td style="border:1px solid #d1d5db;padding:8px">0.00 DZD</td></tr></table><p style="text-align:right"><strong>Total HT:</strong> 0.00 DZD</p>`;
    return `<h1>${title || 'Document'}</h1><p>Commencez à rédiger votre document comme dans Microsoft Word — barre d'outils complète, tableaux, listes, couleurs, alignement, insertion table, et mise en page A4.</p><p><br/></p>`;
  };

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'other' as DocType,
    classification: 'internal' as ClassificationLevel,
    departmentId: '',
    ownerUserId: '',
    documentNumber: '',
    issuingAuthority: '',
    documentDate: new Date().toISOString().slice(0, 10),
    creationDate: new Date().toISOString().slice(0, 10),
    keywords: '',
    notes: '',
    priority: 'medium',
    language: 'unknown',
    template: 'blank',
  });

  if (!open) return null;

  const applyTemplate = (tpl: string) => {
    setForm((f) => ({ ...f, template: tpl }));
    const titleForTpl = form.title || (tpl==='contract'?'Contract — ': tpl==='report'?'Report — ': tpl==='letter'?'Letter — ': tpl==='invoice'?'Invoice — ':'Document');
    setEditorHtml(templateHtml(tpl, titleForTpl));
    if (tpl === 'contract') setForm((f) => ({ ...f, type: 'contract', classification: 'confidential', title: f.title || 'Contract — ' }));
    if (tpl === 'report') setForm((f) => ({ ...f, type: 'report', classification: 'internal', title: f.title || 'Report — ' }));
    if (tpl === 'letter') setForm((f) => ({ ...f, type: 'letter', classification: 'internal', title: f.title || 'Letter — ' }));
    if (tpl === 'invoice') setForm((f) => ({ ...f, type: 'invoice', classification: 'confidential', title: f.title || 'Invoice — ' }));
    if (tpl === 'blank' && !editorHtml) setEditorHtml(templateHtml('blank',''));
  };

  const handleSave = async (targetState: 'draft' | 'pending_review' | 'pending_signature') => {
    if (!form.title.trim()) { toast('warning', t('error')); return; }
    setSaving(true);
    try {
      let filePath: string | null = null;
      let fileType: string | null = null;
      let fileSize: number | null = null;
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        const up = await api.upload('/api/data/upload', fd) as { filePath: string; type?: string; size?: number };
        filePath = up.filePath;
        fileType = file.name.split('.').pop()?.toLowerCase() || null;
        fileSize = file.size;
      } else if (editorHtml && editorHtml.replace(/<[^>]*>/g,'').trim().length > 10) {
        // Word-like editor content → create HTML file (pixel-perfect like Word)
        const htmlDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${form.title.trim()}</title><style>body{font-family:Calibri,Arial,sans-serif;line-height:1.6;max-width:800px;margin:40px auto;padding:20px;color:#111}h1{font-size:24px}h2{font-size:18px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #d1d5db;padding:8px}</style></head><body>${editorHtml}</body></html>`;
        const blob = new Blob([htmlDoc], { type: 'text/html' });
        const htmlFile = new File([blob], `${(form.title.trim().replace(/[^a-zA-Z0-9\u0600-\u06FF]/g,'_') || 'document')}.html`, { type: 'text/html' });
        const fd = new FormData();
        fd.append('file', htmlFile);
        const up = await api.upload('/api/data/upload', fd) as { filePath: string };
        filePath = up.filePath;
        fileType = 'html';
        fileSize = blob.size;
      }
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description || null,
        type: form.type,
        classification: form.classification,
        departmentId: form.departmentId || null,
        ownerUserId: form.ownerUserId || null,
        documentNumber: form.documentNumber || null,
        issuingAuthority: form.issuingAuthority || null,
        tags: form.keywords.split(',').map((s) => s.trim()).filter(Boolean),
        priority: form.priority,
        metadata: { notes: form.notes, template: form.template, documentDate: form.documentDate, creationDate: form.creationDate, keywords: form.keywords.split(',').map((s)=>s.trim()).filter(Boolean), language: form.language, editorHtml: editorHtml.slice(0,50000) } as Record<string, unknown>,
        approvalState: targetState === 'draft' ? 'draft' : 'pending_review',
        signatureState: targetState === 'pending_signature' ? 'pending' : 'not_required',
        filePath,
        fileType: fileType || null,
        fileSize: fileSize || 0,
      };
      const res = await api.post('/api/data/documents/create-full', payload) as { document: { id: string } };
      if (targetState === 'pending_review' && res.document?.id) {
        await api.patch(`/api/data/documents/${res.document.id}/status`, { status: 'pending_review' }).catch(() => {});
      }
      if (targetState === 'pending_signature' && res.document?.id) {
        await api.post(`/api/data/documents/${res.document.id}/signatures`, { signers: [{ email: form.ownerUserId || 'signer@example.com', name: 'Signer', order: 1 }] }).catch(() => {});
      }

      toast('success', targetState === 'draft' ? t('uploadSuccess') : targetState === 'pending_review' ? 'Sent for review' : 'Sent for signature');
      await refreshData();
      onCreated?.();
      onClose();
      setForm({
        title: '', description: '', type: 'other', classification: 'internal', departmentId: '', ownerUserId: '', documentNumber: '', issuingAuthority: '', documentDate: new Date().toISOString().slice(0, 10), creationDate: new Date().toISOString().slice(0, 10), keywords: '', notes: '', priority: 'medium', language: 'unknown', template: 'blank',
      });
      setFile(null);
      setEditorHtml('');
      setStep('form');
    } catch (e) {
      toast('error', e instanceof Error ? e.message : t('error'));
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white"><FileText className="h-4 w-4" /></div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">{t('createDocument')}</h2>
              <p className="text-xs text-neutral-500">{t('createDocumentDesc')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex rounded-lg border border-neutral-200 p-0.5 bg-neutral-50">
              <button onClick={() => setStep('form')} className={`px-3 py-1 text-xs font-medium rounded-md ${step==='form'?'bg-white shadow text-neutral-900':'text-neutral-500'}`}>{t('metadata')}</button>
              <button onClick={() => setStep('editor')} className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 ${step==='editor'?'bg-white shadow text-primary-700':'text-neutral-500'}`}><PenLine className="h-3 w-3" /> Word</button>
              <button onClick={() => setStep('preview')} className={`px-3 py-1 text-xs font-medium rounded-md ${step==='preview'?'bg-white shadow text-neutral-900':'text-neutral-500'}`}>{t('previewBeforeSave')}</button>
            </div>
            <Button variant="ghost" size="sm" className="sm:hidden" onClick={() => setStep(step==='form'?'editor':step==='editor'?'preview':'form')} icon={step==='form'?<PenLine className="h-4 w-4"/>:step==='editor'?<Eye className="h-4 w-4"/>:<FileText className="h-4 w-4"/>}>{step==='form'?'Word':step==='editor'?t('view'):t('metadata')}</Button>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-neutral-100"><X className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-5">
          {step === 'form' ? (
            <>
              {/* Template */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Template</label>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATES.map((tpl) => (
                    <button key={tpl.id} onClick={() => applyTemplate(tpl.id)} className={`rounded-lg border px-3 py-2 text-xs font-medium ${form.template === tpl.id ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'}`}>
                      {locale === 'ar' ? tpl.labelAr : locale === 'fr' ? tpl.labelFr : tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Title / العنوان *</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Contract — TechCorp 2025" className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Description détaillée..." className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as DocType })} className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-sm">
                    {Object.entries(typeConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Classification</label>
                  <select value={form.classification} onChange={(e) => setForm({ ...form, classification: e.target.value as ClassificationLevel })} className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-sm">
                    {Object.entries(classificationConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Department / الجهة</label>
                  <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-sm">
                    <option value="">—</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Owner / صاحب الوثيقة</label>
                  <select value={form.ownerUserId} onChange={(e) => setForm({ ...form, ownerUserId: e.target.value })} className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-sm">
                    <option value="">—</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Document Number</label>
                  <input value={form.documentNumber} onChange={(e) => setForm({ ...form, documentNumber: e.target.value })} placeholder="DOC-2025-001" className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Issuing Authority / الجهة المصدرة</label>
                  <input value={form.issuingAuthority} onChange={(e) => setForm({ ...form, issuingAuthority: e.target.value })} placeholder="Ministry / Direction" className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-sm" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Document Date</label>
                  <input type="date" value={form.documentDate} onChange={(e) => setForm({ ...form, documentDate: e.target.value })} className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Creation Date</label>
                  <input type="date" value={form.creationDate} onChange={(e) => setForm({ ...form, creationDate: e.target.value })} className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-sm" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-sm">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Language</label>
                  <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-sm">
                    <option value="unknown">Auto-detect</option>
                    <option value="ar">Arabic</option>
                    <option value="fr">French</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Keywords (comma separated)</label>
                  <input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="contract, 2025, finance" className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Internal notes..." className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-neutral-700 mb-1">File (optional — upload existing)</label>
                  <div onClick={() => fileRef.current?.click()} className="flex items-center gap-3 rounded-lg border-2 border-dashed border-neutral-200 px-4 py-3 hover:bg-neutral-50 cursor-pointer">
                    <Upload className="h-5 w-5 text-neutral-400" />
                    <span className="text-sm text-neutral-600">{file ? file.name : 'Click to upload or drag file'}</span>
                    <input ref={fileRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </div>
                  {file && <p className="text-xs text-neutral-500 mt-1">{file.name} · {(file.size/1024).toFixed(1)} KB</p>}
                  <p className="text-[11px] text-neutral-400 mt-1">Image → Doc exact: image will be converted to PDF with same dimensions (pixel-perfect) on save if you select image file.</p>
                </div>
              </div>
            </>
          ) : step === 'editor' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-500">Rédigez comme dans Microsoft Word — mise en forme, tableaux, listes, couleurs, alignement. Le contenu sera enregistré comme document HTML/PDF fidèle.</p>
                <Badge variant="neutral">Word-like</Badge>
              </div>
              <WordEditor value={editorHtml} onChange={setEditorHtml} placeholder={t('createDocumentDesc')} />
              <p className="text-[11px] text-neutral-400">Tip: Sélectionnez un template en haut (Contrat/Rapport/Lettre/Facture) pour pré-remplir, puis éditez librement.</p>
            </div>
          ) : (
            <Card>
              <CardBody className="space-y-4">
                <div className="flex items-center gap-2"><Badge>{form.type}</Badge><Badge variant="neutral">{form.classification}</Badge><Badge variant="neutral">{form.priority}</Badge></div>
                <h3 className="text-lg font-bold text-neutral-900">{form.title || '—'}</h3>
                <p className="text-sm text-neutral-600 whitespace-pre-wrap">{form.description || 'No description'}</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-neutral-500">Number:</span> <span className="font-medium text-neutral-900">{form.documentNumber || '—'}</span></div>
                  <div><span className="text-neutral-500">Authority:</span> <span className="font-medium">{form.issuingAuthority || '—'}</span></div>
                  <div><span className="text-neutral-500">Department:</span> <span className="font-medium">{departments.find((d)=>d.id===form.departmentId)?.name || '—'}</span></div>
                  <div><span className="text-neutral-500">Owner:</span> <span className="font-medium">{users.find((u)=>u.id===form.ownerUserId)?.name || '—'}</span></div>
                  <div><span className="text-neutral-500">Doc Date:</span> <span className="font-medium">{form.documentDate}</span></div>
                  <div><span className="text-neutral-500">File:</span> <span className="font-medium">{file?.name || (editorHtml.replace(/<[^>]*>/g,'').trim() ? 'Word content' : 'No file (metadata only)')}</span></div>
                  <div className="col-span-2"><span className="text-neutral-500">Keywords:</span> {form.keywords || '—'}</div>
                  <div className="col-span-2"><span className="text-neutral-500">Notes:</span> {form.notes || '—'}</div>
                </div>
                {editorHtml && editorHtml.replace(/<[^>]*>/g,'').trim() && (
                  <div className="rounded-lg border border-neutral-200 bg-white p-4">
                    <p className="text-xs font-medium text-neutral-700 mb-2">Aperçu contenu Word</p>
                    <div className="prose prose-sm max-w-none text-sm text-neutral-800" dangerouslySetInnerHTML={{ __html: editorHtml }} />
                  </div>
                )}
                <div className="rounded-lg bg-primary-50 border border-primary-200 p-3 flex items-center gap-2 text-xs text-primary-700"><Sparkles className="h-4 w-4" /> AI will extract metadata & suggest retention after creation.</div>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="flex items-center justify-between border-t px-6 py-4">
          <Button variant="ghost" onClick={onClose} disabled={saving}>{t('cancel')}</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSave('draft')} disabled={saving}>{saving ? t('loading') : t('saveAsDraft')}</Button>
            <Button variant="outline" onClick={() => handleSave('pending_review')} disabled={saving}>{t('sendForReview')}</Button>
            <Button onClick={() => handleSave('pending_signature')} disabled={saving} icon={<Sparkles className="h-4 w-4" />}>{t('sendForSignature')}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
