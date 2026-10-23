'use client'

// /fx-preview: Check-in's effect system (components/fx), each effect once, with where it's allowed.
// The reference to check after changing an effect or a --fx-* token. Real components, real demo data.
import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { AchievementCard } from '@/components/checkin/AchievementCard'
import { Button } from '@/components/checkin/Button'
import { CrewHero } from '@/components/checkin/CrewHero'
import { XIcon } from '@/components/checkin/icons'
import { PostCard } from '@/components/checkin/PostCard'
import { Reactions } from '@/components/checkin/Reactions'
import { PageHead, SectionTitle } from '@/components/checkin/SectionTitle'
import { Switch } from '@/components/checkin/Switch'
import { TabBar } from '@/components/checkin/TabBar'
import { ThemeToggle } from '@/components/checkin/theme-toggle'
import { CodeTiles, Ticket } from '@/components/checkin/Ticket'
import { useToast } from '@/components/checkin/Toast'
import { burstFrom } from '@/components/fx/burst'
import { flyArc } from '@/components/fx/fly'
import { HoldButton } from '@/components/fx/HoldButton'
import { RevealCard } from '@/components/fx/RevealCard'
import { RollingCount } from '@/components/fx/RollingCount'
import { sfx, useSound } from '@/components/fx/sound'
import { useActiveCrew } from '@/lib/activeCrew'
import { HUE_CLASS, type Hue } from '@/lib/colors'
import { getAchievements, getFeed, getGroup, useQuery, type FeedItem, type ReactionCount } from '@/lib/data'
import { cn } from '@/lib/utils'

/** The motion budget: how loud an effect is allowed to be, and where. */
const TIER = {
  calm: 'Everyday: answers a touch, then rests',
  moment: 'Moments: check-ins, milestones, achievements',
  scoped: 'Scoped loop: one place only',
} as const

function Fx({ name, tier, where, children }: { name: string; tier: keyof typeof TIER; where: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <SectionTitle title={name} note={TIER[tier]} />
      <p className="-mt-1 mb-4 text-[13.5px] text-muted-foreground">{where}</p>
      <div className="rounded-lg border bg-card p-5 shadow-card">{children}</div>
    </section>
  )
}

