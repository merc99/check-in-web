'use client'

// Pattern: magpui / Agent task list with folding subagents, by @n___vc (adapted to Check-in tokens)

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Lock } from 'lucide-react'
import { useCallback, useEffect, useReducer, useState, type ReactNode } from 'react'
import { RollingCount } from '@/components/fx/RollingCount'
import { cn } from '@/lib/utils'

/*
 * A careful agent working down a list. One step is active at a time: its ring turns, its timer counts,
 * and the small jobs it starts appear under it one by one, then fold away when the step is done and the
 * ring becomes a mint check joined to the next by the rail. A step marked `gate` never finishes itself:
 * it says "Asks first" and waits for the person.
 *
 * It is driven by a typed event stream (`useTaskRun().emit`), so the demo script and a real run look
 * the same to it.
 */

export type TaskStep = { id: string; label: string; gate?: boolean }
export type TaskEvent =
  | { type: 'step-start'; step: string }
  | { type: 'sub-start'; step: string; id: string; text: string }
  | { type: 'sub-done'; step: string; id: string; text?: string }
  | { type: 'step-done'; step: string }
  | { type: 'reset' }

type Sub = { id: string; text: string; done: boolean }
type StepState = { status: 'pending' | 'active' | 'done'; started?: number; ended?: number; subs: Sub[] }
export type TaskRunState = { steps: TaskStep[]; by: Record<string, StepState>; last?: string }

const fresh = (steps: TaskStep[]): TaskRunState => ({
  steps,
  by: Object.fromEntries(steps.map((s) => [s.id, { status: 'pending', subs: [] }])),
})

function reduce(state: TaskRunState, e: TaskEvent): TaskRunState {
  if (e.type === 'reset') return fresh(state.steps)
  const cur = state.by[e.step]
  if (!cur) return state
  const set = (next: StepState, last = state.last) => ({ ...state, last, by: { ...state.by, [e.step]: next } })
  switch (e.type) {
    case 'step-start': {
      // one active step at a time: starting one finishes whatever was running
      const by = { ...state.by }
      for (const [id, s] of Object.entries(by)) if (s.status === 'active') by[id] = { ...s, status: 'done', ended: Date.now(), subs: [] }
      by[e.step] = { ...cur, status: 'active', started: Date.now(), subs: [] }
      return { ...state, by, last: `Now: ${state.steps.find((s) => s.id === e.step)?.label}` }
    }
    case 'sub-start':
      return set({ ...cur, subs: [...cur.subs.map((s) => ({ ...s, done: true })), { id: e.id, text: e.text, done: false }] })
    case 'sub-done':
      return set({ ...cur, subs: cur.subs.map((s) => (s.id === e.id ? { ...s, done: true, text: e.text ?? s.text } : s)) })
    case 'step-done':
      return set({ ...cur, status: 'done', ended: Date.now(), subs: [] }, `Done: ${state.steps.find((s) => s.id === e.step)?.label}`)
  }
}

/** The run's state and the one way to change it. */
export function useTaskRun(steps: TaskStep[]) {
  const [state, dispatch] = useReducer(reduce, steps, fresh)
  const emit = useCallback((e: TaskEvent) => dispatch(e), [])
  return { state, emit }
}

/** Seconds since `from`, ticking once a second while `live`. */
function useSeconds(from: number | undefined, to: number | undefined, live: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!live) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [live])
  if (!from) return 0
  return Math.max(0, Math.floor(((to ?? now) - from) / 1000))
}

const ease = [0.22, 1, 0.36, 1] as const

export function TaskRun({ run, gate }: { run: TaskRunState; /** what a waiting gate row offers, e.g. a button */ gate?: ReactNode }) {
  const still = useReducedMotion()
  return (
    <div className="task-run">
      <p className="sr-only" aria-live="polite">{run.last}</p>
      <ol className="flex flex-col">
        {run.steps.map((step, i) => (
          <Row key={step.id} step={step} s={run.by[step.id]} last={i === run.steps.length - 1} still={!!still} gate={gate} />
        ))}
      </ol>
    </div>
  )
}

