'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

const HIDE_MS = 2200

const ToastContext = createContext<(message: string) => void>(() => {})

/** `const toast = useToast(); toast('Invite code copied')` */
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  const [show, setShow] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const toast = useCallback((next: string) => {
    setMessage(next)
    setShow(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setShow(false), HIDE_MS)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'pointer-events-none fixed bottom-[calc(112px+env(safe-area-inset-bottom))] left-1/2 z-60 -translate-x-1/2',
          'whitespace-nowrap rounded-full bg-ink px-5 py-3 text-sm font-bold text-peach',
          'transition-[opacity,transform] duration-400 ease-spring',
          show ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-6 scale-90 opacity-0',
        )}
      >
        {message}
      </div>
    </ToastContext.Provider>
  )
}
