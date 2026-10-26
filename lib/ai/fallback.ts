import type { AssistSuggestion, RecapRequest } from './schema'

// What the AI features show when there's no model to ask: no API key, a visitor over the rate
// limit, or an error. Built from the same data, in the same voice, so the demo never breaks.

const join = (names: string[]) =>
  names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

/** A short weekly recap from the numbers and one or two real notes. */
export function recapFallback(week: RecapRequest): string {
  const total = week.checkIns.length
  if (!total) return `Quiet week so far in ${week.crewName}. Whoever goes first sets the tone, and any day is a good day to start.`

  const showed = week.perPerson.filter((p) => p.count > 0)
  const top = showed[0]
  const lines: string[] = []
  lines.push(
    `${showed.length} of ${week.memberCount} of you checked in this week, ${total} time${total === 1 ? '' : 's'} in all.`,
  )
  if (top && top.count > 1) {
    const ties = showed.filter((p) => p.count === top.count).map((p) => p.name)
    lines.push(`${join(ties)} showed up the most, ${top.count} days${ties.length > 1 ? ' each' : ''}.`)
  }
  // One or two notes from crewmates, the most recent first.
  const notes = [...week.checkIns].reverse().filter((c) => c.note && !c.isMe)
  const picked = notes.filter((c, i) => notes.findIndex((x) => x.name === c.name) === i).slice(0, 2)
  if (picked.length) lines.push(picked.map((c) => `${c.name}: “${c.note}”`).join(' '))
  if (week.streak > 1) lines.push(`Someone's been in every day for ${week.streak} days running. That's the crew doing its job.`)
  return lines.join(' ')
}

/** Tidy a note and pick matching crew tags, without a model. */
export function assistFallback(text: string, tags: string[]): AssistSuggestion {
  let note = text.trim().replace(/\s+/g, ' ')
  note = note.charAt(0).toUpperCase() + note.slice(1)
  if (!/[.!?]$/.test(note)) note += '.'
  const words = text.toLowerCase().match(/[a-z]+/g) ?? []
  const matches = tags.filter((t) =>
    t
      .toLowerCase()
      .split(/[\s-]+/)
      .some((part) => part.length >= 3 && words.some((w) => w.startsWith(part.slice(0, 4)) || part.startsWith(w.slice(0, 4)))),
  )
  return { note: note.slice(0, 140), tags: matches.slice(0, 3) }
}
