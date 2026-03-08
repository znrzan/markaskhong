'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Clock, MapPin, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Swal from 'sweetalert2'

export default function QueueStatusPage() {
  const { id } = useParams()
  const router = useRouter()
  const [queueData, setQueueData] = useState<any>(null)
  const [allQueues, setAllQueues] = useState<any[]>([]) // untuk hitung posisi real
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    async function fetchData() {
      setLoading(true)

      // Fetch data antrian user ini
      const { data: userQueue, error: userError } = await supabase
        .from('queues')
        .select('*, services(name, is_trending)')
        .eq('id', id)
        .single()

      if (userError) {
        setError('Antrian tidak ditemukan')
        setLoading(false)
        return
      }

      setQueueData(userQueue)

      // Fetch semua antrian aktif hari ini untuk hitung posisi real (Hanya untuk tipe non-booking)
      if (userQueue.service_type !== 'Booking') {
        const today = new Date().toISOString().split('T')[0]
        const { data: allActive } = await supabase
          .from('queues')
          .select('id, position, status')
          .gte('created_at', today)
          .neq('service_type', 'Booking')
          .neq('status', 'done') // hanya yang belum selesai
          .order('position', { ascending: true })

        setAllQueues(allActive || [])
      } else {
        // Untuk Booking, kita bisa ambil semua antrian booking di slot waktu yang sama yang belum selesai
        const { data: allActiveBooking } = await supabase
          .from('queues')
          .select('id, position, status')
          .eq('service_type', 'Booking')
          .eq('booking_date', userQueue.booking_date)
          .eq('booking_time', userQueue.booking_time)
          .neq('status', 'done')
          .order('position', { ascending: true })

        setAllQueues(allActiveBooking || [])
      }

      setLoading(false)
    }

    fetchData()

    // Realtime: update kalau ada perubahan di queues
    const channel = supabase
      .channel('queue-status')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queues' }, () => {
        fetchData() // refresh semua data
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  const handleCancel = async () => {
    const result = await Swal.fire({
      title: 'Batalin ngantri?',
      text: "Sayang banget lho, seriusan mau batalin antrianmu?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F97316',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Iya, Batalin',
      cancelButtonText: 'Berubah pikiran',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    setLoading(true);

    try {
      await supabase
        .from('queues')
        .update({ status: 'cancelled' })
        .eq('id', id);

      // Kirim Notifikasi WA Batal (Background task)
      if (queueData?.phone && queueData.phone !== '-') {
        const waMessage = `Yah, sayang banget ${queueData.customer_name}, antrianmu di Markas Khong barusan dibatalin 😔.\n\nKapan-kapan mampir lagi ya kalau udah senggang! ✂️🛵`;
        fetch('/api/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: queueData.phone, message: waMessage })
        }).catch(err => console.error("Gagal trigger WA Cancel:", err));
      }

      await Swal.fire({
        title: 'Dibatalkan!',
        text: 'Antrian lu udah berhasil dibatalin.',
        icon: 'success',
        confirmButtonColor: '#F97316'
      });

      router.push('/');
    } catch (err) {
      console.error(err);
      Swal.fire('Oops!', 'Gagal membatalkan antrian.', 'error');
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Memuat...</div>
  }

  if (error || !queueData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Oops!</h1>
        <p className="text-gray-600 text-center">{error || 'Antrian tidak ditemukan'}</p>
        <Button onClick={() => router.push('/')} className="mt-6 bg-orange-600">
          Kembali
        </Button>
      </div>
    )
  }

  // Kondisi utama: kalau sudah selesai, tampilkan pesan terima kasih
  if (queueData.status === 'done') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 overflow-x-hidden">
        <CheckCircle2 size={80} className="text-green-500 mb-6" />
        <h1 className="text-3xl sm:text-4xl font-bold text-green-600 mb-4 text-center tracking-tight">
          Yeay, Beres Bosku!
        </h1>
        <p className="text-lg text-gray-700 text-center mb-8 max-w-md font-medium">
          Rambut udah rapi maksimal nih. Semoga suka sama hasil potongannya ya! 😎✂️
        </p>
        <p className="text-gray-500 text-center mb-10">
          Ditunggu kedatangannya lagi di Markas Khong.
        </p>

        <Button onClick={() => router.push('/')} className="bg-orange-600 hover:bg-orange-700 h-12 w-full max-w-xs font-bold text-lg rounded-xl">
          Balik ke Detail Home
        </Button>
      </div>
    )
  }

  // Kalau belum selesai, tampilkan status normal
  // Hitung posisi real dari semua antrian aktif (yang tipe-nya sesuai/sejenis)
  const activeQueues = allQueues.filter(q => q.status !== 'done')
  const currentPosition = activeQueues.findIndex(q => q.id === id) + 1

  // Jika karena suatu alasan findIndex -1, fallback ke position asli
  const displayPosition = currentPosition > 0 ? currentPosition : queueData.position

  const estimated = (displayPosition - 1) * 30 // rata-rata 30 menit per orang yg ngantri di depannya

  const progress = Math.min(100, 100 - ((displayPosition - 1) * 10)) // contoh

  // Info tambahan untuk booking
  const isBooking = queueData.service_type === 'Booking'
  const bookingDateFormatted = isBooking && queueData.booking_date
    ? new Date(queueData.booking_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : ''

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      <div className="flex-1 max-w-md mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-2xl font-extrabold text-gray-800 mb-2 text-center tracking-tight">Posisimu Sekarang</h1>

        <div className="flex justify-center mb-8">
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 px-4 py-1 text-lg font-bold">
            Lagi Nunggu Giliran ⏳
          </Badge>
        </div>

        {isBooking && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-blue-800 font-semibold mb-1">Jadwal Booking Anda:</p>
            <p className="text-blue-900 font-bold">{bookingDateFormatted}</p>
            <p className="text-blue-700">Sesi: {queueData.booking_time}</p>
          </div>
        )}

        <div className="text-center mb-10">
          <p className="text-lg text-gray-500 mb-1 font-bold tracking-widest text-[11px] uppercase">NOMOR PANGGILANMU</p>
          <h2 className="text-6xl sm:text-7xl font-extrabold text-orange-600 tracking-tighter">
            #{queueData.position}
          </h2>
          <p className="text-sm font-medium text-gray-500 mt-2">
            Atas nama: <span className="text-gray-800 font-bold">{queueData.customer_name}</span>
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-8 text-center shadow-inner">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Clock size={32} className="text-orange-600" />
            <p className="text-2xl font-extrabold text-orange-600 tracking-tight">
              {isBooking ? 'Sesuai Sesi' : (displayPosition === 1 ? 'Giliranmu sebentar lagi!' : `Kira-kira ${estimated} menit lagi`)}
            </p>
          </div>
          <p className="text-gray-600 font-medium">Santai, bentar lagi giliranmu dicukur kok ☕</p>
        </div>

        <div className="mb-10">
          <p className="text-gray-600 mb-3 text-center font-bold">
            Sabar ya, tinggal <span className="text-orange-600">{displayPosition - 1} orang</span> lagi di depanmu!
          </p>
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            <Progress
              value={progress}
              className="h-4"
              indicatorClassName="bg-gradient-to-r from-orange-400 to-yellow-400"
            />
          </div>
          <p className="text-sm font-bold text-gray-500 text-center mt-3">
            {progress}% lagi menuju giliranmu • Live Update ⚡
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-10">
          <div className="flex items-center gap-3 mb-3">
            <MapPin size={24} className="text-orange-600" />
            <h3 className="font-semibold text-gray-800">Markas Khong</h3>
          </div>
          <p className="text-gray-600 text-sm">
            Jl. Desa Penatarsewu, Penatarasewu, Penatarsewu, Kec. Tanggulangin, Kabupaten Sidoarjo, Jawa Timur 61272
          </p>
        </div>

        <Button
          variant="outline"
          className="w-full border-red-500 text-red-600 hover:bg-red-50 h-14 text-lg font-bold rounded-xl"
          onClick={handleCancel}
          disabled={loading}
        >
          Batalin Antrian Dong
        </Button>
      </div>
    </div>
  )
}