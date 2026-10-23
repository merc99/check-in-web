import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { SearchIcon } from './icons'

/** Pill search field with a magnifier. Pass `aria-label` when there's no visible label. */
export const SearchInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function SearchInput(
  { className, ...props },
  ref,
) {
  return (
    <span
      className={cn(
        'flex items-center gap-[10px] rounded-full border border-border bg-card px-4 shadow-card transition-shadow duration-150 focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/25',
        className,
      )}
    >
      <SearchIcon size={18} className="flex-none" />
      <input
        ref={ref}
        type="search"
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent py-3 text-base outline-hidden placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />
    </span>
  )
})
