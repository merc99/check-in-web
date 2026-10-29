'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { BottomSheet } from '@/components/arc/bottom-sheet/bottom-sheet'
import { Avatar } from '@/components/checkin/Avatar'
import { Button } from '@/components/checkin/Button'
import { Card } from '@/components/checkin/Card'
import { TagChip, ToggleChip } from '@/components/checkin/Chip'
import { FormField, Input, Textarea } from '@/components/checkin/FormField'
import { HeatmapGrid, weekDays } from '@/components/checkin/HeatmapGrid'
import { CheckIcon, PlusIcon, ShareIcon } from '@/components/checkin/icons'
import { useLive } from '@/components/checkin/LivePill'
import { SectionTitle } from '@/components/checkin/SectionTitle'
import { CrewBlock } from '@/components/checkin/CrewBlock'
import { CrewCover } from '@/components/checkin/CrewCover'
import { MemberSticker } from '@/components/checkin/MemberSticker'
import { SessionDetails } from '@/components/checkin/SessionDetails'
import { TierCard } from '@/components/checkin/TierCard'
import { TierCeremony } from '@/components/fx/TierCeremony'
import { TIER_KEYS, tierOf, type TierKey } from '@/lib/mastery'
import { CREW_HUES, HUE_CLASS } from '@/lib/colors'
import { CREW_PATTERNS } from '@/lib/crewStyle'
import { cn } from '@/lib/utils'
import { Segmented } from '@/components/checkin/Segmented'
import { Sheet } from '@/components/checkin/Sheet'
import { TabBar, type TabKey } from '@/components/checkin/TabBar'
import { useToast } from '@/components/checkin/Toast'
import { AVATAR_HUES } from '@/lib/colors'
import { DataCheck } from './DataCheck'

const VARIANTS = ['primary', 'dark', 'secondary', 'danger'] as const
const TAGS = ['leg day', 'run', 'pr', 'stretch', 'rest day', 'push', 'gouache', 'ink']
const AVATAR_SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const
const NAMES = ['Maya', 'Dre', 'Priya', 'Sam', 'Theo']

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section>
      <SectionTitle title={title} note={note} />
      {children}
    </section>
  )
}

