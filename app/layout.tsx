import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/navbar'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'UtilityManager - Správa měřičů',
  description: 'Aplikace pro správu a odečty měřičů v komerčním areálu',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs">
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <main className="min-h-screen bg-gray-50 pb-4 sm:pb-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}

