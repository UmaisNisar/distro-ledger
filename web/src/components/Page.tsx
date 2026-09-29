import type { ReactNode } from 'react'

/** Standard page scaffold with an iOS large title and optional right-side action. */
export function Page({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-3 pt-6 sm:pt-8">
        <h1 className="large-title">{title}</h1>
        {action && <div className="shrink-0 pb-1">{action}</div>}
      </header>
      {children}
    </div>
  )
}
