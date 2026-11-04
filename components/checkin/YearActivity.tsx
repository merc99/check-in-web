// Pattern: magpui / activity heatmap with project breakdown (after Rare UI's GitHub activity; adapted to Check-in tokens)
'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { HUE_CLASS, type Hue } from '@/lib/colors'
import { addDays, localDate } from '@/lib/dates'
import { cn } from '@/lib/utils'

export interface ActivityCrew {
  id: string
  name: string
  color: Hue
  emoji?: string | null
  /** Check-ins in this crew this year. */
  count: number
}

const WEEKS = 31
const EASE_SWAP = [0.22, 1, 0.36, 1] as const
const EASE_TIP = [0.2, 0, 0, 1] as const
/** How strong a day reads by its check-ins: 1, 2, 3+. */
const STRENGTH = ['', 'opacity-45', 'opacity-75', 'opacity-100'] as const
const DAY = ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays']
const DAY_LETTER = ['M', '', 'W', '', 'F', '', '']

type Cell = { day: Date; key: string; future: boolean; total: number; byCrew: [string, number][] }

/**
 * Your year in one card: the last 31 weeks as a grid, each day in the color of the crew you checked
 * in with most (deeper with more check-ins), month names above and M/W/F down the side. Crew chips
 * under it filter the grid (and the month bars) to one crew. A line under the grid tells the day you point at, tap or
 * focus (date and crews), or sums up the stretch when nothing is picked. The grid is one tab stop:
 * arrow keys move by week and day, Enter pins a day, Escape lets it go.
 */
