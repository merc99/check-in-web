import { TIER_HUE, TierMedal } from '@/components/checkin/TierCard'
import { ChallengeBar } from '@/components/checkin/ChallengeBar'
import { SkillAchievements } from '@/components/you/SkillAchievements'
import { HUE_CLASS } from '@/lib/colors'
import type { SkillProgress } from '@/lib/data'
import { tierOf } from '@/lib/mastery'
import { cn } from '@/lib/utils'

/**
 * Your skills (mastery): one compact row per crew's skill, the tier's tile, the tier and the crew, and
 * how far the next tier is on a bar in the next tier's color. The full tier cards live in the binder
 * below. Encouraging, never a countdown: "12 more sessions to Committed".
 */
export function TrophyCase({ skills }: { skills: SkillProgress[] }) {
  if (!skills.length) return null
  return (
    <>
    <ul className="flex flex-col gap-3">
      {skills.map((s) => (
        <li key={s.groupId} className="rounded-xl border bg-card p-4 edge-lit">
          {s.tier ? (
            <div className="flex items-center gap-3 px-1 pt-1">
              <TierMedal tier={s.tier} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-muted-foreground">{s.crewName}</p>
                <p className="text-[18px] font-medium leading-tight tracking-tight">{tierOf(s.tier).name}</p>
              </div>
              <p className="flex-none text-right">
                <span className="tnum block text-[18px] font-medium leading-tight">{s.sessions.toLocaleString()}</span>
                <span className="block font-mono text-[11px] text-subtle-foreground">sessions</span>
              </p>
            </div>
          ) : (
            <p className="px-1 py-2 text-[14px] text-muted-foreground">No sessions in {s.crewName} yet. The first one gets you Started.</p>
          )}
          {s.next && <NextTier skill={s} />}
          <SkillAchievements groupId={s.groupId} color={s.color} />
          <ChallengeBar groupId={s.groupId} color={s.color} className="px-1 pb-1 pt-3" />
        </li>
      ))}
    </ul>
    </>
  )
}

function NextTier({ skill: s }: { skill: SkillProgress }) {
  const next = s.next!
  const t = tierOf(next.tier)
  const from = s.tier ? tierOf(s.tier).at : 0
  const done = Math.max(0, Math.min(1, (s.sessions - from) / (t.at - from)))
  return (
    <div className="px-1 pb-1 pt-3">
      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span>
          <span className="tnum font-medium">{next.toGo}</span> more session{next.toGo === 1 ? '' : 's'} to <span className="font-medium">{t.name}</span>
        </span>
        <span className="tnum text-muted-foreground">
          {s.sessions} / {t.at}
        </span>
      </div>
      <div aria-hidden="true" className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full origin-left rounded-full transition-transform duration-300 ease-out', HUE_CLASS[TIER_HUE[next.tier]].solid)} style={{ transform: `scaleX(${done})` }} />
      </div>
    </div>
  )
}
