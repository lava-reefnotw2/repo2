import type { Metadata } from 'next'
import { DM_Sans, Nunito } from 'next/font/google'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Horarios UNT',
  description: 'Sistema de gestión de horarios - Universidad Nacional de Trujillo',
}

import { Providers } from '@/components/Providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${nunito.variable} ${dmSans.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
