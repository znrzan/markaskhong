'use client'

import Link from 'next/link'
import { Home, Clock, User } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed-bottom-nav bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16 px-4">
        <Link href="/" className={cn(
          "flex flex-col items-center p-2",
          pathname === '/' ? "text-orange-500" : "text-gray-600"
        )}>
          <Home size={24} />
          <span className="text-xs mt-1">Beranda</span>
        </Link>

        <Link href="/join" className={cn(
          "flex flex-col items-center p-2",
          pathname.startsWith('/join') ? "text-orange-500" : "text-gray-600"
        )}>
          <Clock size={24} />
          <span className="text-xs mt-1">Antrian</span>
        </Link>

        <Link href="/profil" className={cn(
          "flex flex-col items-center p-2",
          pathname === '/profil' ? "text-orange-500" : "text-gray-600"
        )}>
          <User size={24} />
          <span className="text-xs mt-1">Profil</span>
        </Link>
      </div>
    </nav>
  )
}