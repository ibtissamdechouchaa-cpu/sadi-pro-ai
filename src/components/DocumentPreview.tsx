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
        if (!r.ok) {
          const body = await r.text().catch(() => '');
          throw new Error(body || 'Preview failed');
        }
        const ct = r.headers.get('Content-Type') || '';
        setContentType(ct);

        // Server returns synthesized text/plain or text/html for docs without file
        // Also handle declared text types
        if (ct.includes('text/plain') || ct.includes('text/html') || TEXT_TYPES.has(ext)) {
          const t = await r.text();
          if (!cancelled) {
            setTextContent(t.slice(0, 25000));
            setLoading(false);
          }
          return;
        }

        // For images / pdf / office: get blob
        const blob = await r.blob();
        if (cancelled) return;
        if (blob.size === 0) throw new Error('Empty file');
        // If server sent text but blob is text, handle as text
        if (blob.type.includes('text/plain') || blob.type.includes('text/html')) {
          const t = await blob.text();
          setTextContent(t.slice(0, 25000));
          setContentType(blob.type);
          setLoading(false);
          return;
        }
        setObjectUrl(URL.createObjectURL(blob));
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err?.message?.includes('<!DOCTYPE') ? 'Unable to load preview.' : (err?.message || 'Unable to load preview.');
          setError(msg.slice(0, 200));
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [docId, ext]);

  useEffect(() => {
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [objectUrl]);

  const handleDownload = async () => {
    const token = localStorage.getItem('sadi_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const r = await fetch(`/api/data/download/${docId}`, { headers });
      if (r.ok) {
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Try to get filename from Content-Disposition, fallback to title.ext
        const cd = r.headers.get('Content-Disposition') || '';
        const m = cd.match(/filename\*?=(?:UTF-8''|")?([^";\n]+)/);
        a.download = m ? decodeURIComponent(m[1].replace(/"/g, '')) : `${title}.${ext || 'bin'}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        return;
      }
      // If download 404 (no file stored), fallback to preview content as .txt
      if (r.status === 404) {
        const pr = await fetch(`/api/data/preview/${docId}`, { headers });
        if (pr.ok) {
          const ct = pr.headers.get('Content-Type') || '';
          if (ct.includes('text/')) {
            const t = await pr.text();
            const blob = new Blob([t], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title}.txt`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 2000);
            return;
          }
          const blob = await pr.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${title}.${ext || 'bin'}`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 2000);
          return;
        }
      }
      throw new Error('Download failed');
    } catch {
      setError('Download failed. Try again.');
    }
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
        <div>
          <div className="rounded-lg border border-neutral-200 bg-white overflow-auto" style={{ maxHeight: 650 }}>
            <div dangerouslySetInnerHTML={{ __html: textContent }} className="p-4 prose prose-sm max-w-none" />
          </div>
          <div className="mt-3 flex justify-center">
            <Button variant="outline" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={handleDownload}>Download file</Button>
          </div>
        </div>
      );
    }
    return (
      <div>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <pre className="max-h-[550px] overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-neutral-700">{textContent}</pre>
        </div>
        <div className="mt-3 flex justify-center">
          <Button variant="outline" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={handleDownload}>Download file</Button>
        </div>
      </div>
    );
  }

  if (objectUrl && IMAGE_TYPES.has(ext)) {
    return (
      <div>
        <img src={objectUrl} alt={title} className="max-h-[600px] w-full rounded-lg border object-contain bg-white" />
        <div className="mt-3 flex justify-center">
          <Button variant="outline" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={handleDownload}>Download file</Button>
        </div>
      </div>
    );
  }

  if (objectUrl && PDF_TYPES.has(ext)) {
    return (
      <div>
        <iframe src={objectUrl} title={title} className="h-[650px] w-full rounded-lg border bg-white" />
        <div className="mt-3 flex justify-center">
          <Button variant="outline" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={handleDownload}>Download file</Button>
        </div>
      </div>
    );
  }

  if (objectUrl && OFFICE_TYPES.has(ext)) {
    return (
      <div>
        <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>}>
          <OfficeViewer uri={objectUrl} fileType={ext} fileName={`${title}.${ext}`} height={650} />
        </Suspense>
        <div className="mt-3 flex justify-center">
          <Button variant="outline" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={handleDownload}>Download file</Button>
        </div>
      </div>
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
      <p className="text-sm text-neutral-500">Preview not available for .{ext || 'unknown'} files.</p>
      <Button variant="outline" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={handleDownload}>Download file</Button>
    </div>
  );
}
