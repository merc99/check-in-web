'use client'

import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { RankEmblem } from '@/components/checkin/Progression'
import { RollingCount } from '@/components/fx/RollingCount'
import type { MyProgress } from '@/lib/data'
import { MAX_LEVEL, rankFor, rankOf, TIER_XP, XP } from '@/lib/progression'
import { cn } from '@/lib/utils'

/**
 * Your rank (progression): the emblem, your level, how far the next one is in mint (it's your own
 * bar), XP this week, and what the next level gives. "How XP works" opens the rules and where yours
 * came from. XP never goes down.
 */
export function RankCard({ progress: p, className }: { progress: MyProgress; className?: string }) {
  const [open, setOpen] = useState(false)
  const panel = useId()
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(raf)
  }, [])
  const rank = rankOf(p.rank)
  const top = p.level >= MAX_LEVEL
  const into = p.xp - p.levelFrom
  const span = Math.max(1, p.levelTo - p.levelFrom)
  const toGo = p.levelTo - p.xp
  const nextRank = rankFor(p.level + 1)
  const nextRewards = p.rewards.filter((r) => r.level !== null && r.level > p.level).sort((a, b) => a.level! - b.level!)
  const nextAt = nextRewards[0]?.level
  const comingUp = nextRewards.filter((r) => r.level === nextAt)

  return (
    <section aria-label="Your rank" className={cn('flex flex-col rounded-xl border bg-card p-5 edge-lit', className)}>
      <div className="flex items-center gap-4">
        <RankEmblem level={p.level} rank={p.rank} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-muted-foreground">{rank.name}</p>
          <p className="mt-0.5 flex items-baseline gap-2">
            <span className="text-[15px] text-muted-foreground">Level</span>
            <span className="text-[40px] font-medium leading-none tracking-tightest">
              <RollingCount n={ready ? p.level : 1} tight label={`Level ${p.level}`} />
            </span>
          </p>
        </div>
        {p.weekXp > 0 && (
          <span className="self-start rounded-full bg-primary-soft px-2 py-0.5 font-mono text-[11px] text-primary-ink">
            +{p.weekXp.toLocaleString()} XP this week
          </span>
        )}
      </div>

      <div className="mt-5">
        <div
          role="progressbar"
          aria-label={top ? 'Top level' : `XP to level ${p.level + 1}`}
          aria-valuemin={0}
          aria-valuemax={span}
          aria-valuenow={top ? span : into}
          className="h-2.5 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full origin-left rounded-full bg-primary transition-transform duration-500 ease-out"
            style={{ transform: `scaleX(${ready ? (top ? 1 : into / span) : 0})` }}
          />
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-3 text-[13px]">
          <span>
            {top ? (
              'Top level. Every session still counts.'
            ) : (
              <>
                <span className="tnum font-medium">{toGo.toLocaleString()} XP</span> to level {p.level + 1}
                {nextRank.key !== p.rank && <span className="text-muted-foreground"> · {nextRank.name}</span>}
              </>
            )}
          </span>
          <span className="tnum font-mono text-[12px] text-subtle-foreground">
            {p.xp.toLocaleString()} / {p.levelTo.toLocaleString()}
          </span>
        </div>
      </div>

      {comingUp.length > 0 && (
        <p className="mt-3 text-[13px] text-muted-foreground">
          Level {nextAt} gives you{' '}
          <span className="text-foreground">{comingUp.map((r) => `${r.name} ${r.slot === 'title' ? 'title' : r.slot === 'card' ? 'card' : 'frame'}`).join(' and ')}</span>
        </p>
      )}

      <div className="mt-auto pt-3">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panel}
          onClick={() => setOpen((o) => !o)}
          className="hit-44 flex w-full items-center justify-between gap-3 border-t pt-3 text-left text-[13px] font-medium"
        >
          How XP works
          <ChevronDown size={16} aria-hidden="true" className={cn('text-muted-foreground transition-transform duration-200 ease-out', open && 'rotate-180')} />
        </button>
        <div id={panel} inert={!open} className={cn('grid transition-[grid-template-rows] duration-200 ease-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
          <div className="min-h-0 overflow-hidden">
            <ul className="mt-3 grid gap-1.5 text-[13px]">
              <Rule label="A session (one check-in)" xp={XP.session} />
              <Rule label="With a photo, details or a crewmate" xp={XP.photo} each />
              <Rule label="A badge earned" xp={XP.achievement} />
              <Rule label="A tier reached" xp={`${TIER_XP.started}–${TIER_XP.master.toLocaleString()}`} />
            </ul>
            <p className="mt-3 text-[12px] text-muted-foreground">XP never goes down. A missed day costs nothing.</p>
            <p className="mt-4 text-[13px] font-medium">Where yours came from</p>
            <ul className="mt-2 grid gap-1.5 text-[13px]">
              {p.sources.filter((s) => s.xp > 0).map((s) => (
                <li key={s.label} className="flex items-baseline justify-between gap-3">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="tnum font-mono text-[12px]">{s.xp.toLocaleString()} XP</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

function Rule({ label, xp, each }: { label: string; xp: number | string; each?: boolean }) {
  return (
    <li className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="tnum flex-none font-mono text-[12px]">+{xp} XP{each ? ' each' : ''}</span>
    </li>
  )
}
