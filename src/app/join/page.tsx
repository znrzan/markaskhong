'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export default function JoinPage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [haircutModel, setHaircutModel] = useState('') // ← text input untuk model rambut
  const [serviceType, setServiceType] = useState('Premium') // State untuk pilihan harga
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const router = useRouter()


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !phone.trim()) {
      setError('Nama dan Nomor HP wajib diisi')
      return
    }

    if (!haircutModel.trim()) {
      setError('Model rambut wajib diisi')
      return
    }

    if (!agreeTerms) {
      setError('Setujui syarat & ketentuan terlebih dahulu')
      return
    }

    if (serviceType === 'Booking') {
      if (!bookingDate) {
        setError('Tanggal booking wajib dipilih')
        return
      }
      if (!bookingTime) {
        setError('Waktu booking wajib dipilih')
        return
      }
    }

    setLoading(true)
    setError(null)
    setInfoMessage(null)

    if (serviceType === 'Booking') {
      try {
        // Cek ketersediaan slot untuk tanggal dan waktu yang dipilih
        const { count, error: countError } = await supabase
          .from('queues')
          .select('*', { count: 'exact', head: true })
          .eq('service_type', 'Booking')
          .eq('booking_date', bookingDate)
          .eq('booking_time', bookingTime)

        if (countError) throw countError

        // Maksimal 2 slot per waktu (siang / malam)
        if (count !== null && count >= 2) {
          setError(`Slot booking untuk tanggal ${bookingDate} waktu ${bookingTime} sudah penuh. Silakan pilih tanggal atau waktu lain.`)

          // Cari slot kosong di hari yang sama
          const alternateTime = bookingTime === 'Siang' ? 'Malam' : 'Siang'
          const { count: altCount } = await supabase
            .from('queues')
            .select('*', { count: 'exact', head: true })
            .eq('service_type', 'Booking')
            .eq('booking_date', bookingDate)
            .eq('booking_time', alternateTime)

          if (altCount !== null && altCount < 2) {
            setInfoMessage(`💡 Rekomendasi: Slot ${alternateTime} pada tanggal yang sama masih tersedia.`)
          } else {
            setInfoMessage(`💡 Info: Semua slot (Siang & Malam) untuk tanggal ${bookingDate} sudah penuh. Silakan pilih tanggal lain.`)
          }

          setLoading(false)
          return
        }
      } catch (err) {
        console.error("Error checking availability:", err)
        setError("Gagal memeriksa ketersediaan slot. Silakan coba lagi.")
        setLoading(false)
        return
      }
    }

    // Logika perhitungan posisi antrian
    let finalPosition = 0
    let estimated = 0

    if (serviceType === 'Booking') {
      // Ambil slot terakhir untuk tanggal & waktu yang dipilih
      const { data: latestBooking } = await supabase
        .from('queues')
        .select('position')
        .eq('service_type', 'Booking')
        .eq('booking_date', bookingDate)
        .eq('booking_time', bookingTime)
        .order('position', { ascending: false })
        .limit(1)

      // Fallback robust untuk memastikan jika kosong kembalinya 1
      if (latestBooking && latestBooking.length > 0 && latestBooking[0].position != null) {
        finalPosition = latestBooking[0].position + 1
      } else {
        finalPosition = 1
      }
      estimated = 0 // Estiamsi untuk booking diset 0
    } else {
      // Hanya hitung urutan dari orang yang reguler (bukan Booking)
      const todayStart = new Date().toISOString().split('T')[0]
      const { data: maxPosData } = await supabase
        .from('queues')
        .select('position')
        .gte('created_at', todayStart)
        .neq('service_type', 'Booking')
        .order('position', { ascending: false })
        .limit(1)

      if (maxPosData && maxPosData.length > 0 && maxPosData[0].position != null) {
        finalPosition = maxPosData[0].position + 1
      } else {
        finalPosition = 1
      }

      // Estimasi sederhana (misal rata-rata 30 menit per orang)
      estimated = finalPosition * 30
    }

    // Insert ke queues (haircut_model jadi text biasa)
    const { data, error: insertError } = await supabase
      .from('queues')
      .insert({
        id: uuidv4(),
        customer_name: name.trim(),
        phone: phone.trim(),
        haircut_model: haircutModel.trim(), // ← simpan sebagai text
        service_type: serviceType, // ← simpan tipe layanan yang dipilih
        booking_date: serviceType === 'Booking' ? bookingDate : null,
        booking_time: serviceType === 'Booking' ? bookingTime : null,
        position: finalPosition,
        status: serviceType === 'Booking' ? 'booked' : 'waiting',
        estimated_wait: estimated,
      })
      .select('id')
      .single()

    if (insertError) {
      setError('Gagal masuk antrian: ' + insertError.message)
      console.error(insertError)
    } else if (data?.id) {
      // Kirim Notifikasi WA (Background task)
      if (phone.trim()) {
        const waMessage = `✨ Wuih, mantap ${name.trim()}!\n\nKursimu di Markas Khong udah diamankan nih. Antrianmu nomor:\n*#${finalPosition}*\n\nLayanan: *${serviceType}*\nModel: *${haircutModel || 'Sesuai Arahan'}*\n\nBiar nggak bosan nunggu di tempat, pantau sisa antrianmu live dari HP di sini ya:\nhttps://markaskhong.com/queue/${data.id}\n\nSiap-siap meluncur kalau giliranmu udah dekat! 🛵💨`;

        // Sengaja tidak di-await agar tidak slowing down UI redirect
        fetch('/api/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: phone.trim(), message: waMessage })
        }).catch(err => console.error("Gagal trigger WA:", err));
      }

      router.push(`/queue/${data.id}`)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      <div className="flex-1 max-w-md mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-orange-600 mb-3 text-center tracking-tight">
          Daftar Antrian Yuk!
        </h1>
        <p className="text-gray-600 text-center mb-6 text-base font-medium">
          Pilih layanan & isi data kamu buat amankan kursi potongnya ✂️
        </p>

        {/* Pilihan Layanan */}
        <div className="mb-10">
          <Label className="text-gray-700 font-bold mb-3 block text-base">Pilih Layanan Dulu Nih</Label>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setServiceType('Booking')}
              className={`w-full text-left transition-all p-4 rounded-xl shadow-sm flex justify-between items-center ${serviceType === 'Booking'
                ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white ring-2 ring-orange-600 ring-offset-2'
                : 'bg-white border-2 border-gray-100 hover:border-orange-300'
                }`}
            >
              <div>
                <h3 className={`font-bold text-lg ${serviceType === 'Booking' ? 'text-white' : 'text-gray-800'}`}>
                  Booking Cukur
                </h3>
                <p className={`text-sm mt-0.5 ${serviceType === 'Booking' ? 'text-orange-100' : 'text-gray-500'}`}>
                  Hanya 4 slot (2 siang, 2 malam)
                </p>
              </div>
              <div className={`font-bold text-xl px-3 py-1 rounded-lg ${serviceType === 'Booking' ? 'bg-white/20' : 'text-orange-600 bg-orange-50'
                }`}>20k</div>
            </button>

            <button
              type="button"
              onClick={() => setServiceType('Premium')}
              className={`w-full text-left transition-all p-4 rounded-xl shadow-sm flex justify-between items-center ${serviceType === 'Premium'
                ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white ring-2 ring-orange-600 ring-offset-2'
                : 'bg-white border-2 border-gray-100 hover:border-orange-300'
                }`}
            >
              <div>
                <h3 className={`font-bold text-lg ${serviceType === 'Premium' ? 'text-white' : 'text-gray-800'}`}>
                  Cukur Premium
                </h3>
                <p className={`text-sm mt-0.5 ${serviceType === 'Premium' ? 'text-orange-100' : 'text-gray-500'}`}>
                  Layanan cukur lengkap
                </p>
              </div>
              <div className={`font-bold text-xl px-3 py-1 rounded-lg ${serviceType === 'Premium' ? 'bg-white/20' : 'text-orange-600 bg-orange-50'
                }`}>18k</div>
            </button>

            <button
              type="button"
              onClick={() => setServiceType('Standar')}
              className={`w-full text-left transition-all p-4 rounded-xl shadow-sm flex justify-between items-center ${serviceType === 'Standar'
                ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white ring-2 ring-orange-600 ring-offset-2'
                : 'bg-white border-2 border-gray-100 hover:border-orange-300'
                }`}
            >
              <div>
                <h3 className={`font-bold text-lg ${serviceType === 'Standar' ? 'text-white' : 'text-gray-800'}`}>
                  Cukur TOK
                </h3>
                <p className={`text-sm mt-0.5 ${serviceType === 'Standar' ? 'text-orange-100' : 'text-gray-500'}`}>
                  Cukur standar
                </p>
              </div>
              <div className={`font-bold text-xl px-3 py-1 rounded-lg ${serviceType === 'Standar' ? 'bg-white/20' : 'text-orange-600 bg-orange-50'
                }`}>15k</div>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 font-medium">
            Yah, gagal masuk antrian: {error}
          </div>
        )}

        {infoMessage && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-xl mb-8 text-sm font-medium">
            {infoMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 mt-5">
          <div className="flex flex-col gap-2">
            <Label className="text-gray-700 font-bold text-base">Nama Panggilan Kamu *</Label>
            <Input
              placeholder="Biar asik masukin nama panggilan aja (Cth: Budi)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-14 border-2 border-orange-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl bg-orange-50/30 text-base shadow-sm w-full placeholder:text-gray-400"
            />
          </div>

          {/* WhatsApp Input */}
          <div className="flex flex-col gap-2 mb-5">
            <Label className="text-gray-700 font-bold text-base">Nomor WhatsApp (Opsional)</Label>
            <Input
              type="tel"
              placeholder="Masukin WA biar dapat notif pas giliranmu dekat!"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-14 border-2 border-orange-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl bg-orange-50/30 text-base shadow-sm w-full placeholder:text-gray-400"
            />
          </div>

          {/* Haircut Model */}
          <div className="flex flex-col gap-2 mb-8">
            <Label className="text-gray-700 font-bold text-base">Model Rambut (Opsional)</Label>
            <Input
              type="text"
              placeholder="Mau gaya apa nih? (Contoh: Mullet / Fade) Kosongin aja kalau bebas"
              value={haircutModel}
              onChange={(e) => setHaircutModel(e.target.value)}
              className="h-14 border-2 border-orange-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl bg-orange-50/30 text-base shadow-sm w-full placeholder:text-gray-400"
            />
          </div>

          {serviceType === 'Booking' && (
            <div className="space-y-4 p-5 bg-orange-50 border border-orange-100 rounded-xl animate-in slide-in-from-top-4 fade-in duration-300">
              <h3 className="font-semibold text-orange-800 border-b border-orange-200 pb-2">Jadwal Booking</h3>

              <div>
                <Label className="text-gray-700 font-medium mb-2 block text-sm">Pilih Tanggal</Label>
                <Input
                  type="date"
                  value={bookingDate}
                  min={new Date().toISOString().split('T')[0]} // Tidak bisa pilih hari kemarin
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="h-12 text-base rounded-xl bg-white focus:ring-orange-500 focus:border-orange-500"
                  required={serviceType === 'Booking'}
                />
              </div>

              <div>
                <Label className="text-gray-700 font-medium mb-2 block text-sm">Pilih Waktu</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBookingTime('Siang')}
                    className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${bookingTime === 'Siang'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-300'
                      }`}
                  >
                    Siang (Max 2)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingTime('Malam')}
                    className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${bookingTime === 'Malam'
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-300'
                      }`}
                  >
                    Malam (Max 2)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Container Estimasi (Sekarang masuk ke dalam flex box) */}
          <div className="bg-orange-50/50 border border-orange-200 p-5 rounded-xl text-sm text-gray-700 mt-6 mb-4">
            <p className="font-bold mb-1 text-orange-800">Kira-kira nunggu 25 menitan nih ☕</p>
            <p className="text-orange-700/80">Tenang aja, nanti dikabarin via WA kalau giliranmu udah dekat kok!</p>
          </div>

          <div className="flex items-start gap-3 mt-4">
            <Checkbox
              id="terms"
              checked={agreeTerms}
              onCheckedChange={(checked) => setAgreeTerms(!!checked)}
              className="mt-1 h-5 w-5 border-orange-500 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
            />
            <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed cursor-pointer font-medium">
              Sip, aku setuju sama aturannya. Boleh kirim notif WA pas giliranku tiba! 🤙
            </Label>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !agreeTerms}
            className="w-full h-14 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-xl text-lg font-bold shadow-lg shadow-orange-500/25 transition-all active:scale-[0.98] mt-8"
          >
            {loading ? 'Daftarin kamu...' : 'Antri Sekarang'}
          </Button>
        </form>
      </div>
    </div>
  )
}