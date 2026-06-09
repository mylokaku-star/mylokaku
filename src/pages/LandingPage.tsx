import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TombolInstalPWA from '../components/TombolInstalPWA'

export default function LandingPage() {
  const navigate = useNavigate()
  
  // State untuk FAQ interaktif
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const faqs = [
    {
      q: "Apa itu Lokaku?",
      a: "Lokaku adalah platform hyperlocal untuk menemukan UMKM, toko kelontong, penyedia jasa, hingga barang preloved yang aktif dan buka secara realtime di sekitarmu."
    },
    {
      q: "Bagaimana cara mendaftarkan usaha saya?",
      a: "Cukup klik tombol 'Daftarkan Usaha Anda' di bagian bawah halaman ini, buat akun, dan isi profil tokomu atau layanan jasa yang kamu sediakan."
    },
    {
      q: "Apakah bisa menjual barang bekas di sini?",
      a: "Tentu saja! Lokaku mendukung fitur pencarian dan penjualan barang preloved/bekas untuk memudahkan transaksi antar tetangga terdekat."
    }
  ]

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
          {/* Tombol Masuk & Daftar */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/login')} 
              className="text-sm font-semibold text-gray-600 hover:text-green-600 transition-colors"
            >
              Masuk
            </button>
            <button 
              onClick={() => navigate('/register')} 
              className="text-sm font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              Daftar
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="px-6 py-12 text-center max-w-md mx-auto">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Radar Kebutuhan <span className="text-green-600">Sekitarmu</span>
          </h1>
          <p className="text-gray-500 text-base mb-8 leading-relaxed">
            Temukan UMKM, toko kelontong, penyedia jasa, hingga barang preloved yang benar-benar aktif and tersedia di sekitarmu saat ini.
          </p>

          {/* 🚀 TOMBOL INSTAL PWA & SHARE DI SINI */}
          <TombolInstalPWA />

          {/* Main Action Buttons (3 Kolom) */}
          <div className="grid grid-cols-3 gap-3 mt-8">
            <button
              onClick={() => navigate('/cari')}
              className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-green-50 border border-gray-100 hover:border-green-200 rounded-2xl shadow-sm transition-all group"
            >
              <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">🔍</span>
              <span className="font-bold text-xs text-gray-800 group-hover:text-green-700 text-center leading-tight">Cari Toko & Jasa</span>
            </button>

            <button
              onClick={() => navigate('/preloved')}
              className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-amber-50 border border-gray-100 hover:border-amber-200 rounded-2xl shadow-sm transition-all group"
            >
              <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">🛍️</span>
              <span className="font-bold text-xs text-gray-800 group-hover:text-amber-700 text-center leading-tight">Barang Preloved</span>
            </button>

            <button
              onClick={() => navigate('/peta')}
              className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-2xl shadow-sm transition-all group"
            >
              <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">🗺️</span>
              <span className="font-bold text-xs text-gray-800 group-hover:text-blue-700 text-center leading-tight">Lihat Peta Sekitar</span>
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
                <h3 className="font-bold text-gray-800 text-sm">Mendukung Jasa & Barang Preloved</h3>
                <p className="text-gray-500 text-xs mt-1">
                  Tidak hanya toko fisik, asisten harian hingga jasa teknis panggilan bisa ditemukan dengan mudah, serta memudahkan mencari dan menjual barang preloved/bekas antar tetangga.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="px-6 py-10 border-b border-gray-100">
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-bold text-gray-900 text-center mb-6">Pertanyaan Umum (FAQ)</h2>
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 font-semibold text-sm text-gray-800 flex justify-between items-center transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className="text-gray-400">{openFaq === index ? '▲' : '▼'}</span>
                  </button>
                  {openFaq === index && (
                    <div className="px-4 py-3 bg-white text-xs text-gray-500 leading-relaxed border-t border-gray-50">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer & Hubungkan Mitra + CS/Sosmed */}
      <div className="bg-gray-50 border-t border-gray-100 mt-auto">
        <div className="p-6 text-center max-w-md mx-auto w-full space-y-6">
          {/* Section Ajak Mitra */}
          <div>
            <p className="text-xs text-gray-400 mb-2">Punya usaha dagang, layanan jasa, atau barang bekas layak pakai?</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-xs font-bold text-green-600 hover:text-green-700 underline tracking-wide"
            >
              Daftarkan Usaha Anda ke Lokaku Sekarang →
            </button>
          </div>

          <hr className="border-gray-200" />

          {/* Section CS & Sosial Media */}
          <div className="flex flex-col items-center gap-4">
            
            <div className="w-full px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-left shadow-sm">
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong className="text-amber-900 font-bold block mb-1 text-center">💡 Imbauan Keamanan Bertransaksi:</strong> 
                Lokaku adalah platform untuk menemukan kebutuhan di sekitar Anda. Kami mengimbau penjual dan pembeli untuk selalu berhati-hati saat bertransaksi. Periksa kembali detail produk/jasa dan <span className="font-bold text-amber-950 underline">hindari pembayaran di awal sebelum kesepakatan benar-benar pasti.</span>
              </p>
            </div>

            {/* ✅ SEKARANG SUDAH DIARAHKAN KE /chat-cs (Chat Internal) */}
            <button
              onClick={() => navigate('/chat-cs')}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-full transition-colors shadow-sm"
            >
              💬 Hubungi Customer Service
            </button>
            
            <div className="flex items-center gap-4 text-xs font-medium text-gray-500 flex-wrap justify-center">
              <a href="https://instagram.com/lokaku" target="_blank" rel="noreferrer" className="hover:text-pink-600 transition-colors">Instagram</a>
              <span className="text-gray-300">•</span>
              <a href="https://tiktok.com/@lokaku" target="_blank" rel="noreferrer" className="hover:text-black transition-colors">TikTok</a>
              <span className="text-gray-300">•</span>
              <a href="https://youtube.com/@lokaku" target="_blank" rel="noreferrer" className="hover:text-red-600 transition-colors">YouTube</a>
              <span className="text-gray-300">•</span>
              <a href="https://facebook.com/lokaku" target="_blank" rel="noreferrer" className="hover:text-blue-600 transition-colors">Facebook</a>
              <span className="text-gray-300">•</span>
              <a href="https://twitter.com/lokaku" target="_blank" rel="noreferrer" className="hover:text-black transition-colors">X / Twitter</a>
            </div>
            
            <p className="text-[10px] text-gray-400">&copy; {new Date().getFullYear()} Lokaku. Hak Cipta Dilindungi.</p>
          </div>
        </div>
      </div>
    </div>
  )
}