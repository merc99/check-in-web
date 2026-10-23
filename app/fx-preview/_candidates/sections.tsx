'use client'

// The side-by-side comparisons on /fx-preview. Every overlap gets one section; every version in it
// uses Check-in's real tokens and demo content. Verdicts live in page.tsx.
import { useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { AchievementCard } from '@/components/checkin/AchievementCard'
import { Button } from '@/components/checkin/Button'
import { ConfirmSheet } from '@/components/checkin/ConfirmSheet'
import { CrewHero } from '@/components/checkin/CrewHero'
import { Foil, FoilLight } from '@/components/checkin/Foil'
import { CheckIcon } from '@/components/checkin/icons'
import { JoyTakeover } from '@/components/checkin/JoyTakeover'
import { RollingCount } from '@/components/checkin/Reactions'
import { TabBar } from '@/components/checkin/TabBar'
import { CodeTiles, Ticket } from '@/components/checkin/Ticket'
import { useToast } from '@/components/checkin/Toast'
import { HUE_CLASS, type Hue } from '@/lib/colors'
import type { Achievement, GroupDetail } from '@/lib/data'
import { prefersReducedMotion, useCountUp } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { burstFrom, flyTo, mmoToast, sfx, useHold, useMmoTilt } from './mmo'
import mmo from './mmo.module.css'
import premium from './premium.module.css'

// ── layout helpers ──

export function Compare({ children, cols = 4 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  return (
    <div
      className={cn(
        'grid gap-4 [.phone_&]:grid-cols-1',
        cols === 2 && 'sm:grid-cols-2',
        cols === 3 && 'sm:grid-cols-2 xl:grid-cols-3',
        cols === 4 && 'sm:grid-cols-2 xl:grid-cols-4',
      )}
    >
      {children}
    </div>
  )
}

export function Variant({ label, source, children, className }: { label: string; source: string; children: ReactNode; className?: string }) {
  return (
    <figure className="flex min-w-0 flex-col rounded-lg border bg-card p-4 shadow-card">
      <figcaption className="mb-4 flex items-baseline justify-between gap-2">
        <span className="font-bold">{label}</span>
        <span className="rounded-full border px-2 py-[2px] text-[11.5px] font-semibold text-muted-foreground">{source}</span>
      </figcaption>
      <div className={cn('flex flex-1 flex-col items-center justify-center gap-4', className)}>{children}</div>
    </figure>
  )
}

const HUE_VARS = (hue: Hue) => ({ '--hue': HUE_CLASS[hue].cssVar }) as CSSProperties

// ── A. Card surfaces: the achievement card ──

function MedalFace({ a }: { a: Achievement }) {
  return (
    <>
      <div
        aria-hidden="true"
        className="mx-auto mb-[10px] grid size-[58px] place-items-center rounded-full border border-on-color bg-on-color font-display text-[21px]"
        style={{ color: HUE_CLASS[a.color].cssVar }}
      >
        {a.glyph}
      </div>
      <div className="text-[13px] font-bold leading-[1.2]">{a.title}</div>
      <div className="mt-1 text-[11.5px] font-medium">{a.subtitle}</div>
    </>
  )
}

function MmoHolo({ a, combo }: { a: Achievement; combo?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useMmoTilt(ref, combo ? 10 : 12)
  return (
    <div
      ref={ref}
      style={HUE_VARS(a.color)}
      className={cn(mmo.card, !combo && mmo.ring, 'w-[118px] px-[10px] py-4 text-center')}
    >
      {combo ? <span aria-hidden="true" className={mmo.sparkle} /> : <span aria-hidden="true" className={mmo.foil} />}
      <div className={mmo.body}>
        <MedalFace a={a} />
      </div>
    </div>
  )
}

function PremiumHolo({ a }: { a: Achievement }) {
  return (
    <Foil hue="white" strength={0}>
      <div className={cn('relative w-[118px] overflow-hidden rounded-lg border border-on-color/15 px-[10px] py-4 text-center text-on-color shadow-raised', HUE_CLASS[a.color].solid)}>
        <MedalFace a={a} />
        <span aria-hidden="true" className={premium.rainbow} />
        <span aria-hidden="true" className={premium.glare} />
      </div>
    </Foil>
  )
}

/** App foil (full hue, enamel medal, white sheen) plus the mmo kit's cursor sparkle and grain. */
function ComboFoil({ a }: { a: Achievement }) {
  const ref = useRef<HTMLDivElement>(null)
  useMmoTilt(ref, 10)
  return (
    <Foil hue="white" strength={0.6}>
      <div
        ref={ref}
        className={cn('relative w-[118px] overflow-hidden rounded-lg border border-on-color/15 px-[10px] py-4 text-center text-on-color shadow-raised', HUE_CLASS[a.color].solid)}
      >
        <MedalFace a={a} />
        <FoilLight />
        <span aria-hidden="true" className={mmo.sparkle} />
      </div>
    </Foil>
  )
}

export function SurfaceCompare({ achievements }: { achievements: Achievement[] }) {
  const pair = achievements.filter((a) => a.unlocked).filter((a) => a.color === 'rose' || a.color === 'lemon' || a.color === 'sky').slice(0, 2)
  const row = (render: (a: Achievement, i: number) => ReactNode) => <div className="flex gap-3">{pair.map(render)}</div>
  return (
    <Compare cols={2}>
      <Variant label="A1 · Foil (live now)" source="App">
        {row((a, i) => <AchievementCard key={a.key} achievement={a} tilt={i % 2 ? 'right' : 'left'} />)}
      </Variant>
      <Variant label="A2 · Holo card + ring" source="mmo">
        {row((a) => <MmoHolo key={a.key} a={a} />)}
      </Variant>
      <Variant label="A3 · Rainbow holo" source="Premium">
        {row((a) => <PremiumHolo key={a.key} a={a} />)}
      </Variant>
      <Variant label="A4 · Foil + sparkle" source="App + mmo">
        {row((a) => <ComboFoil key={a.key} a={a} />)}
      </Variant>
    </Compare>
  )
}

// ── B. Light bands: the invite ticket ──

function TicketDemo({ g, variant }: { g: GroupDetail; variant: 'band' | 'loop' | 'ring' }) {
  const [copies, setCopies] = useState(0)
  const ticket = (
    <Ticket
      color={g.color}
      shine={variant === 'band' ? copies : undefined}
      className="w-full"
      top={
        <div className="relative px-4 pb-4 pt-4">
          <p className="text-sm font-bold">Invite code</p>
          <button type="button" onClick={() => setCopies((n) => n + 1)} aria-label="Copy invite code" className="mt-3 block rounded-[10px]">
            <CodeTiles code={g.slug} wave={copies} />
          </button>
        </div>
      }
      bottom={<div className="px-4 py-3 text-[13px] text-muted-foreground">Tap the code to copy it.</div>}
    />
  )
  if (variant === 'loop')
    return (
      <div className="relative w-full overflow-hidden rounded-lg">
        {ticket}
        <span aria-hidden="true" className={mmo.sheenLoop} />
      </div>
    )
  if (variant === 'ring')
    return (
      <div className={cn(mmo.ring, 'w-full rounded-lg')} style={{ '--ring-color': 'white' } as CSSProperties}>
        {ticket}
      </div>
    )
  return ticket
}

export function BandCompare({ g }: { g: GroupDetail }) {
  return (
    <Compare cols={3}>
      <Variant label="B1 · One sweep (live now)" source="App / Premium">
        <TicketDemo g={g} variant="band" />
      </Variant>
      <Variant label="B2 · Looping holo sheen" source="mmo">
        <TicketDemo g={g} variant="loop" />
      </Variant>
      <Variant label="B3 · Light ring on the edge" source="mmo">
        <TicketDemo g={g} variant="ring" />
      </Variant>
    </Compare>
  )
}

// ── C. Borders and rings: the crew hero on a day everyone's in ──

export function RingCompare({ g }: { g: GroupDetail }) {
  const members = g.members.map((m) => ({ ...m, inToday: true }))
  const hero = <CrewHero color={g.color} members={members} arrivedId={null} />
  return (
    <Compare cols={2}>
      <Variant label="C1 · Hairline (live now)" source="App">
        <div className="w-full">{hero}</div>
      </Variant>
      <Variant label="C2 · Slow light ring" source="mmo">
        <div className={cn(mmo.ring, 'w-full rounded-xl')} style={{ '--ring-color': `color-mix(in srgb, ${HUE_CLASS[g.color].cssVar} 35%, white)`, '--ring-speed': '10s' } as CSSProperties}>
          {hero}
        </div>
      </Variant>
      <Variant label="C3 · Aurora frame" source="mmo">
        <div className={cn(mmo.aurora, 'w-full rounded-xl')}>{hero}</div>
      </Variant>
      <Variant label="C4 · Static hue edge" source="Premium">
        <div
          className="w-full rounded-xl border-2 border-transparent [&>section]:border-0"
          style={{
            background: `linear-gradient(var(--card), var(--card)) padding-box, linear-gradient(160deg, color-mix(in srgb, ${HUE_CLASS[g.color].cssVar} 40%, white), ${HUE_CLASS[g.color].cssVar} 45%, color-mix(in srgb, ${HUE_CLASS[g.color].cssVar} 70%, black)) border-box`,
          }}
        >
          {hero}
        </div>
      </Variant>
    </Compare>
  )
}

// ── D. Check-in celebration ──

export function CelebrateCompare({ hue }: { hue: Hue }) {
  const [joy, setJoy] = useState<{ x: number; y: number } | null>(null)
  const hues = [`--${hue}`, '--primary', '--lemon', '--sky', '--rose']
  const at = (el: Element) => {
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }
  return (
    <>
      <Compare cols={3}>
        <Variant label="D1 · Joy takeover (live now)" source="App" className="min-h-28">
          <Button variant="primary" onClick={(e) => setJoy(at(e.currentTarget))}>
            <CheckIcon size={18} /> Check in
          </Button>
          <p className="text-center text-[13px] text-muted-foreground">Mint floods from the button, words spring in, crew-hue confetti falls.</p>
        </Variant>
        <Variant label="D2 · Particle burst" source="mmo" className="min-h-28">
          <Button
            variant="primary"
            onClick={(e) => {
              burstFrom(e.currentTarget, hues, 70)
              sfx('reward')
            }}
          >
            <CheckIcon size={18} /> Check in
          </Button>
          <p className="text-center text-[13px] text-muted-foreground">A canvas burst of crew hues from the button, nothing else.</p>
        </Variant>
        <Variant label="D3 · Burst, then the takeover" source="App + mmo" className="min-h-28">
          <Button
            variant="primary"
            onClick={(e) => {
              const el = e.currentTarget
              burstFrom(el, hues, 40)
              sfx('success')
              const origin = at(el)
              setTimeout(() => setJoy(origin), prefersReducedMotion() ? 0 : 320)
            }}
          >
            <CheckIcon size={18} /> Check in
          </Button>
          <p className="text-center text-[13px] text-muted-foreground">The button answers at once with a small burst, then the takeover.</p>
        </Variant>
      </Compare>
      {joy && <JoyTakeover origin={joy} count={42} sub="That one’s yours for good." onDismiss={() => {}} onClosed={() => setJoy(null)} />}
    </>
  )
}

// ── E. Fly-to: +1 into the streak ──

/** The app's reaction-style flight: an arc with a tilt, then the target squashes. */
function arcFly(from: Element, to: HTMLElement, text: string, onLand: () => void) {
  if (prefersReducedMotion()) return onLand()
  const a = from.getBoundingClientRect()
  const b = to.getBoundingClientRect()
  const p = document.createElement('div')
  p.textContent = text
  p.style.cssText = 'position:fixed;left:0;top:0;z-index:90;pointer-events:none;font:800 20px var(--font-bricolage),sans-serif;color:var(--primary-ink)'
  document.body.appendChild(p)
  const x0 = a.left + a.width / 2
  const y0 = a.top + a.height / 2
  const x1 = b.left + b.width / 2
  const y1 = b.top + b.height / 2
  const mx = (x0 + x1) / 2
  const my = Math.min(y0, y1) - 60
  let landed = false
  const land = () => {
    if (landed) return
    landed = true
    p.remove()
    to.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.12, .9)', offset: 0.35 }, { transform: 'scale(.97, 1.04)', offset: 0.7 }, { transform: 'scale(1)' }],
      { duration: 420, easing: 'ease-out' },
    )
    onLand()
  }
  p.animate(
    [
      { transform: `translate(${x0}px, ${y0}px) translate(-50%,-50%) scale(1.3)` },
      { transform: `translate(${mx}px, ${my}px) translate(-50%,-50%) scale(1.2) rotate(-12deg)`, offset: 0.45 },
      { transform: `translate(${x1}px, ${y1}px) translate(-50%,-50%) scale(.9)` },
    ],
    { duration: 650, easing: 'cubic-bezier(0.35, 0, 0.3, 1)', fill: 'forwards' },
  ).onfinish = land
  setTimeout(land, 900)
}

function StreakTile({ n, tickerRef, roll }: { n: number; tickerRef: RefObject<HTMLDivElement | null>; roll?: boolean }) {
  const counted = useCountUp(n, { duration: 400 })
  return (
    <div ref={tickerRef} className="w-full rounded-lg border bg-card p-4 shadow-card">
      <div className="font-display text-[44px] leading-none tracking-tightest">{roll ? <RollingCount n={n} /> : <span className="tnum">{counted}</span>}</div>
      <div className="mt-1 text-[13px] text-muted-foreground">day streak</div>
    </div>
  )
}

export function FlyCompare() {
  const [a, setA] = useState(6)
  const [b, setB] = useState(6)
  const ta = useRef<HTMLDivElement>(null)
  const tb = useRef<HTMLDivElement>(null)
  return (
    <Compare cols={2}>
      <Variant label="E1 · Arc, squash, rolling digits" source="App (reactions)">
        <StreakTile n={a} tickerRef={ta} roll />
        <Button size="sm" onClick={(e) => ta.current && arcFly(e.currentTarget, ta.current, '+1', () => setA((n) => n + 1))}>
          Check in today
        </Button>
      </Variant>
      <Variant label="E2 · Float up, glide, pulse" source="mmo">
        <StreakTile n={b} tickerRef={tb} />
        <Button
          size="sm"
          onClick={(e) => {
            sfx('reward')
            if (tb.current) flyTo(e.currentTarget, tb.current, '+1', () => setB((n) => n + 1))
          }}
        >
          Check in today
        </Button>
      </Variant>
    </Compare>
  )
}

// ── F. Milestone reveal ──

function RevealModal({ a, combo, onClose }: { a: Achievement; combo?: boolean; onClose: () => void }) {
  const [stage, setStage] = useState<'closed' | 'shaking' | 'open'>('closed')
  const card = useRef<HTMLDivElement>(null)
  const open = () => {
    if (stage !== 'closed') return
    setStage('shaking')
    sfx('charge')
    setTimeout(() => {
      setStage('open')
      if (card.current) burstFrom(card.current, [`--${a.color}`, 'white', `--${a.color}`], combo ? 40 : 110)
      sfx(combo ? 'levelUp' : 'fanfare')
    }, prefersReducedMotion() ? 0 : 800)
  }
  return (
    <div className={mmo.reveal} role="dialog" aria-modal="true" aria-label={`Milestone: ${a.title}`}>
      <div className={mmo.scrim} onClick={onClose} />
      <div ref={card} className={mmo.revealCard} style={HUE_VARS(a.color)} data-revealed={!combo && stage === 'open' ? '' : undefined}>
        {combo && stage === 'open' ? (
          <AchievementCard achievement={a} tilt="left" />
        ) : (
          <div className={mmo.medal} data-shake={stage === 'shaking' ? '' : undefined} data-open={stage === 'open' ? '' : undefined}>
            <span className={mmo.beam} aria-hidden="true" />
            <span className="relative">{stage === 'open' ? a.glyph : '?'}</span>
          </div>
        )}
        <p className="mt-2 font-display text-[26px] leading-none tracking-tighter">{stage === 'open' ? a.title : 'A milestone'}</p>
        <p className="text-[14px] font-medium" aria-live="polite">
          {stage === 'open' ? a.subtitle + '. That one’s yours for good.' : 'You earned something.'}
        </p>
        {stage === 'open' ? (
          <Button size="sm" className="mt-2" onClick={onClose}>
            Nice
          </Button>
        ) : (
          <Button size="sm" variant="primary" className="mt-2" onClick={open} autoFocus>
            Reveal it
          </Button>
        )}
      </div>
    </div>
  )
}

export function RevealCompare({ milestone }: { milestone: Achievement }) {
  const [shown, setShown] = useState<'flood' | 'card' | 'combo' | null>(null)
  return (
    <>
      <Compare cols={3}>
        <Variant label="F1 · Full-screen flood" source="App (joy)" className="min-h-28">
          <Button onClick={() => setShown('flood')}>Show “{milestone.title}”</Button>
          <p className="text-center text-[13px] text-muted-foreground">The joy takeover pattern: the screen floods, words spring in.</p>
        </Variant>
        <Variant label="F2 · Reveal card" source="mmo" className="min-h-28">
          <Button onClick={() => setShown('card')}>Show “{milestone.title}”</Button>
          <p className="text-center text-[13px] text-muted-foreground">A card pops in; tap to reveal: shake, beam, color flood, big burst.</p>
        </Variant>
        <Variant label="F3 · Reveal card, foil inside" source="mmo + App" className="min-h-28">
          <Button onClick={() => setShown('combo')}>Show “{milestone.title}”</Button>
          <p className="text-center text-[13px] text-muted-foreground">The same reveal, landing on the foil achievement, smaller burst.</p>
        </Variant>
      </Compare>
      {shown === 'flood' && (
        <JoyTakeover
          origin={{ x: typeof window === 'undefined' ? 0 : innerWidth / 2, y: typeof window === 'undefined' ? 0 : innerHeight / 2 }}
          count={50}
          sub={`${milestone.title}. That one’s yours for good.`}
          onDismiss={() => {}}
          onClosed={() => setShown(null)}
        />
      )}
      {(shown === 'card' || shown === 'combo') && <RevealModal a={{ ...milestone, unlocked: true }} combo={shown === 'combo'} onClose={() => setShown(null)} />}
    </>
  )
}

// ── G. Toasts ──

export function ToastCompare() {
  const toast = useToast()
  return (
    <Compare cols={2}>
      <Variant label="G1 · Inverted pill (live now)" source="App">
        <div className="flex flex-wrap justify-center gap-2">
          <Button size="sm" onClick={() => toast('Invite code copied')}>One</Button>
          <Button
            size="sm"
            onClick={() => {
              toast('Maya joined the crew')
              toast('Dre just checked in')
              toast('Priya sent you a heart')
            }}
          >
            Three at once
          </Button>
        </div>
        <p className="text-center text-[13px] text-muted-foreground">One at a time, the last one wins. 2.2s, above the tab bar.</p>
      </Variant>
      <Variant label="G2 · Glass stack" source="mmo">
        <div className="flex flex-wrap justify-center gap-2">
          <Button size="sm" onClick={() => mmoToast('Invite code copied')}>One</Button>
          <Button
            size="sm"
            onClick={() => {
              mmoToast('Maya joined the crew')
              mmoToast('Dre just checked in')
              mmoToast('Priya sent you a heart')
            }}
          >
            Three at once
          </Button>
        </div>
        <p className="text-center text-[13px] text-muted-foreground">Batches what arrives together, stacks up to three, pauses on hover. 4.2s.</p>
      </Variant>
    </Compare>
  )
}

// ── H. Destructive confirm ──

function HoldButton({ label, onDone }: { label: string; onDone: () => void }) {
  const ref = useHold(onDone, 1100)
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        mmo.hold,
        'inline-flex w-full items-center justify-center rounded-full border border-border bg-destructive-soft px-6 py-[15px] text-[15px] font-bold text-destructive-ink shadow-raised',
      )}
      style={{ '--hold-fill': 'color-mix(in srgb, var(--destructive) 35%, transparent)' } as CSSProperties}
    >
      {label}
    </button>
  )
}

