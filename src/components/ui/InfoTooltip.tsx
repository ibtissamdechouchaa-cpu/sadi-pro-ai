import { useState } from 'react';
import { Info } from 'lucide-react';

export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label="More info"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-colors focus-ring"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span className="absolute left-1/2 top-full z-30 mt-1.5 w-64 -translate-x-1/2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs leading-relaxed text-neutral-600 shadow-elevated">
          {text}
        </span>
      )}
    </span>
  );
}
