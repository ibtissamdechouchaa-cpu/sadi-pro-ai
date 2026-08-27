import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FileText,
  Grid3x3,
  List,
  Filter,
  Search,
  MoreVertical,
  Download,
  Share2,
  Trash2,
  Shield,
  FileSpreadsheet,
  FileImage,
  ChevronDown,
  X,
  FileUp,
} from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/lib/toast';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CreateDocumentModal } from '@/components/CreateDocumentModal';
import {
  statusConfig,
  typeConfig,
  classificationConfig,
  getStatusLabel,
  getTypeLabel,
  getClassificationLabel,
  formatBytes,
  timeAgo,
  cn,
} from '@/lib/utils';
import type { Document, DocType, ClassificationLevel } from '@/types';

function fileIcon(type: string, className = 'h-4 w-4') {
  if (['xls','xlsx','csv'].includes(type)) return { icon: FileSpreadsheet, color: 'text-emerald-600 bg-emerald-50' };
  if (['png','jpg','jpeg','webp','tiff'].includes(type)) return { icon: FileImage, color: 'text-purple-600 bg-purple-50' };
  if (type === 'pdf') return { icon: FileText, color: 'text-red-600 bg-red-50' };
  return { icon: FileText, color: 'text-neutral-500 bg-neutral-100' };
}

interface DocumentsPageProps {
  onOpenDocument: (doc: Document) => void;
}

