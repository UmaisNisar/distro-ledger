import { shortNum } from '../lib/format'

export interface MonthBar {
  monthName: string
  total: number
  transactions: number
}

/**
 * Editorial bar chart: labelled bars, a selected month, click to select.
 * Pure CSS/flex (no chart lib) so bars are fully controllable and clickable.
 */
export function MonthBarChart({
  data,
  selected,
  onSelect,
  height = 240,
}: {
  data: MonthBar[]
  selected: number
  onSelect: (index: number) => void
  height?: number
}) {
  const max = Math.max(1, ...data.map((d) => d.total))
  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex items-end gap-1.5 sm:gap-3 border-b border-base-300"
        style={{ height }}
      >
        {data.map((d, i) => {
          const sel = i === selected
          const h = d.total > 0 ? Math.max(8, Math.round((d.total / max) * (height - 34))) : 3
          const fill = d.total === 0
            ? 'var(--color-base-300)'
            : sel
              ? 'var(--color-primary)'
              : 'color-mix(in oklab, var(--color-primary) 32%, var(--color-base-100))'
          return (
            <button
              key={d.monthName}
              type="button"
              onClick={() => onSelect(i)}
              aria-label={`${d.monthName}: ${shortNum(d.total)}`}
              title={`${d.monthName} · ${shortNum(d.total)} · ${d.transactions} ${d.transactions === 1 ? 'sale' : 'sales'}`}
              className="flex-1 basis-0 flex flex-col justify-end items-center gap-1.5 pb-2 group"
              style={{ height }}
            >
              <span
                className="tabular text-[11px] transition-colors"
                style={{
                  color: sel ? 'var(--color-base-content)' : 'color-mix(in oklab, var(--color-base-content) 55%, transparent)',
                  fontWeight: sel ? 600 : 500,
                  opacity: d.total > 0 ? 1 : 0,
                }}
              >
                {shortNum(d.total)}
              </span>
              <span
                className="block w-full rounded-t-lg transition-[height,background-color] duration-200 group-hover:brightness-95"
                style={{ height: h, background: fill, borderRadius: '8px 8px 3px 3px' }}
              />
            </button>
          )
        })}
      </div>
      <div className="flex gap-1.5 sm:gap-3">
        {data.map((d, i) => (
          <span
            key={d.monthName}
            className="flex-1 basis-0 text-center text-xs"
            style={{
              color: i === selected ? 'var(--color-base-content)' : 'color-mix(in oklab, var(--color-base-content) 55%, transparent)',
              fontWeight: i === selected ? 700 : 500,
            }}
          >
            {d.monthName.slice(0, 3)}
          </span>
        ))}
      </div>
    </div>
  )
}
