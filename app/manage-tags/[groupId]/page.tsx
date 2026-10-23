'use client'

import { useState, use } from 'react';
import { TagAccordion } from '@/components/crew/TagAccordion'
import { List } from '@/components/ui/List'
import { PageHead } from '@/components/ui/SectionTitle'
import { BackLink } from '@/components/ui/TextButton'
import { useActiveCrew } from '@/lib/activeCrew'

export default function ManageTagsPage(props: { params: Promise<{ groupId: string }> }) {
  const params = use(props.params);
  const { groups } = useActiveCrew()
  // The crew you came from starts open; one open at a time.
  const [openId, setOpenId] = useState<string | null>(params.groupId)

  return (
    <main className="px-5 pb-12">
      <BackLink href={`/group-settings/${params.groupId}`} label="Crew settings" />
      <PageHead className="pt-3" title="Tags" lead="Each tag keeps its color everywhere it shows up." />
      <List className="mt-5">
        {groups?.map((g) => (
          <TagAccordion key={g.id} group={g} open={openId === g.id} onToggle={() => setOpenId((id) => (id === g.id ? null : g.id))} />
        ))}
      </List>
    </main>
  )
}
