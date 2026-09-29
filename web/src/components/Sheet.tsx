import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

/**
 * Right-side slide-in drawer for creating/editing records.
 * Full width on mobile, a fixed panel on desktop. Backdrop dims the whole
 * viewport (portaled to <body>). Animates on both open and close.
 */
export function Sheet({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  eyebrow?: string
  children: ReactNode
  footer?: ReactNode
}) {
  const [closing, setClosing] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Play the exit animation, then tell the parent to unmount.
  const requestClose = useCallback(() => {
    if (closing) return
    setClosing(true)
    timer.current = setTimeout(() => onClose(), 210)
  }, [closing, onClose])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && requestClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, requestClose])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <button
        className={`absolute inset-0 bg-[rgba(22,32,27,0.38)] cursor-default ${closing ? 'fade-out' : 'fade-in'}`}
        onClick={requestClose}
        aria-label="Close"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute top-0 right-0 bottom-0 w-full sm:w-[480px] flex flex-col bg-base-100 shadow-[-12px_0_40px_rgba(22,32,27,0.18)] ${closing ? 'drawer-out' : 'drawer-in'}`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-base-300 shrink-0">
          <div className="flex flex-col gap-0.5 min-w-0">
            {eyebrow && <span className="section-header">{eyebrow}</span>}
            <h3 className="title-2 truncate">{title}</h3>
          </div>
          <button
            className="grid place-items-center w-11 h-11 shrink-0 rounded-xl border border-base-300 hover:bg-base-200 transition-colors"
            onClick={requestClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 py-5 flex flex-col gap-1">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-base-300 bg-base-100 shrink-0">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  )
}
