import type { ReactNode } from 'react'

/** Display-font section heading with an optional note on the right ("2 of 6"). */
export function SectionTitle({ title, note }: { title: ReactNode; note?: ReactNode }) {
  return (
    <div className="mb-[14px] mt-9 flex items-baseline justify-between gap-3">
      <h2 className="font-display text-[19px] leading-none">{title}</h2>
      {note && <small className="text-[13px] text-muted-foreground">{note}</small>}
    </div>
  )
}

/** Big page title + one line under it (Explore, Edit profile, crew screens). */
export function PageHead({ title, lead, className }: { title: ReactNode; lead?: ReactNode; className?: string }) {
  return (
    <div className={className ?? 'pb-1 pt-7'}>
      <h1 className="font-display text-[40px] leading-[.95] max-[380px]:text-[34px]">{title}</h1>
      {lead && <p className="mt-[10px] max-w-[36ch] text-[15.5px] text-muted-foreground">{lead}</p>}
    </div>
  )
}