export default function FxPreview() {
  const toast = useToast()
  const { activeId } = useActiveCrew()
  const { soundOn, setSoundOn } = useSound()
  const achievements = useQuery(getAchievements, [], ['check_ins', 'groups', 'group_members'])
  const group = useQuery(() => (activeId ? getGroup(activeId) : Promise.resolve(null)), [activeId], ['groups', 'group_members'])
  const feed = useQuery(() => (activeId ? getFeed(activeId) : Promise.resolve([] as FeedItem[])), [activeId], ['check_ins', 'reactions'])
  const [streak, setStreak] = useState(6)
  const [total, setTotal] = useState(41)
  const [reveal, setReveal] = useState(false)
  const [chips, setChips] = useState<ReactionCount[] | null>(null)
  const [tab, setTab] = useState<'explore' | 'feed' | 'you'>('feed')
  const streakRef = useRef<HTMLDivElement>(null)

  const g = group.data
  const list = achievements.data ?? []
  const milestone = list.find((a) => !a.unlocked) ?? list[0]
  const post = feed.data?.find((f) => !f.isMine && f.note)
  const shownChips = chips ?? post?.reactions ?? []
  const react = (emoji: string, on: boolean) =>
    setChips(() => {
      const had = shownChips.find((c) => c.emoji === emoji)
      if (on) return had ? shownChips.map((c) => (c.emoji === emoji ? { ...c, count: c.count + 1, mine: true } : c)) : [...shownChips, { emoji, count: 1, mine: true }]
      return shownChips.map((c) => (c.emoji === emoji ? { ...c, count: c.count - 1, mine: false } : c)).filter((c) => c.count > 0)
    })
  const hue: Hue = g?.color ?? 'sky'

  return (
    <main data-layout="wide" className="px-5 pb-[150px] lg:px-8 lg:pb-16">
      <PageHead title="Effects" lead="Check-in’s effect system (components/fx), each effect once, with where it’s allowed. Knobs are the --fx-* tokens in globals.css." />

      <div className="sticky top-0 z-30 -mx-5 mt-5 flex flex-wrap items-center gap-4 border-b bg-background/90 px-5 py-3 backdrop-blur-xl lg:-mx-8 lg:px-8">
        <div className="w-[220px]">
          <ThemeToggle />
        </div>
        <label className="flex items-center gap-3 text-[13px] font-bold">
          <Switch checked={soundOn} onChange={setSoundOn} label="Sounds" /> Sounds
        </label>
      </div>

      <div className="mx-auto max-w-[880px]">
        <Fx name="Foil achievements" tier="calm" where="You → Achievements, and inside the milestone reveal. Tilts under a mouse; one sweep on a tap.">
          <div className="flex flex-wrap justify-center gap-3">
            {list.filter((a) => a.unlocked).slice(0, 4).map((a, i) => (
              <AchievementCard key={a.key} achievement={a} tilt={i % 2 ? 'right' : 'left'} />
            ))}
          </div>
        </Fx>

        {g && (
          <Fx name="Holo sheen" tier="scoped" where="Invite tickets only (crew settings, the invite page).">
            <Ticket
              color={g.color}
              top={
                <div className="px-5 pb-[18px] pt-5">
                  <p className="text-sm font-bold">Invite code</p>
                  <div className="mt-3">
                    <CodeTiles code={g.slug} wave={0} />
                  </div>
                </div>
              }
              bottom={<div className="px-5 py-[14px] text-sm text-muted-foreground">{g.name}</div>}
            />
          </Fx>
        )}

        {g && (
          <Fx name="Aurora frame" tier="scoped" where="The crew hero, only while the whole crew is in today.">
            <CrewHero color={g.color} members={g.members.map((m) => ({ ...m, inToday: true }))} arrivedId={null} />
          </Fx>
        )}

        <Fx name="Check-in burst" tier="moment" where="After a check-in, from the button you used (the FAB or the rail button).">
          <div className="flex justify-center">
            <Button
              variant="primary"
              onClick={(e) => {
                burstFrom(e.currentTarget, [`--${hue}`, '--primary', `--${hue}`, '--lemon', 'white'])
                sfx('success')
              }}
            >
              Check in
            </Button>
          </div>
        </Fx>

        <Fx name="Fly-to" tier="moment" where="A day’s first check-in: +1 lands on the streak. Reactions land on their chip the same way.">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div ref={streakRef} className="rounded-lg border bg-background p-4">
              <div className="font-display text-[44px] leading-none tracking-tightest">
                <RollingCount n={streak} tight label={`${streak}`} />
              </div>
              <div className="mt-1 text-[13px] text-muted-foreground">day streak</div>
            </div>
            <Button
              size="sm"
              onClick={(e) => streakRef.current && flyArc({ from: e.currentTarget, to: streakRef.current, text: '+1', className: 'font-display text-[22px] font-extrabold text-primary-ink', onLand: () => setStreak((n) => n + 1) })}
            >
              Check in today
            </Button>
          </div>
        </Fx>

        {milestone && (
          <Fx name="Milestone reveal" tier="moment" where="When a check-in unlocks an achievement. Nowhere else.">
            <div className="flex justify-center">
              <Button onClick={() => setReveal(true)}>Unlock “{milestone.title}”</Button>
            </div>
            {reveal && <RevealCard achievement={{ ...milestone, unlocked: true }} onClose={() => setReveal(false)} />}
          </Fx>
        )}

        {post && (
          <Fx name="Reactions" tier="calm" where="Every post. The heart is the first emoji; double-tap hearts.">
            <PostCard item={{ ...post, reactions: shownChips }} onHeart={(on) => react('❤️', on)} reactions={<Reactions chips={shownChips} onReact={react} />} />
          </Fx>
        )}

        <Fx name="Toasts" tier="calm" where="Confirmations and live news. Arrivals within a moment batch into one card.">
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={() => toast('Invite code copied')}>One</Button>
            <Button
              size="sm"
              onClick={() => {
                toast('Maya joined the crew')
                toast('Dre just checked in')
                toast('Priya reacted 💪')
              }}
            >
              Three at once
            </Button>
          </div>
        </Fx>

        <Fx name="Hold to confirm" tier="calm" where="Destructive actions only: delete a crew or your account, leave a crew, remove a member.">
          <div className="mx-auto flex max-w-[360px] flex-col items-center gap-5">
            <HoldButton label="Hold to delete crew" hint="Hold the button to delete the crew" detail="Nothing is deleted here." onConfirm={() => toast('Held: crew deleted (preview)')} />
            <HoldButton variant="secondary" label="Hold to leave crew" hint="Hold the button to leave the crew" onConfirm={() => toast('Held: left (preview)')} />
            <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
              <HoldButton variant="icon" label="Hold to remove Maya" hint="Hold the × to remove Maya" onConfirm={() => toast('Held: Maya removed (preview)')}>
                <XIcon size={15} />
              </HoldButton>
              Remove a member
            </div>
          </div>
        </Fx>

        <Fx name="Rolling digits" tier="calm" where="Every number that changes: stats, the crew hero, streaks, reaction counts.">
          <div className="flex items-center justify-center gap-6">
            <div className="font-display text-[64px] leading-none tracking-tightest">
              <RollingCount n={total} tight label={`${total}`} />
            </div>
            <Button size="sm" onClick={() => setTotal((n) => n + 1)}>+1</Button>
          </div>
        </Fx>

        <Fx name="Frosted glass" tier="calm" where="The tab dock and toasts. Opaque where blur isn’t supported.">
          <div className="crew-glow relative h-48 overflow-hidden rounded-lg border bg-background" style={{ '--crew': HUE_CLASS[hue].cssVar } as CSSProperties}>
            <div className="flex flex-col gap-2 p-3" aria-hidden="true">
              {(['coral', 'grape', 'lemon'] as Hue[]).map((h, i) => (
                <div key={h} className="flex items-center gap-2 rounded-md border bg-card p-2 text-[13px]">
                  <span className={cn('size-7 rounded-full', HUE_CLASS[h].solid)} />
                  {['5x5 squats, finally smooth.', 'Inked the cat.', 'Morning pages done.'][i]}
                </div>
              ))}
            </div>
            <div className="absolute inset-x-3 bottom-3">
              <TabBar active={tab} onSelect={setTab} />
            </div>
          </div>
        </Fx>
      </div>
    </main>
  )
}