export function DocumentsPage({ onOpenDocument }: DocumentsPageProps) {
  const { t } = useTranslation();
  const { documents, departments, addDocuments, deleteDocument, isLoading } = useStore();
  const { toast } = useToast();
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocType | 'all'>('all');
  const [classFilter, setClassFilter] = useState<ClassificationLevel | 'all'>('all');
  const [deptFilter, setDeptFilter] = useState<string | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ name: string; progress: number } | null>(null);
  const [bulkShareOpen, setBulkShareOpen] = useState(false);
  const [bulkShareEmail, setBulkShareEmail] = useState('');
  const [rowDropdownId, setRowDropdownId] = useState<string | null>(null);
  const [rowShareId, setRowShareId] = useState<string | null>(null);
  const [rowShareEmail, setRowShareEmail] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkShareRef = useRef<HTMLDivElement>(null);
  const rowDropdownRef = useRef<HTMLDivElement>(null);
  const [confirm, setConfirm] = useState<{open:boolean; message:string; onConfirm:()=>void}>({open:false,message:'',onConfirm:()=>{}});
  const [showCreate, setShowCreate] = useState(false);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setUploadProgress({ name: fileArray[0].name, progress: -1 });
    addDocuments(fileArray).finally(() => setUploadProgress(null));
  }, [addDocuments]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const filtered = documents.filter((doc) => {
    if (doc.archiveState === 'pending_disposal') return false;
    if (search && !doc.title.toLowerCase().includes(search.toLowerCase()) && !doc.tags.some((t) => t.includes(search.toLowerCase()))) return false;
    if (typeFilter !== 'all' && doc.type !== typeFilter) return false;
    if (classFilter !== 'all' && doc.classification !== classFilter) return false;
    if (deptFilter !== 'all' && doc.departmentId !== deptFilter) return false;
    if (statusFilter !== 'all' && doc.status !== statusFilter) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const activeFilters = [typeFilter !== 'all', classFilter !== 'all', deptFilter !== 'all', statusFilter !== 'all'].filter(Boolean).length;

  const handleBulkShare = async () => {
    if (!bulkShareEmail.trim()) return;
    const email = bulkShareEmail.trim();
    const selectedIds = Array.from(selected);
    const results = await Promise.allSettled(selectedIds.map(async (docId) => {
      const doc = documents.find((d) => d.id === docId);
      if (!doc) throw new Error(`Document ${docId} not found`);
      const deduped = [...new Set([...doc.sharedWith, email])];
      if (deduped.length === doc.sharedWith.length) return;
      await api.patch(`/api/data/documents/${docId}`, { sharedWith: deduped });
    }));
    const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failures.length > 0) {
      failures.forEach((f) => {
        const msg = f.reason instanceof Error ? f.reason.message : String(f.reason);
        toast('error', msg || t('error'));
      });
      if (failures.length < selectedIds.length) toast('success', `${selectedIds.length - failures.length} ${t('success')}`);
    } else {
      const skipped = results.filter((r) => r.status === 'fulfilled').length;
      if (skipped > 0) toast('success', t('success'));
    }
    setBulkShareEmail('');
    setBulkShareOpen(false);
  };

  const handleBulkExport = () => {
    const selectedDocs = documents.filter((d) => selected.has(d.id));
    const rows = [
      ['Title', 'Type', 'Classification', 'Status', 'Size', 'Modified', 'Tags'],
      ...selectedDocs.map((d) => [
        d.title,
        typeConfig[d.type].label,
        classificationConfig[d.classification].label,
        statusConfig[d.status].label,
        formatBytes(d.fileSize),
        new Date(d.modifiedAt).toISOString(),
        d.tags.join('; '),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documents-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRowDownload = async (doc: Document) => {
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
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      toast('error', t('error'));
    }
  };

  const handleRowShare = async (docId: string) => {
    if (!rowShareEmail.trim()) return;
    const email = rowShareEmail.trim();
    try {
      const doc = documents.find((d) => d.id === docId);
      if (doc) {
        const deduped = [...new Set([...doc.sharedWith, email])];
        if (deduped.length === doc.sharedWith.length) {
          setRowShareEmail('');
          setRowShareId(null);
          return;
        }
        await api.patch(`/api/data/documents/${docId}`, { sharedWith: deduped });
        toast('success', t('success'));
      }
    } catch (err) {
      console.error('Failed to share document:', docId, err);
      toast('error', err instanceof Error ? err.message : t('error'));
    }
    setRowShareEmail('');
    setRowShareId(null);
  };

  const handleRowDelete = (docId: string) => {
    deleteDocument(docId);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(docId);
      return next;
    });
    setRowDropdownId(null);
  };

  return (
    <div className="space-y-5">
      <ConfirmDialog open={confirm.open} title={t('confirm')} message={confirm.message} confirmLabel={t('delete')} onConfirm={()=>{confirm.onConfirm(); setConfirm({...confirm,open:false})}} onCancel={()=>setConfirm({...confirm,open:false})} />
      <CreateDocumentModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => setShowCreate(false)} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('documents')}</h1>
          <p className="mt-1 text-sm text-neutral-500">{filtered.length} {t('documents')} {t('allDocuments')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-neutral-200 bg-white p-0.5">
            <button
              onClick={() => setView('list')}
              className={cn('rounded-md p-1.5 transition-colors', view === 'list' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:text-neutral-600')}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('grid')}
              className={cn('rounded-md p-1.5 transition-colors', view === 'grid' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:text-neutral-600')}
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
          </div>
          <Button variant="outline" icon={<FileText className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
            {t('create') || 'Create'}
          </Button>
          <Button icon={<Upload className="h-4 w-4" />} onClick={() => fileInputRef.current?.click()}>
            {t('upload')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </div>

      {/* Search & filters bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search')}
            className="w-full h-10 rounded-lg border border-neutral-200 bg-white pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-colors"
          />
        </div>
        <Button
          variant="outline"
          icon={<Filter className="h-4 w-4" />}
          onClick={() => setShowFilters(!showFilters)}
        >
          {t('filter')}
          {activeFilters > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
              {activeFilters}
            </span>
          )}
        </Button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card className="animate-slide-up">
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FilterSelect label={t('documentType')} value={typeFilter} onChange={(v) => setTypeFilter(v as DocType | 'all')} options={[{ value: 'all', label: t('allDocuments') }, ...Object.entries(typeConfig).map(([k, v]) => ({ value: k, label: t(v.labelKey as never) }))]} />
            <FilterSelect label={t('classification')} value={classFilter} onChange={(v) => setClassFilter(v as ClassificationLevel | 'all')} options={[{ value: 'all', label: t('classification') }, ...Object.entries(classificationConfig).map(([k, v]) => ({ value: k, label: t(v.labelKey as never) }))]} />
            <FilterSelect label={t('department')} value={deptFilter} onChange={(v) => setDeptFilter(v)} options={[{ value: 'all', label: t('department') }, ...departments.map((d) => ({ value: d.id, label: d.name }))]} />
            <FilterSelect label={t('status')} value={statusFilter} onChange={(v) => setStatusFilter(v)} options={[{ value: 'all', label: t('status') }, ...Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: t(v.labelKey as never) }))]} />
            {activeFilters > 0 && (
              <button
                onClick={() => { setTypeFilter('all'); setClassFilter('all'); setDeptFilter('all'); setStatusFilter('all'); }}
                className="flex items-center gap-1 text-xs font-medium text-error-600 hover:text-error-700"
              >
                <X className="h-3 w-3" /> {t('close')} {t('filter')}
              </button>
            )}
          </CardBody>
        </Card>
      )}

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary-200 bg-primary-50 px-4 py-2.5 animate-slide-up">
          <span className="text-sm font-medium text-primary-700">{selected.size} {t('documents')}</span>
          <div className="flex-1" />
          <div className="relative" ref={bulkShareRef}>
            <Button variant="ghost" size="sm" icon={<Share2 className="h-3.5 w-3.5" />} onClick={() => setBulkShareOpen(!bulkShareOpen)}>
              {t('view')}
            </Button>
            {bulkShareOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg">
                <p className="text-xs font-medium text-neutral-700 mb-2">{t('view')}</p>
                <input
                  type="email"
                  value={bulkShareEmail}
                  onChange={(e) => setBulkShareEmail(e.target.value)}
                  placeholder={t('email')}
                  className="w-full h-8 rounded border border-neutral-200 bg-white px-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleBulkShare(); }}
                />
                <div className="flex justify-end gap-1.5 mt-2">
                  <button onClick={() => { setBulkShareOpen(false); setBulkShareEmail(''); }} className="px-2 py-1 text-xs text-neutral-500 hover:text-neutral-700">{t('cancel')}</button>
                  <button onClick={handleBulkShare} className="px-2 py-1 text-xs font-medium text-white bg-primary-600 rounded hover:bg-primary-700">{t('view')}</button>
                </div>
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={handleBulkExport}>
            {t('export')}
          </Button>
          <Button variant="ghost" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setConfirm({open:true, message:`${t('delete')} ${selected.size} ${t('documents')}?`, onConfirm:()=>{ const n = selected.size; selected.forEach((id) => deleteDocument(id)); setSelected(new Set()); toast('success', `${n} ${t('documentDeleted')}`); }})}>
            {t('delete')}
          </Button>
          <button onClick={() => setSelected(new Set())} className="rounded p-1 text-primary-400 hover:text-primary-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Upload progress */}
      {uploadProgress && (
        <Card className="animate-slide-up border-primary-200">
          <CardBody className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50">
              <FileUp className="h-4 w-4 text-primary-600 animate-pulse-soft" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-900">{t('upload')} {uploadProgress.name}</p>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                {uploadProgress.progress < 0 ? (
                  <div className="h-full w-1/3 rounded-full bg-primary-500 animate-[shimmer_1.5s_infinite]" />
                ) : (
                  <div className="h-full rounded-full bg-primary-500 transition-all duration-100" style={{ width: `${uploadProgress.progress}%` }} />
                )}
              </div>
            </div>
            <span className="text-xs font-medium text-primary-600">
              {uploadProgress.progress < 0 ? t('upload') : `${uploadProgress.progress}%`}
            </span>
          </CardBody>
        </Card>
      )}

      {/* Drag & drop zone */}
      {dragOver && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setDragOver(false)}
          className="rounded-xl border-2 border-dashed border-primary-400 bg-primary-50 py-16 text-center"
        >
          <FileUp className="mx-auto h-10 w-10 text-primary-500" />
          <p className="mt-3 text-sm font-medium text-primary-700">{t('dragDropFiles')}</p>
        </div>
      )}

      {/* Documents */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText className="h-8 w-8" />}
            title={t('noDocuments')}
            description={search || activeFilters > 0 ? t('noSearchResults') : t('noDocuments')}
            action={<Button icon={<Upload className="h-4 w-4" />} onClick={() => fileInputRef.current?.click()}>{t('uploadDocuments')}</Button>}
          />
        </Card>
      ) : view === 'list' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/50">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={(e) => setSelected(e.target.checked ? new Set(filtered.map((d) => d.id)) : new Set())}
                      className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500">{t('documents')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 hidden md:table-cell">{t('documentType')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 hidden lg:table-cell">{t('classification')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 hidden lg:table-cell">{t('status')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 hidden xl:table-cell">{t('fileSize')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 hidden xl:table-cell">{t('uploadedAt')}</th>
                  <th className="w-10 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {filtered.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => onOpenDocument(doc)}
                    className="group cursor-pointer hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-4 py-3" onClick={(e) => { e.stopPropagation(); toggleSelect(doc.id); }}>
                      <input
                        type="checkbox"
                        checked={selected.has(doc.id)}
                        onChange={() => toggleSelect(doc.id)}
                        className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {(() => { const f = fileIcon(doc.fileType); const Icon = f.icon; return <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${f.color}`}><Icon className="h-4 w-4" /></div>; })()}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate flex items-center gap-1.5">
                            {doc.title}
                            {doc.language !== 'unknown' && <span className="ml-1 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">{doc.language.toUpperCase()}</span>}
                            {doc.legalHold && <Shield className="h-3.5 w-3.5 text-error-500 shrink-0" />}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {doc.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="text-[10px] text-neutral-400">#{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant="neutral">{getTypeLabel(doc.type, t)}</Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium', classificationConfig[doc.classification].color)}>
                        {getClassificationLabel(doc.classification, t)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <Badge variant="neutral" className={statusConfig[doc.status].color} dot>
                        {getStatusLabel(doc.status, t)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-xs text-neutral-500">{formatBytes(doc.fileSize)}</td>
                    <td className="px-4 py-3 hidden xl:table-cell text-xs text-neutral-500">{timeAgo(doc.modifiedAt)}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="relative" ref={rowDropdownRef}>
                        <button
                          onClick={() => setRowDropdownId(rowDropdownId === doc.id ? null : doc.id)}
                          aria-label={t('view')}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {rowDropdownId === doc.id && (
                          <div className="absolute right-0 top-full z-30 mt-1 w-40 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
                            <button
                              onClick={() => { handleRowDownload(doc); setRowDropdownId(null); }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                            >
                              <Download className="h-3.5 w-3.5" /> {t('download')}
                            </button>
                            <button
                              onClick={() => { setRowShareId(doc.id); setRowDropdownId(null); }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                            >
                              <Share2 className="h-3.5 w-3.5" /> {t('view')}
                            </button>
                            <button onClick={async () => { try { await api.post(`/api/data/documents/${doc.id}/translate`, { targetLang: 'ar' }); toast('success', t('translateToArabic')); } catch { toast('error', t('error')); } setRowDropdownId(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">{t('translateToArabic')}</button>
                            <button onClick={async () => { try { await api.post(`/api/data/documents/${doc.id}/translate`, { targetLang: 'fr' }); toast('success', t('translateToFrench')); } catch { toast('error', t('error')); } setRowDropdownId(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">{t('translateToFrench')}</button>
                            <button onClick={async () => { try { await api.post(`/api/data/documents/${doc.id}/translate`, { targetLang: 'en' }); toast('success', t('translateToEnglish')); } catch { toast('error', t('error')); } setRowDropdownId(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">{t('translateToEnglish')}</button>
                            <button
                              onClick={() => handleRowDelete(doc.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-error-600 hover:bg-error-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> {t('delete')}
                            </button>
                          </div>
                        )}
                        {rowShareId === doc.id && (
                          <div className="absolute right-0 top-full z-30 mt-1 w-56 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg">
                            <p className="text-xs font-medium text-neutral-700 mb-2">{t('view')} "{doc.title.slice(0, 20)}..."</p>
                            <input
                              type="email"
                              value={rowShareEmail}
                              onChange={(e) => setRowShareEmail(e.target.value)}
                              placeholder={t('email')}
                              className="w-full h-8 rounded border border-neutral-200 bg-white px-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                              onKeyDown={(e) => { if (e.key === 'Enter') handleRowShare(doc.id); }}
                              autoFocus
                            />
                            <div className="flex justify-end gap-1.5 mt-2">
                              <button onClick={() => { setRowShareId(null); setRowShareEmail(''); }} className="px-2 py-1 text-xs text-neutral-500 hover:text-neutral-700">{t('cancel')}</button>
                              <button onClick={() => handleRowShare(doc.id)} className="px-2 py-1 text-xs font-medium text-white bg-primary-600 rounded hover:bg-primary-700">{t('view')}</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {filtered.map((doc) => (
            <Card key={doc.id} hover className="cursor-pointer" >
              <div onClick={() => onOpenDocument(doc)}>
                <CardBody>
                  <div className="flex items-start justify-between mb-3">
                    {(() => { const f = fileIcon(doc.fileType); const Icon = f.icon; return <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${f.color}`}><Icon className="h-5 w-5" /></div>; })()}
                    {doc.legalHold && <Shield className="h-4 w-4 text-error-500" />}
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 line-clamp-2">{doc.title}</h3>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <Badge variant="neutral">{getTypeLabel(doc.type, t)}</Badge>
                    <Badge variant="neutral" className={statusConfig[doc.status].color} dot>
                      {getStatusLabel(doc.status, t)}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
                    <span>{formatBytes(doc.fileSize)}</span>
                    <span>{timeAgo(doc.modifiedAt)}</span>
                  </div>
                </CardBody>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-500 mb-1.5">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-9 appearance-none rounded-lg border border-neutral-200 bg-white pl-3 pr-8 text-sm text-neutral-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-colors"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
      </div>
    </div>
  );
}