export function ConfirmCompare() {
  const toast = useToast()
  const [sheet, setSheet] = useState<'tap' | 'hold' | null>(null)
  const done = () => {
    setSheet(null)
    sfx('confirm')
    toast('Crew deleted (preview)')
  }
  return (
    <>
      <Compare cols={3}>
        <Variant label="H1 · Sheet + tap (live now)" source="App">
          <Button variant="danger" onClick={() => setSheet('tap')}>Delete crew</Button>
          <p className="text-center text-[13px] text-muted-foreground">An “Are you sure?” sheet; one tap on the red button.</p>
        </Variant>
        <Variant label="H2 · Hold to confirm, inline" source="mmo">
          <HoldButton label="Hold to delete crew" onDone={done} />
          <p className="text-center text-[13px] text-muted-foreground">No sheet: hold for 1.1s while it fills. Space or Enter also works.</p>
        </Variant>
        <Variant label="H3 · Sheet + hold" source="App + mmo">
          <Button variant="danger" onClick={() => setSheet('hold')}>Delete crew</Button>
          <p className="text-center text-[13px] text-muted-foreground">The sheet explains; the final button is hold-to-confirm.</p>
        </Variant>
      </Compare>
      <ConfirmSheet
        open={sheet === 'tap'}
        onClose={() => setSheet(null)}
        title="Delete 5am Lifters?"
        body="Everyone’s check-ins in this crew go with it. This can’t be undone."
        confirmLabel="Delete crew"
        onConfirm={done}
      />
      {sheet === 'hold' && (
        <HoldSheet onClose={() => setSheet(null)} onDone={done} />
      )}
    </>
  )
}

