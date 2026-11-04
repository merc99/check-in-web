'use client'

import { ImagePlus, Plus, Route, Sparkles } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Button as UiButton } from '@/components/ui/button'
import { Assignees } from '@/components/bencho/Assignees'
import { suggestCheckIn, wait } from '@/lib/ai/demo'
import type { Suggestion as AssistSuggestion } from '@/lib/ai/writer'
import { ResponsiveSheet } from '@/components/checkin/ResponsiveSheet'
import { Button } from '@/components/checkin/Button'
import { AddChip, TagChip, ToggleChip } from '@/components/checkin/Chip'
import { FormField, Textarea } from '@/components/checkin/FormField'
import { CheckIcon } from '@/components/checkin/icons'
import { SessionDetails } from '@/components/checkin/SessionDetails'
import { SearchInput } from '@/components/checkin/SearchInput'
import { TaskRun, useTaskRun, type TaskStep } from '@/components/checkin/TaskRun'
import { DetailsEditor } from '@/components/feed/DetailsEditor'
import { StravaPicker } from '@/components/feed/StravaPicker'
import { cleanDetails, type CheckInDetails, type CheckInSource, type SkillKind } from '@/lib/mastery'
import { cn } from '@/lib/utils'
import { HUE_CLASS, type Hue } from '@/lib/colors'
import { prefersReducedMotion } from '@/lib/motion'

const NOTE_MAX = 280
const STAMP_MS = 520

// Tidy with AI, shown as a careful helper working down a list; the last step waits for you.
const TIDY_STEPS: TaskStep[] = [
  { id: 'read', label: 'Read your note' },
  { id: 'details', label: 'Spot the details' },
  { id: 'tags', label: 'Match your crew’s tags' },
  { id: 'use', label: 'Use the tidy version', gate: true },
]
/** "45 min, 5 km" from the details a suggestion spotted. */
function detailSummary(d: CheckInDetails) {
  const out: string[] = []
  if (d.activity) out.push(d.activity)
  if (d.minutes) out.push(`${d.minutes} min`)
  if (d.distanceKm) out.push(`${d.distanceKm} km`)
  if (d.pages) out.push(`${d.pages} pages`)
  if (d.book) out.push(d.book)
  if (d.items?.length) out.push(d.items.join(', '))
  return out.join(', ')
}

export interface CheckInDraft {
  /** A proof photo (demo: an object URL for an image picked on this device). */
  photoUrl: string | null
  note: string
  tags: string[]
  /** Optional specifics; null for a loose check-in. */
  details: CheckInDetails | null
  /** Picked from a Strava activity (fitness crews). */
  source: CheckInSource
  /** Crewmates who did it with you (user ids). */
  with: string[]
}

/** A crewmate you can say you did it with, and a short line about them. */
export type Crewmate = { id: string; name: string; color: Hue; note: string }

/**
 * Note + tags, then the stamp: the button shrinks to a mint circle and draws a check
 * before `onSubmit` runs. New tags only get created if you actually check in.
 */
