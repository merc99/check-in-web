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

  // State only changes when the promise settles, never synchronously.
  const load = useCallback(() => {
    const id = ++run.current
    fetcherRef.current().then(
      (data) => id === run.current && setState({ data, error: undefined, settled: true }),
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
