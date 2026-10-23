'use client'

// /fx-preview: every effect from the three sources (the app, premium-ui-kit/, mmo-fx-kit/) side by
// side, with a verdict for each overlap. Review page only; real screens change after Ben signs off.
import { useState, type ReactNode } from 'react'
import { PageHead, SectionTitle } from '@/components/checkin/SectionTitle'
import { ThemeToggle } from '@/components/checkin/theme-toggle'
import { useActiveCrew } from '@/lib/activeCrew'
import { getAchievements, getGroup, useQuery } from '@/lib/data'
import { cn } from '@/lib/utils'
import { useSound, MmoToasts } from './_candidates/mmo'
import {
  BandCompare,
  CelebrateCompare,
  ConfirmCompare,
  CountCompare,
  FlyCompare,
  GlassCompare,
  RevealCompare,
  RingCompare,
  SurfaceCompare,
  ToastCompare,
} from './_candidates/sections'

type Row = { type: string; effect: string; app?: string; premium?: string; mmo?: string; overlap?: string }

/** Step 1: the inventory. "overlap" names the comparison section below. */
const INVENTORY: Row[] = [
  { type: 'Card surfaces', effect: 'Foil / holo finish on a card', app: 'Foil (white sheen, full hue)', premium: 'Rainbow holo foil + glare', mmo: 'Holo card, cursor-masked rainbow foil, grain', overlap: 'A' },
  { type: 'Card surfaces', effect: 'Light band / sheen across a surface', app: 'LightBand (one sweep)', premium: 'Masked light band', mmo: 'Looping holo sheen', overlap: 'B' },
  { type: 'Card surfaces', effect: 'Metallic text, metal buttons, enamel panels', premium: 'Yes', overlap: 'Skipped: luxury-club look' },
  { type: 'Card surfaces', effect: 'Parallax art layers', mmo: 'Yes', overlap: 'No art to layer' },
  { type: 'Borders and rings', effect: 'Highlighted border', app: 'Hairline, today ring, “you” ring', premium: 'Gradient (metal) border', mmo: 'Light ring, neon, aurora, rainbow, gold, pulse, prismatic frames', overlap: 'C' },
  { type: 'Borders and rings', effect: 'Rarity tiles', mmo: 'Common to legendary', overlap: 'No: rarity is a game idea' },
  { type: 'Hover and tilt', effect: 'Pointer tilt', app: 'Foil tilt, card lift', premium: 'Tilt + press-sink (ring cards)', mmo: 'Tilt with glare', overlap: 'A (tilt is part of the surface)' },
  { type: 'Rewards and celebrations', effect: 'Check-in celebration', app: 'Joy takeover: flood, words, confetti; check-in stamp', mmo: 'Canvas particle burst', overlap: 'D' },
  { type: 'Rewards and celebrations', effect: 'Fly-to', app: 'Reaction flight + squash', premium: 'Same (reactions)', mmo: '“+250” to a balance, pulse', overlap: 'E' },
  { type: 'Rewards and celebrations', effect: 'Milestone reveal', app: 'Joy takeover pattern', mmo: 'Reveal card: shake, beam, flood', overlap: 'F' },
  { type: 'Rewards and celebrations', effect: 'Heart burst, avatar check-badge pop, heatmap cell-in, ticket wave', app: 'Yes', overlap: 'No overlap: keep' },
  { type: 'Feedback', effect: 'Toasts', app: 'Inverted pill (+ unused shadcn sonner)', mmo: 'Glass stack, batching', overlap: 'G' },
  { type: 'Feedback', effect: 'Destructive confirm', app: 'Confirm sheet, tap', mmo: 'Hold to confirm', overlap: 'H' },
  { type: 'Feedback', effect: 'Counting numbers', app: 'Count-up ticker', premium: 'Rolling digits', overlap: 'I' },
  { type: 'Feedback', effect: 'Live pill (crew activity)', app: 'Yes', overlap: 'No overlap: keep' },
  { type: 'Carousels and lists', effect: '3D ring carousel', premium: 'Ring carousel (live on Explore)', overlap: 'No overlap: keep' },
  { type: 'Carousels and lists', effect: 'Emoji reactions', premium: 'Live on posts', overlap: 'No overlap: keep' },
  { type: 'Carousels and lists', effect: 'Bottom sheet', app: 'Arc sheet + older Sheet + shadcn sheet', overlap: 'Same job three ways (cleanup in step 3)' },
  { type: 'Glass and backgrounds', effect: 'Glass dock / panels', app: 'Spec’d frosted tab bar (built opaque)', mmo: 'Liquid glass with refraction', overlap: 'J' },
  { type: 'Glass and backgrounds', effect: 'Crew glow, hero gradient, film grain', app: 'Crew glow, hero gradient', mmo: 'Grain on cards', overlap: 'Grain judged in A4' },
  { type: 'Sound', effect: 'Synthesized sounds', mmo: '17 sounds, off by default', overlap: 'No overlap: step 3' },
]

