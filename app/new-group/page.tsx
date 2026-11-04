'use client'

import { CrewDot } from '@/components/checkin/CrewBlock'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/checkin/Button'
import { CapacityDots } from '@/components/checkin/CapacityDots'
import { RollingCounter } from '@/components/bencho/RollingCounter'
import { FormField, Input } from '@/components/checkin/FormField'
import { Segmented } from '@/components/checkin/Segmented'
import { PageHead } from '@/components/checkin/SectionTitle'
import { Swatches } from '@/components/checkin/Swatches'
import { BackLink, TextLink } from '@/components/checkin/TextButton'
import { useToast } from '@/components/checkin/Toast'
import { useActiveCrew } from '@/lib/activeCrew'
import { CREW_HUES, type Hue } from '@/lib/colors'
import { createGroup, getGroup, joinGroupBySlug } from '@/lib/data'

const MIN_SIZE = 3
const MAX_SIZE = 15

export default function NewGroupPage() {
  const router = useRouter()
  const toast = useToast()
  const { groups, setActiveId } = useActiveCrew()
  const [mode, setMode] = useState<'create' | 'join'>('create')
  // "Join with a code" in the create menu links here with ?join=1.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from the URL after hydration, so the server render matches
    if (new URLSearchParams(window.location.search).has('join')) setMode('join')
  }, [])
  const [name, setName] = useState('')
  const [color, setColor] = useState<Hue>('leaf')
  const [max, setMax] = useState<number>(8)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  // A field's error shows after a submit, or after you leave a field you typed in, and clears on your next
  // keystroke (forms skill: blur first, the button always works).
  const [flagged, setFlagged] = useState<'name' | 'code' | null>(null)
  const [dirty, setDirty] = useState<'name' | 'code' | null>(null)

  const fail = (e: unknown) => {
    toast(e instanceof Error ? e.message : 'That didn’t go through. Try again.')
    setBusy(false)
  }

  const create = async () => {
    if (busy) return
    if (!name.trim()) return setFlagged('name')
    setBusy(true)
    try {
      const id = await createGroup({ name, color, maxMembers: max })
      setActiveId(id)
      router.replace(`/group-settings/${id}`)
      toast('Crew created. Share the code.')
    } catch (e) {
      fail(e)
    }
  }

  const join = async () => {
    if (busy) return
    if (code.length !== 6) return setFlagged('code')
    setBusy(true)
    try {
      const id = await joinGroupBySlug(code)
      const g = await getGroup(id)
      setActiveId(id)
      router.replace('/feed')
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
            {/* Live preview of the crew's header as you type (the same look the feed uses). */}
            <div aria-hidden="true" className="mt-5 rounded-xl border bg-card px-5 py-4 edge-lit">
              <h2 className="flex items-center gap-2 truncate text-[24px] font-medium leading-tight">
                <CrewDot color={color} className="size-[10px]" />
                {shownName || 'Your crew'}
              </h2>
              <div className="mt-2 flex items-center gap-2.5">
                <CapacityDots filled={1} max={max} />
                <span className="font-mono text-[12px] text-muted-foreground">
                  <span className="tnum text-foreground">1</span> of <span className="tnum">{max}</span>
                </span>
              </div>
            </div>

            <FormField label="Crew name" error={flagged === 'name' && !shownName ? 'Give your crew a name to create it.' : undefined}>
              <Input
                value={name}
                aria-invalid={flagged === 'name' && !shownName}
                onChange={(e) => {
                  setName(e.target.value)
                  setDirty('name')
                  setFlagged(null)
                }}
                onBlur={() => dirty === 'name' && !shownName && setFlagged('name')}
                maxLength={32}
                placeholder="DIALED, Morning Pages…"
                onKeyDown={(e) => e.key === 'Enter' && create()}
              />
            </FormField>
            <FormField label="Color" as="group">
              <Swatches colors={CREW_HUES} value={color} onChange={setColor} />
            </FormField>
            <FormField label="Max size" as="group" hint="Small on purpose. Everyone should notice everyone.">
              {/* Bencho's rolling counter: tap, hold or drag the number. 3 to 15, the size a crew is for. */}
              <div className="flex items-center gap-3">
                <RollingCounter start={max} min={MIN_SIZE} max={MAX_SIZE} label="Max size" corner={16} onChange={setMax} />
                <span className="text-[14px] text-muted-foreground">people</span>
              </div>
            </FormField>
            <Button variant="primary" block disabled={busy} onClick={create}>
              Create crew
            </Button>
          </>
        ) : (
          <>
            <div className="h-3" />
            {/* "Any code works" is the demo's fallback (joinGroupBySlug); drop that sentence with a real backend. */}
            <FormField
              label="Invite code"
              hint="Six characters, from whoever invited you. Any code works in this prototype."
              error={flagged === 'code' && code.length !== 6 ? 'Invite codes are six characters. Check the code and try again.' : undefined}
            >
              <Input
                aria-invalid={flagged === 'code' && code.length !== 6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
                  setDirty('code')
                  setFlagged(null)
                }}
                onBlur={() => dirty === 'code' && code.length > 0 && code.length !== 6 && setFlagged('code')}
                onKeyDown={(e) => e.key === 'Enter' && join()}
                maxLength={6}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="ABC123"
                className="p-4 text-center font-display text-[30px] uppercase tracking-[.18em]"
              />
            </FormField>
            <Button variant="primary" block disabled={busy} onClick={join}>
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
