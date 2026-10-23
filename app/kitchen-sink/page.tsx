'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { Avatar } from '@/components/checkin/Avatar'
import { Button } from '@/components/checkin/Button'
import { Card } from '@/components/checkin/Card'
import { TagChip, ToggleChip } from '@/components/checkin/Chip'
import { FormField, Input, Textarea } from '@/components/checkin/FormField'
import { HeatmapGrid, weekDays } from '@/components/checkin/HeatmapGrid'
import { CheckIcon, PlusIcon, ShareIcon } from '@/components/checkin/icons'
import { useLive } from '@/components/checkin/LivePill'
import { SectionTitle } from '@/components/checkin/SectionTitle'
import { Segmented } from '@/components/checkin/Segmented'
import { Sheet } from '@/components/checkin/Sheet'
import { TabBar, type TabKey } from '@/components/checkin/TabBar'
import { useToast } from '@/components/checkin/Toast'
import { AVATAR_COLORS } from '@/lib/colors'
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
        <p className="mt-[10px] max-w-[36ch] text-[15.5px] text-ink-soft">
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
              <Avatar key={s} name={NAMES[i]} color={AVATAR_COLORS[i]} size={s} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {AVATAR_COLORS.map((c, i) => (
              <Avatar key={c} name={NAMES[i]} color={c} />
            ))}
            <Avatar />
            <Avatar name="Ben" you />
          </div>
          <div className="flex">
            {NAMES.slice(0, 4).map((n, i) => (
              <Avatar key={n} name={n} color={AVATAR_COLORS[i]} size="xs" className={i ? '-ml-2' : undefined} />
            ))}
          </div>
        </div>
      </Section>

      <Section title="Cards" note="md · lg">
        <div className="flex flex-col gap-[14px]">
          <Card>
            <p className="font-bold">Card, md</p>
            <p className="mt-1 text-ink-soft">14px radius, 16px padding, sh2. Posts, lists, stats.</p>
          </Card>
          <Card size="lg">
            <p className="font-bold">Card, lg</p>
            <p className="mt-1 text-ink-soft">18px radius, 20px padding. Hero and feature cards.</p>
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
            <p className="text-[12.5px] text-ink-mute">Today’s still open. No rush.</p>
            <Button size="sm" onClick={() => setHeatRun((n) => n + 1)}>
              Replay
            </Button>
          </div>
        </Card>
      </Section>

      <Section title="Overlays" note="sheet · toast · live pill">
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => setSheetOpen(true)}>
            Open sheet
          </Button>
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
            <p className="tnum mt-[6px] text-right text-xs text-ink-mute">{note.length} / 280</p>
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
    </main>
  )
}
