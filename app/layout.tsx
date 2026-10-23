import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Geist, Pixelify_Sans } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { AppSidebar } from '@/components/checkin/AppSidebar'
import { TabBarDock } from '@/components/checkin/TabBar'
import { Providers } from './providers'
import './globals.css'

// Display: Bricolage Grotesque keeps the playful edge. Body: Geist for the clean, modern read.
const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-bricolage', display: 'swap' })
const sans = Geist({ subsets: ['latin'], variable: '--font-geist-sans', display: 'swap' })
// The logo's pixel wordmark only.
const pixel = Pixelify_Sans({ subsets: ['latin'], weight: ['700'], variable: '--font-pixelify', display: 'swap' })

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
    <html lang="en" className={`${display.variable} ${sans.variable} ${pixel.variable}`} suppressHydrationWarning>
      <body>
        {/* .dark goes on <html>. Default follows the system; the You tab has a toggle. */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {/* Project: toasts, live pill, demo sign-in, active crew + simulation, then the tab dock. */}
          <Providers>
            {/* Phones: one centered column (max-w-app) with the bottom tab bar.
                Desktop (lg): sidebar + content. Pages stay one centered column unless their
                <main> sets data-layout="wide" (the feed, with its right rail). */}
            <div className="min-h-dvh lg:mx-auto lg:flex lg:max-w-[1600px]">
              <AppSidebar />
              <div className="relative mx-auto min-h-dvh max-w-app lg:mx-0 lg:min-w-0 lg:max-w-none lg:flex-1 lg:[&>main:not([data-layout=wide])]:mx-auto lg:[&>main:not([data-layout=wide])]:max-w-app">
                {children}
              </div>
            </div>
            <TabBarDock />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
