import type { CrewWeek } from '@/lib/data'

// The demo "AI" writer: the weekly recap and the check-in tidy-up, built from the crew's own data in
// the brand voice. No model, no key, no server: it runs in the browser. `variant` picks different
// phrasing (and different notes to quote), so "Rewrite" reads like a fresh take.

export interface Suggestion {
  note: string
  tags: string[]
}

const pick = <T,>(options: T[], variant: number, salt = 0) => options[(variant + salt) % options.length]

const join = (names: string[]) =>
  names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

/** A three-to-four sentence recap of the crew's last seven days. */
export function recapText(week: CrewWeek, variant = 0): string {
  const total = week.checkIns.length
  const crew = week.crewName
  if (!total) {
    return pick(
      [
        `Quiet week so far in ${crew}. Whoever goes first sets the tone, and any day is a good day to start.`,
        `Nothing logged in ${crew} yet this week. No pressure: one check-in gets it rolling.`,
      ],
      variant,
    )
  }

  const showed = week.perPerson.filter((p) => p.count > 0)
  const n = week.memberCount
  const lines: string[] = []

  lines.push(
    pick(
      [
        `${showed.length} of ${n} of you checked in this week, ${total} time${total === 1 ? '' : 's'} in all.`,
        `${total} check-in${total === 1 ? '' : 's'} this week, from ${showed.length} of ${n} of you.`,
        `This week ${crew} logged ${total} check-in${total === 1 ? '' : 's'}, with ${showed.length} of ${n} of you showing up.`,
      ],
      variant,
    ),
  )

  const top = showed[0]
  if (top && top.count > 1) {
    const ties = showed.filter((p) => p.count === top.count && !p.isMe).map((p) => p.name)
    if (ties.length) {
      const who = join(ties)
      const all = top.count >= 7
      lines.push(
        all
          ? pick([`${who} checked in every single day.`, `${who} didn't miss a day.`, `Seven for seven: ${who}.`], variant, 1)
          :
        pick(
          [
            `${who} showed up the most, ${top.count} days${ties.length > 1 ? ' each' : ''}.`,
            `${who} led the way with ${top.count} days${ties.length > 1 ? ' each' : ''}.`,
            `The most steady: ${who}, ${top.count} days out of seven.`,
          ],
          variant,
          1,
        ),
      )
    }
  }

  // Quote one or two crewmates, a different pair on each rewrite.
  const notes = [...week.checkIns].reverse().filter((c) => c.note && !c.isMe)
  const byPerson = notes.filter((c, i) => notes.findIndex((x) => x.name === c.name) === i)
  if (byPerson.length) {
    const start = variant % byPerson.length
    const quoted = [byPerson[start], byPerson[(start + 1) % byPerson.length]].filter((c, i, a) => a.indexOf(c) === i)
    lines.push(quoted.map((c) => `${c.name}: “${c.note}”`).join(' '))
  }

  const me = week.perPerson.find((p) => p.isMe)
  if (me && me.count > 0) {
    lines.push(
      pick(
        [`You were in on ${me.count} of those days.`, `You showed up ${me.count} time${me.count === 1 ? '' : 's'}. It all counts.`],
        variant,
        2,
      ),
    )
  }

  if (week.streak > 1) {
    lines.push(
      pick(
        [
          `Someone's been in every day for ${week.streak} days running. That's the crew doing its job.`,
          `${week.streak} days in a row with someone checking in. Nice work, everyone.`,
          `The crew streak is at ${week.streak} days, carried by all of you.`,
        ],
        variant,
        1,
      ),
    )
  }
  return lines.join(' ')
}

/** Tidy a few loose words into a note, and pick matching tags from the crew's own list. */
export function tidyNote(text: string, tags: string[]): Suggestion {
  let note = text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\bi\b/g, 'I')
    .replace(/\s+([,.!?])/g, '$1')
  note = note.charAt(0).toUpperCase() + note.slice(1)
  if (!/[.!?]$/.test(note)) note += '.'
  const words = text.toLowerCase().match(/[a-z]+/g) ?? []
  const matches = tags.filter((t) =>
    t
      .toLowerCase()
      .split(/[\s-]+/)
      .some((part) => part.length >= 3 && words.some((w) => w.length >= 3 && (w.startsWith(part.slice(0, 4)) || part.startsWith(w.slice(0, 4))))),
  )
  return { note: note.slice(0, 140), tags: matches.slice(0, 3) }
}
