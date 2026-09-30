import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Calendar, Check, ChevronDown, Eye, EyeOff, Search } from 'lucide-react'
import { format as formatDate, parseISO } from 'date-fns'
import { DayPicker } from 'react-day-picker'

function Wrap({
  id,
  label,
  error,
  required,
  hint,
  children,
}: {
  id: string
  label: string
  error?: string
  required?: boolean
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-[0.92rem] font-semibold mb-1.5">
        {label}
        {required && <span className="text-error ml-0.5" aria-hidden="true">*</span>}
      </label>
      {children}
      {/* one reserved line: shows the error, else the hint — never shifts layout */}
      <div className="min-h-[18px] pt-1 text-xs leading-tight">
        {error ? (
          <span className="text-error">{error}</span>
        ) : hint ? (
          <span className="text-tertiary">{hint}</span>
        ) : null}
      </div>
    </div>
  )
}

export const TextField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string; required?: boolean }
>(function TextField({ label, error, hint, required, className = '', id, ...rest }, ref) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <Wrap id={fieldId} label={label} error={error} required={required} hint={hint}>
      <input id={fieldId} ref={ref} required={required} className={`input w-full ${error ? 'input-error' : ''} ${className}`} {...rest} />
    </Wrap>
  )
})

/** Password input with a show/hide eye toggle. */
export const PasswordField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string; required?: boolean }
>(function PasswordField({ label, error, hint, required, className = '', id, ...rest }, ref) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const [show, setShow] = useState(false)
  return (
    <Wrap id={fieldId} label={label} error={error} required={required} hint={hint}>
      <div className={`input w-full flex items-center gap-2 pr-1 ${error ? 'input-error' : ''}`}>
        <input
          id={fieldId}
          ref={ref}
          type={show ? 'text' : 'password'}
          className={`grow bg-transparent border-0 outline-none ${className}`}
          {...rest}
        />
        <button
          type="button"
          className="grid place-items-center w-9 h-9 shrink-0 rounded-lg hover:bg-base-200 text-secondary transition-colors"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </Wrap>
  )
})

/** Currency amount input — shows the symbol inline, whole numbers only. */
export const MoneyField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; symbol?: string; hint?: string; required?: boolean }
>(function MoneyField({ label, error, hint, required, className = '', id, symbol = 'Rs', ...rest }, ref) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <Wrap id={fieldId} label={label} error={error} required={required} hint={hint}>
      <div className={`input w-full flex items-center gap-2 ${error ? 'input-error' : ''}`}>
        <span className="shrink-0 text-secondary font-semibold select-none">{symbol}</span>
        <input
          id={fieldId}
          ref={ref}
          type="number"
          inputMode="numeric"
          step="1"
          min="0"
          className={`grow bg-transparent border-0 outline-none tabular ${className}`}
          {...rest}
        />
      </div>
    </Wrap>
  )
})

export type ComboOption = { value: string; label: string; hint?: string }

/** Searchable single-select (typeahead). Filters options as you type. */
export function Combobox({
  label,
  value,
  onChange,
  options,
  placeholder = 'Search…',
  error,
  hint,
  required,
  emptyText = 'No matches',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: ComboOption[]
  placeholder?: string
  error?: string
  hint?: string
  required?: boolean
  emptyText?: string
}) {
  const id = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = options.find((o) => o.value === value)
  const q = query.trim().toLowerCase()
  const filtered = q
    ? options.filter((o) => o.label.toLowerCase().includes(q) || (o.hint ?? '').toLowerCase().includes(q))
    : options

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <Wrap id={id} label={label} error={error} required={required} hint={hint}>
      <div ref={wrapRef} className="relative">
        <button
          type="button"
          id={id}
          className={`input w-full flex items-center justify-between gap-2 text-left ${error ? 'input-error' : ''}`}
          onClick={() => setOpen((o) => !o)}
        >
          <span className={selected ? '' : 'text-tertiary'}>{selected ? selected.label : placeholder}</span>
          <ChevronDown size={18} className="opacity-50 shrink-0" />
        </button>
        {open && (
          <div className="absolute z-20 mt-1.5 w-full rounded-xl border border-base-300 bg-base-100 shadow-lg overflow-hidden fade-in">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-base-300">
              <Search size={16} className="opacity-50 shrink-0" />
              <input
                autoFocus
                className="grow bg-transparent border-0 outline-none text-[0.95rem]"
                placeholder="Type to search…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-3 text-sm text-secondary">{emptyText}</div>
              ) : (
                filtered.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-base-200 transition-colors"
                    onClick={() => {
                      onChange(o.value)
                      setOpen(false)
                      setQuery('')
                    }}
                  >
                    <span className="min-w-0 truncate text-[0.95rem]">{o.label}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      {o.hint && <span className="footnote text-tertiary tabular">{o.hint}</span>}
                      {o.value === value && <Check size={16} className="text-primary" />}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </Wrap>
  )
}

/** Themed date picker. Wraps react-day-picker (the calendar DaisyUI officially
 * themes via its `.react-day-picker` component classes) in an in-app popover, so
 * it matches the app instead of the unstyleable native browser popup. Value is an
 * ISO date string (yyyy-MM-dd). */
export function DateField({
  label,
  value,
  onChange,
  error,
  hint,
  required,
  placeholder = 'Select a date',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  hint?: string
  required?: boolean
  placeholder?: string
}) {
  const id = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const parsed = value ? parseISO(value) : null
  const selected = parsed && !isNaN(parsed.getTime()) ? parsed : undefined

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const thisYear = new Date().getFullYear()

  return (
    <Wrap id={id} label={label} error={error} required={required} hint={hint}>
      <div ref={wrapRef} className="relative">
        <button
          type="button"
          id={id}
          className={`input w-full flex items-center justify-between gap-2 text-left ${error ? 'input-error' : ''}`}
          onClick={() => setOpen((o) => !o)}
        >
          <span className={selected ? 'tabular' : 'text-tertiary'}>
            {selected ? formatDate(selected, 'd MMM yyyy') : placeholder}
          </span>
          <Calendar size={18} className="opacity-50 shrink-0" />
        </button>
        {open && (
          <div className="absolute z-30 mt-1.5 rounded-xl border border-base-300 bg-base-100 shadow-lg overflow-hidden fade-in">
            <DayPicker
              className="react-day-picker"
              mode="single"
              required={false}
              selected={selected}
              defaultMonth={selected}
              onSelect={(d) => {
                onChange(d ? formatDate(d, 'yyyy-MM-dd') : '')
                if (d) setOpen(false)
              }}
              captionLayout="dropdown"
              startMonth={new Date(thisYear - 5, 0)}
              endMonth={new Date(thisYear + 1, 11)}
              showOutsideDays
            />
          </div>
        )}
      </div>
    </Wrap>
  )
}

export const TextareaField = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; hint?: string; required?: boolean }
>(function TextareaField({ label, error, hint, required, className = '', id, ...rest }, ref) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <Wrap id={fieldId} label={label} error={error} required={required} hint={hint}>
      <textarea id={fieldId} ref={ref} required={required} className={`textarea w-full min-h-24 ${error ? 'textarea-error' : ''} ${className}`} {...rest} />
    </Wrap>
  )
})

export const SelectField = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; hint?: string; required?: boolean; children: ReactNode }
>(function SelectField({ label, error, hint, required, className = '', children, id, ...rest }, ref) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <Wrap id={fieldId} label={label} error={error} required={required} hint={hint}>
      <select id={fieldId} ref={ref} required={required} className={`select w-full ${error ? 'select-error' : ''} ${className}`} {...rest}>
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
