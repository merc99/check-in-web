import { cn } from '@/lib/cn'

/** On/off pill. The knob slides (transform) and the track fills mint when on. */
export function Switch({
  checked, onChange, label, disabled,
}: { checked: boolean; onChange: (on: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-8 w-[52px] flex-none rounded-full border border-ink shadow-sh1 transition-colors duration-200 disabled:opacity-45',
        checked ? 'bg-mint' : 'bg-peach-deep',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute left-[3px] top-[3px] size-[23px] rounded-full border border-ink bg-card transition-transform duration-300 ease-spring',
          checked && 'translate-x-5',
        )}
      />
    </button>
  )
}