export function CheckInSheet({
  open, onClose, group, tags, crewmates = [], onSubmit,
}: {
  open: boolean
  onClose: () => void
  group: { name: string; color: Hue; skillKind: SkillKind }
  tags: string[]
  crewmates?: Crewmate[]
  onSubmit: (draft: CheckInDraft) => void
}) {
  const [note, setNote] = useState('')
  const [query, setQuery] = useState('')
  const [added, setAdded] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [stamping, setStamping] = useState(false)
  // Session details: collapsed until asked for (loose is the default).
  const [details, setDetails] = useState<CheckInDetails>({})
  const [detailsOpen, setDetailsOpen] = useState(false)
  // Strava (fitness crews, demo): a picked activity fills the details.
  const [stravaOpen, setStravaOpen] = useState(false)
  const [stravaId, setStravaId] = useState<string | null>(null)
  const [photo, setPhoto] = useState<string | null>(null)
  const [withIds, setWithIds] = useState<string[]>([])
  const photoInput = useRef<HTMLInputElement>(null)
  // Smart check-in: a tidied note and matching tags from a few loose words (AI, on request).
  const [tidy, setTidy] = useState<{ step: 'busy' } | { step: 'ready'; for: string; s: AssistSuggestion } | null>(null)
  const tidyAbort = useRef<AbortController | null>(null)
  const { state: tidyRun, emit } = useTaskRun(TIDY_STEPS)

  // Start fresh each time the sheet opens (adjusting state during render, not in an effect).
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setNote('')
      setQuery('')
      setAdded([])
      setSelected(new Set())
      setStamping(false)
      setTidy(null)
      setDetails({})
      setDetailsOpen(false)
      setStravaOpen(false)
      setStravaId(null)
      setPhoto(null)
      setWithIds([])
    }
  }

  const words = note.trim().split(/\s+/).filter(Boolean).length
  const askTidy = async () => {
    tidyAbort.current?.abort()
    const ctrl = new AbortController()
    tidyAbort.current = ctrl
    const asked = note
    const n = asked.trim().split(/\s+/).filter(Boolean).length
    const beat = (ms: number) => wait(prefersReducedMotion() ? 0 : ms, ctrl.signal)
    emit({ type: 'reset' })
    setTidy({ step: 'busy' })
    try {
      const pending = suggestCheckIn(asked, tags, group.skillKind, ctrl.signal)
      emit({ type: 'step-start', step: 'read' })
      emit({ type: 'sub-start', step: 'read', id: 'r', text: `Reading ${n} words` })
      await beat(380)
      emit({ type: 'sub-done', step: 'read', id: 'r', text: `Read ${n} words` })
      const s = await pending
      emit({ type: 'step-start', step: 'details' })
      emit({ type: 'sub-start', step: 'details', id: 'd', text: 'Looking for times and numbers' })
      await beat(480)
      emit({ type: 'sub-done', step: 'details', id: 'd', text: s.details ? `Found ${detailSummary(s.details)}` : 'Nothing specific, and that’s fine' })
      await beat(260)
      emit({ type: 'step-start', step: 'tags' })
      emit({ type: 'sub-start', step: 'tags', id: 't', text: `Checking ${tags.length} crew tags` })
      await beat(420)
      emit({ type: 'sub-done', step: 'tags', id: 't', text: s.tags.length ? `Matched ${s.tags.join(', ')}` : 'No tag fits yet' })
      await beat(260)
      emit({ type: 'step-done', step: 'tags' })
      setTidy({ step: 'ready', for: asked, s })
    } catch {
      // Aborted.
    }
  }
  const applyTidy = (s: AssistSuggestion) => {
    setNote(s.note)
    setSelected((prev) => new Set([...prev, ...s.tags]))
    if (s.details) {
      setDetails((d) => ({ ...d, ...s.details }))
      setDetailsOpen(true)
    }
    emit({ type: 'step-start', step: 'use' })
    emit({ type: 'step-done', step: 'use' })
    setTidy(null)
  }
  // A suggestion only stands for the words it was made from.
  const suggestion = tidy?.step === 'ready' && tidy.for === note ? tidy.s : null

  const q = query.trim().toLowerCase()
  const all = useMemo(() => [...tags, ...added.filter((t) => !tags.includes(t))], [tags, added])
  const visible = all.filter((t) => !q || t.includes(q))
  const canAdd = q.length > 0 && !all.includes(q)

  const toggle = (t: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })

  const add = () => {
    setAdded((a) => [...a, q.slice(0, 24)])
    setSelected((s) => new Set(s).add(q.slice(0, 24)))
    setQuery('')
  }

  const submit = () => {
    if (stamping) return
    setStamping(true)
    try {
      navigator.vibrate?.(18)
    } catch {
      // Not supported everywhere; the stamp is the feedback that matters.
    }
    const d = detailsOpen ? cleanDetails(details) : null
    const source: CheckInSource = stravaId && d ? 'strava' : 'manual'
    setTimeout(() => onSubmit({ note: note.trim(), tags: Array.from(selected), details: d, source, photoUrl: photo, with: withIds }), prefersReducedMotion() ? 0 : STAMP_MS)
  }

  return (
    // Phones: one resting height, since a half-height peek would hide the button. Desktop: a centered dialog.
    <ResponsiveSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      title="Check in"
      detents={[0.9]}
    >
      <div className="flex flex-col gap-4">
        {/* The sheet title is text only, so the crew chip leads the content instead of sitting beside the title. */}
        <div>
          <TagChip name={group.name} color={group.color} size="m" />
        </div>

        <FormField label="Note" optional>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={NOTE_MAX}
            placeholder="How’d it go?"
          />
          <div className="mt-[6px] flex min-h-8 items-center justify-between gap-3">
            {words >= 2 && !suggestion ? (
              <UiButton size="sm" variant="ghost" className="-ml-3" disabled={tidy?.step === 'busy'} onClick={askTidy}>
                <Sparkles size={15} strokeWidth={1.75} /> {tidy?.step === 'busy' ? 'Tidying…' : 'Tidy with AI'}
              </UiButton>
            ) : (
              <span />
            )}
            <span className="tnum text-xs text-muted-foreground">
              {note.length} / {NOTE_MAX}
            </span>
          </div>
        </FormField>

        {/* The tidy run: a short list of what it's doing, then the suggestion, which waits for you. */}
        {(tidy?.step === 'busy' || suggestion) && (
          <div className="-mt-2 animate-rise rounded-md border bg-muted/50 p-3">
            <TaskRun run={tidyRun} />
            {suggestion && (
              <div className="mt-3 border-t pt-3">
                <p className="flex items-center gap-[6px] text-[12px] font-medium text-primary-ink">
                  <Sparkles size={13} strokeWidth={1.75} aria-hidden="true" /> Suggestion
                </p>
                <p className="mt-1 text-[15px] leading-[1.45]">{suggestion.note}</p>
                {suggestion.details && <SessionDetails details={suggestion.details} skill={group.skillKind} className="mt-2" />}
                {suggestion.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-[6px]">
                    {suggestion.tags.map((t) => (
                      <TagChip key={t} name={t} />
                    ))}
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <UiButton size="sm" onClick={() => applyTidy(suggestion)}>
                    Use this
                  </UiButton>
                  <UiButton size="sm" variant="ghost" onClick={() => setTidy(null)}>
                    Keep mine
                  </UiButton>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Session details: specific or loose. Fields follow the crew's skill. */}
        {detailsOpen ? (
          <div className="rounded-md border bg-muted/50 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[13px] font-medium">
                Details <span className="font-normal text-muted-foreground">{stravaId ? 'from Strava' : 'optional'}</span>
              </p>
              <span className="-mr-2 flex">
                {!photo && (
                  <UiButton size="sm" variant="ghost" onClick={() => photoInput.current?.click()}>
                    <ImagePlus size={15} /> Add photo
                  </UiButton>
                )}
                <UiButton
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDetailsOpen(false)
                    setStravaId(null)
                  }}
                >
                  Remove
                </UiButton>
              </span>
            </div>
            <DetailsEditor skill={group.skillKind} value={details} onChange={setDetails} />
          </div>
        ) : (
          <div className="-mt-2 flex flex-wrap gap-1">
            <UiButton size="sm" variant="ghost" className="-ml-3" onClick={() => setDetailsOpen(true)}>
              <Plus size={15} /> Add details
            </UiButton>
            <UiButton size="sm" variant="ghost" onClick={() => photoInput.current?.click()}>
              <ImagePlus size={15} /> {photo ? 'Change photo' : 'Add photo'}
            </UiButton>
            {group.skillKind === 'fitness' && (
              <UiButton size="sm" variant="ghost" aria-expanded={stravaOpen} onClick={() => setStravaOpen((o) => !o)}>
                <Route size={15} /> Add from Strava
              </UiButton>
            )}
          </div>
        )}

        <input
          ref={photoInput}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) setPhoto(URL.createObjectURL(f))
            e.target.value = ''
          }}
        />
        {photo && (
          <div className="relative -mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="Your proof photo" className="max-h-[180px] w-full rounded-md border object-cover" />
            <UiButton size="sm" variant="secondary" className="absolute right-2 top-2" onClick={() => setPhoto(null)}>
              Remove photo
            </UiButton>
          </div>
        )}

        {stravaOpen && !detailsOpen && (
          <div className="-mt-2 animate-rise rounded-md border bg-muted/50 p-3">
            <StravaPicker
              pickedId={stravaId}
              onPick={(a) => {
                setStravaId(a?.id ?? null)
                if (!a) return
                setDetails({ activity: a.type, minutes: a.minutes, distanceKm: a.distanceKm })
                setDetailsOpen(true)
                setStravaOpen(false)
              }}
            />
          </div>
        )}

        {/* Who you did it with: crewmates as faces in a pill (Bencho's assignees). */}
        {crewmates.length > 0 && (
          <FormField label="With" optional as="group">
            <Assignees
              inline
              defaultOpen={false}
              label="With"
              empty="Just me"
              corner={999}
              people={crewmates.map((c) => ({ id: c.id, name: c.name, role: c.note, hue: HUE_CLASS[c.color].cssVar }))}
              value={withIds}
              onChange={setWithIds}
            />
          </FormField>
        )}

        <FormField label="Tags" optional>
          <SearchInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canAdd) {
                e.preventDefault()
                add()
              }
            }}
            placeholder="Search or add a tag"
            maxLength={24}
          />
        </FormField>
        <div className="flex flex-wrap gap-2">
          {visible.map((t) => (
            <ToggleChip key={t} label={t} selected={selected.has(t)} onToggle={() => toggle(t)} />
          ))}
          {canAdd && <AddChip name={q} onAdd={add} />}
          {!visible.length && !canAdd && <p className="text-[13px] text-muted-foreground">No tags yet. Type one to add it.</p>}
        </div>

        <div className="flex justify-center pt-3">
          <Button
            variant="brand"
            onClick={submit}
            disabled={stamping}
            aria-label={stamping ? 'Checking in' : undefined}
            className={cn('duration-350 ease-spring disabled:opacity-100', stamping ? 'size-[58px] p-0!' : 'w-full')}
          >
            {stamping ? (
              <svg viewBox="0 0 24 24" width={26} height={26} fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7" strokeDasharray={24} strokeDashoffset={24} className="animate-draw" />
              </svg>
            ) : (
              <>
                <CheckIcon size={18} /> Check in
              </>
            )}
          </Button>
        </div>
      </div>
    </ResponsiveSheet>
  )
}
