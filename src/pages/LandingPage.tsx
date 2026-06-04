import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm">L</div>
          <span className="font-extrabold text-gray-900 text-xl">Lokaku</span>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="text-sm font-semibold text-red-600 border-2 border-red-600 px-5 py-2 rounded-xl hover:bg-red-50 transition"
        >
          Masuk
        </button>
      </div>

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 text-white px-6 py-20 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white rounded-full"></div>
        </div>
        <div className="relative max-w-lg mx-auto">
          <span className="inline-block text-xs bg-white/20 backdrop-blur px-4 py-1.5 rounded-full mb-5 font-semibold tracking-wide">
            🇮🇩 Platform UMKM Lokal Indonesia
          </span>
          <h1 className="text-4xl font-extrabold mb-4 leading-tight">
            Temukan kebutuhan sekitar, <span className="text-yellow-300">sekarang!</span>
          </h1>
          <p className="text-green-100 text-sm mb-10 leading-relaxed max-w-sm mx-auto">
            Lokaku menghubungkan kamu dengan UMKM lokal yang sedang buka di sekitarmu secara realtime.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/cari')}
              className="bg-white text-green-700 font-bold px-7 py-3 rounded-xl text-sm hover:bg-green-50 transition shadow-lg"
            >
              🔍 Cari Toko
            </button>
            <button
              onClick={() => navigate('/login')}
              className="bg-yellow-400 text-gray-900 font-bold px-7 py-3 rounded-xl text-sm hover:bg-yellow-300 transition shadow-lg"
            >
              Daftar UMKM
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-900 text-white px-6 py-8">
        <div className="max-w-lg mx-auto grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-extrabold text-yellow-400">100%</p>
            <p className="text-xs text-gray-400 mt-1">Gratis</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-yellow-400">Realtime</p>
            <p className="text-xs text-gray-400 mt-1">Status buka</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-yellow-400">5 menit</p>
            <p className="text-xs text-gray-400 mt-1">Setup toko</p>
          </div>
        </div>
      </div>

      {/* Fitur */}
      <div className="px-6 py-14 max-w-lg mx-auto">
        <h2 className="text-center font-extrabold text-gray-900 text-2xl mb-2">Kenapa pakai Lokaku?</h2>
        <p className="text-center text-gray-400 text-sm mb-8">Bukan marketplace biasa — ini radar kebutuhan sekitarmu</p>
        <div className="space-y-4">
          {[
            { icon: '📍', title: 'Berbasis Lokasi Realtime', desc: 'Temukan toko yang benar-benar buka dan ada di dekatmu saat ini' },
            { icon: '⚡', title: 'Cepat & Langsung', desc: 'Hubungi penjual langsung via WhatsApp tanpa perantara' },
            { icon: '🏪', title: 'Khusus UMKM Lokal', desc: 'Dukung usaha sekitarmu, bukan marketplace nasional' },
            { icon: '🗺️', title: 'Lihat di Peta', desc: 'Tampilkan lokasi toko langsung di peta interaktif' },
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-3xl">{f.icon}</span>
              <div>
                <h3 className="font-bold text-gray-800 text-sm">{f.title}</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-br from-red-600 to-red-700 px-6 py-14">
        <div className="max-w-lg mx-auto text-center text-white">
          <h2 className="font-extrabold text-2xl mb-3">Punya UMKM? Daftarkan sekarang!</h2>
          <p className="text-red-100 text-sm mb-8">Gratis selamanya. Mudah dikelola. Langsung ditemukan pembeli di sekitarmu.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-white text-red-600 font-extrabold py-4 rounded-2xl text-sm transition hover:bg-red-50 shadow-xl"
          >
            Daftar Sekarang — Gratis! 🚀
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-8 text-center bg-gray-900 text-white">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center text-white text-xs font-black">L</div>
          <span className="font-extrabold text-white">Lokaku</span>
        </div>
        <p className="text-xs text-gray-500">"Apa pun kebutuhan sekitarmu, cari di Lokaku"</p>
        <div className="flex justify-center gap-6 mt-4">
          <button onClick={() => navigate('/cari')} className="text-xs text-gray-500 hover:text-white transition">Cari Toko</button>
          <button onClick={() => navigate('/peta')} className="text-xs text-gray-500 hover:text-white transition">Peta</button>
          <button onClick={() => navigate('/login')} className="text-xs text-gray-500 hover:text-white transition">Masuk</button>
        </div>
      </div>

    </div>
  )
}