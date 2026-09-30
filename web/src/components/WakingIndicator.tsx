import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { getInflight, subscribeInflight } from '../lib/api'

// Tuning (ported from PaymentTracker's WakingIndicator):
// warm requests finish before SHOW_DELAY, so the bar only ever appears on a slow
// (cold-start) request; the hint explains the wait once it's clearly a cold start.
const SHOW_DELAY_MS = 800
const HINT_DELAY_MS = 5000
const TIME_CONSTANT_MS = 18000
const CAP = 0.95
const FINISH_HOLD_MS = 350

function computeFakeProgress(elapsedMs: number): number {
  return Math.min(1 - Math.exp(-elapsedMs / TIME_CONSTANT_MS), CAP)
}

/** True whenever at least one API request is in flight (any page, incl. login). */
function useApiBusy(): boolean {
  return useSyncExternalStore(
    (cb) => subscribeInflight(cb),
    () => getInflight() > 0,
    () => false,
  )
}

/** Cold-start progress bar. Fixed, bottom-right, appears only when the API is slow. */
export function WakingIndicator() {
  const loading = useApiBusy()
  const [visible, setVisible] = useState(false)
  const [percent, setPercent] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!loading) {
      if (visible) {
        setFinishing(true)
        setPercent(1)
        const t = setTimeout(() => {
          setVisible(false)
          setFinishing(false)
          setPercent(0)
          setShowHint(false)
          startRef.current = null
        }, FINISH_HOLD_MS)
        return () => clearTimeout(t)
      }
      return
    }

    startRef.current = performance.now()
    setFinishing(false)
    const showTimer = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    const hintTimer = setTimeout(() => setShowHint(true), HINT_DELAY_MS)

    const tick = () => {
      const elapsed = performance.now() - (startRef.current ?? performance.now())
      setPercent(computeFakeProgress(elapsed))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hintTimer)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [loading, visible])

  if (!visible) return null
  const pctText = Math.round(percent * 100)

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 right-4 z-[200] w-[320px] max-w-[calc(100vw-2rem)] panel bg-base-100 transition-opacity duration-300 ease-out ${
        finishing ? 'opacity-0' : 'fade-in opacity-100'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border-2 border-primary border-r-transparent animate-spin" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate section-header text-base-content">{finishing ? 'Connected' : 'Waking server'}</p>
            <p className="tabular text-[0.72rem] font-semibold text-secondary">{pctText}%</p>
          </div>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded bg-base-300">
            <div className="h-full rounded bg-primary transition-[width] duration-200 ease-out" style={{ width: `${pctText}%` }} />
          </div>
          {showHint && !finishing && (
            <p className="mt-1.5 footnote text-tertiary">
              Free tier — the first request can take 30–60s while the API spins up.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
