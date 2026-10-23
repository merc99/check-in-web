// Tailwind can't see class names built at runtime (`bg-${hue}`), so every hue a crew,
// tag or avatar can take is mapped to literal classes here. Values switch per theme
// through CSS variables, so these classes work in light and dark automatically.

export const HUES = ['coral', 'sky', 'rose', 'grape', 'lemon', 'leaf', 'clay', 'indigo'] as const
export type Hue = (typeof HUES)[number]

export const AVATAR_HUES: Hue[] = ['leaf', 'sky', 'coral', 'grape', 'lemon']
export const CREW_HUES: Hue[] = [...HUES]

export const HUE_CLASS: Record<Hue, { solid: string; soft: string; ink: string; ring: string; cssVar: string }> = {
  coral:  { solid: 'bg-coral',  soft: 'bg-coral-soft',  ink: 'text-coral-ink',  ring: 'ring-coral',  cssVar: 'var(--coral)' },
  sky:    { solid: 'bg-sky',    soft: 'bg-sky-soft',    ink: 'text-sky-ink',    ring: 'ring-sky',    cssVar: 'var(--sky)' },
  rose:   { solid: 'bg-rose',   soft: 'bg-rose-soft',   ink: 'text-rose-ink',   ring: 'ring-rose',   cssVar: 'var(--rose)' },
  grape:  { solid: 'bg-grape',  soft: 'bg-grape-soft',  ink: 'text-grape-ink',  ring: 'ring-grape',  cssVar: 'var(--grape)' },
  lemon:  { solid: 'bg-lemon',  soft: 'bg-lemon-soft',  ink: 'text-lemon-ink',  ring: 'ring-lemon',  cssVar: 'var(--lemon)' },
  leaf:   { solid: 'bg-leaf',   soft: 'bg-leaf-soft',   ink: 'text-leaf-ink',   ring: 'ring-leaf',   cssVar: 'var(--leaf)' },
  clay:   { solid: 'bg-clay',   soft: 'bg-clay-soft',   ink: 'text-clay-ink',   ring: 'ring-clay',   cssVar: 'var(--clay)' },
  indigo: { solid: 'bg-indigo', soft: 'bg-indigo-soft', ink: 'text-indigo-ink', ring: 'ring-indigo', cssVar: 'var(--indigo)' },
}

// Deterministic: the same tag name always gets the same hue (from the brief).
export function getTagHue(name: string): Hue {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return HUES[Math.abs(hash) % HUES.length]
}
