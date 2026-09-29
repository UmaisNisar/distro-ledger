import type { ReactNode } from 'react'

/** Page scaffold: animated entrance, large title, optional subtitle + right actions. */
export function Page({
  title,
  subtitle,
  eyebrow,
  action,
  children,
}: {
  title: string
  subtitle?: string
  eyebrow?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="animate-page flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && <div className="section-header mb-1">{eyebrow}</div>}
          <h1 className="large-title">{title}</h1>
          {subtitle && <p className="subhead text-secondary mt-1">{subtitle}</p>}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </header>
      {children}
    </div>
  )
}
