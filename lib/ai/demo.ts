'use client'

import type { CrewWeek } from '@/lib/data'
import { prefersReducedMotion } from '@/lib/motion'
import { recapText, tidyNote, type Suggestion } from './writer'

// The demo AI as the screens use it: the writer's output, delivered like a model's. A short
// "reading" pause, then the recap streams in word by word. Everything runs in the browser.

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    const t = window.setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(t)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })

/** Streams the weekly recap into `onText` (the whole text so far). Rejects if aborted. */
export async function streamRecap(week: CrewWeek, onText: (text: string) => void, variant: number, signal?: AbortSignal) {
  const full = recapText(week, variant)
  await wait(800 + Math.random() * 600, signal)
  if (prefersReducedMotion()) return onText(full)
  let text = ''
  for (const part of full.split(/(\s+)/)) {
    text += part
    onText(text)
    if (part.trim()) await wait(22 + Math.random() * 38, signal)
  }
}

/** A tidied note and matching crew tags, after a short "thinking" pause. */
export async function suggestCheckIn(text: string, tags: string[], signal?: AbortSignal): Promise<Suggestion> {
  await wait(500 + Math.random() * 400, signal)
  return tidyNote(text, tags)
}