type Verdict = { winner: string; why: string; combo?: string }

/** Step 2: the recommendation for each overlap. */
const VERDICTS: Record<string, Verdict> = {
  A: {
    winner: 'A4 · Foil + sparkle',
    why: 'A1’s full-hue card and enamel medal read best at a glance; mmo’s cursor sparkle adds the “earned” glint without the rainbow or the looping ring.',
    combo: 'Yes: the combo beats both. A2’s ring loops forever and its darker lower half drops the subtitle’s contrast; A3’s rainbow bleeds into the enamel medal and fights the hue.',
  },
  B: { winner: 'B1 · One sweep', why: 'Light that answers a hover or a copy feels like a reward; B2 and B3 loop on a screen you’re reading, which breaks the calm rule.' },
  C: {
    winner: 'C2 · Slow light ring, hue-tinted',
    why: 'Only for the day the whole crew is in: one slow arc in the crew’s hue marks a rare moment. C3 glows like a game; C4 is static so it never says “today”.',
    combo: 'Use C2 only for “everyone’s in”, never as a default border.',
  },
  D: {
    winner: 'D3 · Burst, then the takeover',
    why: 'The button answers in the same frame, then the takeover lands. D2 alone is too small for the app’s biggest moment.',
    combo: 'Yes: mmo’s burst in front of the app’s takeover beats both.',
  },
  E: { winner: 'E1 · Arc and rolling digits', why: 'Matches the reactions, so the app has one way of landing a number; E2’s straight glide and brightness pulse feel like a coin counter.' },
  F: {
    winner: 'F3 · Reveal card, foil inside',
    why: 'A milestone deserves its own card you can keep looking at; landing on the real foil achievement ties it to the You tab. F1 repeats the check-in takeover; F2’s beam and big burst read as loot.',
    combo: 'Yes: mmo’s reveal staging with the app’s foil card.',
  },
  G: {
    winner: 'G1 · Pill, plus batching',
    why: 'The pill is calmer and fits the brand; borrow G2’s batching so three arrivals become one toast instead of overwriting each other.',
    combo: 'Yes: the pill’s look with the stack’s batching.',
  },
  H: {
    winner: 'H3 · Sheet + hold',
    why: 'The sheet says what will be lost; holding the final button stops an accidental tap. H2 without the sheet hides the explanation.',
    combo: 'Yes: hold-to-confirm only for “delete crew” and “delete account”, not for leaving or removing a tag.',
  },
  I: { winner: 'I1 for big numbers, I2 in chips', why: 'The count-up feels like progress on the hero numbers; rolling digits suit small counts that change by one (reactions, streak).' },
  J: {
    winner: 'J2 · Frosted glass',
    why: 'It’s already the spec: blur with a border and an opaque fallback. J3’s refraction is Chromium-only and warps the post text under it.',
  },
}

function Section({ id, title, note, children }: { id: string; title: string; note: string; children: ReactNode }) {
  const v = VERDICTS[id]
  return (
    <section className="mt-10">
      <SectionTitle title={`${id}. ${title}`} note={note} />
      {children}
      {v && (
        <div className="mt-4 rounded-md border border-primary/40 bg-primary-soft p-4 text-[14px]">
          <p>
            <b>Pick: {v.winner}.</b> {v.why}
          </p>
          {v.combo && <p className="mt-1 text-muted-foreground">Combining: {v.combo}</p>}
        </div>
      )}
    </section>
  )
}

