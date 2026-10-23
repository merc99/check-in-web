import type { Metadata, Viewport } from 'next'
import { Bowlby_One, Inter } from 'next/font/google'
import { TabBarDock } from '@/components/ui/TabBar'
import { Providers } from './providers'
import './globals.css'

const bowlby = Bowlby_One({ weight: '400', subsets: ['latin'], variable: '--font-bowlby', display: 'swap' })
const inter = Inter({ weight: ['400', '500', '700'], subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  title: 'Check-in',
  description: 'No shame days, just show up.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FCEFD7',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bowlby.variable} ${inter.variable}`}>
      <body>
        <div className="grain relative mx-auto min-h-dvh max-w-app">
          <Providers>
            {children}
            <TabBarDock />
          </Providers>
        </div>
      </body>
    </html>
  )
}
