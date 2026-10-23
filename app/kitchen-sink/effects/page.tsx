'use client'

// The premium UI kit effects (premium-ui-kit/), adapted to Check-in, side by side. All four are live
// (You, feed, invite tickets, Explore); this page is the reference to check after changing them.
import { useState, type ReactNode } from 'react'
import { AchievementCard } from '@/components/checkin/AchievementCard'
import { PostCard } from '@/components/checkin/PostCard'
import { Reactions, type ReactionChip } from '@/components/checkin/Reactions'
import { PageHead, SectionTitle } from '@/components/checkin/SectionTitle'
import { CodeTiles, Ticket } from '@/components/checkin/Ticket'
import { useToast } from '@/components/checkin/Toast'
import { FeaturedCrews } from '@/components/explore/FeaturedCrews'
import { useActiveCrew } from '@/lib/activeCrew'
import { getAchievements, getExploreGroups, getFeed, getGroup, useQuery, type FeedItem } from '@/lib/data'

function Section({ title, note, how, children }: { title: string; note: string; how: string; children: ReactNode }) {
  return (
    <section>
      <SectionTitle title={title} note={note} />
      <p className="-mt-1 mb-4 text-[13.5px] text-muted-foreground">{how}</p>
      {children}
    </section>
  )
}

function Label({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-[12.5px] font-semibold text-muted-foreground">{children}</p>
}

const OTHERS: ReactionChip[] = [{ emoji: '💪', count: 3, mine: false }]

export default function EffectsPreview() {
  const toast = useToast()
  const { activeId } = useActiveCrew()
  const achievements = useQuery(getAchievements, [], ['check_ins', 'groups', 'group_members'])
  const feed = useQuery(() => (activeId ? getFeed(activeId) : Promise.resolve([] as FeedItem[])), [activeId], ['check_ins', 'reactions'])
  const group = useQuery(() => (activeId ? getGroup(activeId) : Promise.resolve(null)), [activeId], ['groups'])
  const crews = useQuery(() => getExploreGroups(''), [], ['groups', 'group_members'])

  const [edited, setChips] = useState<ReactionChip[] | null>(null)
  const [copies, setCopies] = useState(0)

  // Keep the first sample post: live crew activity adds newer ones while you're trying it.
  const [sampleId, setSampleId] = useState<string | null>(null)
  const first = feed.data?.find((f) => !f.isMine && f.note)
  if (!sampleId && first) setSampleId(first.id)
  const sample = feed.data?.find((f) => f.id === sampleId) ?? first
  // The heart is the first reaction: its chip starts from the post's real heart count.
  const chips =
    edited ??
    (sample && sample.hearts.count > 0
      ? [{ emoji: '❤️', count: sample.hearts.count, mine: sample.hearts.byMe }, ...OTHERS]
      : OTHERS)

  const react = (emoji: string, on: boolean) =>
    setChips(() => {
      const list = chips
      const had = list.find((c) => c.emoji === emoji)
      if (on) {
        if (had) return list.map((c) => (c.emoji === emoji ? { ...c, count: c.count + 1, mine: true } : c))
        return [...list, { emoji, count: 1, mine: true }]
      }
      return list
        .map((c) => (c.emoji === emoji ? { ...c, count: c.count - 1, mine: false } : c))
        .filter((c) => c.count > 0)
    })

  // Double-tap on the card checks byMe before hearting, so it reads the heart chip.
  const heartChip = chips.find((c) => c.emoji === '❤️')
  const post = sample && { ...sample, hearts: { ...sample.hearts, byMe: !!heartChip?.mine } }
  const unlocked = achievements.data?.filter((a) => a.unlocked).slice(0, 3) ?? []
  const g = group.data

  return (
    <main className="px-5 pb-[150px]">
      <PageHead
        title="Effects preview"
        lead="Four effects from the premium UI kit, rebuilt in Check-in’s style. All four are live: You, the feed, invite tickets and Explore."
      />

      {/* 1. Foil */}
      <Section
        title="Foil achievements"
        note="You tab"
        how="Filled with the achievement’s color, with an enamel badge. With a mouse, the card tilts toward the pointer and a foil sheen follows it. On a phone, a tap plays one sweep. It never moves on its own."
      >
        <Label>Before</Label>
        <div className="flex gap-3 pb-2">
          {unlocked.map((a, i) => (
            <AchievementCard key={a.key} achievement={a} tilt={i % 2 ? 'right' : 'left'} finish="sweep" />
          ))}
        </div>
        <Label>Foil</Label>
        <div className="flex gap-3 pb-2">
          {unlocked.map((a, i) => (
            <AchievementCard key={a.key} achievement={a} tilt={i % 2 ? 'right' : 'left'} finish="foil" />
          ))}
        </div>
      </Section>

      {/* 2. Reactions */}
      <Section
        title="Emoji reactions"
        note="Feed posts"
        how="The heart is one of the reactions now. The smiley opens the set: pick one and it flies to its chip and the count rolls. Tap a chip to join it or take yours back. Double-tap the post to heart it. On a phone, hold the smiley and slide."
      >
        {post ? (
          <PostCard item={post} onHeart={(on) => react('❤️', on)} reactions={<Reactions chips={chips} onReact={react} />} />
        ) : (
          <div className="h-40 rounded-lg border bg-card" />
        )}
      </Section>

      {/* 3. Light band */}
      <Section
        title="Light on the invite ticket"
        note="Crew settings, invite page"
        how="A band of light crosses the ticket when a mouse comes over it, and each time the code is copied. Tap the code to try it."
      >
        {g && (
          <Ticket
            color={g.color}
            shine={copies}
            top={
              <div className="px-5 pb-[18px] pt-5">
                <p className="text-sm font-bold">Invite code</p>
                <button
                  type="button"
                  onClick={() => {
                    setCopies((n) => n + 1)
                    toast('Invite code copied')
                  }}
                  aria-label={`Copy invite code ${g.slug.split('').join(' ')}`}
                  className="mt-3 block rounded-[10px]"
                >
                  <CodeTiles code={g.slug} wave={copies} />
                </button>
                <p className="mt-[10px] text-[12.5px] font-medium">Tap the code to copy it.</p>
              </div>
            }
            bottom={<div className="px-5 py-[14px] text-sm text-muted-foreground">{g.name}</div>}
          />
        )}
      </Section>

      {/* 4. Ring carousel */}
      <Section
        title="Featured crews ring"
        note="Explore, top"
        how="Drag or flick it round, use the arrow keys, or tap a side card to bring it forward. A card gives a little under the pointer. Tap the front one to open the crew."
      >
        {crews.data && <FeaturedCrews crews={crews.data} onOpen={(id) => toast(`Would open ${crews.data?.find((c) => c.id === id)?.name}`)} />}
      </Section>
    </main>
  )
}