export default function FxPreview() {
  const { activeId } = useActiveCrew()
  const achievements = useQuery(getAchievements, [], ['check_ins', 'groups', 'group_members'])
  const group = useQuery(() => (activeId ? getGroup(activeId) : Promise.resolve(null)), [activeId], ['groups', 'group_members'])
  const sound = useSound()
  const [phone, setPhone] = useState(false)
  const g = group.data
  const list = achievements.data ?? []
  const milestone = list.find((a) => !a.unlocked) ?? list[list.length - 1]

  return (
    <main data-layout="wide" className="px-5 pb-[150px] lg:px-8 lg:pb-16">
      {/* The liquid glass refraction filter (J3). Chromium only. */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <filter id="liquid" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.03" numOctaves={2} seed={4} result="n" />
          <feGaussianBlur in="n" stdDeviation="1.5" result="nb" />
          <feDisplacementMap in="SourceGraphic" in2="nb" scale={34} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <PageHead
        title="Effects, side by side"
        lead="Every overlap between the app, the premium kit and the mmo kit, in Check-in’s colors. Switch the theme and the phone frame to check each one."
      />

      <div className="sticky top-0 z-30 -mx-5 mt-5 flex flex-wrap items-center gap-3 border-b bg-background/90 px-5 py-3 backdrop-blur-xl lg:-mx-8 lg:px-8">
        <div className="w-[220px]">
          <ThemeToggle />
        </div>
        <button
          type="button"
          aria-pressed={phone}
          onClick={() => setPhone((p) => !p)}
          className={cn('rounded-full border px-4 py-2 text-[13px] font-bold', phone ? 'bg-foreground text-background' : 'bg-card')}
        >
          Phone width
        </button>
        <button
          type="button"
          aria-pressed={sound.on}
          onClick={sound.toggle}
          className={cn('rounded-full border px-4 py-2 text-[13px] font-bold', sound.on ? 'bg-foreground text-background' : 'bg-card')}
        >
          Sound {sound.on ? 'on' : 'off'}
        </button>
        <span className="text-[13px] text-muted-foreground">Sound plays on the D, E, F, H buttons (mmo kit).</span>
      </div>

      <div className={cn(phone && 'phone mx-auto max-w-[390px]')}>
        <SectionTitle title="Inventory" note={`${INVENTORY.length} effects, 3 sources`} />
        <div className="overflow-x-auto rounded-lg border bg-card shadow-card">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead className="border-b text-muted-foreground">
              <tr>
                {['Type', 'Effect', 'App', 'Premium kit', 'mmo kit', 'Overlap'].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INVENTORY.map((r) => (
                <tr key={r.effect} className="border-b last:border-0">
                  <td className="px-3 py-2 text-muted-foreground">{r.type}</td>
                  <td className="px-3 py-2 font-semibold">{r.effect}</td>
                  <td className="px-3 py-2">{r.app ?? '–'}</td>
                  <td className="px-3 py-2">{r.premium ?? '–'}</td>
                  <td className="px-3 py-2">{r.mmo ?? '–'}</td>
                  <td className="px-3 py-2">{r.overlap && /^[A-J]/.test(r.overlap) ? <b>{r.overlap}</b> : r.overlap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {list.length > 0 && (
          <Section id="A" title="Card surfaces" note="Achievements on You. Hover with a mouse; tap on a phone.">
            <SurfaceCompare achievements={list} />
          </Section>
        )}
        {g && (
          <Section id="B" title="Light bands" note="The invite ticket. Hover, or tap the code.">
            <BandCompare g={g} />
          </Section>
        )}
        {g && (
          <Section id="C" title="Borders and rings" note="The crew hero on a day everyone’s in.">
            <RingCompare g={g} />
          </Section>
        )}
        <Section id="D" title="Check-in celebration" note="Tap each Check in.">
          <CelebrateCompare hue={g?.color ?? 'sky'} />
        </Section>
        <Section id="E" title="Fly-to" note="+1 into your streak.">
          <FlyCompare />
        </Section>
        {milestone && (
          <Section id="F" title="Milestone reveal" note={`Your next one: ${milestone.title}.`}>
            <RevealCompare milestone={milestone} />
          </Section>
        )}
        <Section id="G" title="Toasts" note="Try “Three at once”.">
          <ToastCompare />
        </Section>
        <Section id="H" title="Destructive confirm" note="Deleting a crew (nothing is deleted here).">
          <ConfirmCompare />
        </Section>
        <Section id="I" title="Counting numbers" note="All-time check-ins.">
          <CountCompare />
        </Section>
        <Section id="J" title="Glass" note="The tab dock over a busy feed.">
          <GlassCompare />
        </Section>
      </div>

      <MmoToasts />
    </main>
  )
}
