'use client'

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { BrandMark } from '@/components/checkin/BrandMark'
import { Button } from '@/components/checkin/Button'
import { TextButton } from '@/components/checkin/TextButton'
import { cn } from '@/lib/utils'
import { CheckInArt, OrbitArt, StreakArt } from './IntroArt'

const SLIDES: { title: string; lead: string; art: () => ReactNode }[] = [
  // The logo lockup, as on the original brand card.
  { title: 'No shame days, just show up.', lead: 'A small crew, one check-in a day, and a count that never goes down.', art: () => <BrandMark size="lg" /> },
  { title: 'Your crew notices.', lead: 'Join a small group of 3 to 15 people. Showing up is easier when someone sees it.', art: OrbitArt },
  { title: 'Check in, daily.', lead: 'A quick note and a couple of tags. That’s the whole thing.', art: CheckInArt },
  { title: 'Streaks, minus the shame.', lead: 'Miss a day? It happens. Your all-time count never goes down.', art: StreakArt },
]
const SWIPE_PX = 60

/** Four-panel intro (the logo, then three). Swipe, arrow keys, Next or Skip; the last panel hands off to `onStart`. */
export function IntroSlides({ onStart }: { onStart: () => void }) {
  const [step, setStep] = useState(0)
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const drag = useRef<number | null>(null)
  const slides = useRef<(HTMLDivElement | null)[]>([])
  const last = step === SLIDES.length - 1

  const go = (n: number) => setStep(Math.max(0, Math.min(SLIDES.length - 1, n)))

  // Off-screen slides can't be tabbed into.
  useEffect(() => {
    slides.current.forEach((el, i) => el?.toggleAttribute('inert', i !== step))
  }, [step])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input,textarea')) return
      if (e.key === 'ArrowRight') setStep((s) => Math.min(SLIDES.length - 1, s + 1))
      if (e.key === 'ArrowLeft') setStep((s) => Math.max(0, s - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = e.clientX
    setDragging(true)
    setDx(0)
  }
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current === null) return
    const raw = e.clientX - drag.current
    const atEdge = (step === 0 && raw > 0) || (last && raw < 0)
    setDx(atEdge ? raw * 0.3 : raw)
  }
  const onUp = () => {
    if (drag.current === null) return
    drag.current = null
    setDragging(false)
    if (dx < -SWIPE_PX) go(step + 1)
    else if (dx > SWIPE_PX) go(step - 1)
    setDx(0)
  }

  return (
    <section className="flex min-h-dvh flex-col pb-6 pt-5">
      <div className="flex min-h-[42px] items-center justify-between">
        <BrandMark />
        {!last && <TextButton onClick={() => go(SLIDES.length - 1)}>Skip</TextButton>}
      </div>

      <div
        className="-mx-5 mt-4 flex-1 cursor-grab touch-pan-y overflow-hidden active:cursor-grabbing"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        onPointerCancel={onUp}
        aria-roledescription="carousel"
      >
        <div
          className={cn('flex h-full', !dragging && 'transition-transform duration-200 ease-out')}
          style={{ transform: `translateX(calc(${-step * 100}% + ${dx}px))` }}
        >
          {SLIDES.map((s, i) => (
            <div
              key={s.title}
              ref={(el) => {
                slides.current[i] = el
              }}
              aria-hidden={i !== step}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${SLIDES.length}`}
              className="flex flex-[0_0_100%] flex-col px-5"
            >
              <div className="grid min-h-[280px] flex-1 select-none place-items-center py-4">{s.art()}</div>
              <h1 className="font-display text-[44px] leading-[.95] max-[380px]:text-[38px]">{s.title}</h1>
              <p className="mt-[14px] max-w-[30ch] text-[17px] text-muted-foreground">{s.lead}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-5 mt-7 flex gap-2" aria-label={`Step ${step + 1} of ${SLIDES.length}`}>
        {SLIDES.map((s, i) => (
          <span
            key={s.title}
            className={cn('h-[10px] rounded-full border border-border transition-colors duration-200', i === step ? 'w-[30px] bg-foreground' : 'w-[10px] bg-card')}
          />
        ))}
      </div>
      {last ? (
        <Button variant="primary" block onClick={onStart}>
          Get started
        </Button>
      ) : (
        <Button variant="dark" block onClick={() => go(step + 1)}>
          Next
        </Button>
      )}
    </section>
  )
}
