import { useEffect, useRef, useState } from 'react';
import '@doc-preview/themes/src/doc-preview.css';

interface Props {
  blob: Blob;
  fileName: string;
  fileType: string;
}

export function DocPreviewViewer({ blob, fileName, fileType }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | void;
    let engine: InstanceType<typeof import('@doc-preview/core').PreviewEngine> | null = null;

    async function mount() {
      try {
        const core = await import('@doc-preview/core');
        if (cancelled || !hostRef.current) return;

        const host = hostRef.current;
        host.innerHTML = '';

        engine = new core.PreviewEngine(
          {
            documents: [
              {
                file: new File([blob], fileName, { type: blob.type || `application/${fileType}` }),
                fileName,
                fileType,
              },
            ],
            config: {
              header: { disableHeader: false, disableFileName: false },
              pdf: { showControls: true, showThumbnails: true, fitWidthOnLoad: true },
              sanitizeHtml: true,
            },
          },
          () => {
            if (!cancelled && engine) {
              const state = engine.getState();
              if (state.phase === 'error' && state.errorText) setError(state.errorText);
            }
          }
        );

        host.id = 'doc-preview-root';
        host.className = 'dp-root';

        const { renderPreviewTree } = core as unknown as { renderPreviewTree: typeof import('@doc-preview/core').renderPreviewTree };
        // renderPreviewTree reads from engine state
        renderPreviewTree({
          host,
          engine,
          theme: { primary: '#2563eb', textPrimary: '#0f172a' },
        });

        await engine.loadActive();
        if (!cancelled) {
          const state = engine.getState();
          if (state.phase === 'error' && state.errorText) setError(state.errorText);
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Preview failed to load');
      }
    }

    mount();

    return () => {
      cancelled = true;
      if (typeof cleanup === 'function') cleanup();
      if (engine) {
        try { (engine as unknown as { destroy?: () => void }).destroy?.(); } catch {}
      }
    };
  }, [blob, fileName, fileType]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-8">
        <p className="text-sm text-neutral-500">{error}</p>
        <p className="text-xs text-neutral-400">Try downloading the file instead.</p>
      </div>
    );
  }

  return <div ref={hostRef} className="min-h-[520px] w-full overflow-hidden rounded-lg border" />;
}
