'use client'

// Pattern: mmo fx kit / toast stack (adapted to Check-in). Messages that arrive together batch into
// one toast (three arrivals read as one card, not three overwrites); up to three stack; hovering
// pauses one; tap dismisses. Above the tab bar on phones, bottom right on desktop.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { FX } from '@/components/fx/config'
import styles from './Toast.module.css'

const ToastContext = createContext<(message: string) => void>(() => {})

/** `const toast = useToast(); toast('Invite code copied')` */
export const useToast = () => useContext(ToastContext)

type Item = { id: number; lines: string[]; bye?: boolean }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([])
  const buffer = useRef<string[] | null>(null)
  const nextId = useRef(0)

  const toast = useCallback((message: string) => {
    if (buffer.current) {
      buffer.current.push(message)
      return
    }
    buffer.current = [message]
    setTimeout(() => {
      const lines = buffer.current ?? []
      buffer.current = null
      // The same message twice in a row (a double tap) shows once.
      const unique = lines.filter((l, i) => lines.indexOf(l) === i)
      setItems((list) => [...list, { id: ++nextId.current, lines: unique }].slice(-FX.toastMax))
    }, FX.toastBatchMs)
  }, [])

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.map((t) => (t.id === id ? { ...t, bye: true } : t)))
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 200)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className={styles.stack} role="status" aria-live="polite">
        {items.map((t) => (
          <ToastCard key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastCard({ item, onDismiss }: { item: Item; onDismiss: () => void }) {
  const timer = useRef(0)
  const dismissRef = useRef(onDismiss)
  useEffect(() => {
    dismissRef.current = onDismiss
  })
  const arm = useCallback(() => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => dismissRef.current(), FX.toastMs)
  }, [])
  useEffect(() => {
    arm()
    return () => window.clearTimeout(timer.current)
  }, [arm])

  const lines = item.lines.length > 3 ? [...item.lines.slice(0, 3), `and ${item.lines.length - 3} more`] : item.lines
  return (
    <div
      className={styles.toast}
      data-bye={item.bye ? '' : undefined}
      onMouseEnter={() => window.clearTimeout(timer.current)}
      onMouseLeave={arm}
      onClick={onDismiss}
    >
      {lines.map((l, i) => (
        <div key={i} className={styles.line}>
          {l}
        </div>
      ))}
    </div>
  )
}
