'use client'

import { QRCodeCanvas } from 'qrcode.react'
import { Download } from 'lucide-react'

export default function Home() {
  const joinUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/join`

  const handleDownload = () => {
    const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement
    if (!canvas) return
    const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream')
    const downloadLink = document.createElement('a')
    downloadLink.href = pngUrl
    downloadLink.download = 'QR_MarkasKhong.png'
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  return (
    <div className="flex-1 bg-white flex flex-col items-center justify-center px-6 py-12 overflow-x-hidden">
      <h1 className="text-4xl sm:text-5xl font-black text-orange-600 mb-8 text-center tracking-tight">
        Scan yuk, antri dari mana aja!
      </h1>

      <div className="p-5 bg-white border-[3px] border-orange-500 rounded-3xl shadow-xl max-w-xs w-full flex flex-col items-center">
        <QRCodeCanvas
          id="qr-code-canvas"
          value={joinUrl}
          size={280}
          fgColor="#F97316"
          level="H"
          className="w-full h-auto mb-4"
        />
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-700 px-4 py-2 rounded-xl font-bold transition-colors w-full justify-center"
        >
          <Download size={18} /> Simpan QR
        </button>
      </div>

      <p className="mt-8 text-lg sm:text-lg text-gray-600 font-medium text-center px-4">
        Nggak perlu nunggu berjam-jam di lokasi. <br /> Pantau giliran santai dari HP-mu 📱✨
      </p>
    </div>
  )
}