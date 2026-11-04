'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { CreateMenu } from '@/components/bencho/CreateMenu'
import { BrandMark } from '@/components/checkin/BrandMark'
import { CrewBlock, CrewDot } from '@/components/checkin/CrewBlock'
import { GearIcon } from '@/components/checkin/icons'
import { TABS } from '@/components/checkin/TabBar'
import { useActiveCrew } from '@/lib/activeCrew'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

/**
 * Desktop navigation (lg and up), reference: Halmatec. A narrow rail of crew medals on the far left
 * (pick one to open it in the feed; + opens a menu to start, join or browse), then a quiet panel: the logo, the three
 * tabs and the crew you're on. Phones use the bottom tab bar.
 */
export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { status } = useAuth()
  const { activeId, setActiveId, groups } = useActiveCrew()

  if (status !== 'signedIn' || pathname === '/') return null
  const onFeed = pathname === '/feed'
  const active = groups?.find((g) => g.id === activeId)

  return (
    <div className="sticky top-0 hidden h-dvh flex-none lg:flex">
      {/* The crew rail */}
      <nav aria-label="Your crews" className="flex w-[72px] flex-col items-center gap-2 border-r bg-sidebar py-5">
        <ul className="flex min-h-0 flex-col items-center gap-2 overflow-y-auto px-3 py-1">
          {groups?.map((g) => {
            const current = onFeed && g.id === activeId
            return (
              <li key={g.id} className="relative">
                {/* The active crew gets a short bar on the rail's edge. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-foreground transition-[opacity,transform] duration-200 ease-out',
                    current ? 'opacity-100' : 'scale-y-50 opacity-0',
                  )}
                />
                <button
                  type="button"
                  aria-current={current ? 'true' : undefined}
                  aria-label={`${g.name}, ${g.inToday} of ${g.memberCount} in today`}
                  title={g.name}
                  onClick={() => {
                    setActiveId(g.id)
                    if (!onFeed) router.push('/feed')
                    window.scrollTo({ top: 0 })
                  }}
                  className={cn(
                    'block rounded-[14px] transition-[transform,opacity] duration-150 ease-out active:scale-[.97]',
                    current ? 'opacity-100' : 'opacity-70 hover:opacity-100',
                  )}
                >
                  <CrewBlock name={g.name} color={g.color} emoji={g.emoji} size="md" className="rounded-[14px]" />
                </button>
              </li>
            )
          })}
        </ul>
        {/* + opens the create menu (Bencho): start a crew, join with a code, or browse. */}
        <CreateMenu variant="rail" />
      </nav>

      {/* The panel */}
      <aside className="flex w-[208px] flex-col border-r px-3 py-6">
        <Link href="/feed" className="mb-6 self-start px-3" aria-label="Check-in, go to your feed">
          <BrandMark />
        </Link>

        <nav aria-label="Main" className="flex flex-col gap-1">
          {TABS.map(({ key, label, href, Icon }) => {
            const current = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={key}
                href={href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'flex h-9 items-center gap-3 rounded-full border px-3 text-[14px] transition-colors duration-150 ease-out',
                  current ? 'border-border bg-muted text-foreground edge-lit' : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* The crew you're on: its name, who's in, and its settings. */}
        {active && (
          <div className="mt-auto rounded-lg border bg-card p-3 edge-lit">
            <p className="flex items-center gap-2 text-[14px] font-medium">
              <CrewDot color={active.color} className="size-2" />
              <span className="truncate">{active.name}</span>
            </p>
            <p className="tnum mt-1 font-mono text-[12px] text-muted-foreground">
              {active.inToday} of {active.memberCount} in today
            </p>
            <Link
              href={`/group-settings/${active.id}`}
              className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground"
            >
              <GearIcon size={15} /> Crew settings
            </Link>
          </div>
        )}
      </aside>
    </div>
  )
}
