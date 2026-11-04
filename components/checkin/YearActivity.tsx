// Pattern: magpui / activity heatmap with project breakdown (after Rare UI's GitHub activity; adapted to Check-in tokens)
'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { HUE_CLASS, type Hue } from '@/lib/colors'
import { addDays, localDate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { ChevronIcon } from './icons'

export interface ActivityCrew {
  id: string
  name: string
  color: Hue
  emoji?: string | null
  /** Check-ins in this crew over the year. */
  count: number
}

const WEEKS = 31
const EASE_SWAP = [0.22, 1, 0.36, 1] as const
const EASE_TIP = [0.2, 0, 0, 1] as const
/** Mint by how many check-ins a day holds: none, 1, 2, 3, 4+. */
const LEVEL = ['bg-muted', 'bg-primary/25', 'bg-primary/45', 'bg-primary/70', 'bg-primary'] as const
const DAY = ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays']

/**
 * Your year in one small card (340:172, filling its column): the check-in count for the year over the last 31 weeks as a mint
 * grid, and your top three crews behind the round toggle. The card keeps its size while the two views
 * crossfade (280ms, the entering one rises 8px, rows stagger 35ms); hover or focus a day for a pale
 * tooltip. The grid is one tab stop: arrow keys move by day (up/down) and week (left/right).
 */
export function YearActivity({
  counts, crews, month, today = new Date(), className,
}: {
  /** Check-ins per day, keyed YYYY-MM-DD. */
  counts: Record<string, number>
  crews: ActivityCrew[]
  /** This month against the last, shown in the header ("+3 vs last month", else "4 this month"). */
  month?: { thisMonth: number; lastMonth: number }
  today?: Date
  className?: string
}) {
  const reduce = useReducedMotion() ?? false
  const [view, setView] = useState<'year' | 'crews'>('year')
  const moved = useRef(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const backRef = useRef<HTMLButtonElement>(null)

  // Hand focus to the other view's control after a switch (not on first render).
  useEffect(() => {
    if (!moved.current) return
    ;(view === 'crews' ? backRef : toggleRef).current?.focus()
  }, [view])
  const go = (v: 'year' | 'crews') => {
    moved.current = true
    setView(v)
  }

  const year = today.getFullYear()
  const total = useMemo(
    () => Object.entries(counts).reduce((n, [k, c]) => (k.startsWith(`${year}-`) ? n + c : n), 0),
    [counts, year],
  )
  const top = useMemo(() => [...crews].sort((a, b) => b.count - a.count).slice(0, 3), [crews])

  const swap = {
    initial: { opacity: 0, y: reduce ? 0 : 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 0 },
    transition: { duration: reduce ? 0 : 0.28, ease: EASE_SWAP },
  }

  return (
    <section
      aria-label="Your year"
      className={cn('relative aspect-[340/172] w-full min-h-[172px] rounded-[18px] border bg-card edge-lit', className)}
    >
      <AnimatePresence initial={false}>
        {view === 'year' ? (
          <motion.div key="year" {...swap} className="absolute inset-0 flex flex-col p-[14px]">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[14px] font-medium leading-none">
                <span className="tnum">{total.toLocaleString()}</span> check-ins in {year}
              </h3>
              {month &&
                (month.thisMonth > month.lastMonth ? (
                  <span className="flex-none rounded-full bg-primary-soft px-2 py-0.5 font-mono text-[11px] text-primary-ink">
                    +{month.thisMonth - month.lastMonth} vs last month
                  </span>
                ) : (
                  <span className="flex-none font-mono text-[11px] text-muted-foreground">
                    <span className="tnum text-foreground">{month.thisMonth}</span> this month ·{' '}
                    <span className="tnum">{month.lastMonth}</span> last
                  </span>
                ))}
            </div>
            <YearGrid counts={counts} today={today} />
            <div className="mt-auto flex h-10 items-center justify-between gap-2 rounded-[12px] bg-muted pl-3 pr-1.5">
              <span className="truncate text-[12px] text-muted-foreground">Most check-ins in</span>
              <span className="flex flex-none items-center gap-2">
                <span className="flex" aria-hidden="true">
                  {top.map((c, i) => (
                    <span
                      key={c.id}
                      className={cn(
                        'grid size-6 place-items-center rounded-full text-[12px] leading-none ring-2 ring-muted',
                        HUE_CLASS[c.color].solid,
                        i > 0 && '-ml-1.5',
                      )}
                    >
                      {c.emoji ?? c.name.trim()[0]?.toUpperCase()}
                    </span>
                  ))}
                </span>
                <button
                  ref={toggleRef}
                  type="button"
                  onClick={() => go('crews')}
                  aria-label="Show check-ins by crew"
                  className="hit-44 grid size-7 place-items-center rounded-full border border-border-strong text-muted-foreground transition-[transform,color,border-color] duration-150 ease-out hover:border-foreground/40 hover:text-foreground active:scale-[.97]"
                >
                  <ChevronIcon size={14} />
                </button>
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div key="crews" {...swap} className="absolute inset-0 flex flex-col p-[14px]">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[12px] text-muted-foreground">Most check-ins in</h3>
              <button
                ref={backRef}
                type="button"
                onClick={() => go('year')}
                aria-label="Back to your year"
                className="hit-44 grid size-7 place-items-center rounded-full border border-border-strong text-muted-foreground transition-[transform,color,border-color] duration-150 ease-out hover:border-foreground/40 hover:text-foreground active:scale-[.97]"
              >
                <ChevronIcon size={14} className="rotate-180" />
              </button>
            </div>
            <ol className="mt-2 flex flex-col gap-0.5">
              {top.map((c, i) => (
                <motion.li
                  key={c.id}
                  initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduce ? 0 : 0.28, ease: EASE_SWAP, delay: reduce ? 0 : 0.035 * (i + 1) }}
                  className="flex h-[34px] items-center gap-2.5 rounded-[10px] px-2 transition-colors duration-150 ease-out hover:bg-muted"
                >
                  <span
                    aria-hidden="true"
                    className={cn('grid size-6 flex-none place-items-center rounded-full text-[12px] leading-none', HUE_CLASS[c.color].solid)}
                  >
                    {c.emoji ?? c.name.trim()[0]?.toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{c.name}</span>
                  <span className="tnum font-mono text-[12px] text-muted-foreground">
                    {c.count.toLocaleString()}
                    <span className="sr-only"> check-ins</span>
                  </span>
                </motion.li>
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

/** The last 31 weeks, Monday on top, as an ARIA grid (weekdays are rows) with one tab stop. */
function YearGrid({ counts, today }: { counts: Record<string, number>; today: Date }) {
  const reduce = useReducedMotion() ?? false
  const todayKey = localDate(today)
  const dow = (today.getDay() + 6) % 7
  const start = addDays(today, -dow - (WEEKS - 1) * 7)

  // rows[d][w]: weekday d of week w.
  const rows = useMemo(
    () =>
      Array.from({ length: 7 }, (_, d) =>
        Array.from({ length: WEEKS }, (_, w) => {
          const day = addDays(start, w * 7 + d)
          const key = localDate(day)
          return { day, key, count: counts[key] ?? 0, future: key > todayKey }
        }),
      ),
    // start is derived from today; key on the day, not the Date object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [counts, todayKey],
  )
  const inDays = rows.flat().filter((c) => !c.future && c.count > 0).length

  // The roving tab stop (today to start), and which day the tooltip is on (hover or focus).
  const [cursor, setCursor] = useState<[number, number]>([dow, WEEKS - 1])
  const [tip, setTip] = useState<[number, number] | null>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const cells = useRef<Map<string, HTMLSpanElement>>(new Map())
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  const cellAt = (d: number, w: number) => rows[d]?.[w]

  // Place the tooltip above the active day, kept inside the grid's width.
  useLayoutEffect(() => {
    if (!tip) return
    const el = cells.current.get(`${tip[0]}-${tip[1]}`)
    const box = wrap.current
    if (!el || !box) return
    const b = box.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    const w = tipRef.current?.offsetWidth ?? 0
    const left = Math.min(Math.max(r.left - b.left + r.width / 2 - w / 2, -4), b.width - w + 4)
    setPos({ left, top: r.top - b.top - 6 })
  }, [tip])

  const focusCell = (d: number, w: number) => {
    setCursor([d, w])
    cells.current.get(`${d}-${w}`)?.focus()
  }

  const onKey = (e: KeyboardEvent) => {
    const [d, w] = cursor
    let next: [number, number] | null = null
    if (e.key === 'ArrowLeft') next = [d, w - 1]
    else if (e.key === 'ArrowRight') next = [d, w + 1]
    else if (e.key === 'ArrowUp') next = [d - 1, w]
    else if (e.key === 'ArrowDown') next = [d + 1, w]
    else if (e.key === 'Home') next = [d, 0]
    else if (e.key === 'End') next = [dow, WEEKS - 1]
    if (!next) return
    e.preventDefault()
    const c = cellAt(next[0], next[1])
    if (c && !c.future) focusCell(next[0], next[1])
  }

  const active = tip ? cellAt(tip[0], tip[1]) : null
  const label = (c: { day: Date; count: number }) => {
    const date = c.day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    return c.count === 0 ? `No check-ins on ${date}` : `${c.count} check-in${c.count === 1 ? '' : 's'} on ${date}`
  }

  return (
    <div ref={wrap} className="relative mt-2.5" onPointerLeave={() => setTip(wrap.current?.contains(document.activeElement) ? cursor : null)}>
      <p id="year-activity-summary" className="sr-only">
        {inDays} days in over the last {WEEKS} weeks. Arrow keys move by day and week.
      </p>
      <div
        role="grid"
        aria-label={`Check-ins, last ${WEEKS} weeks`}
        aria-describedby="year-activity-summary"
        onKeyDown={onKey}
        onBlur={(e) => {
          if (!wrap.current?.contains(e.relatedTarget as Node)) setTip(null)
        }}
        className="grid grid-cols-[repeat(31,minmax(0,1fr))] gap-[3px]"
      >
        {rows.map((row, d) => (
          <div role="row" key={d} aria-label={DAY[d]} className="contents">
            {row.map((c, w) => {
              const isCursor = cursor[0] === d && cursor[1] === w
              return (
                <span
                  key={c.key}
                  ref={(el) => {
                    if (el) cells.current.set(`${d}-${w}`, el)
                    else cells.current.delete(`${d}-${w}`)
                  }}
                  role="gridcell"
                  tabIndex={c.future ? undefined : isCursor ? 0 : -1}
                  aria-label={c.future ? 'Still to come' : label(c)}
                  aria-disabled={c.future || undefined}
                  onPointerEnter={() => !c.future && setTip([d, w])}
                  onFocus={() => {
                    setCursor([d, w])
                    setTip([d, w])
                  }}
                  className={cn(
                    'aspect-square rounded-[2px] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card',
                    c.future ? 'hatch opacity-40' : LEVEL[Math.min(c.count, 4)],
                  )}
                />
              )
            })}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            ref={tipRef}
            aria-hidden="true"
            initial={{ opacity: 0, y: reduce ? 0 : 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.12, ease: EASE_TIP }}
            style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? 'visible' : 'hidden' }}
            className="pointer-events-none absolute z-10 -translate-y-full whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-background shadow-overlay"
          >
            {label(active)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Deterministic sample data for the kitchen sink: a year of check-ins and three crews. */
export function demoYearActivity(today = new Date()): { counts: Record<string, number>; crews: ActivityCrew[] } {
  let seed = 20261103
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
  const counts: Record<string, number> = {}
  for (let i = 0; i < 400; i++) {
    const day = addDays(today, -i)
    const weekend = day.getDay() === 0 || day.getDay() === 6
    if (rand() < (weekend ? 0.45 : 0.68)) counts[localDate(day)] = 1 + Math.floor(rand() * rand() * 4.6)
  }
  return {
    counts,
    crews: [
      { id: 'dialed', name: 'DIALED', color: 'sky', emoji: '💪', count: 214 },
      { id: 'sketch', name: 'Sketchbook Daily', color: 'grape', emoji: '🎨', count: 96 },
      { id: 'pages', name: 'Ten Pages', color: 'lemon', emoji: '📚', count: 41 },
    ],
  }
}
