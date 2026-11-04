'use client'

import { RotateCw, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CrewDot } from '@/components/checkin/CrewBlock'
import { TaskRun, useTaskRun, type TaskEvent, type TaskStep } from '@/components/checkin/TaskRun'
import { useToast } from '@/components/checkin/Toast'
import { Button } from '@/components/ui/button'
import { streamRecap } from '@/lib/ai/demo'
import type { Hue } from '@/lib/colors'
import { getCrewWeek } from '@/lib/data'
import { cn } from '@/lib/utils'
import styles from './CrewRecap.module.css'

type State = { step: 'idle' } | { step: 'writing'; text: string } | { step: 'done'; text: string }

/** What the demo AI does before it writes, shown as a task list (TaskRun). The last step waits for you. */
const STEPS: TaskStep[] = [
  { id: 'read', label: 'Read the week’s check-ins' },
  { id: 'count', label: 'Count sessions per person' },
  { id: 'quote', label: 'Pick notes worth quoting' },
  { id: 'write', label: 'Write the recap' },
  { id: 'share', label: 'Share with the crew', gate: true },
]

/** A pause that a new tap or a crew switch can cancel. */
const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((ok, no) => {
    const t = window.setTimeout(ok, ms)
    signal.addEventListener('abort', () => { window.clearTimeout(t); no(new DOMException('aborted', 'AbortError')) }, { once: true })
  })

/**
 * A short recap of one crew's last seven days by the demo AI (lib/ai: in the browser, no model).
 * Lives on the You tab, so the feed stays minimal. Pick a crew, tap "Write recap"; it streams in,
 * and each "Rewrite" takes a different angle.
 */
export function CrewRecap({ crews, initialId }: { crews: { id: string; name: string; color: Hue }[]; initialId?: string | null }) {
  const [crewId, setCrewId] = useState(() => crews.find((c) => c.id === initialId)?.id ?? crews[0]?.id)
  const [state, setState] = useState<State>({ step: 'idle' })
  const abort = useRef<AbortController | null>(null)
  /** Which phrasing to use next; picked at random on the first tap, then the next one on each rewrite. */
  const variant = useRef(-1)
  const { state: run, emit } = useTaskRun(STEPS)
  const toast = useToast()
  useEffect(() => () => abort.current?.abort(), [])

  const crew = crews.find((c) => c.id === crewId)
  if (!crew) return null

  const write = async () => {
    abort.current?.abort()
    const ctrl = new AbortController()
    abort.current = ctrl
    if (variant.current < 0) variant.current = Math.floor(Math.random() * 6)
    setState({ step: 'writing', text: '' })
    emit({ type: 'reset' })
    const go = async (e: TaskEvent, ms: number) => { emit(e); await wait(ms, ctrl.signal) }
    try {
      // The steps are the demo AI's real work on this crew's data, paced so you can follow it.
      await go({ type: 'step-start', step: 'read' }, 0)
      await go({ type: 'sub-start', step: 'read', id: 'r1', text: `Opening ${crew.name}’s week` }, 500)
      const week = await getCrewWeek(crew.id)
      const n = week.checkIns.length
      await go({ type: 'sub-done', step: 'read', id: 'r1', text: `Read ${n} check-in${n === 1 ? '' : 's'}` }, 450)
      await go({ type: 'step-done', step: 'read' }, 150)

      await go({ type: 'step-start', step: 'count' }, 0)
      const top = week.perPerson[0]
      await go({ type: 'sub-start', step: 'count', id: 'c1', text: `Counting ${week.memberCount} people` }, 550)
      await go({ type: 'sub-done', step: 'count', id: 'c1', text: `Counted ${week.memberCount} people` }, 0)
      if (top && top.count > 0) await go({ type: 'sub-start', step: 'count', id: 'c2', text: `${top.isMe ? 'You lead' : `${top.name} leads`} with ${top.count}` }, 650)
      await go({ type: 'step-done', step: 'count' }, 150)

      await go({ type: 'step-start', step: 'quote' }, 0)
      const notes = week.checkIns.filter((c) => c.note).length
      await go({ type: 'sub-start', step: 'quote', id: 'q1', text: `Reading ${notes} note${notes === 1 ? '' : 's'}` }, 650)
      await go({ type: 'sub-done', step: 'quote', id: 'q1', text: notes ? `Picked the ones that sound like the crew` : 'No notes this week, numbers only' }, 600)
      await go({ type: 'step-done', step: 'quote' }, 150)

      await go({ type: 'step-start', step: 'write' }, 0)
      emit({ type: 'sub-start', step: 'write', id: 'w1', text: 'Writing in the crew’s voice' })
      await streamRecap(week, (text) => setState({ step: 'writing', text }), variant.current++, ctrl.signal)
      emit({ type: 'step-done', step: 'write' })
      setState((s) => ({ step: 'done', text: s.step === 'idle' ? '' : s.text }))
    } catch {
      // Aborted (another crew was picked, or the page closed): nothing to show.
    }
  }

  const choose = (id: string) => {
    if (id === crewId) return
    abort.current?.abort()
    setCrewId(id)
    setState({ step: 'idle' })
    emit({ type: 'reset' })
  }

  const text = state.step === 'idle' ? '' : state.text
  /** The gate: nothing leaves your device until you say so. Copying is the share, so it marks the step done. */
  const share = async () => {
    try {
      await navigator.clipboard.writeText(text)
      emit({ type: 'step-start', step: 'share' })
      emit({ type: 'step-done', step: 'share' })
      toast(`Recap copied. Paste it wherever ${crew.name} talks`)
    } catch {
      toast('Couldn’t copy. Select the text and copy it instead')
    }
  }
  return (
    <div className="rounded-lg border bg-card p-4 shadow-card">
      {crews.length > 1 && (
        <div role="group" aria-label="Crew to recap" className="-mx-1 mb-3 flex flex-wrap gap-2">
          {crews.map((c) => {
            const on = c.id === crewId
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                onClick={() => choose(c.id)}
                className={cn(
                  'hit-44 inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[13px] font-medium transition-colors duration-150 ease-out',
                  on ? 'border-foreground bg-foreground text-background' : 'border-border-strong text-muted-foreground hover:text-foreground',
                )}
              >
                <CrewDot color={c.color} className="size-[10px]" />
                {c.name}
              </button>
            )
          })}
        </div>
      )}

      {state.step === 'idle' ? (
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="grid size-9 flex-none place-items-center rounded-full bg-primary-soft text-primary-ink">
            <Sparkles size={17} strokeWidth={1.75} />
          </span>
          <p className="min-w-0 flex-1 text-[13px] text-muted-foreground">A recap of {crew.name}’s last seven days.</p>
          <Button size="sm" variant="secondary" onClick={write}>
            Write recap
          </Button>
        </div>
      ) : (
        <div aria-live="polite" aria-busy={state.step === 'writing'}>
          <TaskRun
            run={run}
            gate={
              state.step === 'done' && run.by.share.status !== 'done' ? (
                <Button size="sm" variant="secondary" className="h-7 px-3 text-[12px]" onClick={share}>
                  Copy to share
                </Button>
              ) : undefined
            }
          />
          {text && (
            <p className={cn('mt-3 border-t pt-3 text-[15px] leading-[1.55]', state.step === 'writing' && styles.caret)}>{text}</p>
          )}
          {state.step === 'done' && (
            <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
              <span className="text-[12px] text-muted-foreground">Demo AI, written on your device from this week’s check-ins</span>
              <Button size="sm" variant="ghost" onClick={write}>
                <RotateCw size={14} /> Rewrite
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
