'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export default function JoinPage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchServices() {
      setLoading(true)
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name')

      if (error) setError('Gagal memuat model rambut')
      else setServices(data || [])
      setLoading(false)
    }
    fetchServices()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreeTerms) {
      setError('Setujui syarat terlebih dahulu')
      return
    }

    setLoading(true)
    setError(null)

    const todayStart = new Date().toISOString().split('T')[0]
    const { data: maxPos } = await supabase
      .from('queues')
      .select('position')
      .gte('created_at', todayStart)
      .order('position', { ascending: false })
      .limit(1)

    const position = (maxPos?.[0]?.position || 0) + 1

    const selected = services.find(s => s.id === serviceId)
    const estimated = position * (selected?.duration || 30)

    const { data, error: insertError } = await supabase
      .from('queues')
      .insert({
        id: uuidv4(),
        customer_name: name.trim(),
        phone: phone.trim(),
        service_id: serviceId || null,
        position,
        status: 'waiting',
        estimated_wait: estimated,
      })
      .select('id')
      .single()

    if (insertError) {
      setError('Gagal masuk antrian: ' + insertError.message)
    } else if (data?.id) {
      router.push(`/queue/${data.id}`)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <div className="max-w-md mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 flex flex-col min-h-screen">
        <h1 className="text-3xl sm:text-4xl font-bold text-orange-600 mb-3 text-center">
          Join Antrian Sekarang
        </h1>
        <p className="text-gray-600 text-center mb-8 sm:mb-10 text-base">
          Masukkan data Anda untuk mendapatkan nomor antrian
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-8 flex items-center gap-3">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {loading && services.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">Memuat...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 flex-1">
            <div>
              <Label className="text-gray-700 font-medium mb-2 block text-base">Nama Lengkap</Label>
              <Input placeholder="Contoh: Budi Santos" value={name} onChange={(e) => setName(e.target.value)} required className="h-12 sm:h-14 text-base rounded-xl" />
            </div>

            <div>
              <Label className="text-gray-700 font-medium mb-2 block text-base">Nomor HP / WhatsApp</Label>
              <Input type="tel" placeholder="0812xxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} required className="h-12 sm:h-14 text-base rounded-xl" />
            </div>

            <div>
              <Label className="text-gray-700 font-medium mb-2 block text-base">Jenis Potongan Rambut</Label>
              <Select value={serviceId} onValueChange={setServiceId} required>
                <SelectTrigger className="h-12 sm:h-14 text-base rounded-xl">
                  <SelectValue placeholder="Pilih model rambut" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} {s.is_trending && <span className="text-yellow-600 font-medium ml-1">(Trend)</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl text-sm text-gray-600">
              <p className="font-medium mb-2">Estimasi waktu tunggu saat ini sekitar 25 menit.</p>
              <p>Anda akan menerima notifikasi WhatsApp saat giliran Anda mendekat.</p>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox id="terms" checked={agreeTerms} onCheckedChange={(checked) => setAgreeTerms(!!checked)} className="mt-1 h-5 w-5 border-orange-500 data-[state=checked]:bg-orange-500" />
              <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
                Dengan bergabung, Anda menyetujui syarat & ketentuan kami. Kami akan mengirimkan notifikasi WhatsApp saat giliran Anda.
              </Label>
            </div>

            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white h-14 sm:h-16 text-lg sm:text-xl font-bold rounded-xl shadow-lg mt-6 sm:mt-10" disabled={loading || !agreeTerms}>
              {loading ? 'Memproses...' : 'Masuk Antrian'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}