function Row({ step, s, last, still, gate }: { step: TaskStep; s: StepState; last: boolean; still: boolean; gate?: ReactNode }) {
  const active = s.status === 'active'
  const done = s.status === 'done'
  const waiting = step.gate && !done
  const secs = useSeconds(s.started, s.ended, active)
  return (
    <motion.li layout={still ? false : 'position'} className="relative">
      {/* the rail to the next ring: mint once this step is done */}
      {!last && (
        <span aria-hidden="true" className="absolute bottom-0 left-[5.25px] top-[17px] w-[1.5px] bg-border-strong">
          <motion.span
            className="absolute inset-0 origin-top bg-primary"
            initial={false}
            animate={{ scaleY: done ? 1 : 0 }}
            transition={{ duration: still ? 0 : 0.2, ease }}
          />
        </span>
      )}
      <div className="flex h-6 items-center gap-2.5">
        <Ring status={s.status} gate={!!step.gate} still={still} />
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-[13px] transition-colors duration-200',
            active || waiting ? 'text-foreground' : done ? 'text-muted-foreground' : 'text-subtle-foreground',
          )}
        >
          {step.label}
        </span>
        {waiting ? (
          gate ?? <span className="rounded-[4px] bg-lemon-soft px-1.5 py-0.5 text-[11px] font-medium text-lemon-ink">Asks first</span>
        ) : (
          (active || done) && (
            <span className={cn('tnum font-mono text-[11px]', active ? 'text-muted-foreground' : 'text-subtle-foreground')}>
              <RollingCount n={secs} />s
            </span>
          )
        )}
      </div>
      {/* the small jobs under the active step; they fold away when it is done */}
      <AnimatePresence initial={false}>
        {s.subs.map((sub) => (
          <motion.div
            key={sub.id}
            initial={still ? false : { height: 0, opacity: 0, x: -4 }}
            animate={{ height: 'auto', opacity: 1, x: 0 }}
            exit={still ? { opacity: 0, transition: { duration: 0 } } : { height: 0, opacity: 0, transition: { duration: 0.26, ease } }}
            transition={{ duration: 0.22, ease }}
            className="overflow-hidden"
          >
            <div className="flex h-[22px] items-center gap-2 pl-[18px] text-[12px]">
              <span aria-hidden="true" className={cn('size-1 flex-none rounded-full transition-colors duration-200', sub.done ? 'bg-subtle-foreground' : 'bg-lemon')} />
              <span className={cn('truncate transition-colors duration-200', sub.done ? 'text-subtle-foreground' : 'text-foreground')}>{sub.text}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.li>
  )
}

/** 12px. Pending: a hollow ring. Active: a ring with a turning wedge. Done: a mint check. Gate: a lock. */
function Ring({ status, gate, still }: { status: StepState['status']; gate: boolean; still: boolean }) {
  if (status === 'done') {
    return (
      <motion.svg
        width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="relative flex-none"
        initial={still ? false : { scale: 0.6 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
      >
        <circle cx="6" cy="6" r="6" fill="var(--primary)" />
        <path d="M3.4 6.2 5.2 8l3.4-3.6" fill="none" stroke="var(--primary-foreground)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </motion.svg>
    )
  }
  if (gate) {
    return (
      <span aria-hidden="true" className="relative grid size-3 flex-none place-items-center rounded-full border-[1.5px] border-muted-foreground bg-card text-muted-foreground">
        <Lock size={6} strokeWidth={3} />
      </span>
    )
  }
  if (status === 'active') {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="relative flex-none">
        <circle cx="6" cy="6" r="5.25" fill="var(--card)" stroke="var(--lemon)" strokeWidth="1.5" />
        {/* the wedge turns once every 900ms; reduced motion leaves it still */}
        <path d="M6 6V2.6A3.4 3.4 0 0 1 9.2 4.9Z" fill="var(--lemon)" className="task-spin" />
      </svg>
    )
  }
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="relative flex-none">
      <circle cx="6" cy="6" r="5.25" fill="var(--card)" stroke="var(--border-strong)" strokeWidth="1.5" />
    </svg>
  )
}
