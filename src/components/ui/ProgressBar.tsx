import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'accent';
  size?: 'sm' | 'md';
}

const colorClasses = {
  primary: 'bg-primary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
  accent: 'bg-accent-500',
};

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
};

export function ProgressBar({ value, max = 100, className, color = 'primary', size = 'md' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} className={cn('w-full overflow-hidden rounded-full bg-neutral-100', sizeClasses[size], className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500 ease-out', colorClasses[color])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
