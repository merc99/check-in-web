import type { ReactNode } from 'react'

// Line icons from the prototype. 24px grid, stroke = currentColor.
export interface IconProps {
  size?: number
  strokeWidth?: number
  className?: string
}

function icon(name: string, paths: ReactNode, defaultStroke = 2) {
  function Icon({ size = 20, strokeWidth = defaultStroke, className }: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={className}
      >
        {paths}
      </svg>
    )
  }
  Icon.displayName = name
  return Icon
}

export const HEART_PATH = 'M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z'

export const HeartIcon = icon('HeartIcon', <path d={HEART_PATH} />)
export const PlusIcon = icon('PlusIcon', <path d="M12 5v14M5 12h14" />, 2.5)
export const CheckIcon = icon('CheckIcon', <path d="M5 12.5l4.5 4.5L19 7" />, 2.8)
export const GearIcon = icon(
  'GearIcon',
  <>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="17" r="2" />
  </>,
)
export const ChevronIcon = icon('ChevronIcon', <path d="M6 9l6 6 6-6" />, 2.4)
export const BackIcon = icon('BackIcon', <path d="M15 5l-7 7 7 7" />, 2.4)
export const XIcon = icon('XIcon', <path d="M6 6l12 12M18 6L6 18" />)
export const CopyIcon = icon(
  'CopyIcon',
  <>
    <rect x="8" y="8" width="12" height="12" rx="3" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </>,
)
export const ShareIcon = icon(
  'ShareIcon',
  <>
    <path d="M12 15V4M8 8l4-4 4 4" />
    <path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
  </>,
)
export const CompassIcon = icon(
  'CompassIcon',
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M15.5 8.5l-2 5-5 2 2-5z" />
  </>,
)
export const FeedIcon = icon(
  'FeedIcon',
  <>
    <rect x="4" y="4" width="16" height="7" rx="2.5" />
    <rect x="4" y="13" width="16" height="7" rx="2.5" />
  </>,
)
export const UserIcon = icon(
  'UserIcon',
  <>
    <circle cx="12" cy="8.5" r="3.8" />
    <path d="M4.5 20c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5" />
  </>,
)
export const PinIcon = icon('PinIcon', <path d="M9 4h6l-1 6 3 3H7l3-3zM12 13v7" />)
export const SearchIcon = icon(
  'SearchIcon',
  <>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4 4" />
  </>,
)
