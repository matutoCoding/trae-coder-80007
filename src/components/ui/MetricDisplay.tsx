import type { ReactNode } from 'react';

interface MetricDisplayProps {
  label: string;
  value: ReactNode;
  unit?: string;
  tone?: 'default' | 'highlight' | 'success' | 'warn' | 'danger';
  hint?: string;
  icon?: ReactNode;
}

export default function MetricDisplay({
  label,
  value,
  unit,
  tone = 'default',
  hint,
  icon,
}: MetricDisplayProps) {
  const toneMap = {
    default: 'text-ink-300',
    highlight: 'text-bronze-500',
    success: 'text-bamboo-500',
    warn: 'text-rattan-400',
    danger: 'text-cinnabar-400',
  };
  return (
    <div className="rounded-lg border border-bronze-200/50 bg-gradient-to-br from-white/90 to-rice-100/80 p-4">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink-100">
        {icon}
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`font-display text-2xl font-bold tabular-nums ${toneMap[tone]}`}>{value}</span>
        {unit && <span className="text-xs text-ink-100">{unit}</span>}
      </div>
      {hint && <p className="mt-1 text-[11px] leading-tight text-ink-100">{hint}</p>}
    </div>
  );
}
