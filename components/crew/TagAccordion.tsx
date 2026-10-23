'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { TagChip, ToggleChip } from '@/components/ui/Chip'
import { CrewBlock } from '@/components/ui/CrewBlock'
import { Input } from '@/components/ui/FormField'
import { ChevronIcon } from '@/components/ui/icons'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { addTag, deleteTags, getTags, useQuery, type GroupSummary } from '@/lib/data'

/** One crew's tags: tap to select, delete the selection, or add a new one with a live chip preview. */
export function TagAccordion({ group, open, onToggle }: { group: GroupSummary; open: boolean; onToggle: () => void }) {
  const toast = useToast()
  const panelId = useId()
  const tags = useQuery(() => getTags(group.id), [group.id], ['tags'])
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [draft, setDraft] = useState('')

  const panel = useRef<HTMLDivElement>(null)

  // Selection belongs to the open panel only; a closed panel can't be tabbed into.
  useEffect(() => {
    if (!open) setSelected(new Set())
    panel.current?.toggleAttribute('inert', !open)
  }, [open])

  const fail = (e: unknown) => toast(e instanceof Error ? e.message : 'That didn’t go through. Try again.')
  const list = tags.data ?? []
  const clean = draft.trim().toLowerCase()

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const remove = () => {
    const n = selected.size
    deleteTags(group.id, Array.from(selected)).then(() => {
      setSelected(new Set())
      toast(`${n} tag${n > 1 ? 's' : ''} deleted`)
    }, fail)
  }

  const add = () => {
    if (!clean) return
    addTag(group.id, clean).then(() => {
      setDraft('')
      toast('Tag added')
    }, fail)
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 px-4 py-[14px] text-left font-bold"
      >
        <CrewBlock name={group.name} color={group.color} size="sm" />
        <span className="min-w-0 truncate">{group.name}</span>
        <span className="tnum font-medium text-ink-mute">{list.length}</span>
        <ChevronIcon size={18} className={cn('ml-auto flex-none transition-transform duration-300 ease-spring', open && 'rotate-180')} />
      </button>
      {/* Height animates via grid rows (0fr → 1fr), so no measuring. */}
      <div
        id={panelId}
        ref={panel}
        className={cn('grid transition-[grid-template-rows] duration-[400ms] ease-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-4 px-4 pb-[18px] pt-1">
            <div className="flex flex-wrap gap-2">
              {list.length ? (
                list.map((t) => <ToggleChip key={t.id} label={t.name} selected={selected.has(t.id)} onToggle={() => toggle(t.id)} />)
              ) : (
                <p className="text-[12.5px] text-ink-mute">No tags yet.</p>
              )}
            </div>
            {selected.size > 0 && (
              <div>
                <Button size="sm" variant="danger" onClick={remove}>
                  <span>
                    Delete <span className="tnum">{selected.size}</span> selected
                  </span>
                </Button>
              </div>
            )}
            <form
              className="flex items-center gap-3"
              onSubmit={(e) => {
                e.preventDefault()
                add()
              }}
            >
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={24}
                placeholder="New tag"
                aria-label={`New tag for ${group.name}`}
                className="min-w-0 flex-1"
              />
              {clean && <TagChip name={clean} />}
              <Button type="submit" size="sm" variant="primary" disabled={!clean}>
                Add
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
