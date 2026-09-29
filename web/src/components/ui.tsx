import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { PaymentStatus } from '../lib/types'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

export function Button({
  variant = 'primary',
  block,
  loading,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  block?: boolean
  loading?: boolean
}) {
  return (
    <button
      className={`btn btn-${variant} ${block ? 'btn-block' : ''} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner small /> : children}
    </button>
  )
}

export function Spinner({ small }: { small?: boolean }) {
  const s = small ? 18 : 28
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" className="animate-spin" style={{ animation: 'spin 0.8s linear infinite' }}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.25" />
      <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </svg>
  )
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const cls = status === 'Paid' ? 'badge-paid' : status === 'Partial' ? 'badge-partial' : 'badge-unpaid'
  return <span className={`badge ${cls}`}>{status}</span>
}

export function SectionHeader({ children }: { children: ReactNode }) {
  return <div className="section-header">{children}</div>
}

export function StatTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string
  hint?: string
  accent?: boolean
}) {
  return (
    <div className="card p-4 flex flex-col gap-1 min-w-0">
      <span className="footnote text-secondary truncate">{label}</span>
      <span
        className="title-2 truncate"
        style={accent ? { color: 'var(--accent)' } : undefined}
        title={value}
      >
        {value}
      </span>
      {hint && <span className="footnote text-tertiary truncate">{hint}</span>}
    </div>
  )
}

export function EmptyState({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-2 py-16 px-6">
      <div className="headline">{title}</div>
      {subtitle && <div className="subhead text-secondary max-w-xs">{subtitle}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export function SkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <div className="inset-group">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="list-row">
          <div className="skeleton h-4 w-1/3" />
          <div className="skeleton h-4 w-16 ml-auto" />
        </div>
      ))}
    </div>
  )
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div
      className="subhead"
      style={{ color: 'var(--danger)', padding: '12px 16px', background: 'color-mix(in srgb, var(--danger) 10%, transparent)', borderRadius: 'var(--radius-group)' }}
    >
      {message}
    </div>
  )
}
