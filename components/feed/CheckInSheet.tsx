'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/checkin/Button'
import { AddChip, TagChip, ToggleChip } from '@/components/checkin/Chip'
import { FormField, Textarea } from '@/components/checkin/FormField'
import { CheckIcon } from '@/components/checkin/icons'
import { SearchInput } from '@/components/checkin/SearchInput'
import { Sheet } from '@/components/checkin/Sheet'
import { cn } from '@/lib/utils'
import type { Hue } from '@/lib/colors'
import { prefersReducedMotion } from '@/lib/motion'

const NOTE_MAX = 280
const STAMP_MS = 520

export interface CheckInDraft {
  note: string
  tags: string[]
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
  group: { name: string; color: Hue }
  tags: string[]
  onSubmit: (draft: CheckInDraft) => void
}) {
  const [note, setNote] = useState('')
  const [query, setQuery] = useState('')
  const [added, setAdded] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [stamping, setStamping] = useState(false)

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
    }
  }

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
    setTimeout(() => onSubmit({ note: note.trim(), tags: Array.from(selected) }), prefersReducedMotion() ? 0 : STAMP_MS)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Check in" aside={<TagChip name={group.name} color={group.color} size="m" />}>
      <div className="flex flex-col gap-4">
        <FormField label="Note" optional>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={NOTE_MAX}
            placeholder="How’d it go?"
          />
          <span className="tnum mt-[6px] block text-right text-xs text-muted-foreground">
            {note.length} / {NOTE_MAX}
          </span>
        </FormField>

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
    </Sheet>
  )
}
