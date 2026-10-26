import { z } from 'zod'

// What the browser sends the AI routes. The demo's data lives in the browser (lib/mock), so the
// page sends just what each feature needs; the routes validate and cap it before any model call.

const short = (max: number) => z.string().trim().max(max)

export const RecapRequest = z.object({
  crewName: short(40).min(1),
  memberCount: z.number().int().min(1).max(50),
  streak: z.number().int().min(0).max(10000),
  perPerson: z.array(z.object({ name: short(40), isMe: z.boolean(), count: z.number().int().min(0).max(100) })).max(20),
  checkIns: z
    .array(
      z.object({
        name: short(40),
        isMe: z.boolean(),
        day: short(12),
        note: short(300).nullable(),
        tags: z.array(short(30)).max(6),
      }),
    )
    .max(120),
})
export type RecapRequest = z.infer<typeof RecapRequest>

export const AssistRequest = z.object({
  text: short(280).min(1),
  /** The crew's existing tags: suggestions only ever come from this list. */
  tags: z.array(short(30)).max(40),
})
export type AssistRequest = z.infer<typeof AssistRequest>

export interface AssistSuggestion {
  note: string
  tags: string[]
}

/** Where a response came from: Claude, or the built-in template (no key, rate limit, or an error). */
export type AiSource = 'claude' | 'fallback'
