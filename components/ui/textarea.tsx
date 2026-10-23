import * as React from "react"
import { cn } from "@/lib/utils"

// Same treatment as input: rounded-md, strong border on card, mint focus ring, 16px text.
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-26 w-full resize-none rounded-md border border-border-strong bg-card px-4 py-3 text-base leading-normal text-foreground transition-[border-color,box-shadow] duration-150 ease-out outline-none placeholder:text-subtle-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
