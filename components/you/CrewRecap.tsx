'use client'

import { RotateCw, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CrewDot } from '@/components/checkin/CrewBlock'
import { Button } from '@/components/ui/button'
import { streamRecap } from '@/lib/ai/demo'
import type { Hue } from '@/lib/colors'
import { getCrewWeek } from '@/lib/data'
import { cn } from '@/lib/utils'
import styles from './CrewRecap.module.css'

type State = { step: 'idle' } | { step: 'writing'; text: string } | { step: 'done'; text: string }

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
  useEffect(() => () => abort.current?.abort(), [])

  const crew = crews.find((c) => c.id === crewId)
  if (!crew) return null

  const write = async () => {
    abort.current?.abort()
    const ctrl = new AbortController()
    abort.current = ctrl
    if (variant.current < 0) variant.current = Math.floor(Math.random() * 6)
    setState({ step: 'writing', text: '' })
    try {
      const week = await getCrewWeek(crew.id)
      await streamRecap(week, (text) => setState({ step: 'writing', text }), variant.current++, ctrl.signal)
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
  }

  const text = state.step === 'idle' ? '' : state.text
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
                  'hit-44 inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[13px] font-semibold transition-colors duration-150 ease-out',
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
          {text ? (
            <p className={cn('text-[15px] leading-[1.55]', state.step === 'writing' && styles.caret)}>{text}</p>
          ) : (
            <p className={cn('text-[14px] font-medium', styles.shimmer)}>Reading {crew.name}’s week…</p>
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
