'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { BrandMark } from '@/components/ui/BrandMark'
import { Button } from '@/components/ui/Button'
import { CapacityDots } from '@/components/ui/CapacityDots'
import { CheckIcon } from '@/components/ui/icons'
import { TextLink } from '@/components/ui/TextButton'
import { Ticket } from '@/components/ui/Ticket'
import { useToast } from '@/components/ui/Toast'
import { useActiveCrew } from '@/lib/activeCrew'
import { getGroupPreview, joinGroupBySlug, useQuery } from '@/lib/data'

/** Public invite page (works signed out once auth exists). Joining with the link skips the join request. */
export default function InvitePage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const toast = useToast()
  const { setActiveId } = useActiveCrew()
  const [busy, setBusy] = useState(false)
  const preview = useQuery(() => getGroupPreview(params.slug), [params.slug], ['groups', 'group_members', 'join_requests'])
  const p = preview.data

  const open = (id: string) => {
    setActiveId(id)
    router.push('/feed')
  }

  const join = async () => {
    if (!p || busy) return
    setBusy(true)
    try {
      const id = await joinGroupBySlug(params.slug)
      open(id)
      toast('Welcome to the crew')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'That didn’t go through. Try again.')
      setBusy(false)
    }
  }

  if (preview.loading && !p) return <main className="min-h-dvh px-5" />

  return (
    <main className="flex min-h-dvh flex-col justify-center px-5 py-5">
      <BrandMark className="mb-7 justify-center" />

      {!p ? (
        <div className="text-center">
          <h1 className="font-display text-[30px] leading-none">This invite doesn’t match a crew.</h1>
          <p className="mx-auto mt-3 max-w-[32ch] text-ink-soft">The code may have changed, or the crew was deleted. Ask whoever sent it for a fresh one.</p>
        </div>
      ) : (
        <>
          <Ticket
            color={p.color}
            className="text-center"
            top={
              <div className="px-5 pb-6 pt-8">
                <p className="font-bold">You’re invited to join</p>
                <h1 className="mt-3 break-words font-display text-[42px] leading-[.95]">{p.name}</h1>
                <div className="mt-5 flex justify-center">
                  {p.preview.map((m, i) => (
                    <Avatar key={m.id} name={m.name} color={m.color} photoUrl={m.photoUrl} className={i ? '-ml-2' : undefined} />
                  ))}
                </div>
              </div>
            }
            bottom={
              <div className="flex items-center justify-center gap-[10px] px-5 py-[14px] font-bold">
                <CapacityDots filled={p.memberCount} max={p.maxMembers} />
                <span>
                  <span className="tnum">{p.memberCount}</span> of <span className="tnum">{p.maxMembers}</span> members
                </span>
              </div>
            }
          />
          <div className="mt-7">
            {p.status === 'member' ? (
              <Button variant="primary" block onClick={() => open(p.id)}>
                <CheckIcon size={18} /> You’re in. Open the feed
              </Button>
            ) : p.status === 'pending' ? (
              <Button block disabled>
                Request sent
              </Button>
            ) : p.status === 'full' ? (
              <Button block disabled>
                This crew is full right now
              </Button>
            ) : (
              <Button variant="primary" block disabled={busy} onClick={join}>
                Join {p.name}
              </Button>
            )}
          </div>
        </>
      )}

      <p className="mt-8 text-center font-display text-[17px]">No shame days, just show up.</p>
      <TextLink href="/feed" className="mx-auto mt-3">
        Back to the app
      </TextLink>
    </main>
  )
}
