import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

// Restyled to the Check-in button spec (CLAUDE.md). shadcn's variant and size names are kept.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-transparent bg-clip-padding font-semibold whitespace-nowrap transition-[transform,background-color,color,box-shadow,border-color] duration-150 ease-out outline-none select-none active:not-aria-[haspopup]:scale-[.97] focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        default:
          "bg-primary bg-[linear-gradient(rgb(255_255_255/.18),transparent)] text-primary-foreground shadow-card hover:bg-primary/90",
        outline:
          "border-border-strong bg-card text-foreground hover:bg-muted aria-expanded:bg-muted",
        secondary:
          "border-border-strong bg-card text-foreground shadow-card hover:bg-muted aria-expanded:bg-muted",
        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "bg-destructive-soft text-destructive-ink hover:bg-destructive-soft/80 focus-visible:ring-destructive/25",
        link: "h-auto px-0 text-primary-ink underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default: "h-12 px-6 text-[15px]",
        xs: "h-7 gap-1 px-3 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-9 gap-1.5 px-4 text-[13px] [&_svg:not([class*='size-'])]:size-4",
        lg: "h-14 px-8 text-base",
        icon: "size-11",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-9 [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
