import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import PwaProvider from '@/components/PwaProvider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// ── Viewport (theme-color, scale) ────────────────────────────────────────────
export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

// ── Metadata ─────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'CaloriaCerta — Nutrição Consciente',
  description:
    'Nutrição consciente para brasileiros no Japão. Scanner de rótulos em japonês, receitas Japan-friendly e acompanhamento inteligente de calorias.',

  // PWA manifest
  manifest: '/manifest.json',

  // Standard icons
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png',  sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png',  sizes: '512x512', type: 'image/png' },
    ],
    // iOS home screen icon
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },

  // iOS PWA — makes Safari run the app in full-screen when launched from home screen
  appleWebApp: {
    capable: true,
    title: 'CaloriaCerta',
    statusBarStyle: 'default',
  },

  // Prevent iOS from auto-linking phone numbers
  formatDetection: { telephone: false },

  // Open Graph (looks good when sharing link)
  openGraph: {
    title: 'CaloriaCerta',
    description: 'Nutrição consciente para brasileiros no Japão',
    type: 'website',
    locale: 'pt_BR',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* PWA: registers service worker + shows install banner */}
        <PwaProvider />
      </body>
    </html>
  )
}
