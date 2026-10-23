// Tailwind can't see class names built at runtime (`bg-${color}`), so every
// color a crew, tag or avatar can take is mapped to literal classes here.

export const TAG_COLORS = ['coral', 'sky', 'rose', 'grape', 'lemon', 'leaf', 'clay', 'indigo'] as const
export type TagColor = (typeof TAG_COLORS)[number]
export type BrandColor = TagColor | 'mint'

export const AVATAR_COLORS: BrandColor[] = ['mint', 'sky', 'coral', 'grape', 'lemon']
export const GROUP_COLORS: BrandColor[] = ['mint', ...TAG_COLORS]

export const COLOR_CLASS: Record<BrandColor, { bg: string; text: string }> = {
  mint: { bg: 'bg-mint', text: 'text-ink' },
  coral: { bg: 'bg-coral', text: 'text-coral-ink' },
  sky: { bg: 'bg-sky', text: 'text-sky-ink' },
  rose: { bg: 'bg-rose', text: 'text-rose-ink' },
  grape: { bg: 'bg-grape', text: 'text-grape-ink' },
  lemon: { bg: 'bg-lemon', text: 'text-lemon-ink' },
  leaf: { bg: 'bg-leaf', text: 'text-leaf-ink' },
  clay: { bg: 'bg-clay', text: 'text-clay-ink' },
  indigo: { bg: 'bg-indigo', text: 'text-indigo-ink' },
}

// Deterministic: the same tag name always gets the same color (from the brief).
export function getTagColor(name: string): TagColor {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}
