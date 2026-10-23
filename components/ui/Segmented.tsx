'use client'

import { useRef, type KeyboardEvent } from 'react'
import { cn } from '@/lib/cn'

export interface SegmentedProps<T extends string> {
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  label?: string
}

/** Switch with a sliding ink indicator (New crew: Create / Join with code). Arrow keys move between options. */
export function Segmented<T extends string>({ options, value, onChange, label }: SegmentedProps<T>) {
  const index = Math.max(0, options.findIndex((o) => o.value === value))
  const root = useRef<HTMLDivElement>(null)

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = (index + step + options.length) % options.length
    onChange(options[next].value)
    root.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
  }

  return (
    <div
      ref={root}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="relative flex rounded-full border border-ink bg-card p-1 shadow-sh2"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 rounded-full bg-ink transition-transform duration-[400ms] ease-spring"
        style={{ width: `calc((100% - 8px) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((o) => {
        const selected = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative z-[1] flex-1 rounded-full p-[11px] font-bold transition-colors duration-200',
              selected ? 'text-peach' : 'text-ink',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
