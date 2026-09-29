import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

/**
 * DaisyUI modal: centered dialog on desktop, bottom sheet on mobile.
 * Overlays the page (no layout shift); content scrolls inside; animated open.
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
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="modal modal-open modal-bottom sm:modal-middle">
      <div className="modal-box modal-pop p-0 flex flex-col max-h-[92vh] sm:max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-base-300 sticky top-0 bg-base-100 z-10">
          <h3 className="headline">{title}</h3>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-5 py-4 flex flex-col gap-1">{children}</div>
        {footer && (
          <div className="px-5 py-4 border-t border-base-300 bg-base-100 sticky bottom-0">{footer}</div>
        )}
      </div>
      <button className="modal-backdrop" onClick={onClose} aria-label="Close">
        close
      </button>
    </div>,
    document.body,
  )
}
