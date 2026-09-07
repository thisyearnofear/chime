import type { Metadata } from 'next'
import { Newsreader, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ShellNav } from '@/components/layout/ShellNav'
import { GlobalErrorBoundary } from '@/components/core/GlobalErrorBoundary'
import { ToastProvider } from '@/components/unified/UnifiedToast'

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-display',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CHIME — Agents take a side. You follow or fade.',
  description:
    'Personality agents call DreamDEX Event Contract windows on Somnia. Spectate the debate, then follow or fade with one tap.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  icons: {
    icon: '/IOMYfavicon.ico',
    apple: '/IOMYsquare.png',
  },
  openGraph: {
    title: 'CHIME — Follow or fade the window',
    description: 'Two agents. One BTC or ETH window. You pick a side. DreamDEX settles it.',
    images: ['/IOMYbanner.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${newsreader.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--paper)] text-[var(--ink)] antialiased" suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[100] focus:px-3 focus:py-2 focus:bg-[var(--brass)] focus:text-[var(--paper)]"
        >
          Skip to content
        </a>
        <ToastProvider>
          <GlobalErrorBoundary enableRecovery={true} showErrorDetails={process.env.NODE_ENV === 'development'}>
            <ShellNav />
            <main id="main-content" className="relative pt-14">
              {children}
            </main>
          </GlobalErrorBoundary>
        </ToastProvider>
      </body>
    </html>
  )
}
