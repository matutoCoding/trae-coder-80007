import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  children,
  className,
  ...rest
}: BtnProps) {
  const variants: Record<Variant, string> = {
    primary:
      'bg-bronze-400 text-rice-50 hover:bg-bronze-500 active:bg-bronze-600 shadow-sm hover:shadow-md ring-bronze-300/50',
    secondary:
      'border border-bronze-300 bg-rice-50 text-bronze-500 hover:bg-bronze-50 active:bg-bronze-100 ring-bronze-200/60',
    ghost:
      'bg-transparent text-ink-200 hover:bg-bronze-100/50 active:bg-bronze-200/50 ring-bronze-200/40',
    danger:
      'bg-cinnabar-400 text-white hover:bg-cinnabar-500 active:bg-cinnabar-500 ring-cinnabar-300/40',
    success:
      'bg-bamboo-400 text-white hover:bg-bamboo-500 active:bg-bamboo-500 ring-bamboo-300/40',
  };
  const sizes: Record<Size, string> = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[32px]',
    md: 'px-4 py-2 text-sm gap-2 min-h-[40px]',
    lg: 'px-6 py-2.5 text-base gap-2.5 min-h-[48px]',
  };
  return (
    <button
      {...rest}
      className={twMerge(
        'inline-flex items-center justify-center rounded-md font-medium transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
}
