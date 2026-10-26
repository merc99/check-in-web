'use client'

import { RotateCw, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { streamRecap } from '@/lib/ai/demo'
import { getCrewWeek } from '@/lib/data'
import { cn } from '@/lib/utils'
import styles from './RecapCard.module.css'

type State = { step: 'idle' } | { step: 'writing'; text: string } | { step: 'done'; text: string }

/**
 * "Your crew's week": a short recap of the last seven days by the demo AI (lib/ai, in the browser;
 * no model). Written on request, streams in, and each "Rewrite" takes a different angle.
 */
export function RecapCard({ groupId, crewName }: { groupId: string; crewName: string }) {
  const [state, setState] = useState<State>({ step: 'idle' })
  const abort = useRef<AbortController | null>(null)
  /** Which phrasing to use next; picked at random on the first tap, then the next one on each rewrite. */
  const variant = useRef(-1)
  useEffect(() => () => abort.current?.abort(), [])

  const write = async () => {
    abort.current?.abort()
    const ctrl = new AbortController()
    abort.current = ctrl
    if (variant.current < 0) variant.current = Math.floor(Math.random() * 6)
    setState({ step: 'writing', text: '' })
    try {
      const week = await getCrewWeek(groupId)
      await streamRecap(week, (text) => setState({ step: 'writing', text }), variant.current++, ctrl.signal)
      setState((s) => ({ step: 'done', text: s.step === 'idle' ? '' : s.text }))
    } catch {
      // Aborted (the crew changed or the card left): nothing to show.
    }
  }

  const text = state.step === 'idle' ? '' : state.text
  return (
    <section aria-labelledby={`recap-${groupId}`} className="mt-4 rounded-lg border bg-card p-4 shadow-card">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="grid size-9 flex-none place-items-center rounded-full bg-primary-soft text-primary-ink">
          <Sparkles size={17} strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={`recap-${groupId}`} className="font-display text-[17px] leading-tight tracking-tighter">
            Your crew’s week
          </h2>
        </div>
        {state.step === 'idle' && (
          <Button size="sm" variant="secondary" onClick={write}>
            Write recap
          </Button>
        )}
      </div>
      {state.step === 'idle' && <p className="mt-2 text-[13px] text-muted-foreground">A short recap of {crewName}’s last seven days, written by a demo AI.</p>}

      {state.step !== 'idle' && (
        <div className="mt-3" aria-live="polite" aria-busy={state.step === 'writing'}>
          {text ? (
            <p className={cn('text-[15px] leading-[1.55]', state.step === 'writing' && styles.caret)}>{text}</p>
          ) : (
            <p className={cn('text-[14px] font-medium', styles.shimmer)}>Reading the week’s check-ins…</p>
          )}
          {state.step === 'done' && (
            <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
              <span className="text-[12px] text-muted-foreground">
                Demo AI, written on your device from this week’s check-ins
              </span>
              <Button size="sm" variant="ghost" onClick={write}>
                <RotateCw size={14} /> Rewrite
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
