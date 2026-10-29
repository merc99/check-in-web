'use client'

import { Plus, Route, Sparkles } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Button as UiButton } from '@/components/ui/button'
import { suggestCheckIn } from '@/lib/ai/demo'
import type { Suggestion as AssistSuggestion } from '@/lib/ai/writer'
import { ResponsiveSheet } from '@/components/checkin/ResponsiveSheet'
import { Button } from '@/components/checkin/Button'
import { AddChip, TagChip, ToggleChip } from '@/components/checkin/Chip'
import { FormField, Textarea } from '@/components/checkin/FormField'
import { CheckIcon } from '@/components/checkin/icons'
import { SessionDetails } from '@/components/checkin/SessionDetails'
import { SearchInput } from '@/components/checkin/SearchInput'
import { DetailsEditor } from '@/components/feed/DetailsEditor'
import { StravaPicker } from '@/components/feed/StravaPicker'
import { cleanDetails, type CheckInDetails, type CheckInSource, type SkillKind } from '@/lib/mastery'
import { cn } from '@/lib/utils'
import type { Hue } from '@/lib/colors'
import { prefersReducedMotion } from '@/lib/motion'

const NOTE_MAX = 280
const STAMP_MS = 520

export interface CheckInDraft {
  note: string
  tags: string[]
  /** Optional specifics; null for a loose check-in. */
  details: CheckInDetails | null
  /** Picked from a Strava activity (fitness crews). */
  source: CheckInSource
}

/**
 * Note + tags, then the stamp: the button shrinks to a mint circle and draws a check
 * before `onSubmit` runs. New tags only get created if you actually check in.
 */
export function CheckInSheet({
  open, onClose, group, tags, onSubmit,
}: {
  open: boolean
  onClose: () => void
  group: { name: string; color: Hue; skillKind: SkillKind }
  tags: string[]
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
  // Smart check-in: a tidied note and matching tags from a few loose words (AI, on request).
  const [tidy, setTidy] = useState<{ step: 'busy' } | { step: 'ready'; for: string; s: AssistSuggestion } | null>(null)
  const tidyAbort = useRef<AbortController | null>(null)

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
    }
  }

  const words = note.trim().split(/\s+/).filter(Boolean).length
  const askTidy = async () => {
    tidyAbort.current?.abort()
    const ctrl = new AbortController()
    tidyAbort.current = ctrl
    const asked = note
    setTidy({ step: 'busy' })
    try {
      const s = await suggestCheckIn(asked, tags, group.skillKind, ctrl.signal)
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
    setTimeout(() => onSubmit({ note: note.trim(), tags: Array.from(selected), details: d, source }), prefersReducedMotion() ? 0 : STAMP_MS)
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

        {suggestion && (
          <div aria-live="polite" className="-mt-2 animate-rise rounded-md border border-primary/30 bg-primary-soft/40 p-3">
            <p className="flex items-center gap-[6px] text-[12px] font-semibold text-primary-ink">
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

        {/* Session details: specific or loose. Fields follow the crew's skill. */}
        {detailsOpen ? (
          <div className="rounded-md border bg-muted/50 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[13px] font-semibold">
                Details <span className="font-normal text-muted-foreground">{stravaId ? 'from Strava' : 'optional'}</span>
              </p>
              <UiButton
                size="sm"
                variant="ghost"
                className="-mr-2"
                onClick={() => {
                  setDetailsOpen(false)
                  setStravaId(null)
                }}
              >
                Remove
              </UiButton>
            </div>
            <DetailsEditor skill={group.skillKind} value={details} onChange={setDetails} />
          </div>
        ) : (
          <div className="-mt-2 flex flex-wrap gap-1">
            <UiButton size="sm" variant="ghost" className="-ml-3" onClick={() => setDetailsOpen(true)}>
              <Plus size={15} /> Add details
            </UiButton>
            {group.skillKind === 'fitness' && (
              <UiButton size="sm" variant="ghost" aria-expanded={stravaOpen} onClick={() => setStravaOpen((o) => !o)}>
                <Route size={15} /> Add from Strava
              </UiButton>
            )}
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
          {!visible.length && !canAdd && <p className="text-[12.5px] text-muted-foreground">No tags yet. Type one to add it.</p>}
        </div>

        <div className="flex justify-center pt-3">
          <Button
            variant="primary"
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