export default function KitchenSink() {
  const toast = useToast()
  const live = useLive()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [ceremony, setCeremony] = useState<TierKey | null>(null)
  const [arcSheetOpen, setArcSheetOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [tab, setTab] = useState<TabKey>('feed')
  const [selected, setSelected] = useState<Set<string>>(() => new Set(['leg day']))
  const [heatRun, setHeatRun] = useState(0)
  const [note, setNote] = useState('')

  // Every past day this week except Tuesday is checked.
  const week = useMemo(() => weekDays((d) => d.getDay() !== 2), [])

  const toggle = (tag: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })

  return (
    <main className="px-5 pb-[150px]">
      <header className="pb-1 pt-7">
        <h1 className="font-display text-[40px] leading-[.95]">Kitchen sink</h1>
        <p className="mt-[10px] max-w-[36ch] text-[15.5px] text-muted-foreground">
          Every piece in components/ui, in all its variants. Press things.
        </p>
      </header>

      <Section title="Buttons" note="md · sm">
        <div className="flex flex-col gap-3">
          {VARIANTS.map((v) => (
            <div key={v} className="flex flex-wrap items-center gap-3">
              <Button variant={v}>{v === 'danger' ? 'Delete crew' : 'Check in'}</Button>
              <Button variant={v} size="sm">
                {v === 'danger' ? 'Remove' : 'Accept'}
              </Button>
              <Button variant={v} size="sm" disabled>
                Disabled
              </Button>
            </div>
          ))}
          <Button variant="primary" block>
            <CheckIcon size={18} /> Check in
          </Button>
          <Button block>
            <PlusIcon size={18} /> Start or join a crew
          </Button>
          <div>
            <Button size="sm">
              <ShareIcon size={16} /> Share invite
            </Button>
          </div>
        </div>
      </Section>

      <Section title="Chips" note="tag · toggle">
        <div className="flex flex-col gap-4">
          {(['s', 'm', 'l'] as const).map((size) => (
            <div key={size} className="flex flex-wrap gap-2">
              {TAGS.slice(0, size === 'l' ? 3 : 6).map((t) => (
                <TagChip key={t} name={t} size={size} />
              ))}
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            {TAGS.map((t) => (
              <ToggleChip key={t} label={t} selected={selected.has(t)} onToggle={() => toggle(t)} />
            ))}
          </div>
        </div>
      </Section>

      <Section title="Avatars" note="sizes · colors · you">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            {AVATAR_SIZES.map((s, i) => (
              <Avatar key={s} name={NAMES[i]} color={AVATAR_HUES[i]} size={s} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {AVATAR_HUES.map((c, i) => (
              <Avatar key={c} name={NAMES[i]} color={c} />
            ))}
            <Avatar />
            <Avatar name="Ben" you />
          </div>
          <div className="flex">
            {NAMES.slice(0, 4).map((n, i) => (
              <Avatar key={n} name={n} color={AVATAR_HUES[i]} size="xs" className={i ? '-ml-2' : undefined} />
            ))}
          </div>
        </div>
      </Section>

      <Section title="Crew covers" note="CrewCover · CrewBlock emoji">
        <div className="grid grid-cols-3 gap-2">
          {CREW_PATTERNS.map((p, i) => (
            <div key={p} className={cn('relative flex h-16 items-end rounded-lg p-2 text-on-color', HUE_CLASS[CREW_HUES[i % CREW_HUES.length]].solid)}>
              <CrewCover pattern={p} className="text-on-color opacity-20" fade={false} />
              <span className="relative text-xs font-bold">{p}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <CrewBlock name="Lifters" color="sky" emoji="💪" />
          <CrewBlock name="Sketch" color="grape" emoji="🎨" />
          <CrewBlock name="Letter" color="lemon" />
        </div>
      </Section>

      <Section title="Tier cards" note="paper · enamel · foil · holo · aurora · locked">
        <div className="flex flex-col gap-3">
          {(['started', 'habit', 'committed', 'seasoned', 'expert'] as const).map((t, i) => (
            <TierCard key={t} tier={t} skill="music" crewName="Guitar, 20 Minutes" color={(['clay', 'grape', 'sky', 'coral', 'leaf'] as const)[i]} sessions={[1, 12, 61, 152, 400][i]} />
          ))}
          <TierCard tier="master" skill="music" crewName="Guitar, 20 Minutes" color="clay" sessions={400} locked />
          <TierCard tier="habit" skill="art" crewName="Sketchbook Daily" color="grape" sessions={10} size="sm" />
        </div>
      </Section>

      <Section title="Tier ceremony" note="tap a tier to play it">
        <div className="flex flex-wrap gap-2">
          {TIER_KEYS.map((t) => (
            <Button key={t} size="sm" onClick={() => setCeremony(t)}>
              {tierOf(t).name}
            </Button>
          ))}
        </div>
        {ceremony && (
          <TierCeremony
            tier={ceremony}
            skill="music"
            crewName="Guitar, 20 Minutes"
            color="clay"
            sessions={tierOf(ceremony).at}
            rarity={{ started: 96, habit: 71, committed: 38, seasoned: 9, expert: 2, master: 0 }[ceremony]}
            serial={ceremony === 'master' ? 1 : null}
            onShare={() => {}}
            onClose={() => setCeremony(null)}
          />
        )}
      </Section>

      <Section title="Session details" note="fitness · music · reading · Strava">
        <div className="flex flex-col gap-3">
          <SessionDetails skill="fitness" details={{ activity: 'Run', minutes: 27, distanceKm: 5.2 }} source="strava" />
          <SessionDetails skill="music" details={{ minutes: 20, items: ['Wonderwall intro', 'C major scale'] }} />
          <SessionDetails skill="reading" details={{ book: 'The Creative Act', pages: 30 }} />
        </div>
      </Section>

      <Section title="Member stickers" note="in · not yet (tap waves) · waved">
        <ul className="flex gap-3">
          <MemberSticker person={{ id: 'k1', name: 'Maya', color: 'coral', photoUrl: null }} inToday isMe={false} />
          <MemberSticker person={{ id: 'k2', name: 'Sam', color: 'lemon', photoUrl: null }} inToday={false} isMe={false} onWave={() => {}} />
          <MemberSticker person={{ id: 'k3', name: 'Dre', color: 'sky', photoUrl: null }} inToday={false} isMe={false} waved />
          <MemberSticker person={{ id: 'k4', name: 'Theo', color: 'leaf', photoUrl: null }} inToday={false} isMe={false} waved size="sm" />
        </ul>
      </Section>

      <Section title="Cards" note="md · lg">
        <div className="flex flex-col gap-[14px]">
          <Card>
            <p className="font-bold">Card, md</p>
            <p className="mt-1 text-muted-foreground">14px radius, 16px padding, sh2. Posts, lists, stats.</p>
          </Card>
          <Card size="lg">
            <p className="font-bold">Card, lg</p>
            <p className="mt-1 text-muted-foreground">18px radius, 20px padding. Hero and feature cards.</p>
          </Card>
        </div>
      </Section>

      <Section title="Form fields">
        <div className="flex flex-col gap-4">
          <FormField label="Name">
            <Input placeholder="What your crew calls you" maxLength={40} />
          </FormField>
          <FormField label="Handle" optional>
            <Input placeholder="@handle" maxLength={24} />
          </FormField>
          <FormField label="Bio" optional hint="One line. Your crew sees it on your profile.">
            <Textarea placeholder="One line about you" maxLength={140} />
          </FormField>
          <FormField label="Tags" as="group" optional>
            <div className="flex flex-wrap gap-2">
              {TAGS.slice(0, 4).map((t) => (
                <ToggleChip key={t} label={t} selected={selected.has(t)} onToggle={() => toggle(t)} />
              ))}
            </div>
          </FormField>
        </div>
      </Section>

      <Section title="Segmented">
        <Segmented
          label="New crew"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'create', label: 'Create' },
            { value: 'join', label: 'Join with code' },
          ]}
        />
      </Section>

      <Section title="Tab bar" note="static copy of the dock">
        <TabBar active={tab} onSelect={setTab} />
      </Section>

      <Section title="Heatmap" note="this week">
        <Card>
          <HeatmapGrid key={heatRun} days={week} animate />
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-[12.5px] text-muted-foreground">Today’s still open. No rush.</p>
            <Button size="sm" onClick={() => setHeatRun((n) => n + 1)}>
              Replay
            </Button>
          </div>
        </Card>
      </Section>

      <Section title="Overlays" note="sheet · arc sheet · toast · live pill">
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => setSheetOpen(true)}>
            Open sheet
          </Button>
          <Button onClick={() => setArcSheetOpen(true)}>Open Arc sheet</Button>
          <Button onClick={() => toast('Invite code copied')}>Show toast</Button>
          <Button
            variant="dark"
            onClick={() =>
              live({
                user: { name: 'Dre', color: 'sky' },
                message: (
                  <>
                    <b>Dre</b> just checked in
                  </>
                ),
                onTap: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
              })
            }
          >
            Live pill
          </Button>
        </div>
      </Section>

      <Section title="Mock data" note="lib/data">
        <DataCheck />
      </Section>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Check in"
        aside={<TagChip name="5am Lifters" size="m" />}
      >
        <div className="flex flex-col gap-4">
          <FormField label="Note" optional>
            <Textarea placeholder="How’d it go?" maxLength={280} value={note} onChange={(e) => setNote(e.target.value)} />
            <p className="tnum mt-[6px] text-right text-xs text-muted-foreground">{note.length} / 280</p>
          </FormField>
          <FormField label="Tags" as="group" optional>
            <div className="flex flex-wrap gap-2">
              {TAGS.slice(0, 6).map((t) => (
                <ToggleChip key={t} label={t} selected={selected.has(t)} onToggle={() => toggle(t)} />
              ))}
            </div>
          </FormField>
          <div className="pt-3">
            <Button
              variant="primary"
              block
              onClick={() => {
                setSheetOpen(false)
                toast('You’re in for today')
              }}
            >
              <CheckIcon size={18} /> Check in
            </Button>
          </div>
        </div>
      </Sheet>

      {/* Arc bottom-sheet: peek (45%) and full (92%) heights, flick to move or dismiss. */}
      <BottomSheet
        open={arcSheetOpen}
        onOpenChange={setArcSheetOpen}
        title="Check in"
        description="Drag up for the full sheet, flick down to close."
      >
        <div className="flex flex-col gap-4">
          <FormField label="Note" optional>
            <Textarea placeholder="How’d it go?" maxLength={280} value={note} onChange={(e) => setNote(e.target.value)} />
            <p className="tnum mt-[6px] text-right text-xs text-muted-foreground">{note.length} / 280</p>
          </FormField>
          <FormField label="Tags" as="group" optional>
            <div className="flex flex-wrap gap-2">
              {TAGS.slice(0, 6).map((t) => (
                <ToggleChip key={t} label={t} selected={selected.has(t)} onToggle={() => toggle(t)} />
              ))}
            </div>
          </FormField>
          <div className="pt-3">
            <Button
              variant="primary"
              block
              onClick={() => {
                setArcSheetOpen(false)
                toast('You’re in for today')
              }}
            >
              <CheckIcon size={18} /> Check in
            </Button>
          </div>
        </div>
      </BottomSheet>
    </main>
  )
}
