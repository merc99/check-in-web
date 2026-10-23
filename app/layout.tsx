import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Geist } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { TabBarDock } from '@/components/checkin/TabBar'
import { Providers } from './providers'
import './globals.css'

// Display: Bricolage Grotesque keeps the playful edge. Body: Geist for the clean, modern read.
const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-bricolage', display: 'swap' })
const sans = Geist({ subsets: ['latin'], variable: '--font-geist-sans', display: 'swap' })

export const metadata: Metadata = { title: 'Check-in', description: 'No shame days, just show up.' }

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF9F6' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0B0C' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <body>
        {/* .dark goes on <html>. Default follows the system; the You tab has a toggle. */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="relative mx-auto min-h-dvh max-w-app">
            {/* Project: toasts, live pill, demo sign-in, active crew + simulation, then the tab dock. */}
            <Providers>
              {children}
              <TabBarDock />
            </Providers>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
