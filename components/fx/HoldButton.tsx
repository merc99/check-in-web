'use client'

// Pattern: mmo fx kit / hold to confirm (adapted to Check-in). For destructive actions only (see
// CLAUDE.md): delete a crew, leave a crew, remove a member, delete your account. No "are you sure"
// sheet: the hold is the confirmation, and the label says what happens.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useToast } from '@/components/checkin/Toast'
import { cn } from '@/lib/utils'
import { FX } from './config'
import { sfx } from './sound'
import styles from './HoldButton.module.css'

export interface HoldButtonProps {
  /** What happens once held, e.g. "Hold to delete crew". For `icon`, it's the accessible name. */
  label: string
  /** Shown as a toast when someone taps instead of holding, e.g. "Hold the button to delete the crew". */
  hint: string
  onConfirm: () => void | Promise<unknown>
  variant?: 'danger' | 'secondary' | 'icon'
  /** The icon, for `variant="icon"`. */
  children?: ReactNode
  /** One line under the button saying what goes away (pill variants). */
  detail?: ReactNode
  className?: string
}

export function HoldButton({ label, hint, onConfirm, variant = 'danger', children, detail, className }: HoldButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const callbacks = useRef({ onConfirm, toast, hint })
  useEffect(() => {
    callbacks.current = { onConfirm, toast, hint }
  })

  useEffect(() => {
    const btn = ref.current
    if (!btn) return
    let raf = 0
    let start = 0
    let holding = false
    const set = (v: number) => btn.style.setProperty('--hold', String(v))
    const begin = () => {
      if (btn.disabled || holding) return
      holding = true
      start = performance.now()
      sfx('charge')
      const frame = (now: number) => {
        if (!holding) return
        const k = Math.min(1, (now - start) / FX.holdMs)
        set(k)
        if (k < 1) {
          raf = requestAnimationFrame(frame)
          return
        }
        holding = false
        set(0)
        sfx('confirm')
        setBusy(true)
        Promise.resolve(callbacks.current.onConfirm()).finally(() => setBusy(false))
      }
      raf = requestAnimationFrame(frame)
    }
    const cancel = () => {
      if (!holding) return
      holding = false
      cancelAnimationFrame(raf)
      set(0)
      // Let go almost at once: they tapped. Say how it works instead of doing nothing.
      if (performance.now() - start < FX.holdHintMs) callbacks.current.toast(callbacks.current.hint)
    }
    const keyDown = (e: KeyboardEvent) => {
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
        e.preventDefault()
        begin()
      }
    }
    const keyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') cancel()
    }
    const ends = ['pointerup', 'pointerleave', 'pointercancel'] as const
    btn.addEventListener('pointerdown', begin)
    ends.forEach((ev) => btn.addEventListener(ev, cancel))
    btn.addEventListener('keydown', keyDown)
    btn.addEventListener('keyup', keyUp)
    btn.addEventListener('contextmenu', (e) => e.preventDefault())
    return () => {
      cancelAnimationFrame(raf)
      btn.removeEventListener('pointerdown', begin)
      ends.forEach((ev) => btn.removeEventListener(ev, cancel))
      btn.removeEventListener('keydown', keyDown)
      btn.removeEventListener('keyup', keyUp)
    }
  }, [])

  if (variant === 'icon') {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        disabled={busy}
        className={cn(
          styles.hold,
          styles.icon,
          'grid size-[34px] flex-none place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-xs',
          'transition-colors duration-150 ease-out hover:text-destructive-ink',
          className,
        )}
      >
        {children}
      </button>
    )
  }

  return (
    <div className={cn('flex w-full flex-col items-center gap-2', className)}>
      <button
        ref={ref}
        type="button"
        disabled={busy}
        className={cn(
          styles.hold,
          styles.pill,
          variant === 'danger' ? styles.danger : styles.secondary,
          'inline-flex w-full items-center justify-center rounded-full border px-6 py-[15px] text-[15px] font-bold leading-none shadow-card',
          'transition-transform duration-150 ease-out active:scale-[.98] disabled:opacity-60',
          variant === 'danger' ? 'border-border bg-destructive-soft text-destructive-ink' : 'border-border-strong bg-card text-foreground',
        )}
      >
        {label}
      </button>
      {detail && <p className="text-center text-[13px] text-muted-foreground">{detail}</p>}
    </div>
  )
}
