import { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import type { ReasoningStep } from '@/types';

interface Props {
  steps?: ReasoningStep[];
  summary?: string;
  defaultOpen?: boolean;
}

export function ReasoningTrace({ steps, summary, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  if (!steps || steps.length === 0) return null;

  return (
    <div className="rounded-xl border border-primary-100 bg-primary-50/40 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left hover:bg-primary-50/60 transition-colors"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-white shrink-0">
          <Brain className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-primary-700">AI Reasoning</p>
          <p className="text-xs text-neutral-500 truncate">{summary || `${steps.length} thinking steps`}</p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-neutral-400" /> : <ChevronDown className="h-4 w-4 text-neutral-400" />}
      </button>

      {open && (
        <div className="border-t border-primary-100 bg-white px-4 py-3 space-y-3 animate-slide-up">
          {steps.map((s) => (
            <div key={s.step} className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[10px] font-bold text-primary-700">
                {s.step}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-neutral-800">{s.title}</p>
                <p className="text-xs text-neutral-500 leading-relaxed mt-0.5">{s.thought}</p>
              </div>
            </div>
          ))}
          {summary && (
            <div className="flex items-start gap-2 rounded-lg bg-primary-50 px-3 py-2.5 border border-primary-100">
              <Lightbulb className="h-3.5 w-3.5 text-primary-600 mt-0.5 shrink-0" />
              <p className="text-xs text-primary-800 leading-relaxed">{summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
