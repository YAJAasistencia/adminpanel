import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { RootClientLayout } from '@/components/providers/RootClientLayout'

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'YAJA Asistencia',
  description: 'Plataforma YAJA Asistencia',
  icons: {
    icon: [
      { url: '/favicon.ico?v=2' },
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

