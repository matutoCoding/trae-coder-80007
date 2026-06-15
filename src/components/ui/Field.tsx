interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function Field({ label, hint, error, required, children, className = '' }: FieldProps) {
  return (
    <label className={`block ${className}`}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-ink-200">
          {label}
          {required && <span className="ml-0.5 text-cinnabar-400">*</span>}
        </span>
        {hint && <span className="text-[11px] text-ink-100">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1 text-xs text-cinnabar-400">{error}</p>}
    </label>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export function TextInput(props: InputProps) {
  return (
    <input
      {...props}
      className={[
        'w-full rounded-md border border-bronze-200 bg-rice-50/80 px-3 py-2 text-sm text-ink-300',
        'placeholder:text-ink-100/60 outline-none transition-all',
        'focus:border-bronze-400 focus:bg-white focus:ring-2 focus:ring-bronze-300/40',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        props.className || '',
      ].join(' ')}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}
export function Select(props: SelectProps) {
  return (
    <select
      {...props}
      className={[
        'w-full rounded-md border border-bronze-200 bg-rice-50/80 px-3 py-2 text-sm text-ink-300',
        'outline-none transition-all focus:border-bronze-400 focus:bg-white focus:ring-2 focus:ring-bronze-300/40',
        props.className || '',
      ].join(' ')}
    >
      {props.children}
    </select>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
export function Textarea(props: TextareaProps) {
  return (
    <textarea
      {...props}
      className={[
        'w-full rounded-md border border-bronze-200 bg-rice-50/80 px-3 py-2 text-sm text-ink-300',
        'placeholder:text-ink-100/60 outline-none transition-all',
        'focus:border-bronze-400 focus:bg-white focus:ring-2 focus:ring-bronze-300/40',
        props.className || '',
      ].join(' ')}
    />
  );
}
