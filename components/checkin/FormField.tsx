'use client'

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface FormFieldProps {
  label: ReactNode
  optional?: boolean
  hint?: ReactNode
  /** Shown under the control instead of the hint, after a submit attempt. Clears when the value is fixed. */
  error?: ReactNode
  /** 'group' for a set of controls (swatches, chips) instead of one input. */
  as?: 'label' | 'group'
  className?: string
  children: ReactNode
}

/** Sentence-case label, optional marker, the control, and a hint below. */
export function FormField({ label, optional, hint, error, as = 'label', className, children }: FormFieldProps) {
  const id = useId()
  const body = (
    <>
      <span
        id={id}
        className="mb-2 flex justify-between text-[13px] font-semibold text-foreground"
      >
        {label}
        {optional && (
          <em className="text-xs font-medium normal-case not-italic tracking-normal text-muted-foreground">optional</em>
        )}
      </span>
      {children}
      {error ? (
        <p role="alert" className="mt-2 text-[13px] font-medium text-destructive-ink">
          {error}
        </p>
      ) : (
        hint && <p className="mt-2 text-[12.5px] text-muted-foreground">{hint}</p>
      )}
    </>
  )
  return as === 'group' ? (
    <div role="group" aria-labelledby={id} className={cn('block', className)}>
      {body}
    </div>
  ) : (
    <label className={cn('block', className)}>{body}</label>
  )
}

const FIELD =
  'w-full rounded-md border border-border bg-card px-[14px] py-[13px] text-base shadow-card outline-hidden transition-shadow duration-150 placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-primary/25'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(FIELD, className)} {...props} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(FIELD, 'min-h-[104px] resize-none leading-[1.45]', className)} {...props} />
  },
)
