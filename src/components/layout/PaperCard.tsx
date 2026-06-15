import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface PaperCardProps {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

export default function PaperCard({ children, className, title, subtitle, icon, actions }: PaperCardProps) {
  return (
    <div
      className={twMerge(
        'relative paper-grain overflow-hidden rounded-xl border border-bronze-200/60 bg-rice-50 shadow-paper transition-all duration-200 hover:shadow-paper-hover',
        className,
      )}
    >
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 border-b border-bronze-200/50 px-5 py-4">
          <div className="flex items-start gap-3">
            {icon && <div className="mt-0.5 text-bronze-400">{icon}</div>}
            <div>
              {typeof title === 'string' ? (
                <h3 className="font-display text-lg font-semibold text-ink-300">{title}</h3>
              ) : (
                title
              )}
              {subtitle && <p className="mt-0.5 text-xs text-ink-100">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
