import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FolderOpen,
  Plus,
  FileText,
  MoreVertical,
  Sparkles,
  Check,
  Pencil,
  Trash2,
  Eye,
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/store/StoreContext';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { useTranslation } from '@/lib/i18n';
import { generateId } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Document } from '@/types';

interface CollectionsPageProps {
  onOpenDocument: (doc: Document) => void;
}

interface Collection {
  id: string;
  name: string;
  organizationId: string;
  createdAt: string;
}

export function CollectionsPage({ onOpenDocument }: CollectionsPageProps) {
  const { t } = useTranslation();
  const { documents } = useStore();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [filterCollectionId, setFilterCollectionId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [confirm, setConfirm] = useState<{open:boolean; message:string; onConfirm:()=>void}>({open:false,message:'',onConfirm:()=>{}});

  const loadCollections = useCallback(async () => {
    if (!user?.organizationId) return;
    try {
      const data = await api.get(`/api/data/collections?orgId=${user.organizationId}`);
      if (data.collections) setCollections(data.collections);
    } catch {
      // ignore
    }
  }, [user?.organizationId]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const matchesType = (d: Document, types: string[]) =>
    types.includes(d.type) || d.tags.some((t) => types.includes(t.toLowerCase())) || types.some((k) => d.title.toLowerCase().includes(k));
  const baseSuggested = [
    { name: 'Contracts', docIds: documents.filter((d) => matchesType(d, ['contract', 'agreement'])).map((d) => d.id) },
    { name: 'Invoices', docIds: documents.filter((d) => matchesType(d, ['invoice', 'inv'])).map((d) => d.id) },
    { name: 'HR Documents', docIds: documents.filter((d) => matchesType(d, ['hr', 'policy', 'employee', 'handbook'])).map((d) => d.id) },
    { name: 'Legal Documents', docIds: documents.filter((d) => matchesType(d, ['legal', 'compliance', 'hold'])).map((d) => d.id) },
  ];
  const aiSuggested = documents.length > 0 && baseSuggested.every((s) => s.docIds.length === 0)
    ? [...baseSuggested, { name: 'Recent Documents', docIds: documents.slice(0, 10).map((d) => d.id) }]
    : baseSuggested;

  const acceptedNames = new Set(collections.map((c) => c.name));
  const unacceptedSuggestions = aiSuggested.filter((s) => !acceptedNames.has(s.name));

  const acceptSuggestion = async (suggestion: { name: string; docIds: string[] }) => {
    if (!user?.organizationId) return;
    try {
      const res = await api.post('/api/data/collections', { name: suggestion.name, organizationId: user.organizationId });
      const created = res.collection || { id: generateId('col'), name: suggestion.name, organizationId: user.organizationId, createdAt: new Date().toISOString() };
      setCollections((prev) => [created, ...prev]);
      toast('success', `"${suggestion.name}" ${t('success')}`);
    } catch (e: unknown) {
      toast('error', e instanceof Error ? e.message : t('error'));
    }
  };

  const createCollection = async () => {
    if (!newName.trim() || !user?.organizationId) return;
    try {
      const res = await api.post('/api/data/collections', { name: newName.trim(), organizationId: user.organizationId });
      const created = res.collection || { id: generateId('col'), name: newName.trim(), organizationId: user.organizationId, createdAt: new Date().toISOString() };
      setCollections((prev) => [created, ...prev]);
      setNewName('');
      setShowCreate(false);
      toast('success', t('success'));
    } catch (e: unknown) {
      toast('error', e instanceof Error ? e.message : t('error'));
    }
  };

  const renameCollection = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      await api.patch(`/api/data/collections/${id}`, { name: editingName.trim() });
      setCollections((prev) => prev.map((c) => c.id === id ? { ...c, name: editingName.trim() } : c));
      setEditingId(null);
      setEditingName('');
    } catch (e: any) {
      toast('error', e.message || t('error'));
    }
  };

  const deleteCollection = async (id: string) => {
    setConfirm({
      open: true,
      message: `${t('delete')} ${t('collections')}?`,
      onConfirm: async () => {
        try {
          await api.delete(`/api/data/collections/${id}`);
          setCollections((prev) => prev.filter((c) => c.id !== id));
          setActiveDropdown(null);
          if (filterCollectionId === id) setFilterCollectionId(null);
          toast('success', t('documentDeleted'));
        } catch (e: unknown) {
          toast('error', e instanceof Error ? e.message : t('error'));
        }
      },
    });
  };

  const startEditing = (col: Collection) => {
    setEditingId(col.id);
    setEditingName(col.name);
    setActiveDropdown(null);
  };

  const allCollections = collections.map((c) => {
    const suggested = aiSuggested.find((s) => s.name === c.name);
    return { ...c, docIds: suggested?.docIds || [] };
  });

  const displayedCollections = filterCollectionId
    ? allCollections.filter((c) => c.id === filterCollectionId)
    : allCollections;

  const filteredDocIds = filterCollectionId
    ? allCollections.find((c) => c.id === filterCollectionId)?.docIds || []
    : null;

  return (
    <div className="space-y-5">
      <ConfirmDialog open={confirm.open} title={t('confirm')} message={confirm.message} confirmLabel={t('delete')} onConfirm={()=>{confirm.onConfirm(); setConfirm({...confirm,open:false})}} onCancel={()=>setConfirm({...confirm,open:false})} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('collections')}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t('collections')} {t('documents')}</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
          {t('collections')}
        </Button>
      </div>

      {filterCollectionId && (
        <div className="flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2">
          <Eye className="h-4 w-4 text-primary-600" />
          <span className="text-sm text-primary-700">
            {t('view')}: {allCollections.find((c) => c.id === filterCollectionId)?.name}
          </span>
          <button
            onClick={() => setFilterCollectionId(null)}
            className="ml-auto text-xs text-primary-600 hover:text-primary-800 underline"
          >
            {t('close')} {t('filter')}
          </button>
        </div>
      )}

      {unacceptedSuggestions.length > 0 && (
        <Card className="border-primary-200 bg-primary-50/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary-600" />
              <CardTitle>{t('aiInsights')} {t('collections')}</CardTitle>
            </div>
          </CardHeader>
          <CardBody className="space-y-2">
            {unacceptedSuggestions.map((s) => (
              <div key={s.name} className="flex items-center gap-3 rounded-lg border border-neutral-100 bg-white px-4 py-3">
                <FolderOpen className="h-4 w-4 text-primary-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900">{s.name}</p>
                  <p className="text-xs text-neutral-400">{s.docIds.length} {t('documents')}</p>
                </div>
                <Button size="sm" variant="outline" icon={<Check className="h-3.5 w-3.5" />} onClick={() => acceptSuggestion(s)}>
                  {t('save')}
                </Button>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {displayedCollections.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FolderOpen className="h-8 w-8" />}
            title={t('collections')}
            description={t('noDocuments')}
            action={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>{t('collections')}</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayedCollections.map((col) => {
            const colDocs = filteredDocIds
              ? documents.filter((d) => filteredDocIds.includes(d.id))
              : documents.filter((d) => col.docIds.includes(d.id));
            const isEditing = editingId === col.id;
            const isDropdownOpen = activeDropdown === col.id;
            return (
              <Card key={col.id} hover>
                <CardBody>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                      <FolderOpen className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="relative" ref={isDropdownOpen ? dropdownRef : undefined}>
                      <button
                        onClick={() => setActiveDropdown(isDropdownOpen ? null : col.id)}
                        className="rounded p-1 text-neutral-300 hover:bg-neutral-100 hover:text-neutral-600"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
                          <button
                            onClick={() => startEditing(col)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            {t('edit')}
                          </button>
                          <button
                            onClick={() => { setActiveDropdown(null); setFilterCollectionId(col.id); }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            {t('view')}
                          </button>
                          <button
                            onClick={() => deleteCollection(col.id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {t('delete')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {isEditing ? (
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') renameCollection(col.id);
                          if (e.key === 'Escape') { setEditingId(null); setEditingName(''); }
                        }}
                        className="flex-1 h-8 rounded border border-primary-300 px-2 text-sm text-neutral-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => renameCollection(col.id)}
                        className="rounded p-1 text-success-500 hover:bg-success-50"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <h3 className="text-sm font-semibold text-neutral-900">{col.name}</h3>
                  )}
                  <p className="text-xs text-neutral-400 mt-0.5">{colDocs.length} {t('documents')}</p>
                  {colDocs.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {colDocs.slice(0, 3).map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => onOpenDocument(doc)}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-neutral-50 transition-colors text-left"
                        >
                          <FileText className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                          <span className="text-xs text-neutral-600 truncate">{doc.title}</span>
                        </button>
                      ))}
                      {colDocs.length > 3 && (
                        <p className="text-xs text-neutral-400 pl-2">+{colDocs.length - 3} {t('documents')}</p>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={t('collections')}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t('cancel')}</Button>
            <Button onClick={createCollection} disabled={!newName.trim()}>{t('save')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('collections')}</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('collections')}
              className="w-full h-10 rounded-lg border border-neutral-200 px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-colors"
              autoFocus
            />
          </div>
          <p className="text-xs text-neutral-400">
            {t('collections')} {t('documents')}
          </p>
        </div>
      </Modal>
    </div>
  );
}
