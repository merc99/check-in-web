import { Avatar } from '@/components/checkin/Avatar'
import { Card } from '@/components/checkin/Card'
import { HeatmapGrid, type HeatDay } from '@/components/checkin/HeatmapGrid'
import { PostCard } from '@/components/checkin/PostCard'
import type { BrandColor } from '@/lib/colors'
import type { FeedItem } from '@/lib/data'

// Illustrations for the three intro slides. Static on purpose: CLAUDE.md keeps
// ambient motion to live crew arrivals, so the prototype's spinning orbit and
// floating card stand still here.

const CREW: { name: string; color: BrandColor }[] = [
  { name: 'Maya', color: 'coral' },
  { name: 'Dre', color: 'sky' },
  { name: 'Priya', color: 'grape' },
  { name: 'Sam', color: 'lemon' },
  { name: 'Theo', color: 'leaf' },
]

/** Slide 1: five crewmates around a "5/5 in today" core. */
export function OrbitArt() {
  return (
    <div className="relative size-[250px]" aria-hidden="true">
      <div className="absolute inset-0 rounded-full border-2 border-dashed border-rule" />
      {CREW.map((p, i) => {
        const a = (i / CREW.length) * Math.PI * 2 - Math.PI / 2
        return (
          <span
            key={p.name}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${50 + 50 * Math.cos(a)}%`, top: `${50 + 50 * Math.sin(a)}%` }}
          >
            <Avatar name={p.name} color={p.color} size="lg" />
          </span>
        )
      })}
      <div className="absolute inset-[62px] grid place-items-center rounded-full border border-ink bg-mint text-center shadow-sh3">
        <div>
          <div className="font-display text-[46px] leading-none">5/5</div>
          <div className="mt-1 text-[13px] font-bold">in today</div>
        </div>
      </div>
    </div>
  )
}

const SAMPLE: FeedItem = {
  id: 'intro-sample',
  groupId: 'intro',
  user: { id: 'intro-maya', name: 'Maya', color: 'coral', photoUrl: null },
  isMine: false,
  note: '5x5 squats, finally felt smooth.',
  tags: [
    { id: 'a', name: 'leg day' },
    { id: 'b', name: 'pr' },
  ],
  createdAt: new Date().toISOString(),
  localDate: '',
  hearts: { count: 3, byMe: true, people: [] },
}

/** Slide 2: a check-in card on a tilted backing card. */
export function CheckInArt() {
  return (
    <div className="relative w-[min(300px,100%)]" aria-hidden="true">
      <div className="absolute right-[-6px] bottom-[-14px] left-[14px] top-[18px] rotate-[4deg] rounded-lg border border-ink bg-peach-deep shadow-sh2" />
      <div className="pointer-events-none relative">
        <PostCard item={SAMPLE} onHeart={() => {}} />
      </div>
    </div>
  )
}

const WEEK: HeatDay[] = [1, 1, 0, 1, 1, 1, 1].map((v, i) => ({ label: 'MTWTFSS'[i], done: v === 1 }))

/** Slide 3: the all-time count that never goes down, with a week that has a gap in it. */
export function StreakArt() {
  return (
    <Card size="lg" className="w-[min(300px,100%)] text-center" aria-hidden="true">
      <div className="tnum font-display text-[72px] leading-[.9]">142</div>
      <p className="mt-2 font-medium text-ink-soft">check-ins, all time</p>
      <div className="mt-5">
        <HeatmapGrid days={WEEK} animate />
      </div>
    </Card>
  )
}
