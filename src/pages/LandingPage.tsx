import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">L</div>
          <span className="font-bold text-gray-800 text-lg">Lokaku</span>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="text-sm text-red-600 font-medium border border-red-600 px-4 py-1.5 rounded-lg hover:bg-red-50 transition"
        >
          Masuk
        </button>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 text-white px-6 py-16 text-center">
        <div className="max-w-lg mx-auto">
          <span className="text-xs bg-green-500 px-3 py-1 rounded-full mb-4 inline-block">
            Platform UMKM Lokal Indonesia
          </span>
          <h1 className="text-3xl font-bold mb-4 leading-tight">
            Temukan kebutuhan sekitar, sekarang!
          </h1>
          <p className="text-green-100 text-sm mb-8 leading-relaxed">
            Lokaku menghubungkan kamu dengan UMKM lokal yang sedang buka di sekitarmu secara realtime. Cepat, mudah, dan langsung terhubung.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/cari')}
              className="bg-white text-green-700 font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-green-50 transition"
            >
              🔍 Cari Toko
            </button>
            <button
              onClick={() => navigate('/login')}
              className="bg-green-500 text-white font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-green-400 transition border border-green-400"
            >
              Daftar UMKM
            </button>
          </div>
        </div>
      </div>

      {/* Fitur */}
      <div className="px-6 py-12 max-w-lg mx-auto">
        <h2 className="text-center font-bold text-gray-800 text-xl mb-8">Kenapa pakai Lokaku?</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
            <span className="text-2xl">📍</span>
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">Berbasis Lokasi Realtime</h3>
              <p className="text-xs text-gray-500 mt-1">Temukan toko yang benar-benar buka dan ada di dekatmu saat ini</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
            <span className="text-2xl">⚡</span>
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">Cepat & Langsung</h3>
              <p className="text-xs text-gray-500 mt-1">Hubungi penjual langsung via WhatsApp tanpa perantara</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
            <span className="text-2xl">🏪</span>
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">Khusus UMKM Lokal</h3>
              <p className="text-xs text-gray-500 mt-1">Dukung usaha sekitarmu, bukan marketplace nasional</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
            <span className="text-2xl">🗺️</span>
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">Lihat di Peta</h3>
              <p className="text-xs text-gray-500 mt-1">Tampilkan lokasi toko langsung di peta interaktif</p>
            </div>
          </div>
        </div>
      </div>

      {/* Untuk UMKM */}
      <div className="bg-gray-50 px-6 py-12">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="font-bold text-gray-800 text-xl mb-3">Punya UMKM? Daftarkan sekarang!</h2>
          <p className="text-sm text-gray-500 mb-6">Gratis selamanya. Mudah dikelola. Langsung ditemukan pembeli di sekitarmu.</p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">100%</p>
              <p className="text-xs text-gray-500">Gratis</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">5 menit</p>
              <p className="text-xs text-gray-500">Setup toko</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">Realtime</p>
              <p className="text-xs text-gray-500">Status buka</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl text-sm transition"
          >
            Daftar Sekarang — Gratis!
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-8 text-center border-t">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-green-600 rounded-md flex items-center justify-center text-white text-xs font-bold">L</div>
          <span className="font-bold text-gray-700">Lokaku</span>
        </div>
        <p className="text-xs text-gray-400">"Apa pun kebutuhan sekitarmu, cari di Lokaku"</p>
        <div className="flex justify-center gap-4 mt-4">
          <button onClick={() => navigate('/cari')} className="text-xs text-gray-400 hover:text-gray-600">Cari Toko</button>
          <button onClick={() => navigate('/peta')} className="text-xs text-gray-400 hover:text-gray-600">Peta</button>
          <button onClick={() => navigate('/login')} className="text-xs text-gray-400 hover:text-gray-600">Masuk</button>
        </div>
      </div>

    </div>
  )
}