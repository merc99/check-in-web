// Ben's own progression art. Until a piece is listed here, the component draws its placeholder (a
// coin for badges, a hex for ranks). To swap one: put the file in public/badges/ or public/ranks/
// (square PNG or SVG, transparent background, 256px or more) and add its path here.
import type { RankKey } from './progression'

/** Badge art by achievement key: the skill achievement's key ('early', 'km50'...) or 'all.<key>'. */
export const BADGE_ART: Partial<Record<string, string>> = {
  // early: '/badges/early.png',
}

/** Rank emblems. The level number is drawn on top only for the placeholder. */
export const RANK_ART: Partial<Record<RankKey, string>> = {
  // mainstay: '/ranks/mainstay.png',
}

/** Art for a full badge key ('g1:early' or 'all.week'). */
export const badgeArt = (key: string) => BADGE_ART[key] ?? BADGE_ART[key.includes(':') ? key.split(':')[1] : key]
