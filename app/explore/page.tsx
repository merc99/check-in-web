'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CrewCard } from '@/components/explore/CrewCard'
import { CrewDetailSheet } from '@/components/explore/CrewDetailSheet'
import { Button } from '@/components/checkin/Button'
import { PageHead } from '@/components/checkin/SectionTitle'
import { SearchInput } from '@/components/checkin/SearchInput'
import { useToast } from '@/components/checkin/Toast'
import { useActiveCrew } from '@/lib/activeCrew'
import { getExploreGroups, requestToJoin, useQuery } from '@/lib/data'

export default function ExplorePage() {
  const router = useRouter()
  const toast = useToast()
  const { setActiveId } = useActiveCrew()
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const q = query.trim()
  const crews = useQuery(() => getExploreGroups(q), [q], ['groups', 'group_members', 'join_requests', 'check_ins'])

  const request = (id: string) =>
    requestToJoin(id).then(
      () => toast('Request sent'),
      (e: unknown) => toast(e instanceof Error ? e.message : 'That didn’t go through. Try again.'),
    )

  return (
    <main className="px-5 pb-[150px]">
      <PageHead title="Explore" lead="Public crews looking for one more person who shows up." />
      <SearchInput
        className="mt-5"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search crews"
        aria-label="Search crews"
      />

      <div className="mt-5 flex flex-col gap-[14px]">
        {crews.data?.map((c) => <CrewCard key={c.id} crew={c} onOpen={() => setOpenId(c.id)} />)}
        {crews.data && crews.data.length === 0 && (
          <div className="px-2 py-10 text-center">
            <p className="text-muted-foreground">No crews match “{q}”. Start one and name it whatever you like.</p>
            <Button size="sm" className="mt-4" onClick={() => router.push('/new-group')}>
              Start a crew
            </Button>
          </div>
        )}
      </div>

      <CrewDetailSheet
        crewId={openId}
        onClose={() => setOpenId(null)}
        onRequest={request}
        onOpenFeed={(id) => {
          setActiveId(id)
          setOpenId(null)
          router.push('/feed')
        }}
      />
    </main>
  )
}
