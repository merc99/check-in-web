'use client'

import { forwardRef } from 'react'
import { CheckIcon, PlusIcon } from '@/components/checkin/icons'
import { cn } from '@/lib/utils'

/** Floating check-in button above the tab bar. Turns into a calm "done" state once you're in. */
export const Fab = forwardRef<HTMLButtonElement, { done: boolean; onClick: () => void }>(function Fab({ done, onClick }, ref) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(98px+env(safe-area-inset-bottom))] z-25 mx-auto flex max-w-app justify-end px-5">
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-label={done ? 'You’re checked in today' : 'Check in'}
        className={cn(
          'pointer-events-auto grid size-16 place-items-center rounded-full border border-border shadow-raised',
          'transition-[transform,box-shadow] duration-150 ease-out active:translate-y-[2px] active:shadow-card',
          done ? 'bg-card' : 'bg-primary text-primary-foreground hover:rotate-90 active:rotate-90',
        )}
      >
        {done ? (
          <span className="grid size-[42px] place-items-center rounded-full border border-border bg-primary text-primary-foreground">
            <CheckIcon size={22} />
          </span>
        ) : (
          <PlusIcon size={28} />
        )}
      </button>
    </div>
  )
})
