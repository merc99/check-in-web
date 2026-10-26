import 'server-only'
import Anthropic from '@anthropic-ai/sdk'

// Server side of the AI demo: the client, the model and a small rate limit. Never imported by
// the browser ('server-only'), so the API key stays on the server.

/** Haiku 5.5: fast and cheap for a public demo. Change it here (or with CHECKIN_AI_MODEL). */
export const MODEL = process.env.CHECKIN_AI_MODEL || 'claude-haiku-5-5'

/** True when a key is configured (Vercel: Project → Settings → Environment Variables). */
export const aiEnabled = () => process.env.CHECKIN_AI !== 'off' && !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN)

let client: Anthropic | null = null
export const anthropic = () => (client ??= new Anthropic())

// Best-effort limits, per server instance: enough to stop one visitor running up the bill.
// Over the limit, the routes answer with the template instead of an error.
const PER_IP = 8 // requests
const WINDOW_MS = 10 * 60 * 1000 // per 10 minutes
const DAILY = Number(process.env.CHECKIN_AI_DAILY_CAP || 400) // all visitors, per instance per day
const hits = new Map<string, { n: number; reset: number }>()
let day = { n: 0, reset: 0 }

export function allow(req: Request): boolean {
  const now = Date.now()
  if (now > day.reset) day = { n: 0, reset: now + 24 * 60 * 60 * 1000 }
  if (day.n >= DAILY) return false
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const h = hits.get(ip)
  if (!h || now > h.reset) hits.set(ip, { n: 1, reset: now + WINDOW_MS })
  else if (h.n >= PER_IP) return false
  else h.n++
  day.n++
  if (hits.size > 5000) hits.clear() // keep memory bounded
  return true
}
