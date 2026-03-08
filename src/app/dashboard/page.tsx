'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Users, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function DashboardOverview() {
  const [stats, setStats] = useState({ total: 0, waiting: 0, serving: 0, done: 0 })
  const [activeQueues, setActiveQueues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const today = new Date().toISOString().split('T')[0]

      const { data } = await supabase
        .from('queues')
        .select('*, services(name)')
        .gte('created_at', today)

      const total = data?.length || 0
      const waiting = data?.filter(q => q.status === 'waiting').length || 0
      const serving = data?.filter(q => q.status === 'serving').length || 0
      const done = data?.filter(q => q.status === 'done').length || 0

      setStats({ total, waiting, serving, done })

      // Hanya ambil 5 antrian aktif terbaru
      const active = data
        ?.filter(q => q.status !== 'done')
        ?.sort((a, b) => a.position - b.position)
        ?.slice(0, 5) || []

      setActiveQueues(active)
      setLoading(false)
    }

    fetchData()

    const channel = supabase
      .channel('dashboard-overview')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queues' },
        () => {
          fetchData()
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      <div className="flex-1 max-w-md mx-auto w-full px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold text-orange-600 mb-6 text-center">
          Dashboard Staff
        </h1>

        {/* Stats Besar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4 text-center">
              <Users className="mx-auto mb-2 text-orange-600" size={32} />
              <p className="text-sm text-orange-700">Total Hari Ini</p>
              <p className="text-3xl font-bold text-orange-600">{stats.total}</p>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4 text-center">
              <Clock className="mx-auto mb-2 text-yellow-600" size={32} />
              <p className="text-sm text-yellow-700">Menunggu</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.waiting}</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <CheckCircle className="mx-auto mb-2 text-green-600" size={32} />
              <p className="text-sm text-green-700">Selesai</p>
              <p className="text-3xl font-bold text-green-600">{stats.done}</p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <AlertCircle className="mx-auto mb-2 text-blue-600" size={32} />
              <p className="text-sm text-blue-700">Sedang Dilayani</p>
              <p className="text-3xl font-bold text-blue-600">{stats.serving}</p>
            </CardContent>
          </Card>
        </div>

        {/* Antrian Aktif Teratas */}
        <h2 className="text-xl font-semibold mb-4">Antrian Aktif Saat Ini</h2>
        {activeQueues.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Tidak ada antrian aktif</p>
        ) : (
          <div className="space-y-4">
            {activeQueues.map(q => (
              <Card key={q.id} className="border-l-4 border-orange-500">
                <CardContent className="p-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-bold text-lg">#{q.position} - {q.customer_name}</p>
                      <p className="text-sm text-gray-600">
                        {q.services?.name || 'Tidak dipilih'}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-orange-100 text-orange-800">
                      {q.status === 'serving' ? 'Sedang Dilayani' : 'Menunggu'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Link ke halaman antrian lengkap */}
        <div className="mt-8 text-center">
          <Button asChild className="bg-orange-600 hover:bg-orange-700">
            <Link href="/dashboard/antrean">
              Lihat Semua Antrian →
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}