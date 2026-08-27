import { useEffect, useState, useCallback } from 'react';
import { Workflow, Plus, Play, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/lib/toast';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Wf { id: string; name: string; description: string | null; triggerType: string; isActive: boolean; createdAt: string; }

export function WorkflowsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [items, setItems] = useState<Wf[]>([]);
  const [name, setName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [confirm, setConfirm] = useState<{open:boolean; message:string; onConfirm:()=>void}>({open:false,message:'',onConfirm:()=>{}});

  const load = useCallback(async () => {
    try {
      const d = await api.get('/api/data/workflows');
      if (d.workflows) setItems(d.workflows);
    } catch {}
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!name.trim()) return;
    try {
      const d = await api.post('/api/data/workflows', { name: name.trim(), triggerType: 'manual', isActive: true });
      if (d.workflow) setItems((p) => [d.workflow, ...p]);
      else await load();
      setName(''); setShowCreate(false);
      toast('success', t('success'));
    } catch (e: unknown) { toast('error', e instanceof Error ? e.message : t('error')); }
  };

  const toggle = async (wf: Wf) => {
    try {
      await api.patch(`/api/data/workflows/${wf.id}`, { isActive: !wf.isActive });
      setItems((p) => p.map((x) => x.id === wf.id ? { ...x, isActive: !x.isActive } : x));
    } catch (e: unknown) { toast('error', e instanceof Error ? e.message : t('error')); }
  };

  const remove = async (id: string) => {
    setConfirm({
      open: true,
      message: `${t('delete')} ${t('workflows')}?`,
      onConfirm: async () => {
        try {
          await api.delete(`/api/data/workflows/${id}`);
          setItems((p) => p.filter((x) => x.id !== id));
          toast('success', t('documentDeleted'));
        } catch (e: unknown) { toast('error', e instanceof Error ? e.message : t('error')); }
      },
    });
  };

  const examples = [
    { name: locale === 'ar' ? 'موافقة العقود' : locale === 'fr' ? 'Approbation contrats' : 'Contract Approval', desc: locale === 'ar' ? 'رفع → تصنيف AI → مراجعة → توقيع → أرشفة' : locale === 'fr' ? 'Upload → Classification IA → Revue → Signature → Archive' : 'Upload → AI Classify → Review → Sign → Archive', icon: '📄' },
    { name: locale === 'ar' ? 'معالجة الفواتير' : locale === 'fr' ? 'Traitement factures' : 'Invoice Processing', desc: locale === 'ar' ? 'رفع → OCR → استخراج → موافقة → دفع' : locale === 'fr' ? 'Upload → OCR → Extraction → Approbation → Paiement' : 'Upload → OCR → Extract → Approve → Pay', icon: '🧾' },
    { name: locale === 'ar' ? 'أرشفة تلقائية' : locale === 'fr' ? 'Archivage auto' : 'Auto Archive', desc: locale === 'ar' ? 'انتهاء الاحتفاظ → مراجعة → إتلاف/دائم' : locale === 'fr' ? 'Expiration → Revue → Destruction/Permanent' : 'Expiry → Review → Disposal/Permanent', icon: '🗃️' },
  ];

  return (
    <div className="space-y-5">
      <ConfirmDialog open={confirm.open} title={t('confirm')} message={confirm.message} confirmLabel={t('delete')} onConfirm={()=>{confirm.onConfirm(); setConfirm({...confirm,open:false})}} onCancel={()=>setConfirm({...confirm,open:false})} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('workflows')}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {locale === 'ar' ? 'أتمتة دورة حياة الوثيقة — من الرفع إلى الأرشفة. أنشئ سير عمل مرة واحدة وسيعمل تلقائيًا.' : locale === 'fr' ? 'Automatisez le cycle de vie — de l’upload à l’archivage. Créez une fois, il s’exécute automatiquement.' : 'Automate document lifecycle — from upload to archive. Create once, runs automatically.'}
          </p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>{locale === 'ar' ? '+ سير عمل' : locale === 'fr' ? '+ Flux' : '+ Workflow'}</Button>
      </div>

      {/* How it works — visual */}
      <Card>
        <CardBody>
          <p className="text-xs font-semibold text-neutral-500 mb-3">{locale === 'ar' ? 'كيف يعمل' : locale === 'fr' ? 'Comment ça marche' : 'How it works'}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {[
              locale === 'ar' ? 'رفع' : 'Upload',
              locale === 'ar' ? 'تصنيف AI' : 'AI Classify',
              locale === 'ar' ? 'مراجعة' : 'Review',
              locale === 'ar' ? 'موافقة' : 'Approval',
              locale === 'ar' ? 'توقيع' : 'Sign',
              locale === 'ar' ? 'أرشفة' : 'Archive',
              locale === 'ar' ? 'تنبيه' : 'Alert',
            ].map((s, i, arr) => (
              <span key={s} className="flex items-center gap-2">
                <span className="rounded-full bg-primary-50 text-primary-700 border border-primary-200 px-3 py-1.5 font-medium">{s}</span>
                {i < arr.length - 1 && <span className="text-neutral-300">→</span>}
              </span>
            ))}
          </div>
          <p className="text-xs text-neutral-400 mt-3">
            {locale === 'ar' ? 'مثال: عقد ينتهي خلال 30 يوم → تنبيه → مراجعة → موافقة → تجديد/أرشفة.' : locale === 'fr' ? 'Ex: contrat expire dans 30j → alerte → revue → approbation → renouvellement.' : 'Ex: contract expires in 30d → alert → review → approve → renew/archive.'}
          </p>
        </CardBody>
      </Card>

      {showCreate && (
        <Card>
          <CardBody className="flex gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={locale === 'ar' ? 'اسم سير العمل — مثال: موافقة العقود' : locale === 'fr' ? 'Nom du flux — ex: Approbation contrats' : 'Workflow name — e.g. Contract Approval'} className="flex-1 h-10 rounded-lg border border-neutral-200 px-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none" onKeyDown={(e) => e.key === 'Enter' && create()} autoFocus />
            <Button onClick={create} disabled={!name.trim()} icon={<Play className="h-4 w-4" />}>{t('save')}</Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>{t('cancel')}</Button>
          </CardBody>
        </Card>
      )}

      {items.length === 0 && !showCreate ? (
        <div className="space-y-3">
          <Card>
            <CardBody>
              <p className="text-sm font-medium text-neutral-700 mb-2">{locale === 'ar' ? 'ابدأ بنقرة — أمثلة جاهزة' : locale === 'fr' ? 'Commencez en un clic — exemples' : 'Start with one click — examples'}</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {examples.map((ex) => (
                  <button key={ex.name} onClick={() => { setName(ex.name); setTimeout(() => create(), 100); }} className="text-left rounded-xl border border-neutral-200 p-4 hover:border-primary-300 hover:bg-primary-50/50 transition-colors">
                    <div className="text-lg">{ex.icon}</div>
                    <p className="text-sm font-semibold text-neutral-900 mt-1">{ex.name}</p>
                    <p className="text-xs text-neutral-500 mt-1">{ex.desc}</p>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>
          <Card><EmptyState icon={<Workflow className="h-8 w-8" />} title={locale === 'ar' ? 'لا يوجد سير عمل بعد' : locale === 'fr' ? 'Aucun flux' : 'No workflows yet'} description={locale === 'ar' ? 'أنشئ أول سير عمل أو اختر مثالاً أعلاه. سيعمل تلقائياً عند رفع الوثائق.' : locale === 'fr' ? 'Créez votre premier flux ou choisissez un exemple. Il se déclenchera à l’upload.' : 'Create your first workflow or pick an example. It will trigger on upload.'} action={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>{locale === 'ar' ? '+ سير عمل' : t('workflows')}</Button>} /></Card>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((wf) => (
            <Card key={wf.id}>
              <CardBody className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                  <Workflow className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">{wf.name}</p>
                  <p className="text-xs text-neutral-400">{wf.triggerType} · {new Date(wf.createdAt).toLocaleDateString()}</p>
                </div>
                <button onClick={() => toggle(wf)} className="text-neutral-400 hover:text-primary-600" title={wf.isActive ? t('success') : t('error')}>
                  {wf.isActive ? <ToggleRight className="h-6 w-6 text-success-500" /> : <ToggleLeft className="h-6 w-6" />}
                </button>
                <Button variant="ghost" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => remove(wf.id)}>{t('delete')}</Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
