import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { PaymentStatus } from '../lib/types'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'

const VARIANT: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-neutral btn-outline',
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

export function Spinner({ className = '' }: { className?: string }) {
  return <span className={`loading loading-spinner loading-lg text-primary ${className}`} />
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const cls =
    status === 'Paid' ? 'badge-success' : status === 'Partial' ? 'badge-warning' : 'badge-error'
  return <span className={`badge badge-soft ${cls} font-semibold`}>{status}</span>
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
  icon: Icon,
  accent,
  invert,
}: {
  label: string
  value: string
  hint?: string
  icon?: LucideIcon
  accent?: boolean
  /** Dark, high-emphasis tile — use for the primary KPI. */
  invert?: boolean
}) {
  const iconBg = invert
    ? 'rgba(255,255,255,0.12)'
    : accent
      ? 'color-mix(in oklab, var(--color-primary) 16%, transparent)'
      : 'color-mix(in oklab, var(--color-base-content) 8%, transparent)'
  const iconColor = invert
    ? '#f5f3ee'
    : accent
      ? 'var(--color-primary)'
      : 'var(--color-base-content)'
  return (
    <div
      className={`panel panel-hover p-5 flex items-start gap-3 min-w-0 ${invert ? 'border-transparent' : ''}`}
      style={invert ? { background: 'var(--color-neutral)', color: 'var(--color-neutral-content)' } : undefined}
    >
      {Icon && (
        <span
          className="hidden sm:grid place-items-center rounded-xl shrink-0"
          style={{ width: 40, height: 40, background: iconBg, color: iconColor }}
        >
          <Icon size={20} />
        </span>
      )}
      <div className="min-w-0">
        <div className={`footnote truncate ${invert ? 'opacity-70' : 'text-secondary'}`}>{label}</div>
        <div
          className="tabular truncate font-semibold"
          style={{ fontSize: 'clamp(1.15rem, 5vw, 1.6rem)', lineHeight: 1.15 }}
          title={value}
        >
          {value}
        </div>
        {hint && <div className={`footnote truncate ${invert ? 'opacity-60' : 'text-tertiary'}`}>{hint}</div>}
      </div>
    </div>
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
