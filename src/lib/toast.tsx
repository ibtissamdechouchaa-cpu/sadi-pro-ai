import React, { createContext, useCallback, useContext, useRef, useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastCtx {
  toast: (type: ToastType, message: string, title?: string) => void;
}

const Ctx = createContext<ToastCtx>({ toast: () => {} });
export function useToast() { return useContext(Ctx); }

function ToastCard({ item, onRemove }: { item: ToastItem; onRemove: (id: string) => void }) {
  const [paused, setPaused] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paused) {
      if (progressRef.current) progressRef.current.style.animationPlayState = 'paused';
      return;
    }
    if (progressRef.current) progressRef.current.style.animationPlayState = 'running';
  }, [paused]);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => onRemove(item.id), 4000);
    return () => clearTimeout(t);
  }, [item.id, onRemove, paused]);

  const iconMap: Record<ToastType, React.ReactNode> = {
    success: <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success-100"><CheckCircle className="h-4 w-4 text-success-600" /></span>,
    error: <span className="flex h-8 w-8 items-center justify-center rounded-full bg-error-100"><AlertTriangle className="h-4 w-4 text-error-600" /></span>,
    info: <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100"><Info className="h-4 w-4 text-primary-600" /></span>,
    warning: <span className="flex h-8 w-8 items-center justify-center rounded-full bg-warning-100"><AlertTriangle className="h-4 w-4 text-warning-600" /></span>,
  };

  const bgMap: Record<ToastType, string> = {
    success: 'border-success-200 bg-white',
    error: 'border-error-200 bg-white',
    info: 'border-primary-200 bg-white',
    warning: 'border-warning-200 bg-white',
  };

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`relative flex items-start gap-3 overflow-hidden rounded-xl border px-4 py-3.5 text-sm shadow-elevated animate-slide-up ${bgMap[item.type]}`}
      role="alert"
    >
      {iconMap[item.type]}
      <div className="flex-1 min-w-0 pt-0.5">
        {item.title && <p className="text-sm font-semibold text-neutral-900 leading-none">{item.title}</p>}
        <p className={`text-sm text-neutral-600 ${item.title ? 'mt-1' : ''}`}>{item.message}</p>
      </div>
      <button onClick={() => onRemove(item.id)} aria-label="Dismiss" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600">
        <X className="h-3.5 w-3.5" />
      </button>
      <div
        ref={progressRef}
        className="absolute bottom-0 left-0 h-0.5 bg-current opacity-20"
        style={{ animation: 'shrink 4s linear forwards', width: '100%' } as React.CSSProperties}
      />
      <style>{`@keyframes shrink { from { width: 100% } to { width: 0% } }`}</style>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((type: ToastType, message: string, title?: string) => {
    const id = Math.random().toString(36).slice(2, 9);
    setItems((prev) => {
      const next = [...prev, { id, type, title, message }];
      return next.length > 3 ? next.slice(-3) : next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-[92vw] max-w-sm flex-col gap-2" aria-live="polite" aria-atomic="false">
        {items.map((t) => (
          <ToastCard key={t.id} item={t} onRemove={remove} />
        ))}
      </div>
    </Ctx.Provider>
  );
}
