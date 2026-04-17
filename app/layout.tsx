import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { RootClientLayout } from '@/components/providers/RootClientLayout'

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Admin Panel',
  description: 'Admin panel for managing operations',
  icons: {
    icon: [
      { url: '/favicon.ico?v=2' },
      { url: '/android-chrome-192x192.png?v=2', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png?v=2', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png?v=2', sizes: '180x180', type: 'image/png' }],
    other: [
      { url: '/site.webmanifest?v=2', type: 'application/manifest+json' },
    ],
  },
  openGraph: {
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <RootClientLayout>{children}</RootClientLayout>
      </body>
    </html>
  )
}

