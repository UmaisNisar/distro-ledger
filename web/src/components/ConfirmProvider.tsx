import { AlertTriangle } from 'lucide-react'
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { Button } from './ui'

interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | undefined>(undefined)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<(v: boolean) => void>(() => {})

  const confirm = useCallback<ConfirmFn>((options) => {
    setOpts(options)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const close = (result: boolean) => {
    resolver.current(result)
    setOpts(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {opts && (
        <div className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box modal-pop sm:max-w-sm">
            <div className="flex gap-3">
              {opts.danger && (
                <span className="grid place-items-center w-10 h-10 rounded-full shrink-0"
                  style={{ background: 'color-mix(in oklab, var(--color-error) 15%, transparent)', color: 'var(--color-error)' }}>
                  <AlertTriangle size={20} />
                </span>
              )}
              <div className="min-w-0">
                <h3 className="headline">{opts.title}</h3>
                {opts.message && <p className="subhead text-secondary mt-1">{opts.message}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => close(false)}>
                {opts.cancelLabel ?? 'Cancel'}
              </Button>
              <Button variant={opts.danger ? 'danger' : 'primary'} onClick={() => close(true)}>
                {opts.confirmLabel ?? 'Confirm'}
              </Button>
            </div>
          </div>
          <button className="modal-backdrop" onClick={() => close(false)} aria-label="Cancel">close</button>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}
