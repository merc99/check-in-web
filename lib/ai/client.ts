'use client'

import { assistFallback, recapFallback } from './fallback'
import type { AiSource, AssistSuggestion, RecapRequest } from './schema'

// The browser side of the AI demo. Both calls always produce something: if the route can't be
// reached, the same template the server would use runs here instead.

/** Streams the weekly recap into `onText` (the whole text so far). Resolves with who wrote it. */
export async function streamRecap(week: RecapRequest, onText: (text: string) => void, signal?: AbortSignal): Promise<AiSource> {
  try {
    const res = await fetch('/api/ai/recap', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(week),
      signal,
    })
    if (!res.ok || !res.body) throw new Error('recap unavailable')
    const source = (res.headers.get('x-ai-source') as AiSource) ?? 'fallback'
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let text = ''
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      text += decoder.decode(value, { stream: true })
      onText(text)
    }
    return source
  } catch (e) {
    if (signal?.aborted) throw e
    onText(recapFallback(week))
    return 'fallback'
  }
}

/** A tidied note and matching crew tags for a few loose words. */
export async function suggestCheckIn(text: string, tags: string[], signal?: AbortSignal): Promise<AssistSuggestion & { source: AiSource }> {
  try {
    const res = await fetch('/api/ai/checkin', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, tags }),
      signal,
    })
    if (!res.ok) throw new Error('assist unavailable')
    return await res.json()
  } catch (e) {
    if (signal?.aborted) throw e
    return { ...assistFallback(text, tags), source: 'fallback' }
  }
}
