import type { Metadata } from 'next'

// The page is a client component, so its title lives here (WCAG 2.4.2: each page has its own title).
export const metadata: Metadata = { title: 'Invite' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
