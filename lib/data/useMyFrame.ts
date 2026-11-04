'use client'

import { useSyncExternalStore } from 'react'
import { peekMyFrame, subscribe } from '@/lib/mock/api'
import type { FrameKey } from '@/lib/progression'

/** The frame you're wearing, for your avatar everywhere it shows (updates when you change it). */
export function useMyFrame(): FrameKey | null {
  return useSyncExternalStore(
    (l) => subscribe((c) => c.table === 'profiles' || c.table === 'check_ins' ? l() : undefined),
    peekMyFrame,
    () => null,
  )
}
