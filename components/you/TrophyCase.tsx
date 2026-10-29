import { TierCard } from '@/components/checkin/TierCard'
import { HUE_CLASS, type Hue } from '@/lib/colors'
import type { SkillProgress } from '@/lib/data'
import { tierOf } from '@/lib/mastery'
import { cn } from '@/lib/utils'

/**
 * Your skills (mastery): one row per crew's skill with the tier card you've reached and how far the
 * next one is. Encouraging, never a countdown: "12 more sessions to Committed".
 */
export function TrophyCase({ skills }: { skills: SkillProgress[] }) {
  if (!skills.length) return null
  const committed = skills.some((s) => s.tier && tierOf(s.tier).at >= tierOf('committed').at)
  return (
    <>
    <ul className="flex flex-col gap-3">
      {skills.map((s) => (
        <li key={s.groupId} className="rounded-lg border bg-card p-3 shadow-card">
          {s.tier ? (
            <>
              <TierCard tier={s.tier} skill={s.skill} crewName={s.crewName} color={s.color} sessions={s.sessions} verified={s.vouches?.verified} />
              {s.vouches && (
                <p className={cn('px-1 pt-2 text-[13px]', s.vouches.verified ? 'font-semibold text-primary-ink' : 'text-muted-foreground')}>
                  {s.vouches.verified
                    ? `Verified by ${s.vouches.people.map((p) => p.name).slice(0, 3).join(', ')}`
                    : `${2 - s.vouches.count} more vouch${2 - s.vouches.count === 1 ? '' : 'es'} from your crew to verify it`}
                </p>
              )}
            </>
          ) : (
            <p className="px-1 py-2 text-[14px] text-muted-foreground">No sessions in {s.crewName} yet. The first one gets you Started.</p>
          )}
          {s.next && <NextTier skill={s} />}
        </li>
      ))}
    </ul>
    {/* Perks: what showing up unlocks. Cosmetic and social, a thank-you, never the reason to show up. */}
    <div className="mt-3 rounded-lg border bg-card p-4 shadow-card">
      <p className="text-[13px] font-semibold">Perks</p>
      <ul className="mt-2 flex flex-col gap-2 text-[14px]">
        <li className="flex items-center gap-3">
          <span aria-hidden="true" className={cn('size-5 flex-none rounded-full', committed ? 'foil-frame' : 'border border-dashed border-border-strong')} />
          <span className="min-w-0 flex-1">
            Foil frame for your avatar
            <span className="block text-[12.5px] text-muted-foreground">
              {committed ? 'Unlocked. Turn it on in Settings.' : 'Reach Committed (50 sessions) in any skill.'}
            </span>
          </span>
        </li>
        <li className="flex items-center gap-3 text-muted-foreground">
          <span aria-hidden="true" className="size-5 flex-none rounded-full border border-dashed border-border-strong" />
          <span className="min-w-0 flex-1">
            A holo finish for your posts
            <span className="block text-[12.5px]">Coming at Seasoned (150 sessions).</span>
          </span>
        </li>
      </ul>
    </div>
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
          <span className="tnum font-semibold">{next.toGo}</span> more session{next.toGo === 1 ? '' : 's'} to <span className="font-semibold">{t.name}</span>
        </span>
        <span className="tnum text-muted-foreground">
          {s.sessions} / {t.at}
        </span>
      </div>
      <div aria-hidden="true" className="mt-2 h-[6px] overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full origin-left rounded-full transition-transform duration-300 ease-out', HUE_CLASS[s.color as Hue].solid)} style={{ transform: `scaleX(${done})` }} />
      </div>
    </div>
  )
}
