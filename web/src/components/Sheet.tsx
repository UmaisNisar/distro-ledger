import { useEffect, type ReactNode } from 'react'
import { IconClose } from './icons'

/**
 * Presented modal: bottom sheet on mobile, centered card on desktop.
 * Content scrolls inside; the shell size is fixed so nothing shifts the page.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg flex flex-col rounded-t-[20px] sm:rounded-[20px]"
        style={{ background: 'var(--bg-elevated)', maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 hairline shrink-0">
          <span className="headline">{title}</span>
          <button className="btn-ghost btn" onClick={onClose} aria-label="Close">
            <IconClose width={22} height={22} />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4 flex flex-col gap-3">{children}</div>
        {footer && <div className="px-4 py-3 hairline shrink-0" style={{ borderBottom: 'none', borderTop: '0.5px solid var(--separator)' }}>{footer}</div>}
      </div>
    </div>
  )
}