export function YearActivity({
  byDay, crews, month, today = new Date(), className,
}: {
  /** Check-ins per day (YYYY-MM-DD), per crew id. */
  byDay: Record<string, Record<string, number>>
  crews: ActivityCrew[]
  /** This month against the last, in the header ("+3 vs last month", else "4 this month · 27 last"). */
  month?: { thisMonth: number; lastMonth: number }
  today?: Date
  className?: string
}) {
  const reduce = useReducedMotion() ?? false
  const [crewId, setCrewId] = useState<string | null>(null)
  const crewOf = useMemo(() => new Map(crews.map((c) => [c.id, c])), [crews])
  const ranked = useMemo(() => [...crews].sort((a, b) => b.count - a.count), [crews])
  const picked = crewId ? crewOf.get(crewId) ?? null : null

  const year = today.getFullYear()
  const total = picked ? picked.count : ranked.reduce((n, c) => n + c.count, 0)

  // The grid's days, weekday rows by week columns, filtered to the picked crew.
  const todayKey = localDate(today)
  const dow = (today.getDay() + 6) % 7
  const rows: Cell[][] = useMemo(() => {
    const start = addDays(today, -dow - (WEEKS - 1) * 7)
    return Array.from({ length: 7 }, (_, d) =>
      Array.from({ length: WEEKS }, (_, w) => {
        const day = addDays(start, w * 7 + d)
        const key = localDate(day)
        const all = Object.entries(byDay[key] ?? {}).filter(([id]) => !crewId || id === crewId)
        all.sort((a, b) => b[1] - a[1])
        return { day, key, future: key > todayKey, total: all.reduce((n, [, c]) => n + c, 0), byCrew: all }
      }),
    )
    // today is keyed by its date.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byDay, crewId, todayKey])

  // Month names over the week each month starts in (the first column only when the next is far off).
  const months = useMemo(() => {
    const starts = rows[0].map((_, w) => rows.map((r) => r[w]).find((c) => c.day.getDate() === 1)?.day ?? null)
    const next = starts.findIndex((d, i) => i > 0 && d)
    return starts.map((d, i) => (i === 0 ? (next === -1 || next > 3 ? rows[0][0].day : null) : d))
  }, [rows])

  // The summary when no day is picked: days in and the weekday you show up most.
  const summary = useMemo(() => {
    const past = rows.flat().filter((c) => !c.future)
    const daysIn = past.filter((c) => c.total > 0).length
    const perDow = rows.map((r) => r.filter((c) => !c.future && c.total > 0).length)
    const best = perDow.indexOf(Math.max(...perDow))
    return { daysIn, of: past.length, best: daysIn ? DAY[best] : null }
  }, [rows])

  // Each month in view: its check-ins (filtered like the grid), for the bars under the day line.
  const perMonth = useMemo(() => {
    const out: { key: string; date: Date; count: number }[] = []
    for (const c of rows.flatMap((r) => r).sort((a, b) => a.key.localeCompare(b.key))) {
      const key = c.key.slice(0, 7)
      let m = out[out.length - 1]
      if (!m || m.key !== key) out.push((m = { key, date: c.day, count: 0 }))
      m.count += c.total
    }
    return out
  }, [rows])
  const monthMax = Math.max(1, ...perMonth.map((m) => m.count))
  const thisMonthKey = todayKey.slice(0, 7)

  // Which day the detail line (and tooltip) is about: pointer or focus first, then a pinned day.
  const [hover, setHover] = useState<[number, number] | null>(null)
  const [pinned, setPinned] = useState<[number, number] | null>(null)
  const shown = hover ?? pinned
  const shownCell = shown ? rows[shown[0]]?.[shown[1]] : null

  const swap = {
    initial: { opacity: 0, y: reduce ? 0 : 4 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 },
    transition: { duration: reduce ? 0 : 0.18, ease: EASE_SWAP },
  }

  return (
    <section aria-label="Your year" className={cn('flex flex-col rounded-[18px] border bg-card p-[14px] edge-lit', className)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="min-w-0 truncate text-[14px] font-medium leading-tight">
          <span className="tnum">{total.toLocaleString()}</span> check-ins{picked ? ` in ${picked.name}` : ''} in {year}
        </h3>
        {month && !picked &&
          (month.thisMonth > month.lastMonth ? (
            <span className="flex-none rounded-full bg-primary-soft px-2 py-0.5 font-mono text-[11px] text-primary-ink">
              +{month.thisMonth - month.lastMonth} vs last month
            </span>
          ) : (
            <span className="flex-none font-mono text-[11px] text-muted-foreground">
              <span className="tnum text-foreground">{month.thisMonth}</span> this month · <span className="tnum">{month.lastMonth}</span> in{' '}
              {new Date(today.getFullYear(), today.getMonth() - 1, 1).toLocaleDateString(undefined, { month: 'short' })}
            </span>
          ))}
      </div>

      <YearGrid
        rows={rows}
        months={months}
        crewOf={crewOf}
        cursorStart={[dow, WEEKS - 1]}
        hover={hover}
        pinned={pinned}
        onHover={setHover}
        onPin={setPinned}
        summaryText={`${summary.daysIn} of ${summary.of} days in over the last ${WEEKS} weeks.`}
      />

      {/* The day you're looking at, or the stretch at a glance. */}
      <div className="relative mt-3 h-5" aria-live="polite">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.p key={shownCell ? shownCell.key : `sum-${crewId ?? 'all'}`} {...swap} className="absolute inset-0 flex items-center gap-2 overflow-hidden whitespace-nowrap text-[12px] text-muted-foreground">
            {shownCell ? (
              <>
                <span className="font-medium text-foreground">
                  {shownCell.day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                {shownCell.byCrew.length === 0 ? (
                  <span>{shownCell.future ? 'Still to come' : 'No check-ins'}</span>
                ) : (
                  shownCell.byCrew.map(([id, n]) => {
                    const c = crewOf.get(id)
                    if (!c) return null
                    return (
                      <span key={id} className="inline-flex min-w-0 items-center gap-1.5">
                        <span aria-hidden="true" className={cn('size-2 flex-none rounded-full', HUE_CLASS[c.color].solid)} />
                        <span className="truncate">{c.name}</span>
                        {n > 1 && <span className="tnum font-mono text-[11px] text-subtle-foreground">×{n}</span>}
                      </span>
                    )
                  })
                )}
              </>
            ) : (
              <>
                <span>
                  <span className="tnum font-medium text-foreground">{summary.daysIn}</span> days in, last {WEEKS} weeks
                </span>
                {summary.best && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{summary.best} are your day</span>
                  </>
                )}
              </>
            )}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Month by month: one bar each, the current month in full ink. */}
      <ol aria-label="Check-ins by month" className="mt-2.5 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${perMonth.length}, minmax(0, 1fr))` }}>
        {perMonth.map((m) => {
          const now = m.key === thisMonthKey
          const name = m.date.toLocaleDateString(undefined, { month: 'short' })
          return (
            <li key={m.key} className="flex min-w-0 flex-col items-center gap-1">
              <span className="relative h-9 w-full overflow-hidden rounded-[6px] bg-muted">
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute inset-0 origin-bottom rounded-[6px] transition-transform duration-200 ease-out',
                    picked ? HUE_CLASS[picked.color].solid : 'bg-primary',
                    !now && 'opacity-70',
                  )}
                  style={{ transform: `scaleY(${m.count / monthMax})` }}
                />
              </span>
              <span className={cn('flex w-full flex-col items-center gap-0.5 font-mono text-[10px] leading-none', now ? 'text-foreground' : 'text-subtle-foreground')}>
                <span>{name}</span>
                <span className="tnum text-[9.5px] opacity-80">{m.count}</span>
              </span>
              <span className="sr-only">
                {name}: {m.count} check-ins
              </span>
            </li>
          )
        })}
      </ol>

      {/* Crews: tap one to see only its days (in its color); All brings everything back. */}
      <div role="group" aria-label="Show a crew" className="no-scrollbar -mx-1 mt-auto flex gap-1.5 overflow-x-auto px-1 pt-3">
        <CrewChip active={!crewId} onClick={() => setCrewId(null)} label="All" count={ranked.reduce((n, c) => n + c.count, 0)} />
        {ranked.map((c) => (
          <CrewChip
            key={c.id}
            active={crewId === c.id}
            onClick={() => setCrewId(crewId === c.id ? null : c.id)}
            label={c.name}
            count={c.count}
            dot={HUE_CLASS[c.color].solid}
          />
        ))}
      </div>
    </section>
  )
}

