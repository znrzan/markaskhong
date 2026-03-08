'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export default function FullAntreanPage() {
  const [queues, setQueues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAllQueues() {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('queues')
        .select('*, services(name, is_trending)')
        .gte('created_at', today)
        .order('position', { ascending: true })

      if (error) {
        setError('Gagal memuat daftar antrian')
      } else {
        setQueues(data || [])
      }
      setLoading(false)
    }

    fetchAllQueues()

    const channel = supabase
      .channel('full-antrean')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queues' }, fetchAllQueues)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handlePanggil = async (id: string) => {
    await supabase.from('queues').update({ status: 'serving' }).eq('id', id)
  }

  const handleSelesai = async (id: string) => {
    await supabase.from('queues').update({ status: 'done' }).eq('id', id)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold text-orange-600 mb-6 text-center">
          Daftar Antrian Lengkap
        </h1>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Memuat...</div>
        ) : error ? (
          <div className="text-center py-20 text-red-600">{error}</div>
        ) : queues.length === 0 ? (
          <div className="text-center py-20 text-gray-500">Belum ada antrian hari ini</div>
        ) : (
          <div className="space-y-4">
            {queues.map(q => (
              <Card key={q.id} className={cn(
                "border-l-4",
                q.status === 'serving' ? "border-l-orange-600 bg-orange-50" :
                q.status === 'waiting' ? "border-l-yellow-600 bg-yellow-50" :
                "border-l-green-600 bg-green-50"
              )}>
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-bold">
                        #{q.position} - {q.customer_name}
                      </h3>
                      <p className="text-gray-600">
                        {q.services?.name || 'Tidak dipilih'}
                        {q.services?.is_trending && <Badge className="ml-2 bg-yellow-100 text-yellow-800">Trend</Badge>}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={cn(
                        q.status === 'serving' ? "bg-orange-100 text-orange-800" :
                        q.status === 'waiting' ? "bg-yellow-100 text-yellow-800" :
                        "bg-green-100 text-green-800"
                      )}>
                        {q.status === 'serving' ? 'Sedang Dilayani' :
                         q.status === 'waiting' ? 'Menunggu' : 'Selesai'}
                      </Badge>

                      <div className="flex gap-2">
                        {q.status === 'waiting' && (
                          <Button size="sm" onClick={() => handlePanggil(q.id)} className="bg-orange-600">
                            Panggil
                          </Button>
                        )}
                        {q.status === 'serving' && (
                          <Button size="sm" onClick={() => handleSelesai(q.id)} className="bg-green-600">
                            Selesai
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}