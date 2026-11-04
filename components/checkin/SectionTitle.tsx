import type { ReactNode } from 'react'

/** Section heading with an optional muted note on the right ("2 of 6"). */
export function SectionTitle({ title, note }: { title: ReactNode; note?: ReactNode }) {
  return (
    <div className="mb-3 mt-8 flex items-baseline justify-between gap-3 px-1">
      <h2 className="text-[17px] font-medium leading-none">{title}</h2>
      {note && <small className="font-mono text-[12px] text-muted-foreground">{note}</small>}
    </div>
  )
}

/** Big page title + one line under it (Explore, Edit profile, crew screens). */
export function PageHead({ title, lead, className }: { title: ReactNode; lead?: ReactNode; className?: string }) {
  return (
    <div className={className ?? 'pb-1 pt-7'}>
      <h1 className="text-[32px] font-medium leading-[1.05] max-[380px]:text-[28px]">{title}</h1>
      {lead && <p className="mt-2 max-w-[40ch] text-[15px] text-muted-foreground">{lead}</p>}
    </div>
  )
}
