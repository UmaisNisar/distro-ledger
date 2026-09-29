import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

export const TextField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }
>(function TextField({ label, error, ...rest }, ref) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <input ref={ref} className="field-input" {...rest} />
      <span className="field-error">{error ?? ''}</span>
    </div>
  )
})

export const TextareaField = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }
>(function TextareaField({ label, error, ...rest }, ref) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <textarea ref={ref} className="field-input" {...rest} />
      <span className="field-error">{error ?? ''}</span>
    </div>
  )
})

export const SelectField = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; children: React.ReactNode }
>(function SelectField({ label, error, children, ...rest }, ref) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <select ref={ref} className="field-input" {...rest}>
        {children}
      </select>
      <span className="field-error">{error ?? ''}</span>
    </div>
  )
})

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`seg-item ${value === o.value ? 'active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
