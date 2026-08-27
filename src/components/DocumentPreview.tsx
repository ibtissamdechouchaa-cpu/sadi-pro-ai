import { useEffect, useState, lazy, Suspense } from 'react';
import { FileText, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const OfficeViewer = lazy(() => import('@/components/OfficeViewer'));

interface Props {
  docId: string;
  fileType: string;
  title: string;
}

const OFFICE_TYPES = new Set(['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']);
const IMAGE_TYPES = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'tif', 'svg']);
const TEXT_TYPES = new Set(['txt', 'json', 'xml', 'csv', 'html']);
const PDF_TYPES = new Set(['pdf']);

function getExt(fileType: string): string {
  return (fileType || '').toLowerCase().replace(/^\./, '');
}

export function DocumentPreview({ docId, fileType, title }: Props) {
  const ext = getExt(fileType);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [contentType, setContentType] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setObjectUrl(null);
    setTextContent(null);
    setContentType('');

    const token = localStorage.getItem('sadi_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`/api/data/preview/${docId}`, { headers })
      .then(async (r) => {
        if (cancelled) return;
        if (!r.ok) throw new Error('Preview failed');
        const ct = r.headers.get('Content-Type') || '';
        setContentType(ct);

        if (ct.includes('text/plain') || ct.includes('text/html') || TEXT_TYPES.has(ext)) {
          const t = await r.text();
          if (!cancelled) {
            setTextContent(t.slice(0, 20000));
            setLoading(false);
          }
          return;
        }

        const blob = await r.blob();
        if (cancelled) return;
        if (blob.size === 0) throw new Error('Empty file');
        setObjectUrl(URL.createObjectURL(blob));
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || 'Unable to load preview.');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [docId, ext]);

  useEffect(() => {
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [objectUrl]);

  const handleDownload = () => {
    const token = localStorage.getItem('sadi_token');
    fetch(`/api/data/download/${docId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => {
        if (!r.ok) throw new Error('Download failed');
        return r.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.${ext || 'bin'}`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => {});
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        <p className="text-sm text-neutral-400">Loading preview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-8">
        <AlertCircle className="h-6 w-6 text-neutral-400" />
        <p className="text-sm text-neutral-500">{error}</p>
        <Button variant="outline" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={handleDownload}>Download instead</Button>
      </div>
    );
  }

  if (textContent !== null) {
    if (contentType.includes('text/html') || ext === 'html') {
      return (
        <div className="rounded-lg border border-neutral-200 bg-white overflow-auto" style={{ maxHeight: 650 }}>
          <div dangerouslySetInnerHTML={{ __html: textContent }} className="p-4" />
        </div>
      );
    }
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <pre className="max-h-[550px] overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-neutral-700">{textContent}</pre>
      </div>
    );
  }

  if (objectUrl && IMAGE_TYPES.has(ext)) {
    if (ext === 'svg') {
      return (
        <div className="rounded-lg border border-neutral-200 bg-white p-4 overflow-auto" style={{ maxHeight: 650 }}>
          <div dangerouslySetInnerHTML={{ __html: '' }} />
          <img src={objectUrl} alt={title} className="max-h-[600px] w-full object-contain" />
        </div>
      );
    }
    return <img src={objectUrl} alt={title} className="max-h-[600px] w-full rounded-lg border object-contain bg-white" />;
  }

  if (objectUrl && PDF_TYPES.has(ext)) {
    return <iframe src={objectUrl} title={title} className="h-[650px] w-full rounded-lg border bg-white" />;
  }

  if (objectUrl && OFFICE_TYPES.has(ext)) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>}>
        <OfficeViewer uri={objectUrl} fileType={ext} fileName={`${title}.${ext}`} height={650} />
      </Suspense>
    );
  }

  if (objectUrl) {
    return (
      <div>
        <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>}>
          <OfficeViewer uri={objectUrl} fileType={ext} fileName={`${title}.${ext}`} height={500} />
        </Suspense>
        <div className="mt-3 flex justify-center">
          <Button variant="outline" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={handleDownload}>Download file</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-8">
      <FileText className="h-8 w-8 text-neutral-300" />
      <p className="text-sm text-neutral-500">Preview not available for .{ext} files.</p>
      <Button variant="outline" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={handleDownload}>Download file</Button>
    </div>
  );
}
