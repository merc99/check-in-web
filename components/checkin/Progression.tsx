// Progression pieces: the rank emblem, a badge disc, an avatar frame and a post finish class.
// Placeholder art in the house style (Progression.module.css); lib/art.ts swaps in Ben's own.
import {
  BookOpen, Brush, Calendar, Camera, Clock, Flag, Flame, Layers, Library, Lock, Medal, Mountain, Music, NotebookPen,
  Route, Sparkles, Sun, Sunrise, Target, Timer, Users, type LucideIcon,
} from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { HUE_CLASS, type Hue } from '@/lib/colors'
import { badgeArt, RANK_ART } from '@/lib/art'
import { badgeLook, rankFor, rankOf, type BadgeIcon, type CardFinish, type FrameKey, type RankKey } from '@/lib/progression'
import { cn } from '@/lib/utils'
import s from './Progression.module.css'

const ICON: Record<BadgeIcon, LucideIcon> = {
  sparkle: Sparkles, flag: Flag, layers: Layers, flame: Flame, medal: Medal, users: Users, notebook: NotebookPen,
  calendar: Calendar, sun: Sun, sunrise: Sunrise, camera: Camera, clock: Clock, timer: Timer, route: Route,
  mountain: Mountain, music: Music, book: BookOpen, library: Library, brush: Brush, target: Target,
}

const hueVar = (hue: Hue) => ({ '--hue': HUE_CLASS[hue].cssVar }) as CSSProperties

const EMBLEM_SIZE = { xs: s.emblemXs, sm: s.emblemSm, md: s.emblemMd, lg: s.emblemLg } as const

/** Your rank as a hex with your level in it. Decorative unless `label` is set. */
export function RankEmblem({
  level, rank, size = 'md', label, className,
}: { level: number; rank?: RankKey; size?: keyof typeof EMBLEM_SIZE; label?: string; className?: string }) {
  const r = rank ? rankOf(rank) : rankFor(level)
  const art = RANK_ART[r.key]
  if (art) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={art} alt={label ?? ''} aria-hidden={label ? undefined : true} className={cn(EMBLEM_SIZE[size], 'aspect-[1/1.1] flex-none object-contain', className)} />
  }
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(s.emblem, EMBLEM_SIZE[size], (r.key === 'keystone' || r.key === 'legend') && s[r.key], className)}
      style={hueVar(r.hue)}
    >
      <span>{level}</span>
    </span>
  )
}

const DISC_SIZE = { xs: 'size-[18px]', sm: 'size-7', md: 'size-11', lg: 'size-16' } as const
const ICON_SIZE = { xs: 10, sm: 14, md: 20, lg: 28 } as const

/** An achievement as a coin. Locked ones are a muted disc with a lock. */
export function BadgeDisc({
  badgeKey, locked, size = 'md', className,
}: { badgeKey: string; locked?: boolean; size?: keyof typeof DISC_SIZE; className?: string }) {
  const look = badgeLook(badgeKey)
  const art = !locked ? badgeArt(badgeKey) : undefined
  const Icon = locked ? Lock : ICON[look.icon]
  return (
    <span aria-hidden="true" className={cn(s.disc, DISC_SIZE[size], locked && s.locked, art && s.discArt, className)} style={hueVar(look.hue)}>
      {art ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={art} alt="" />
      ) : (
        <Icon size={ICON_SIZE[size]} strokeWidth={2} />
      )}
    </span>
  )
}

const FRAME_CLASS: Record<FrameKey, string> = { ring: s.frameRing, foil: s.frameFoil, gilded: s.frameGilded, prism: s.framePrism }

/** Wraps an avatar in a frame. `hue` colors the plain ring. */
export function Frame({ frame, hue, className, children }: { frame: FrameKey; hue: Hue; className?: string; children: ReactNode }) {
  return (
    <span className={cn(s.frame, FRAME_CLASS[frame], className)} style={hueVar(hue)}>
      {children}
    </span>
  )
}

const FINISH_CLASS: Record<CardFinish, string> = { edge: s.edge, tint: s.tint, holo: s.holo, gilded: s.gilded, aurora: s.aurora }

/** A post's finish: a className and style (sets --hue to the author's color). */
export function cardFinish(finish: CardFinish, hue: Hue): { className: string; style: CSSProperties } {
  return { className: cn(s.card, FINISH_CLASS[finish]), style: hueVar(hue) }
}
