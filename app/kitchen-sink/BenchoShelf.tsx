'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { Assignees } from '@/components/bencho/Assignees'
import { CardSwap } from '@/components/bencho/CardSwap'
import { ContextMeter } from '@/components/bencho/ContextMeter'
import { CreateMenu } from '@/components/bencho/CreateMenu'
import { DynamicIsland } from '@/components/bencho/DynamicIsland'
import { LiquidToggle } from '@/components/bencho/LiquidToggle'
import { Palette } from '@/components/bencho/Palette'
import { RollingCounter } from '@/components/bencho/RollingCounter'
import { SlideToConfirm } from '@/components/bencho/SlideToConfirm'
import { StackedBars, type StackedBar } from '@/components/bencho/StackedBars'
import { TimeScrubber } from '@/components/bencho/TimeScrubber'
import { Button } from '@/components/checkin/Button'
import { SectionTitle } from '@/components/checkin/SectionTitle'
import { TaskRun, useTaskRun, type TaskEvent, type TaskStep } from '@/components/checkin/TaskRun'
import { useToast } from '@/components/checkin/Toast'

/** One component on a quiet stage, with where it is used. */
function Bench({ name, where, children }: { name: string; where: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-background p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[14px] font-medium">{name}</p>
        <p className="font-mono text-[12px] text-subtle-foreground">{where}</p>
      </div>
      <div className="grid min-h-24 place-items-center overflow-x-auto py-2">{children}</div>
    </div>
  )
}

// Seeded sample columns for the stacked bars, so the shelf looks the same on every load.
const sample = (n: number, seed: number, span: number): StackedBar[] =>
  Array.from({ length: n }, (_, i) => {
    const r = (k: number) => Math.abs(Math.sin(seed + i * 12.9898 + k * 78.233)) % 1
    return { vals: [r(1) > 0.3 ? span : 0, r(2) > 0.55 ? span : 0], label: `Day ${i + 1}`, short: `Day ${i + 1}` }
  })

const STEPS: TaskStep[] = [
  { id: 'a', label: 'Read the week’s check-ins' },
  { id: 'b', label: 'Count sessions per person' },
  { id: 'c', label: 'Write the recap' },
  { id: 'd', label: 'Share with the crew', gate: true },
]
// The mock script: [event, ms to wait after it].
const SCRIPT: [TaskEvent, number][] = [
  [{ type: 'step-start', step: 'a' }, 200],
  [{ type: 'sub-start', step: 'a', id: '1', text: 'Opening DIALED’s week' }, 900],
  [{ type: 'sub-done', step: 'a', id: '1', text: 'Read 23 check-ins' }, 350],
  [{ type: 'sub-start', step: 'a', id: '2', text: 'Matching them to people' }, 900],
  [{ type: 'step-done', step: 'a' }, 300],
  [{ type: 'step-start', step: 'b' }, 200],
  [{ type: 'sub-start', step: 'b', id: '3', text: 'Counting 5 people' }, 900],
  [{ type: 'sub-done', step: 'b', id: '3', text: 'Counted 5 people' }, 350],
  [{ type: 'sub-start', step: 'b', id: '4', text: 'Maya leads with 6' }, 1000],
  [{ type: 'step-done', step: 'b' }, 300],
  [{ type: 'step-start', step: 'c' }, 200],
  [{ type: 'sub-start', step: 'c', id: '5', text: 'Writing in the crew’s voice' }, 2200],
  [{ type: 'step-done', step: 'c' }, 0],
]

function TaskDemo() {
  const { state, emit } = useTaskRun(STEPS)
  const timers = useRef<number[]>([])
  const toast = useToast()
  const play = () => {
    timers.current.forEach(window.clearTimeout)
    emit({ type: 'reset' })
    let at = 300
    timers.current = SCRIPT.map(([e, ms]) => { const t = window.setTimeout(() => emit(e), at); at += ms; return t })
  }
  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])
  const ready = state.by.c.status === 'done' && state.by.d.status !== 'done'
  return (
    <div className="flex w-full max-w-[320px] flex-col gap-3">
      <div className="rounded-lg border bg-card px-3.5 py-3 edge-lit">
        <TaskRun
          run={state}
          gate={ready ? (
            <Button size="sm" variant="secondary" className="h-7 px-3 text-[12px]" onClick={() => { emit({ type: 'step-start', step: 'd' }); emit({ type: 'step-done', step: 'd' }); toast('Approved') }}>
              Approve
            </Button>
          ) : undefined}
        />
      </div>
      <Button size="sm" variant="secondary" onClick={play}>Play the run</Button>
    </div>
  )
}

/**
 * The Bencho components (MIT, bencho.dev/licence) and the magpui task list, adapted to our tokens.
 * Most live only here; the "where" line says which ones are on a screen.
 */
export function BenchoShelf() {
  const toast = useToast()
  return (
    <section>
      <SectionTitle title="Bencho shelf" note="components/bencho" />
      <div className="grid gap-3 lg:grid-cols-2">
        <Bench name="Liquid toggle" where="Switch, every settings row"><LiquidToggle label="Demo toggle" /></Bench>
        <Bench name="Rolling counter" where="New crew, max size"><RollingCounter start={8} min={3} max={15} label="Crew size" /></Bench>
        <Bench name="Stacked bars" where="You, your days by crew">
          <div className="w-full max-w-[340px]">
            <StackedBars
              title="By crew"
              unit="check-ins"
              series={[{ name: 'DIALED', color: 'var(--sky)' }, { name: 'Sketchbook Daily', color: 'var(--grape)' }]}
              days={sample(30, 1, 1)}
              weeks={sample(20, 7, 5)}
            />
          </div>
        </Bench>
        <Bench name="Task run" where="You, the crew recap (magpui)"><TaskDemo /></Bench>
        <Bench name="Create menu" where="kitchen sink only (needs a 244px stage)"><CreateMenu /></Bench>
        <Bench name="Time scrubber" where="kitchen sink only (for reminders, later)"><TimeScrubber start={450} /></Bench>
        <Bench name="Slide to confirm" where="kitchen sink only (HoldButton owns confirms)"><SlideToConfirm onConfirm={() => toast('Confirmed')} /></Bench>
        <Bench name="Assignees" where="kitchen sink only"><Assignees /></Bench>
        <Bench name="Card swap" where="kitchen sink only"><CardSwap /></Bench>
        <Bench name="Dynamic island" where="kitchen sink only"><DynamicIsland activity="Music" /></Bench>
        <Bench name="Context meter" where="kitchen sink only"><ContextMeter /></Bench>
        <Bench name="Palette" where="kitchen sink only"><Palette /></Bench>
      </div>
    </section>
  )
}
