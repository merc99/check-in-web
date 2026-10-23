'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BrandMark } from '@/components/checkin/BrandMark'
import { CrewBlock } from '@/components/checkin/CrewBlock'
import { PlusIcon } from '@/components/checkin/icons'
import { TABS } from '@/components/checkin/TabBar'
import { useActiveCrew } from '@/lib/activeCrew'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

/**
 * Desktop navigation (lg and up): the three tabs, then your crews. Picking a crew opens it in
 * the feed, so on desktop the crew switcher is always in view. Phones use the bottom tab bar.
 */
export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { status } = useAuth()
  const { activeId, setActiveId, groups } = useActiveCrew()

  if (status !== 'signedIn' || pathname === '/') return null
  const onFeed = pathname === '/feed'

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 flex-none flex-col gap-1 border-r px-4 py-7 lg:flex">
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
                'flex items-center gap-3 rounded-full px-4 py-[11px] text-[14px] font-bold transition-colors duration-150 ease-out',
                current ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon size={19} />
              {label}
            </Link>
          )
        })}
      </nav>

      <h2 className="mb-2 mt-8 px-4 font-sans text-[12.5px] font-semibold tracking-normal text-muted-foreground">Your crews</h2>
      <ul className="flex min-h-0 flex-col gap-1 overflow-y-auto">
        {groups?.map((g) => {
          const current = onFeed && g.id === activeId
          return (
            <li key={g.id}>
              <button
                type="button"
                aria-current={current ? 'true' : undefined}
                onClick={() => {
                  setActiveId(g.id)
                  if (!onFeed) router.push('/feed')
                  window.scrollTo({ top: 0 })
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors duration-150 ease-out',
                  current ? 'bg-muted' : 'hover:bg-muted',
                )}
              >
                <CrewBlock name={g.name} color={g.color} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold">{g.name}</span>
                  <span className="tnum block text-[12.5px] text-muted-foreground">
                    {g.inToday} of {g.memberCount} in today
                  </span>
                </span>
              </button>
            </li>
          )
        })}
        <li>
          <Link
            href="/new-group"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-[14px] font-semibold text-primary-ink transition-colors duration-150 ease-out hover:bg-muted"
          >
            <span className="grid size-8 place-items-center rounded-[10px] border border-dashed border-border-strong">
              <PlusIcon size={16} />
            </span>
            Start or join a crew
          </Link>
        </li>
      </ul>
    </aside>
  )
}
