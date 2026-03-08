'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, User, Plus, CheckCircle2, Volume2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import AddQueueModal from '@/components/AddQueueModal'

export default function FullAntreanPage() {
  const [queues, setQueues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

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

    // Find customer data to send WA
    const customer = queues.find(q => q.id === id)
    if (customer && customer.phone && customer.phone !== '-') {
      const waMessage = `Hai ${customer.customer_name}, giliranmu cukur sekarang nih!\n\nYuk, langsung stand-by di kursi Barbershop Markas Khong ya. Ditungguin nih sama Barber-nya!`;
      fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: customer.phone, message: waMessage })
      }).catch(err => console.error("Gagal trigger WA Panggil:", err));
    }
  }

  const handleSelesai = async (id: string) => {
    await supabase.from('queues').update({ status: 'done' }).eq('id', id)

    // Kirim WA Terima Kasih
    const customer = queues.find(q => q.id === id)
    if (customer && customer.phone && customer.phone !== '-') {
      const waMessage = `Yeay, Beres Bosku! 🎉\n\nRambut ${customer.customer_name} udah rapi maksimal nih. Semoga suka sama hasil potongannya ya! 😎✂️\n\nDitunggu kedatangannya lagi di Markas Khong!\n\nKasih tau temen-temen tongkrongan buat potong di mari ya`;
      fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: customer.phone, message: waMessage })
      }).catch(err => console.error("Gagal trigger WA Selesai:", err));
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden pb-24">
      {/* Header Mirip App */}
      <div className="pt-6 px-6 pb-4 flex justify-between items-center bg-white sticky top-0 z-30 shadow-sm border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="text-orange-500 font-bold text-xl"><Volume2 size={24} className="inline-block" style={{ transform: 'rotate(-45deg)' }} /></div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Dashboard Staff</h1>
        </div>
        <div className="flex gap-3">
          <button className="w-10 h-10 rounded-full border border-orange-200 text-orange-500 flex items-center justify-center bg-orange-50 hover:bg-orange-100 transition-colors">
            <Bell size={20} />
          </button>
          <button className="w-10 h-10 rounded-full border border-orange-200 text-gray-500 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <User size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-5 py-6">
        <h2 className="text-3xl font-extrabold text-orange-500 mb-6 drop-shadow-sm">
          Antrian Hari Ini
        </h2>

        {/* Stats Top Row */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-[#FFF8D6] rounded-xl p-3 border border-[#FDEEB3]">
            <p className="text-[10px] font-bold text-gray-600 tracking-wider mb-1">LAGI NUNGGU</p>
            <p className="text-2xl font-black text-gray-900">{queues.filter(q => q.status === 'waiting' || q.status === 'booked').length}</p>
          </div>
          <div className="bg-[#FFF8D6] rounded-xl p-3 border border-[#FDEEB3]">
            <p className="text-[10px] font-bold text-gray-600 tracking-wider mb-1">UDAH BERES</p>
            <p className="text-2xl font-black text-gray-900">{queues.filter(q => q.status === 'done').length}</p>
          </div>
          <div className="bg-[#FFF8D6] rounded-xl p-3 border border-[#FDEEB3]">
            <p className="text-[10px] font-bold text-gray-600 tracking-wider mb-1">RATA-RATA</p>
            <p className="text-2xl font-black text-gray-900 leading-none">28 <span className="text-lg font-bold">mnt</span></p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500 font-medium">Bentar, lagi muat data...</div>
        ) : error ? (
          <div className="text-center py-20 text-red-600 font-medium">Yah, error nih: {error}</div>
        ) : queues.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-gray-500 font-medium">Belum ada antrian yang masuk nih hari ini 😴</p>
          </div>
        ) : (
          <div className="space-y-4">
            {queues.map(q => {
              const isServing = q.status === 'serving'
              const isWaiting = q.status === 'waiting' || q.status === 'booked'
              const isDone = q.status === 'done'

              // Formatted digit (e.g., #05)
              const formattedPos = q.position.toString().padStart(2, '0')

              const isTrending = q.services?.is_trending || q.service_type === 'Premium'

              return (
                <div
                  key={q.id}
                  className={cn(
                    "rounded-[20px] bg-white border-2 p-4 transition-all hover:shadow-md",
                    isServing ? "border-orange-500 shadow-sm" :
                      isWaiting ? "border-gray-100 shadow-sm" :
                        "border-gray-100 opacity-80"
                  )}
                >
                  <div className="flex justify-between items-start mb-4 gap-3">
                    <div className="flex gap-4 items-center min-w-0 flex-1">
                      <h3 className={cn(
                        "text-3xl sm:text-4xl font-black tracking-tight shrink-0",
                        isServing ? "text-orange-500" :
                          isWaiting ? "text-orange-300" :
                            "text-gray-300"
                      )}>
                        #{formattedPos}
                      </h3>
                      <div className="min-w-0 flex-1">
                        <h4 className={cn(
                          "font-extrabold text-[15px] sm:text-[17px] leading-tight mb-1 truncate block",
                          isDone ? "text-gray-500" : "text-gray-900"
                        )}>
                          {q.customer_name}
                        </h4>
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap sm:flex-nowrap">
                          <p className="text-[11px] sm:text-[13px] text-gray-500 font-medium truncate">
                            {q.haircut_model || q.service_type || 'Classic Taper'}
                          </p>
                          {isTrending && !isDone && (
                            <Badge className="bg-[#FDEEB3] hover:bg-[#FDEEB3] text-yellow-800 text-[8px] sm:text-[9px] font-black tracking-wider px-1.5 py-0 rounded uppercase shrink-0">
                              Trend!
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <Badge className={cn(
                      "text-[8px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0",
                      isServing ? "bg-orange-500 hover:bg-orange-600 text-white" :
                        isWaiting ? "bg-yellow-400 hover:bg-yellow-500 text-yellow-900" :
                          "bg-[#68D391] hover:bg-[#68D391] text-white"
                    )}>
                      {isServing ? 'Lagi Dicukur' : isWaiting ? 'Lagi Nunggu' : 'Beres'}
                    </Badge>
                  </div>

                  {/* Actions Area */}
                  <div className="flex gap-3">
                    {/* "Panggilan" Button */}
                    <button
                      onClick={() => !isDone && handlePanggil(q.id)}
                      disabled={isDone || isServing}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all",
                        isDone ? "bg-gray-200 text-gray-400 cursor-not-allowed" :
                          isServing ? "bg-orange-500 text-white" :
                            "bg-[#F46B23] hover:bg-orange-600 text-white shadow-sm"
                      )}
                    >
                      <Volume2 size={16} /> Panggil
                    </button>

                    {/* "Selesai" Button */}
                    <button
                      onClick={() => !isDone && handleSelesai(q.id)}
                      disabled={isDone}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all",
                        isDone ? "bg-gray-200 text-gray-400 cursor-not-allowed" :
                          isServing ? "bg-yellow-400 hover:bg-yellow-500 text-yellow-900 shadow-sm" :
                            "bg-yellow-400 hover:bg-yellow-500 text-yellow-900 shadow-sm"
                      )}
                    >
                      <CheckCircle2 size={16} /> Selesai
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Floating Action Button untuk Tambah Manual */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="fixed bottom-28 right-6 sm:bottom-10 sm:right-10 w-14 h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-105 z-40"
          aria-label="Tambah Antrian Manual"
        >
          <Plus size={28} />
        </button>

        <AddQueueModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => { }} // Supabase realtime otomatis refresh data
        />
      </div>
    </div>
  )
}