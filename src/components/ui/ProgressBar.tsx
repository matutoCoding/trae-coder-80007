import { twMerge } from 'tailwind-merge';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  variant?: 'strength' | 'uniformity' | 'suspension' | 'smoothness' | 'custom';
  customColor?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  variant = 'custom',
  customColor,
  size = 'md',
  className,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const colorMap: Record<ProgressBarProps['variant'], string> = {
    strength: 'from-rattan-300 to-bronze-400',
    uniformity: 'from-bamboo-200 to-bamboo-400',
    suspension: 'from-bronze-200 to-bronze-400',
    smoothness: 'from-rattan-200 to-rattan-400',
    custom: customColor || 'from-ink-100 to-ink-300',
  };
  return (
    <div className={twMerge('w-full', className)}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
          {label && <span className="font-medium text-ink-200">{label}</span>}
          {showValue && (
            <span className="tabular-nums font-semibold text-ink-300">{Math.round(value)}/{max}</span>
          )}
        </div>
      )}
      <div
        className={twMerge(
          'w-full overflow-hidden rounded-full bg-bronze-100/60',
          size === 'sm' ? 'h-1.5' : 'h-2.5',
        )}
      >
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colorMap[variant]} transition-all duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  tone?: 'bronze' | 'bamboo' | 'cinnabar' | 'rattan' | 'ink' | 'gray';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, tone = 'bronze', size = 'sm', className }: BadgeProps) {
  const toneMap = {
    bronze: 'bg-bronze-100 text-bronze-500 border-bronze-200',
    bamboo: 'bg-bamboo-100 text-bamboo-500 border-bamboo-200',
    cinnabar: 'bg-cinnabar-100 text-cinnabar-500 border-cinnabar-200',
    rattan: 'bg-rattan-100 text-rattan-400 border-rattan-200',
    ink: 'bg-ink-50 text-ink-300 border-ink-100',
    gray: 'bg-rice-200/70 text-ink-200 border-rice-300',
  };
  return (
    <span
      className={twMerge(
        'inline-flex items-center border rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        toneMap[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
