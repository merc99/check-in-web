'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/checkin/Button'
import { CapacityDots } from '@/components/checkin/CapacityDots'
import { ToggleChip } from '@/components/checkin/Chip'
import { CrewBlock } from '@/components/checkin/CrewBlock'
import { FormField, Input } from '@/components/checkin/FormField'
import { Segmented } from '@/components/checkin/Segmented'
import { PageHead } from '@/components/checkin/SectionTitle'
import { Swatches } from '@/components/checkin/Swatches'
import { BackLink, TextLink } from '@/components/checkin/TextButton'
import { useToast } from '@/components/checkin/Toast'
import { useActiveCrew } from '@/lib/activeCrew'
import { cn } from '@/lib/utils'
import { HUE_CLASS, CREW_HUES, type Hue } from '@/lib/colors'
import { createGroup, getGroup, joinGroupBySlug } from '@/lib/data'

const SIZES = [5, 8, 10, 15] as const

export default function NewGroupPage() {
  const router = useRouter()
  const toast = useToast()
  const { groups, setActiveId } = useActiveCrew()
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [name, setName] = useState('')
  const [color, setColor] = useState<Hue>('leaf')
  const [max, setMax] = useState<number>(8)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  const fail = (e: unknown) => {
    toast(e instanceof Error ? e.message : 'That didn’t go through. Try again.')
    setBusy(false)
  }

  const create = async () => {
    if (!name.trim() || busy) return
    setBusy(true)
    try {
      const id = await createGroup({ name, color, maxMembers: max })
      setActiveId(id)
      router.push(`/group-settings/${id}`)
      toast('Crew created. Share the code.')
    } catch (e) {
      fail(e)
    }
  }

  const join = async () => {
    if (code.length !== 6 || busy) return
    setBusy(true)
    try {
      const id = await joinGroupBySlug(code)
      const g = await getGroup(id)
      setActiveId(id)
      router.push('/feed')
      toast(`You joined ${g.name}`)
    } catch (e) {
      fail(e)
    }
  }

  const shownName = name.trim()

  return (
    <main className="px-5 pb-12">
      <BackLink href={groups?.length ? '/feed' : '/explore'} />
      <PageHead className="pt-3" title="Get a crew going." />

      <div className="mt-5">
        <Segmented
          label="Create or join"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'create', label: 'Create' },
            { value: 'join', label: 'Join with code' },
          ]}
        />
      </div>

      <div className="mt-2 flex flex-col gap-4">
        {mode === 'create' ? (
          <>
            {/* Live preview of the crew card as you type. */}
            <div
              aria-hidden="true"
              className={cn(
                'mt-5 flex min-h-[116px] items-center gap-4 rounded-lg border border-border p-5 shadow-raised transition-colors duration-200',
                HUE_CLASS[color].soft,
              )}
            >
              <CrewBlock name={shownName || '?'} color={color} size="xl" white />
              <div className="min-w-0 flex-1">
                <h2 className="wrap-break-word font-display text-[26px] leading-none">{shownName || 'Your crew'}</h2>
                <div className="mt-[10px] flex items-center gap-[10px]">
                  <CapacityDots filled={1} max={max} />
                  <span className="text-[13px] font-bold">
                    <span className="tnum">1</span> of <span className="tnum">{max}</span>
                  </span>
                </div>
              </div>
            </div>

            <FormField label="Crew name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={32}
                placeholder="5am Lifters, Morning Pages…"
                onKeyDown={(e) => e.key === 'Enter' && create()}
              />
            </FormField>
            <FormField label="Color" as="group">
              <Swatches colors={CREW_HUES} value={color} onChange={setColor} />
            </FormField>
            <FormField label="Max size" as="group" hint="Small on purpose. Everyone should notice everyone.">
              <div className="flex flex-wrap gap-2">
                {SIZES.map((n) => (
                  <ToggleChip key={n} label={`${n} people`} color="leaf" size="l" selected={max === n} onToggle={() => setMax(n)} />
                ))}
              </div>
            </FormField>
            <Button variant="primary" block disabled={!shownName || busy} onClick={create}>
              Create crew
            </Button>
          </>
        ) : (
          <>
            <div className="h-3" />
            {/* "Any code works" is the demo's fallback (joinGroupBySlug); drop that sentence with a real backend. */}
            <FormField label="Invite code" hint="Six characters, from whoever invited you. Any code works in this prototype.">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                onKeyDown={(e) => e.key === 'Enter' && join()}
                maxLength={6}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="ABC123"
                className="p-4 text-center font-display text-[30px] uppercase tracking-[.18em]"
              />
            </FormField>
            <Button variant="primary" block disabled={code.length !== 6 || busy} onClick={join}>
              Join crew
            </Button>
          </>
        )}
        <TextLink href="/explore" className="mx-auto mt-2">
          Skip for now and browse public crews
        </TextLink>
      </div>
    </main>
  )
}
