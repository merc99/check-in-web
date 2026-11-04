'use client'

import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'
import { subscribe } from '@/lib/mock/api'
import type { TableName } from './types'

export interface QueryState<T> {
  data: T | undefined
  error: Error | undefined
  /** True until the first result (or error) arrives. Refetches keep the last data on screen. */
  loading: boolean
  refetch: () => void
}

/**
 * Runs `fetcher` on mount and whenever `deps` change, then again whenever a row
 * changes in one of `tables`. Keeps the last data while refetching, so lists don't flash.
 *
 *   const feed = useQuery(() => getFeed(groupId), [groupId], ['check_ins', 'reactions'])
 */
export function useQuery<T>(fetcher: () => Promise<T>, deps: DependencyList, tables: readonly TableName[]): QueryState<T> {
  const [state, setState] = useState<{ data: T | undefined; error: Error | undefined; settled: boolean }>({
    data: undefined,
    error: undefined,
    settled: false,
  })
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })
  const run = useRef(0)
  // The last result, serialized: a refetch that comes back the same (most live changes are someone
  // else's) keeps the old state, so nothing re-renders mid-swipe for no reason.
  const last = useRef<string | null>(null)

  // State only changes when the promise settles, never synchronously.
  const load = useCallback(() => {
    const id = ++run.current
    fetcherRef.current().then(
      (data) => {
        if (id !== run.current) return
        let key: string | null = null
        try {
          key = JSON.stringify(data) ?? null
        } catch {
          // Not serializable: always take the new result.
        }
        if (key !== null && key === last.current) {
          setState((s) => (s.settled && !s.error ? s : { data: s.data, error: undefined, settled: true }))
          return
        }
        last.current = key
        setState({ data, error: undefined, settled: true })
      },
      (error: unknown) =>
        id === run.current &&
        setState((s) => ({ ...s, error: error instanceof Error ? error : new Error(String(error)), settled: true })),
    )
  }, [])

  const tableKey = tables.join(',')
  useEffect(() => {
    fetcherRef.current = fetcher
    load()
    const generation = run // bumping it in cleanup drops any response still in flight
    const watched = new Set(tableKey.split(','))
    const unsubscribe = subscribe((change) => {
      if (watched.has(change.table)) load()
    })
    return () => {
      generation.current++
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- callers pass their own deps, like useEffect
  }, [...deps, tableKey, load])

  return { data: state.data, error: state.error, loading: !state.settled, refetch: load }
}