function CrewChip({ active, onClick, label, count, dot }: { active: boolean; onClick: () => void; label: string; count: number; dot?: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 flex-none items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition-[transform,background-color,color,border-color] duration-150 ease-out active:scale-[.97]',
        active ? 'border-transparent bg-foreground text-background' : 'bg-muted text-foreground hover:border-border-strong',
      )}
    >
      {dot && <span aria-hidden="true" className={cn('size-2 rounded-full', dot)} />}
      <span className="max-w-[140px] truncate">{label}</span>
      <span className={cn('tnum font-mono text-[11px]', active ? 'text-background/70' : 'text-muted-foreground')}>{count.toLocaleString()}</span>
    </button>
  )
}

/** The last 31 weeks, Monday on top, as an ARIA grid (weekdays are rows) with one tab stop. */
function YearGrid({
  rows, months, crewOf, cursorStart, hover, pinned, onHover, onPin, summaryText,
}: {
  rows: Cell[][]
  months: (Date | null)[]
  crewOf: Map<string, ActivityCrew>
  cursorStart: [number, number]
  hover: [number, number] | null
  pinned: [number, number] | null
  onHover: (c: [number, number] | null) => void
  onPin: (c: [number, number] | null) => void
  summaryText: string
}) {
  const reduce = useReducedMotion() ?? false
  const [cursor, setCursor] = useState<[number, number]>(cursorStart)
  const wrap = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const cells = useRef<Map<string, HTMLSpanElement>>(new Map())
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const tip = hover

  // Place the tooltip above the day, kept inside the grid's width.
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
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onPin(pinned && pinned[0] === d && pinned[1] === w ? null : [d, w])
      return
    }
    if (e.key === 'Escape') {
      onPin(null)
      return
    }
    let next: [number, number] | null = null
    if (e.key === 'ArrowLeft') next = [d, w - 1]
    else if (e.key === 'ArrowRight') next = [d, w + 1]
    else if (e.key === 'ArrowUp') next = [d - 1, w]
    else if (e.key === 'ArrowDown') next = [d + 1, w]
    else if (e.key === 'Home') next = [d, 0]
    else if (e.key === 'End') next = cursorStart
    if (!next) return
    e.preventDefault()
    const c = rows[next[0]]?.[next[1]]
    if (c && !c.future) focusCell(next[0], next[1])
  }

  const active = tip ? rows[tip[0]]?.[tip[1]] : null
  const label = (c: Cell) => {
    const date = c.day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    if (c.total === 0) return `No check-ins on ${date}`
    const names = c.byCrew.map(([id]) => crewOf.get(id)?.name).filter(Boolean).join(', ')
    return `${c.total} check-in${c.total === 1 ? '' : 's'} on ${date}: ${names}`
  }
  const tipText = (c: Cell) => {
    const date = c.day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    return c.total === 0 ? `None on ${date}` : `${c.total} on ${date}`
  }

  return (
    <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
      <span />
      {/* Month names over the week each starts in. */}
      <div aria-hidden="true" className="mb-1.5 grid h-3 grid-cols-[repeat(31,minmax(0,1fr))] gap-[3px] font-mono text-[10px] leading-none text-subtle-foreground">
        {months.map((m, i) => (
          <span key={i} className="relative">
            {m && <span className="absolute left-0 top-0 whitespace-nowrap">{m.toLocaleDateString(undefined, { month: 'short' })}</span>}
          </span>
        ))}
      </div>

      <div aria-hidden="true" className="grid grid-rows-7 gap-[3px] font-mono text-[10px] leading-none text-subtle-foreground">
        {DAY_LETTER.map((l, i) => (
          <span key={i} className="flex items-center">{l}</span>
        ))}
      </div>

      <div
        ref={wrap}
        className="relative"
        onPointerLeave={() => onHover(wrap.current?.contains(document.activeElement) ? cursor : null)}
      >
        <p id="year-activity-summary" className="sr-only">
          {summaryText} Arrow keys move by day and week; Enter shows a day below.
        </p>
        <div
          role="grid"
          aria-label={`Check-ins, last ${WEEKS} weeks`}
          aria-describedby="year-activity-summary"
          onKeyDown={onKey}
          onBlur={(e) => {
            if (!wrap.current?.contains(e.relatedTarget as Node)) onHover(null)
          }}
          className="grid grid-cols-[repeat(31,minmax(0,1fr))] gap-[3px]"
        >
          {rows.map((row, d) => (
            <div role="row" key={d} aria-label={DAY[d]} className="contents">
              {row.map((c, w) => {
                const isCursor = cursor[0] === d && cursor[1] === w
                const isPinned = pinned?.[0] === d && pinned?.[1] === w
                const top = c.byCrew[0] ? crewOf.get(c.byCrew[0][0]) : undefined
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
                    aria-selected={isPinned || undefined}
                    aria-disabled={c.future || undefined}
                    onPointerEnter={() => !c.future && onHover([d, w])}
                    onClick={() => {
                      if (c.future) return
                      setCursor([d, w])
                      onPin(isPinned ? null : [d, w])
                    }}
                    onFocus={() => {
                      setCursor([d, w])
                      onHover([d, w])
                    }}
                    className={cn(
                      'aspect-square cursor-pointer rounded-[2px] outline-none transition-opacity duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card',
                      c.future
                        ? 'cursor-default hatch opacity-40'
                        : top
                          ? cn(HUE_CLASS[top.color].solid, STRENGTH[Math.min(c.total, 3)])
                          : 'bg-muted',
                      isPinned && 'ring-2 ring-foreground ring-offset-1 ring-offset-card',
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
              {tipText(active)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/** Deterministic sample data for the kitchen sink: a year of check-ins across three crews. */
export function demoYearActivity(today = new Date()): { byDay: Record<string, Record<string, number>>; crews: ActivityCrew[] } {
  let seed = 20261103
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
  const crews: ActivityCrew[] = [
    { id: 'dialed', name: 'DIALED', color: 'sky', emoji: '💪', count: 0 },
    { id: 'sketch', name: 'Sketchbook Daily', color: 'grape', emoji: '🎨', count: 0 },
    { id: 'pages', name: 'Ten Pages', color: 'lemon', emoji: '📚', count: 0 },
  ]
  const weight = [0.6, 0.85, 1]
  const year = `${today.getFullYear()}-`
  const byDay: Record<string, Record<string, number>> = {}
  for (let i = 0; i < 400; i++) {
    const day = addDays(today, -i)
    const key = localDate(day)
    const weekend = day.getDay() === 0 || day.getDay() === 6
    if (rand() > (weekend ? 0.45 : 0.68)) continue
    const n = 1 + Math.floor(rand() * rand() * 3.4)
    for (let k = 0; k < n; k++) {
      const r = rand()
      const c = crews[weight.findIndex((x) => r < x)]
      ;(byDay[key] ??= {})[c.id] = (byDay[key][c.id] ?? 0) + 1
      if (key.startsWith(year)) c.count++
    }
  }
  return { byDay, crews }
}
