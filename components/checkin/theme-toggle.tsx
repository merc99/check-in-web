'use client'
import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

const OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Auto' },
] as const

const noop = () => () => {}

/** Three-way segmented control for the You tab. Sliding indicator, 200ms ease-out. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  // False on the server and during hydration, true after: the saved theme is only known on the client.
  const mounted = useSyncExternalStore(noop, () => true, () => false)
  const idx = Math.max(0, OPTIONS.findIndex(o => o.value === (mounted ? theme : 'system')))
  return (
    <div role="radiogroup" aria-label="Appearance" className="relative grid h-10 grid-cols-3 rounded-full border bg-muted p-1">
      <span aria-hidden className="absolute inset-y-1 left-1 w-[calc((100%-8px)/3)] rounded-full bg-card shadow-card transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${idx * 100}%)` }} />
      {OPTIONS.map(o => (
        <button key={o.value} role="radio" aria-checked={mounted && theme === o.value} onClick={() => setTheme(o.value)}
          className={cn('relative z-10 rounded-full text-[13px] font-medium transition-colors duration-150', mounted && theme === o.value ? 'text-foreground' : 'text-muted-foreground')}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
