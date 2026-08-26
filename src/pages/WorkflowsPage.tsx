import { useEffect, useState, useCallback } from 'react';
import { Workflow, Plus, Play, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/lib/toast';
import { api } from '@/lib/api';

interface Wf { id: string; name: string; description: string | null; triggerType: string; isActive: boolean; createdAt: string; }

export function WorkflowsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Wf[]>([]);
  const [name, setName] = useState('');
  const [showCreate, setShowCreate] = useState(false);

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
      toast('success', 'Workflow created');
    } catch (e: any) { toast('error', e.message || 'Failed to create workflow'); }
  };

  const toggle = async (wf: Wf) => {
    try {
      await api.patch(`/api/data/workflows/${wf.id}`, { isActive: !wf.isActive });
      setItems((p) => p.map((x) => x.id === wf.id ? { ...x, isActive: !x.isActive } : x));
    } catch (e: any) { toast('error', e.message || 'Failed to update'); }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this workflow?')) return;
    try {
      await api.delete(`/api/data/workflows/${id}`);
      setItems((p) => p.filter((x) => x.id !== id));
      toast('success', 'Workflow deleted');
    } catch (e: any) { toast('error', e.message || 'Failed to delete'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Workflows</h1>
          <p className="mt-1 text-sm text-neutral-500">Automate document processing, approvals, and compliance actions.</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>New Workflow</Button>
      </div>

      {showCreate && (
        <Card>
          <CardBody className="flex gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Workflow name" className="flex-1 h-10 rounded-lg border border-neutral-200 px-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none" onKeyDown={(e) => e.key === 'Enter' && create()} autoFocus />
            <Button onClick={create} disabled={!name.trim()} icon={<Play className="h-4 w-4" />}>Create</Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
          </CardBody>
        </Card>
      )}

      {items.length === 0 && !showCreate ? (
        <Card><EmptyState icon={<Workflow className="h-8 w-8" />} title="No workflows yet" description="Create a workflow to automate repetitive document tasks." action={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>New Workflow</Button>} /></Card>
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
                <button onClick={() => toggle(wf)} className="text-neutral-400 hover:text-primary-600" title={wf.isActive ? 'Active — click to disable' : 'Disabled — click to enable'}>
                  {wf.isActive ? <ToggleRight className="h-6 w-6 text-success-500" /> : <ToggleLeft className="h-6 w-6" />}
                </button>
                <Button variant="ghost" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => remove(wf.id)}>Delete</Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
