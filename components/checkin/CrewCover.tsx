import { useId } from 'react'
import { cn } from '@/lib/utils'
import type { CrewPattern } from '@/lib/crewStyle'

/**
 * A crew's cover texture: a quiet pattern in currentColor that fills its (relative) parent and fades
 * out toward the left, so text there stays clean. Static. Set the color and strength with classes,
 * e.g. `text-on-color opacity-15`.
 */
export function CrewCover({ pattern, className, fade = true }: { pattern: CrewPattern; className?: string; fade?: boolean }) {
  const id = `p${useId().replace(/:/g, '')}`
  if (pattern === 'plain') return null
  return (
    <svg
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 size-full', className)}
      style={fade ? { maskImage: 'linear-gradient(to left, #000 35%, transparent 95%)', WebkitMaskImage: 'linear-gradient(to left, #000 35%, transparent 95%)' } : undefined}
    >
      <defs>
        <pattern id={id} patternUnits="userSpaceOnUse" {...PATTERNS[pattern].box}>
          {PATTERNS[pattern].shape}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

const PATTERNS: Record<Exclude<CrewPattern, 'plain'>, { box: { width: number; height: number; patternTransform?: string }; shape: React.ReactNode }> = {
  dots: { box: { width: 16, height: 16 }, shape: <circle cx="4" cy="4" r="2" fill="currentColor" /> },
  stripes: {
    box: { width: 16, height: 16, patternTransform: 'rotate(-35)' },
    shape: <rect width="6" height="16" fill="currentColor" />,
  },
  waves: {
    box: { width: 40, height: 18 },
    shape: <path d="M0 9 Q10 1 20 9 T40 9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />,
  },
  grid: { box: { width: 22, height: 22 }, shape: <path d="M22 0H0V22" fill="none" stroke="currentColor" strokeWidth="1.5" /> },
  confetti: {
    box: { width: 56, height: 56 },
    shape: (
      <g fill="currentColor">
        <rect x="6" y="8" width="9" height="4" rx="2" transform="rotate(30 10 10)" />
        <circle cx="36" cy="12" r="3" />
        <rect x="26" y="34" width="9" height="4" rx="2" transform="rotate(-25 30 36)" />
        <path d="M46 40 l4 7 h-8z" />
        <circle cx="12" cy="42" r="2.2" />
      </g>
    ),
  },
}
