'use client'

import { forwardRef } from 'react'
import { CheckIcon, PlusIcon } from '@/components/checkin/icons'
import { cn } from '@/lib/utils'

/** Floating check-in button above the tab bar. Turns into a calm "done" state once you're in. */
export const Fab = forwardRef<HTMLButtonElement, { done: boolean; onClick: () => void }>(function Fab({ done, onClick }, ref) {
  return (
    // Phones only: on desktop the check-in button sits at the top of the feed's right rail.
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(98px+env(safe-area-inset-bottom))] z-25 mx-auto flex max-w-app justify-end px-5 lg:hidden">
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-label={done ? 'You’re checked in today' : 'Check in'}
        className={cn(
          'pointer-events-auto grid size-16 place-items-center rounded-full border shadow-raised',
          'transition-[transform,background-color] duration-150 ease-out active:scale-[.97]',
          done ? 'border-border bg-card edge-lit' : 'border-transparent bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/.3),var(--elev-raised)]',
        )}
      >
        {done ? (
          <span className="grid size-10 place-items-center rounded-full bg-primary-soft text-primary-ink">
            <CheckIcon size={22} />
          </span>
        ) : (
          <PlusIcon size={28} />
        )}
      </button>
    </div>
  )
})
