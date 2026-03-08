import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import BottomNav from '@/components/BottomNav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Barber Queue - Gaya Pria Sejati',
  description: 'Antrian cukur tanpa nunggu lama di Surabaya',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <main className="min-h-[100dvh] bg-white pb-16 flex flex-col">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  )
}