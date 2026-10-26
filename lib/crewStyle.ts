// A crew's look beyond its color: an emoji for its block and a cover pattern for its banner and
// cards. Owners pick both in crew settings, so no two crews look alike.

export const CREW_PATTERNS = ['dots', 'stripes', 'waves', 'grid', 'confetti', 'plain'] as const
export type CrewPattern = (typeof CREW_PATTERNS)[number]

export const PATTERN_LABEL: Record<CrewPattern, string> = {
  dots: 'Dots',
  stripes: 'Stripes',
  waves: 'Waves',
  grid: 'Grid',
  confetti: 'Confetti',
  plain: 'Plain',
}

/** Emoji a crew can wear. Windows-10-safe (Emoji 11 or older). */
export const CREW_EMOJI = ['💪', '🏃', '🎨', '📝', '💧', '📵', '🎸', '📚', '🧘', '☀️', '🌱', '🚲', '🍎', '🎯', '⭐', '🔥'] as const
