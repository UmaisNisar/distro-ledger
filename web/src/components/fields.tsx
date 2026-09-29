import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

function Wrap({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium mb-1.5 text-secondary">{label}</label>
      {children}
      {/* reserved space: errors never shift layout */}
      <div className="min-h-[18px] pt-1 text-xs text-error leading-tight">{error ?? ''}</div>
    </div>
  )
}

export const TextField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }
>(function TextField({ label, error, className = '', ...rest }, ref) {
  return (
    <Wrap label={label} error={error}>
      <input ref={ref} className={`input w-full ${error ? 'input-error' : ''} ${className}`} {...rest} />
    </Wrap>
  )
})

export const TextareaField = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }
>(function TextareaField({ label, error, className = '', ...rest }, ref) {
  return (
    <Wrap label={label} error={error}>
      <textarea ref={ref} className={`textarea w-full min-h-24 ${error ? 'textarea-error' : ''} ${className}`} {...rest} />
    </Wrap>
  )
})

export const SelectField = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; children: ReactNode }
>(function SelectField({ label, error, className = '', children, ...rest }, ref) {
  return (
    <Wrap label={label} error={error}>
      <select ref={ref} className={`select w-full ${error ? 'select-error' : ''} ${className}`} {...rest}>
        {children}
      </select>
    </Wrap>
  )
})

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = 'sm',
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  size?: 'sm' | 'md'
}) {
  const sz = size === 'sm' ? 'btn-sm' : ''
  return (
    <div className="join">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`btn ${sz} join-item ${value === o.value ? 'btn-primary' : 'btn-ghost bg-base-100'}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