function HoldSheet({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  // A preview stand-in for ConfirmSheet with a hold button; the real one would take a `hold` prop.
  return (
    <div className="fixed inset-0 z-40 grid place-items-end lg:place-items-center" role="dialog" aria-modal="true" aria-label="Delete 5am Lifters?">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-app rounded-t-xl bg-popover p-6 shadow-overlay lg:max-w-[480px] lg:rounded-xl">
        <h2 className="font-display text-[28px] leading-none">Delete 5am Lifters?</h2>
        <p className="mt-4 text-muted-foreground">Everyone’s check-ins in this crew go with it. This can’t be undone.</p>
        <div className="mt-4 flex flex-col gap-4">
          <HoldButton label="Hold to delete crew" onDone={onDone} />
          <Button block onClick={onClose}>
            Keep it
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── I. Counters ──

export function CountCompare() {
  const [n, setN] = useState(41)
  const counted = useCountUp(n, { duration: 500 })
  return (
    <Compare cols={2}>
      <Variant label="I1 · Count-up (live now)" source="App">
        <div className="font-display text-[64px] leading-none tracking-tightest tnum">{counted}</div>
        <Button size="sm" onClick={() => setN((v) => v + 1)}>+1</Button>
      </Variant>
      <Variant label="I2 · Rolling digits" source="Premium (reactions)">
        <div className="font-display text-[64px] leading-none tracking-tightest">
          <RollingCount n={n} />
        </div>
        <Button size="sm" onClick={() => setN((v) => v + 1)}>+1</Button>
      </Variant>
    </Compare>
  )
}

// ── J. Glass: the tab dock over the feed ──

function BusyBackdrop({ children }: { children: ReactNode }) {
  return (
    <div className="crew-glow relative h-56 w-full overflow-hidden rounded-lg border bg-background" style={{ '--crew': 'var(--sky)' } as CSSProperties}>
      <div className="flex flex-col gap-2 p-3" aria-hidden="true">
        {(['coral', 'grape', 'lemon', 'leaf'] as Hue[]).map((h, i) => (
          <div key={h} className="flex items-center gap-2 rounded-md border bg-card p-2">
            <span className={cn('size-7 rounded-full', HUE_CLASS[h].solid)} />
            <span className="text-[13px]">{['5x5 squats, finally smooth.', 'Inked the cat.', 'Morning pages done.', 'Rest day walk.'][i]}</span>
            <span className={cn('ml-auto rounded-full px-2 text-[11px]', HUE_CLASS[h].soft, HUE_CLASS[h].ink)}>tag</span>
          </div>
        ))}
      </div>
      <div className="absolute inset-x-3 bottom-3">{children}</div>
    </div>
  )
}

export function GlassCompare() {
  const [tab, setTab] = useState<'explore' | 'feed' | 'you'>('feed')
  return (
    <Compare cols={3}>
      <Variant label="J1 · Opaque card (live now)" source="App">
        <BusyBackdrop>
          <TabBar active={tab} onSelect={setTab} />
        </BusyBackdrop>
      </Variant>
      <Variant label="J2 · Frosted glass" source="App spec (CLAUDE.md)">
        <BusyBackdrop>
          <div className="[&_nav]:bg-card/75 [&_nav]:shadow-raised [&_nav]:backdrop-blur-xl">
            <TabBar active={tab} onSelect={setTab} />
          </div>
        </BusyBackdrop>
      </Variant>
      <Variant label="J3 · Liquid glass" source="mmo">
        <BusyBackdrop>
          <div className={cn(mmo.glass, mmo.liquid, 'rounded-full [&_nav]:border-transparent [&_nav]:bg-transparent [&_nav]:shadow-none')}>
            <TabBar active={tab} onSelect={setTab} />
          </div>
        </BusyBackdrop>
      </Variant>
    </Compare>
  )
}
