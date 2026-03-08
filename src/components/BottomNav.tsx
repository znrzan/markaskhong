'use client'

import Link from 'next/link'
import { Home, Clock, User } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'  // ini dari shadcn, kalau belum ada, copy dari docs shadcn

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        <Link href="/" className={cn(
          "flex flex-col items-center",
          pathname === '/' ? "text-orange-500" : "text-gray-600"
        )}>
          <Home size={24} />
          <span className="text-xs mt-1">Beranda</span>
        </Link>
        <Link href="/queue/demo-id" className={cn(  // nanti ganti dynamic
          "flex flex-col items-center",
          pathname.startsWith('/queue') ? "text-orange-500" : "text-gray-600"
        )}>
          <Clock size={24} />
          <span className="text-xs mt-1">Antrian</span>
        </Link>
        <Link href="/profile" className={cn(
          "flex flex-col items-center",
          pathname === '/profile' ? "text-orange-500" : "text-gray-600"
        )}>
          <User size={24} />
          <span className="text-xs mt-1">Profil</span>
        </Link>
      </div>
    </nav>
  )
}