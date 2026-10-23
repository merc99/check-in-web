'use client'

// Preview of the premium UI kit effects (premium-ui-kit/), adapted to Check-in. Nothing here is
// used by a real screen yet: each one goes in only after Ben approves its preview.
import { useState, type ReactNode } from 'react'
import { AchievementCard } from '@/components/checkin/AchievementCard'
import { Avatar } from '@/components/checkin/Avatar'
import { CrewBlock } from '@/components/checkin/CrewBlock'
import { PostCard } from '@/components/checkin/PostCard'
import { Reactions, type ReactionChip } from '@/components/checkin/Reactions'
import { RingCarousel } from '@/components/checkin/RingCarousel'
import { PageHead, SectionTitle } from '@/components/checkin/SectionTitle'
import { CodeTiles, Ticket } from '@/components/checkin/Ticket'
import { useToast } from '@/components/checkin/Toast'
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

const START: ReactionChip[] = [
  { emoji: '💪', count: 3, mine: false },
  { emoji: '🔥', count: 1, mine: true },
]

export default function EffectsPreview() {
  const toast = useToast()
  const { activeId } = useActiveCrew()
  const achievements = useQuery(getAchievements, [], ['check_ins', 'groups', 'group_members'])
  const feed = useQuery(() => (activeId ? getFeed(activeId) : Promise.resolve([] as FeedItem[])), [activeId], ['check_ins', 'reactions'])
  const group = useQuery(() => (activeId ? getGroup(activeId) : Promise.resolve(null)), [activeId], ['groups'])
  const crews = useQuery(() => getExploreGroups(''), [], ['groups', 'group_members'])

  const [chips, setChips] = useState(START)
  const [hearted, setHearted] = useState(false)
  const [copies, setCopies] = useState(0)

  const react = (emoji: string, on: boolean) =>
    setChips((list) => {
      const had = list.find((c) => c.emoji === emoji)
      if (on) {
        if (had) return list.map((c) => (c.emoji === emoji ? { ...c, count: c.count + 1, mine: true } : c))
        return [...list, { emoji, count: 1, mine: true }]
      }
      return list
        .map((c) => (c.emoji === emoji ? { ...c, count: c.count - 1, mine: false } : c))
        .filter((c) => c.count > 0)
    })

  const sample = feed.data?.find((f) => !f.isMine && f.note)
  const post = sample && {
    ...sample,
    hearts: { ...sample.hearts, byMe: hearted, count: sample.hearts.count - (sample.hearts.byMe ? 1 : 0) + (hearted ? 1 : 0) },
  }
  const unlocked = achievements.data?.filter((a) => a.unlocked).slice(0, 3) ?? []
  const g = group.data

  return (
    <main className="px-5 pb-[150px]">
      <PageHead
        title="Effects preview"
        lead="Four effects from the premium UI kit, rebuilt in Check-in’s style. Nothing here is on a real screen yet."
      />

      {/* 1. Foil */}
      <Section
        title="Foil achievements"
        note="You tab"
        how="With a mouse, the card tilts toward the pointer and a sheen in the achievement’s color follows it. On a phone, a tap plays one sweep. It never moves on its own."
      >
        <Label>Now</Label>
        <div className="flex gap-3 pb-2">
          {unlocked.map((a, i) => (
            <AchievementCard key={a.key} achievement={a} tilt={i % 2 ? 'right' : 'left'} />
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
        how="The heart stays the one-tap reaction. The smiley opens the crew set: pick one and it flies to its chip and the count rolls. Tap a chip to join it or take yours back. On a phone, hold the smiley and slide."
      >
        {post ? (
          <PostCard item={post} onHeart={setHearted} reactions={<Reactions chips={chips} onReact={react} />} />
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
        {crews.data && crews.data.length > 2 && (
          <RingCarousel
            label="Featured crews"
            items={crews.data.slice(0, 6).map((c) => ({
              key: c.id,
              label: c.name,
              content: (
                <div className="flex h-full flex-col p-5">
                  <CrewBlock name={c.name} color={c.color} size="lg" />
                  <p className="mt-4 font-display text-[22px] leading-[1.05] tracking-tighter">{c.name}</p>
                  {c.description && <p className="mt-2 line-clamp-3 text-[13.5px] text-muted-foreground">{c.description}</p>}
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <span className="flex">
                      {c.preview.slice(0, 4).map((p, i) => (
                        <Avatar key={p.id} name={p.name} color={p.color} photoUrl={p.photoUrl} size="xs" className={i ? 'ml-[-6px]' : undefined} />
                      ))}
                    </span>
                    <span className="tnum text-[12.5px] font-bold">{c.streak}-day streak</span>
                  </div>
                </div>
              ),
            }))}
            onTap={(i) => toast(`Would open ${crews.data?.[i]?.name}`)}
          />
        )}
      </Section>
    </main>
  )
}
