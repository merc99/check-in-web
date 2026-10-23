import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// shadcn-standard helper. Every registry component imports `cn` from here.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
