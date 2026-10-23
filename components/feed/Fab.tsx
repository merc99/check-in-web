'use client'

import { forwardRef } from 'react'
import { CheckIcon, PlusIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

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
          'pointer-events-auto grid size-16 place-items-center rounded-full border border-ink shadow-sh3',
          'transition-[transform,box-shadow] duration-150 ease-spring active:translate-y-[2px] active:shadow-sh3-pressed',
          done ? 'bg-card' : 'bg-mint hover:rotate-90 active:rotate-90',
        )}
      >
        {done ? (
          <span className="grid size-[42px] place-items-center rounded-full border border-ink bg-mint">
            <CheckIcon size={22} />
          </span>
        ) : (
          <PlusIcon size={28} />
        )}
      </button>
    </div>
  )
})
