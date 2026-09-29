import type { ReactNode } from 'react'

/** Page scaffold: animated entrance, large title, optional subtitle + right actions. */
export function Page({
  title,
  subtitle,
  action,
  children,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="animate-page flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="large-title">{title}</h1>
          {subtitle && <p className="subhead text-secondary mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </header>
      {children}
    </div>
  )
}
