import { Check, Clock, FileText, Shield, Archive, Trash2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = { key: string; label: string; icon: typeof FileText; done: boolean; current: boolean };

export function WorkflowStepper({ approvalState, archiveState, status }: { approvalState: string; archiveState: string; status: string }) {
  const steps: Step[] = [
    { key: 'create', label: 'CREATE', icon: FileText, done: true, current: false },
    { key: 'upload', label: 'UPLOAD', icon: FileText, done: status !== 'uploading', current: status === 'uploading' },
    { key: 'ocr', label: 'OCR', icon: Eye, done: ['completed','archived'].includes(status) || approvalState !== 'draft', current: status === 'processing' },
    { key: 'classify', label: 'CLASSIFY', icon: Shield, done: ['pending_review','approved','signed','active','archived'].includes(approvalState), current: approvalState === 'draft' && status === 'completed' },
    { key: 'review', label: 'REVIEW', icon: Eye, done: ['approved','signed','active','archived'].includes(approvalState), current: approvalState === 'pending_review' },
    { key: 'approve', label: 'APPROVE', icon: Check, done: ['signed','active','archived'].includes(approvalState) || archiveState === 'permanent_archive', current: approvalState === 'approved' },
    { key: 'sign', label: 'SIGN', icon: Shield, done: approvalState === 'signed' || archiveState === 'permanent_archive', current: approvalState === 'approved' },
    { key: 'active', label: 'ACTIVE', icon: Clock, done: ['active','archived','permanent_archive'].includes(archiveState) || approvalState === 'active', current: archiveState === 'active' && approvalState === 'active' },
    { key: 'archive', label: 'ARCHIVE', icon: Archive, done: ['archived','permanent_archive','pending_disposal','disposed'].includes(archiveState), current: archiveState === 'archived' },
    { key: 'disposal', label: 'DISPOSAL', icon: Trash2, done: archiveState === 'disposed', current: archiveState === 'pending_disposal' },
  ];
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {steps.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={s.key} className="flex items-center gap-1">
            <div className={cn('flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold border', s.done ? 'bg-success-600 text-white border-success-600' : s.current ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-neutral-400 border-neutral-200')}>
              {s.done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
            </div>
            <span className={cn('text-[10px] font-medium whitespace-nowrap', s.done ? 'text-success-700' : s.current ? 'text-primary-700' : 'text-neutral-400')}>{s.label}</span>
            {i < steps.length - 1 && <div className={cn('h-0.5 w-6', s.done ? 'bg-success-300' : 'bg-neutral-200')} />}
          </div>
        );
      })}
    </div>
  );
}
