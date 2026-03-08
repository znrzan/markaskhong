import { QRCodeSVG } from 'qrcode.react'

export default function Home() {
  const joinUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/join`

  return (
    <div className="flex-1 bg-white flex flex-col items-center justify-center px-6 py-12 overflow-x-hidden">
      <h1 className="text-4xl sm:text-5xl font-bold text-orange-600 mb-10 text-center">
        Scan untuk Join Antrian
      </h1>

      <div className="p-6 bg-white border-4 border-orange-500 rounded-2xl shadow-xl max-w-xs w-full">
        <QRCodeSVG
          value={joinUrl}
          size={280}
          fgColor="#F97316"
          level="H"
          className="w-full h-auto"
        />
      </div>

      <p className="mt-8 text-lg sm:text-xl text-gray-700 text-center">
        Cukur tanpa nunggu lama – pantau dari HP Anda
      </p>
    </div>
  )
}