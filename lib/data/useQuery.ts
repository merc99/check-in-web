'use client'

import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'
import { subscribe } from './api'
import type { TableName } from './types'

export interface QueryState<T> {
  data: T | undefined
  error: Error | undefined
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
  const [state, setState] = useState<Omit<QueryState<T>, 'refetch'>>({ data: undefined, error: undefined, loading: true })
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const run = useRef(0)

  const load = useCallback(() => {
    const id = ++run.current
    setState((s) => ({ ...s, loading: true }))
    fetcherRef.current().then(
      (data) => id === run.current && setState({ data, error: undefined, loading: false }),
      (error: unknown) =>
        id === run.current &&
        setState((s) => ({ ...s, error: error instanceof Error ? error : new Error(String(error)), loading: false })),
    )
  }, [])

  const tableKey = tables.join(',')
  useEffect(() => {
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

  return { ...state, refetch: load }
}
