import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { ArrowRight, type LucideIcon } from 'lucide-react'
import type { PaymentStatus } from '../lib/types'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'

const VARIANT: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary-line',
  ghost: 'btn-ghost',
  danger: 'btn-error btn-outline',
  soft: 'btn-primary btn-soft',
}

export function Button({
  variant = 'primary',
  block,
  loading,
  size = 'md',
  children,
  className = '',
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  block?: boolean
  loading?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeCls = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''
  return (
    <button
      className={`btn ${VARIANT[variant]} ${sizeCls} ${block ? 'btn-block' : ''} gap-2 ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className="loading loading-spinner loading-sm" />}
      {children}
    </button>
  )
}

/** Inline text link that clearly reads as clickable (underline on hover + arrow). */
export function LinkAction({
  children,
  onClick,
}: {
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center gap-1 footnote font-semibold text-primary cursor-pointer hover:underline underline-offset-4 decoration-2"
    >
      {children}
      <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}

export function Spinner({ className = '' }: { className?: string }) {
  return <span className={`loading loading-spinner loading-lg text-primary ${className}`} />
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const cls =
    status === 'Paid' ? 'badge-success' : status === 'Partial' ? 'badge-warning' : 'badge-error'
  const tip =
    status === 'Paid' ? 'Paid in full' : status === 'Partial' ? 'Partially paid — balance outstanding' : 'Unpaid — full amount outstanding'
  return <span className={`badge badge-soft ${cls} font-semibold`} title={tip}>{status}</span>
}

export function SectionHeader({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mt-1 mb-2 px-1">
      <span className="section-header">{children}</span>
      {action}
    </div>
  )
}

export function StatTile({
  label,
  value,
  hint,
  invert,
  onClick,
  size = 'md',
  tip,
}: {
  label: string
  value: string
  hint?: string
  /** Hover explanation of what this metric means. */
  tip?: string
  /** Kept for API compatibility; decorative icons are no longer rendered. */
  icon?: LucideIcon
  accent?: boolean
  /** Dark, high-emphasis tile — use for the primary KPI. */
  invert?: boolean
  /** When set, the whole tile is a button. */
  onClick?: () => void
  /** 'sm' for narrow tiles (e.g. inside a detail panel). */
  size?: 'sm' | 'md'
}) {
  const sm = size === 'sm'
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      title={tip}
      className={`panel ${onClick ? 'panel-hover cursor-pointer' : ''} ${sm ? 'p-4' : 'p-5'} flex flex-col gap-1.5 min-w-0 w-full text-left ${invert ? 'border-transparent' : ''}`}
      style={invert ? { background: 'var(--color-primary)', color: 'var(--color-primary-content)' } : undefined}
    >
      <span
        className="text-[0.7rem] font-bold uppercase tracking-[0.08em] truncate"
        style={{ color: invert ? 'color-mix(in oklab, var(--color-primary-content) 72%, transparent)' : 'color-mix(in oklab, var(--color-base-content) 58%, transparent)' }}
      >
        {label}
      </span>
      <span
        className="tabular truncate font-semibold"
        style={{ fontSize: sm ? 'clamp(0.95rem, 3.2vw, 1.35rem)' : 'clamp(1rem, 4.6vw, 1.9rem)', lineHeight: 1.1 }}
        title={value}
      >
        {value}
      </span>
      {hint && (
        <span className="footnote truncate" style={{ color: invert ? 'color-mix(in oklab, var(--color-primary-content) 60%, transparent)' : 'color-mix(in oklab, var(--color-base-content) 50%, transparent)' }}>
          {hint}
        </span>
      )}
    </Tag>
  )
}

export function EmptyState({
  title,
  subtitle,
  icon: Icon,
  action,
}: {
  title: string
  subtitle?: string
  icon?: LucideIcon
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-2 py-16 px-6">
      {Icon && (
        <span
          className="grid place-items-center rounded-2xl mb-1"
          style={{
            width: 56,
            height: 56,
            background: 'color-mix(in oklab, var(--color-base-content) 7%, transparent)',
            color: 'color-mix(in oklab, var(--color-base-content) 45%, transparent)',
          }}
        >
          <Icon size={26} />
        </span>
      )}
      <div className="headline">{title}</div>
      {subtitle && <div className="subhead text-secondary max-w-sm">{subtitle}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export function SkeletonRows({ count = 6 }: { count?: number }) {
  return (
    <div className="panel p-2 flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <div className="skeleton h-4 w-1/3" />
          <div className="skeleton h-4 w-20 ml-auto" />
          <div className="skeleton h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}
