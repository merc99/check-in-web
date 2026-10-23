// The one door components use for data. lib/data/api.ts picks the implementation
// (in-memory mock or Supabase) from NEXT_PUBLIC_DATA_SOURCE; the exports are the same.
export * from './types'
export * from './api'
export { useQuery } from './useQuery'
