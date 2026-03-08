import { QRCodeSVG} from 'qrcode.react'

export default function Home() {
  const joinUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/join`

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl md:text-5xl font-bold text-orange-600 mb-10 text-center">
        Scan untuk Join Antrian
      </h1>

      <div className="p-6 bg-white border-4 border-orange-500 rounded-2xl shadow-xl mb-8">
        <QRCodeSVG
          value={joinUrl}
          size={280}
          fgColor="#F97316"
          level="H"
        />
      </div>

      <p className="text-lg text-gray-700 text-center mb-4">
        Cukur tanpa nunggu lama – pantau dari HP Anda
      </p>

      <p className="text-sm text-gray-500 text-center">
        Tunjukkan QR ini ke kasir setelah scan
      </p>
    </div>
  )
}