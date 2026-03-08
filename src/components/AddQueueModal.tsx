'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '@/lib/supabase'

interface AddQueueModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function AddQueueModal({ isOpen, onClose, onSuccess }: AddQueueModalProps) {
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [haircutModel, setHaircutModel] = useState('')
    const [serviceType, setServiceType] = useState('Standar')
    const [bookingDate, setBookingDate] = useState('')
    const [bookingTime, setBookingTime] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) {
            setError('Nama pelanggan wajib diisi')
            return
        }

        if (serviceType === 'Booking') {
            if (!bookingDate || !bookingTime) {
                setError('Tanggal dan Waktu Booking wajib dipilih')
                return
            }
        }

        setLoading(true)
        setError(null)

        try {
            let finalPosition = 0
            let estimated = 0

            if (serviceType === 'Booking') {
                const { data: latestBooking } = await supabase
                    .from('queues')
                    .select('position')
                    .eq('service_type', 'Booking')
                    .eq('booking_date', bookingDate)
                    .eq('booking_time', bookingTime)
                    .order('position', { ascending: false })
                    .limit(1)

                // Cek kuota booking
                const { count } = await supabase
                    .from('queues')
                    .select('*', { count: 'exact', head: true })
                    .eq('service_type', 'Booking')
                    .eq('booking_date', bookingDate)
                    .eq('booking_time', bookingTime)

                if (count !== null && count >= 2) {
                    setError(`Slot booking ${bookingTime} pada ${bookingDate} sudah penuh (Max 2).`)
                    setLoading(false)
                    return
                }

                if (latestBooking && latestBooking.length > 0 && latestBooking[0].position != null) {
                    finalPosition = latestBooking[0].position + 1
                } else {
                    finalPosition = 1
                }
            } else {
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
                estimated = finalPosition * 30
            }

            const { error: insertError } = await supabase
                .from('queues')
                .insert({
                    id: uuidv4(),
                    customer_name: name.trim(),
                    phone: phone.trim() || '-', // default '-' if not provided
                    haircut_model: haircutModel.trim() || 'Sesuai Arahan',
                    service_type: serviceType,
                    booking_date: serviceType === 'Booking' ? bookingDate : null,
                    booking_time: serviceType === 'Booking' ? bookingTime : null,
                    position: finalPosition,
                    status: serviceType === 'Booking' ? 'booked' : 'waiting',
                    estimated_wait: estimated,
                })

            if (insertError) throw insertError

            // Kirim Notifikasi WA (Background task)
            const inputPhone = phone.trim()
            if (inputPhone && inputPhone !== '-') {
                const waMessage = `✨ Wuih, mantap ${name.trim()}!\n\nKursimu di Markas Khong udah diamankan nih via admin kami. Antrianmu nomor:\n*#${finalPosition}*\n\nLayanan: *${serviceType}*\nModel: *${haircutModel.trim() || 'Sesuai Arahan'}*\n\nPantau sisa antrianmu live dari HP di sini ya:\nhttps://markaskhong.com/queue/${uuidv4()}\n\nSiap-siap meluncur kalau giliranmu udah dekat! 🛵💨`;

                fetch('/api/whatsapp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: inputPhone, message: waMessage })
                }).catch(err => console.error("Gagal trigger WA:", err));
            }

            // Reset form
            setName('')
            setPhone('')
            setHaircutModel('')
            setServiceType('Standar')
            setBookingDate('')
            setBookingTime('')

            onSuccess()
            onClose()
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Gagal menambahkan antrian')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
                <div className="bg-orange-600 p-4">
                    <h2 className="text-xl font-bold text-white">Tambah Antrian Manual</h2>
                    <p className="text-orange-100 text-sm">Input data pelanggan walk-in</p>
                </div>

                <div className="p-6 overflow-y-auto">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    <form id="add-queue-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label className="text-gray-700 font-medium">Nama Pelanggan *</Label>
                            <Input
                                placeholder="Contoh: Budi"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label className="text-gray-700 font-medium">Nomor WhatsApp (Opsional)</Label>
                            <Input
                                type="tel"
                                placeholder="Disarankan jika ingin notif WA"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label className="text-gray-700 font-medium">Model Rambut</Label>
                            <Input
                                placeholder="Contoh: Mullet, Fade (Kosongkan jika bebas)"
                                value={haircutModel}
                                onChange={(e) => setHaircutModel(e.target.value)}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label className="text-gray-700 font-medium">Tipe Layanan</Label>
                            <select
                                value={serviceType}
                                onChange={(e) => setServiceType(e.target.value)}
                                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="Standar">Cukur TOK (15k)</option>
                                <option value="Premium">Cukur Premium (18k)</option>
                                <option value="Booking">Booking Cukur (20k)</option>
                            </select>
                        </div>

                        {serviceType === 'Booking' && (
                            <div className="p-4 bg-orange-50 rounded-xl space-y-3 border border-orange-100">
                                <div>
                                    <Label className="text-gray-700 font-medium text-sm">Pilih Tanggal Booking *</Label>
                                    <Input
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={bookingDate}
                                        onChange={(e) => setBookingDate(e.target.value)}
                                        required
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-gray-700 font-medium text-sm">Pilih Sesi Waktu *</Label>
                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                        <button
                                            type="button"
                                            onClick={() => setBookingTime('Siang')}
                                            className={`py-2 rounded-lg text-sm transition-colors border ${bookingTime === 'Siang'
                                                ? 'bg-orange-600 text-white border-orange-600'
                                                : 'bg-white text-gray-700 hover:bg-orange-50'
                                                }`}
                                        >
                                            Siang
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setBookingTime('Malam')}
                                            className={`py-2 rounded-lg text-sm transition-colors border ${bookingTime === 'Malam'
                                                ? 'bg-orange-600 text-white border-orange-600'
                                                : 'bg-white text-gray-700 hover:bg-orange-50'
                                                }`}
                                        >
                                            Malam
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                        Batal
                    </Button>
                    <Button type="submit" form="add-queue-form" className="bg-orange-600 hover:bg-orange-700 min-w-[100px]" disabled={loading}>
                        {loading ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
