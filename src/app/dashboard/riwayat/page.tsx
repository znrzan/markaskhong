'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Users, Calendar, ArrowLeft, Scissors, Crown, CalendarClock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export default function RiwayatPage() {
    const [queues, setQueues] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])
    const [stats, setStats] = useState({ total: 0, tok: 0, premium: 0, booking: 0 })

    useEffect(() => {
        async function fetchHistory() {
            setLoading(true)

            const startDate = `${dateFilter}T00:00:00.000Z`
            const endDate = `${dateFilter}T23:59:59.999Z`

            // Ambil data yang statusnya 'done' (bisa ditambah 'cancelled' jika perlu riwayat batal)
            const { data, error } = await supabase
                .from('queues')
                .select('*, services(name)')
                .gte('created_at', startDate)
                .lte('created_at', endDate)
                .eq('status', 'done')
                .order('updated_at', { ascending: false })

            if (!error && data) {
                setQueues(data)

                // Hitung statistik harian
                const total = data.length
                const tok = data.filter(q => q.service_type?.includes('TOK')).length ||
                    data.filter(q => q.services?.name?.includes('TOK')).length
                const premium = data.filter(q => q.service_type?.includes('Premium')).length ||
                    data.filter(q => q.services?.name?.includes('Premium')).length
                const booking = data.filter(q => q.service_type === 'Booking').length

                setStats({ total, tok, premium, booking })
            } else {
                setQueues([])
                setStats({ total: 0, tok: 0, premium: 0, booking: 0 })
            }

            setLoading(false)
        }

        fetchHistory()
    }, [dateFilter])

    return (
        <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
            <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">

                {/* Header Section */}
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="outline" size="icon" asChild className="rounded-full">
                        <Link href="/dashboard">
                            <ArrowLeft size={20} />
                        </Link>
                    </Button>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                        Riwayat & Laporan
                    </h1>
                </div>

                {/* Filter Section */}
                <Card className="mb-6 bg-gray-50 border-gray-200">
                    <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <Calendar className="text-gray-500" />
                            <p className="font-semibold text-gray-700 min-w-[120px]">Pilih Tanggal:</p>
                        </div>
                        <Input
                            type="date"
                            value={dateFilter}
                            max={new Date().toISOString().split('T')[0]} // tidak bisa masa depan
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="bg-white"
                        />
                    </CardContent>
                </Card>

                {/* Stats Section */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
                    <Card className="bg-orange-50 border-orange-200">
                        <CardContent className="p-4 text-center">
                            <Users className="mx-auto mb-2 text-orange-600" size={28} />
                            <p className="text-xs sm:text-sm text-orange-700 font-medium">Total Selesai</p>
                            <p className="text-2xl sm:text-3xl font-bold text-orange-600">{stats.total}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4 text-center">
                            <Scissors className="mx-auto mb-2 text-blue-600" size={28} />
                            <p className="text-xs sm:text-sm text-blue-700 font-medium">Cukur TOK</p>
                            <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.tok}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-yellow-50 border-yellow-200">
                        <CardContent className="p-4 text-center">
                            <Crown className="mx-auto mb-2 text-yellow-600" size={28} />
                            <p className="text-xs sm:text-sm text-yellow-700 font-medium">Premium</p>
                            <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.premium}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-purple-50 border-purple-200">
                        <CardContent className="p-4 text-center">
                            <CalendarClock className="mx-auto mb-2 text-purple-600" size={28} />
                            <p className="text-xs sm:text-sm text-purple-700 font-medium">Booking</p>
                            <p className="text-2xl sm:text-3xl font-bold text-purple-600">{stats.booking}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Table/List Section */}
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Detail Pelanggan Selesai</h2>

                {loading ? (
                    <div className="text-center py-20 text-gray-500">Memuat data riwayat...</div>
                ) : queues.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center">
                        <Calendar className="text-gray-300 mb-3" size={48} />
                        <p className="text-gray-500 font-medium">Tidak ada riwayat cukur selesai pada tanggal ini.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {queues.map(q => {
                            // Format jam selesai (dari updated_at)
                            const timeCompleted = new Date(q.updated_at).toLocaleTimeString('id-ID', {
                                hour: '2-digit', minute: '2-digit'
                            })

                            return (
                                <Card key={q.id} className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                                    <CardContent className="p-4 sm:p-5">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-bold text-gray-800">
                                                        #{q.position} - {q.customer_name}
                                                    </h3>
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                        Selesai {timeCompleted}
                                                    </Badge>
                                                </div>

                                                <div className="text-sm text-gray-600 flex flex-col sm:flex-row sm:gap-4">
                                                    <p><span className="font-semibold text-gray-700">Layanan:</span> {q.service_type || q.services?.name || 'Standar'}</p>
                                                    <p className="hidden sm:block">•</p>
                                                    <p><span className="font-semibold text-gray-700">Model:</span> {q.haircut_model || 'Bebas'}</p>
                                                </div>
                                                {q.phone && q.phone !== '-' && (
                                                    <p className="text-sm text-gray-500 mt-1">📞 {q.phone}</p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}

            </div>
        </div>
    )
}
