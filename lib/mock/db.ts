import type { Change, Tables } from '@/lib/data/types'
import { createSeed } from './seed'

// The in-memory "database". Lives for the browser tab; a reload re-seeds it.

let tables: Tables | null = null

export function db(): Tables {
  if (!tables) tables = createSeed(new Date())
  return tables
}

type Listener = (change: Change) => void
const listeners = new Set<Listener>()

/** Every row change goes through here, like Supabase realtime would deliver it. */
export function emit(change: Change) {
  listeners.forEach((l) => l(change))
}

export function onChange(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Throw everything away and re-seed. Every table reports a change so screens refetch. */
export function resetDb() {
  tables = createSeed(new Date())
  for (const table of Object.keys(tables) as (keyof Tables)[]) emit({ table, type: 'UPDATE', row: null })
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export const nowIso = () => new Date().toISOString()
