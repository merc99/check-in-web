'use client'

import { LiquidToggle } from '@/components/bencho/LiquidToggle'

/**
 * On/off pill: Bencho's liquid toggle. The track turns foreground when on and the droplet stretches
 * as it crosses; drag it or tap it. Same API as before, so every settings row picks it up.
 */
export function Switch({
  checked, onChange, label, disabled,
}: { checked: boolean; onChange: (on: boolean) => void; label: string; disabled?: boolean }) {
  return <LiquidToggle checked={checked} onChange={onChange} label={label} disabled={disabled} />
}
