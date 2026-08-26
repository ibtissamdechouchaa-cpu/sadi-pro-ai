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

  return (
    <div className="space-y-5">
      <ConfirmDialog open={confirm.open} title={t('confirm')} message={confirm.message} confirmLabel={t('delete')} onConfirm={()=>{confirm.onConfirm(); setConfirm({...confirm,open:false})}} onCancel={()=>setConfirm({...confirm,open:false})} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('workflows')}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t('workflows')} — {t('processing')} {t('compliance')}</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>{t('workflows')}</Button>
      </div>

      {showCreate && (
        <Card>
          <CardBody className="flex gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('workflows')} className="flex-1 h-10 rounded-lg border border-neutral-200 px-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none" onKeyDown={(e) => e.key === 'Enter' && create()} autoFocus />
            <Button onClick={create} disabled={!name.trim()} icon={<Play className="h-4 w-4" />}>{t('save')}</Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>{t('cancel')}</Button>
          </CardBody>
        </Card>
      )}

      {items.length === 0 && !showCreate ? (
        <Card><EmptyState icon={<Workflow className="h-8 w-8" />} title={t('workflows')} description={t('workflows')} action={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>{t('workflows')}</Button>} /></Card>
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
