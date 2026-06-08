import { useNavigate } from 'react-router-dom'
import TombolInstalPWA from '../components/TombolInstalPWA'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
              L
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-800">Lokaku</span>
          </div>
          <button 
            onClick={() => navigate('/login')} 
            className="text-sm font-semibold text-gray-600 hover:text-green-600 transition-colors"
          >
            Masuk
          </button>
        </div>

        {/* Hero Section */}
        <div className="px-6 py-12 text-center max-w-md mx-auto">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Radar Kebutuhan <span className="text-green-600">Sekitarmu</span>
          </h1>
          <p className="text-gray-500 text-base mb-8 leading-relaxed">
            Temukan UMKM, toko kelontong, dan penyedia jasa terdekat yang benar-benar aktif dan buka secara realtime di sekitarmu saat ini.
          </p>

          {/* 🚀 TOMBOL INSTAL PWA & SHARE DI SINI */}
          <TombolInstalPWA />

          {/* Main Action Buttons */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <button
              onClick={() => navigate('/cari')}
              className="flex flex-col items-center justify-center p-5 bg-gray-50 hover:bg-green-50 border border-gray-100 hover:border-green-200 rounded-2xl shadow-sm transition-all group"
            >
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">🔍</span>
              <span className="font-bold text-sm text-gray-800 group-hover:text-green-700">Cari Toko & Jasa</span>
            </button>

            <button
              onClick={() => navigate('/peta')}
              className="flex flex-col items-center justify-center p-5 bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-2xl shadow-sm transition-all group"
            >
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">🗺️</span>
              <span className="font-bold text-sm text-gray-800 group-hover:text-blue-700">Lihat Peta Sekitar</span>
            </button>
          </div>
        </div>

        {/* Info Section / Keunggulan */}
        <div className="bg-gray-50 px-6 py-10 border-t border-b border-gray-100">
          <div className="max-w-md mx-auto space-y-6">
            <div className="flex gap-4 items-start">
              <span className="text-2xl p-2 bg-white rounded-xl shadow-sm">🏪</span>
              <div>
                <h3 className="font-bold text-gray-800 text-sm">Fokus Hyperlocal</h3>
                <p className="text-gray-500 text-xs mt-1">Hanya menampilkan apa yang tersedia dan benar-benar buka di dekat lokasi Anda saat ini.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <span className="text-2xl p-2 bg-white rounded-xl shadow-sm">🛠️</span>
              <div>
                <h3 className="font-bold text-gray-800 text-sm">Mendukung Penyedia Jasa</h3>
                <p className="text-gray-500 text-xs mt-1">Tidak hanya toko fisik, asisten harian hingga jasa teknis panggilan bisa ditemukan dengan mudah.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer & Hubungkan Mitra */}
      <div className="p-6 text-center max-w-md mx-auto w-full">
        <p className="text-xs text-gray-400 mb-3">Punya usaha dagang atau layanan jasa?</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-xs font-bold text-green-600 hover:text-green-700 underline tracking-wide"
        >
          Daftarkan Usaha Anda ke Lokaku Sekarang →
        </button>
      </div>
    </div>
  )
}