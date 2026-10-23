'use client'

// The Check-in logo: the gauge (red → yellow → green, like a day going from "not yet" to "in"),
// the check, and the wordmark in the display face (lowercase, extra bold). A holographic band sweeps the gauge when the logo first appears
// and on hover; it never loops (motion budget, CLAUDE.md "Effects").
import { useEffect, useId, useRef } from 'react'
import { prefersReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

// The gauge: a 225° arc over the top, from lower left (red) to just below the right (green).
// viewBox 0 0 48 48, centre (24, 26), radius 17.
const ARC = 'M10.07 35.75 A17 17 0 1 1 40.74 28.95'

export function LogoMark({ size = 34, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '')
  const sweep = useRef<SVGAnimateTransformElement>(null)
  const svg = useRef<SVGSVGElement>(null)

  // One shimmer when the logo appears, and one each time a mouse comes over it.
  useEffect(() => {
    const run = () => {
      if (!prefersReducedMotion()) sweep.current?.beginElement()
    }
    const t = window.setTimeout(run, 350)
    const el = svg.current
    const enter = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') run()
    }
    el?.addEventListener('pointerenter', enter)
    return () => {
      window.clearTimeout(t)
      el?.removeEventListener('pointerenter', enter)
    }
  }, [])

  return (
    <svg ref={svg} viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className={cn('flex-none overflow-visible', className)}>
      <defs>
        <linearGradient id={`g${id}`} gradientUnits="userSpaceOnUse" x1="8" y1="30" x2="42" y2="30">
          <stop offset="0" stopColor="#E8432E" />
          <stop offset=".38" stopColor="#F2A93B" />
          <stop offset=".58" stopColor="#E9F25C" />
          <stop offset="1" stopColor="#5EF04B" />
        </linearGradient>
        {/* The holographic band: pink, cyan and violet light, parked off the arc until it sweeps. */}
        <linearGradient id={`h${id}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="20" y2="0" gradientTransform="translate(-40 0)">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".3" stopColor="#ffb3f0" stopOpacity=".85" />
          <stop offset=".5" stopColor="#fff" stopOpacity="1" />
          <stop offset=".7" stopColor="#9fe8ff" stopOpacity=".85" />
          <stop offset=".85" stopColor="#c7b3ff" stopOpacity=".6" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
          <animateTransform
            ref={sweep}
            attributeName="gradientTransform"
            type="translate"
            from="-20 0"
            to="52 0"
            dur="1.1s"
            begin="indefinite"
            fill="remove"
            calcMode="spline"
            keyTimes="0;1"
            keySplines="0.16 1 0.3 1"
          />
        </linearGradient>
      </defs>
      <path d={ARC} fill="none" stroke={`url(#g${id})`} strokeWidth="7" strokeLinecap="butt" />
      <path d={ARC} fill="none" stroke={`url(#h${id})`} strokeWidth="7" strokeLinecap="butt" style={{ mixBlendMode: 'screen' }} />
      <polyline points="16.5,25.5 22.5,31.5 34.5,19.5" fill="none" stroke="currentColor" strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Gauge + wordmark. `size="lg"` (the intro) adds the tagline under it.
 */
export function BrandMark({ className, size = 'sm' }: { className?: string; size?: 'sm' | 'lg' }) {
  if (size === 'lg') {
    return (
      <div className={cn('flex flex-col items-center text-center', className)} aria-label="Check-in. Stay consistent with people." role="img">
        <LogoMark size={96} />
        <span className="mt-2 font-display text-[46px] font-extrabold leading-none tracking-tighter">check-in</span>
        <span className="mt-3 text-[17px] font-medium text-muted-foreground">stay consistent with people.</span>
      </div>
    )
  }
  return (
    <div className={cn('flex items-center gap-[6px]', className)} aria-label="Check-in" role="img">
      <LogoMark size={34} />
      <span className="font-display text-[22px] font-extrabold leading-none tracking-tighter">check-in</span>
    </div>
  )
}
