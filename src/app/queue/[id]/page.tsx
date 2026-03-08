'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Clock, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function QueueStatusPage() {
  const { id } = useParams()
  const router = useRouter()
  const [queueData, setQueueData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    async function fetchQueue() {
      setLoading(true)
      const { data, error } = await supabase
        .from('queues')
        .select('*, services(name, is_trending)')
        .eq('id', id)
        .single()

      if (error) {
        setError('Gagal memuat status antrian')
        console.error(error)
      } else {
        setQueueData(data)
      }
      setLoading(false)
    }

    fetchQueue()

    // Realtime subscription
    const channel = supabase
      .channel('queues-changes')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'queues', filter: `id=eq.${id}` },
        (payload) => {
          setQueueData(payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  const handleCancel = async () => {
    if (!confirm('Yakin ingin membatalkan antrian?')) return

    setLoading(true)
    const { error } = await supabase
      .from('queues')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (error) {
      setError('Gagal membatalkan antrian')
    } else {
      router.push('/')
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Memuat status antrian...</p>
      </div>
    )
  }

  if (error || !queueData) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h1>
        <p className="text-gray-600 text-center">{error || 'Antrian tidak ditemukan'}</p>
        <Button onClick={() => router.push('/')} className="mt-6 bg-orange-600 hover:bg-orange-700">
          Kembali ke Beranda
        </Button>
      </div>
    )
  }

  const { position, estimated_wait, customer_name, services } = queueData
  const serviceName = services?.name || 'Tidak dipilih'
  const isTrending = services?.is_trending || false

  // Progress contoh (sesuaikan sesuai logika kamu)
  const progress = Math.min(100, Math.max(0, 100 - (position * 5)))

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      <div className="flex-1 max-w-md mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">Status Antrian</h1>

        <div className="flex justify-center mb-8">
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 px-4 py-1 text-lg">
            {isTrending ? 'TRENDI!' : 'Sedang Menunggu'}
          </Badge>
        </div>

        <div className="text-center mb-10">
          <p className="text-lg text-gray-600 mb-1">NOMOR ANTRIAN ANDA</p>
          <h2 className="text-6xl sm:text-7xl font-extrabold text-orange-600">
            ke-{position}
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Nama: {customer_name}
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Clock size={32} className="text-orange-600" />
            <p className="text-2xl font-bold text-orange-600">
              Estimasi {estimated_wait} menit
            </p>
          </div>
          <p className="text-gray-700">Menunggu Giliran Anda</p>
        </div>

        <div className="mb-10">
          <p className="text-gray-600 mb-2 text-center">
            Sisa {position - 1} orang lagi sebelum Anda
          </p>
          <Progress 
            value={progress} 
            className="h-4 bg-gray-200 rounded-full overflow-hidden [&>div]:bg-gradient-to-r [&>div]:from-orange-400 [&>div]:to-yellow-400"
          />
          <p className="text-sm text-gray-500 text-center mt-2">
            {progress}% menuju giliran • Update otomatis
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-10">
          <div className="flex items-center gap-3 mb-3">
            <MapPin size={24} className="text-orange-600" />
            <h3 className="font-semibold text-gray-800">The Gentlemens Club</h3>
          </div>
          <p className="text-gray-600 text-sm">
            Jalan Sudirman No. 42, Surabaya
          </p>
        </div>

        <Button
          variant="outline"
          className="w-full border-orange-600 text-orange-600 hover:bg-orange-50 h-14 text-lg font-bold rounded-xl"
          onClick={handleCancel}
          disabled={loading}
        >
          Batalkan Antrian
        </Button>
      </div>
    </div>
  )
}