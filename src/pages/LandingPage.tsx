import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false)
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Lokaku - Radar Kebutuhan Sekitarmu',
          text: 'Temukan UMKM, toko kelontong, penyedia jasa, hingga barang preloved yang aktif secara realtime di sekitarmu!',
          url: window.location.origin,
        })
      } catch (error) {
        console.log('Batal membagikan:', error)
      }
    } else {
      navigator.clipboard.writeText(window.location.origin)
      alert('Link Lokaku berhasil disalin! Silakan bagikan ke tetangga atau teman.')
    }
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      console.log('User menginstal aplikasi Lokaku')
    }
    setDeferredPrompt(null)
    setIsInstallable(false)
  }

  const faqs = [
    {
      q: "Apa itu Lokaku?",
      a: "Lokaku adalah platform hyperlocal untuk menemukan UMKM, toko kelontong, penyedia jasa, hingga barang preloved yang aktif dan buka secara realtime di sekitarmu."
    },
    {
      q: "Bagaimana cara mendaftarkan usaha saya?",
      a: "Cukup klik tombol 'Daftarkan Usaha Anda' di bagian atas atau bawah halaman ini, buat akun, dan isi profil tokomu atau layanan jasa yang kamu sediakan."
    },
    {
      q: "Apakah bisa menjual barang bekas di sini?",
      a: "Tentu saja! Lokaku mendukung fitur pencarian dan penjualan barang preloved/bekas untuk memudahkan transaksi antar tetangga terdekat."
    }
  ]

  return (
    <div className="min-h-screen bg-[#F9FBFA] flex flex-col justify-between antialiased text-gray-900 font-sans">
      <div>
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md flex items-center justify-between px-6 py-4 border-b border-gray-100/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0D5C3A] rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-[#0D5C3A]/20">L</div>
            <span className="font-extrabold text-xl tracking-tight text-gray-900">lokaku<span className="text-[#0D5C3A]">.id</span></span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-bold text-gray-600 hover:text-[#0D5C3A] transition-colors px-3 py-1.5"
            >
              Masuk
            </button>
            <button
              onClick={() => navigate('/login?tab=daftar')}
              className="text-sm font-bold text-white bg-[#0D5C3A] hover:bg-[#0A472D] px-4 py-1.5 rounded-xl transition-all shadow-sm shadow-[#0D5C3A]/10 active:scale-95"
            >
              Daftar
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="px-6 pt-10 pb-8 text-center max-w-md mx-auto">
          <span className="inline-flex items-center gap-1.5 bg-green-50 text-[#0D5C3A] text-[11px] font-bold px-3 py-1 rounded-full mb-4 border border-green-100">
            📍 Aplikasi Radar Tetangga & UMKM
          </span>
          <h1 className="text-4xl font-black text-gray-950 tracking-tight mb-3 leading-tight">
            Radar Kebutuhan <span className="text-[#0D5C3A]">Sekitarmu</span>
          </h1>
          <p className="text-gray-500 text-sm md:text-base mb-8 leading-relaxed px-2">
            Temukan UMKM, toko kelontong, penyedia jasa, hingga barang preloved yang benar-benar aktif dan tersedia di sekitarmu saat ini.
          </p>

          {/* HIGH CONVERSION CTA BLOCK */}
          <div className="flex flex-col gap-2.5 mb-10">
            <button
              onClick={() => navigate('/cari')}
              className="w-full py-4 bg-[#0D5C3A] hover:bg-[#0A472D] text-white rounded-xl text-sm font-bold shadow-md shadow-[#0D5C3A]/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>🔍</span> Mulai Cari di Sekitarmu
            </button>
            <button
              onClick={() => navigate('/login?tab=daftar')}
              className="w-full py-3.5 bg-[#F2994A]/10 border border-[#F2994A]/30 hover:bg-[#F2994A]/20 text-[#D06D19] rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
            >
              🏪 Daftarkan Usaha / Jasa Saya (Gratis)
            </button>
          </div>

          {/* MAIN GRID NAVIGATION */}
          <div className="text-left mb-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Eksplorasi Fitur</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => navigate('/cari')}
              className="flex flex-col items-center justify-center p-4 bg-white hover:bg-green-50/50 border border-gray-200/70 hover:border-[#0D5C3A]/30 rounded-2xl shadow-sm transition-all group"
            >
              <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center text-xl mb-2.5 group-hover:scale-105 transition-transform">🔍</div>
              <span className="font-bold text-[11px] text-gray-800 text-center leading-tight">Cari Toko & Jasa</span>
            </button>
            <button
              onClick={() => navigate('/preloved')}
              className="flex flex-col items-center justify-center p-4 bg-white hover:bg-amber-50/50 border border-gray-200/70 hover:border-amber-500/30 rounded-2xl shadow-sm transition-all group"
            >
              <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center text-xl mb-2.5 group-hover:scale-105 transition-transform">🛍️</div>
              <span className="font-bold text-[11px] text-gray-800 text-center leading-tight">Barang Preloved</span>
            </button>
            <button
              onClick={() => navigate('/peta')}
              className="flex flex-col items-center justify-center p-4 bg-white hover:bg-blue-50/50 border border-gray-200/70 hover:border-blue-500/30 rounded-2xl shadow-sm transition-all group"
            >
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-xl mb-2.5 group-hover:scale-105 transition-transform">🗺️</div>
              <span className="font-bold text-[11px] text-gray-800 text-center leading-tight">Lihat Peta Sekitar</span>
            </button>
          </div>
        </div>

        {/* Info Value Proposition Section */}
        <div className="bg-white px-6 py-10 border-t border-b border-gray-100">
          <div className="max-w-md mx-auto space-y-6">
            <div className="flex gap-4 items-start">
              <div className="text-xl p-2.5 bg-green-50 text-[#0D5C3A] rounded-xl font-bold shadow-sm">🏪</div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Fokus Hyperlocal</h3>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">Hanya menampilkan apa yang tersedia, terdekat, dan benar-benar buka di sekitar lokasi Anda saat ini secara instan.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="text-xl p-2.5 bg-amber-50 text-[#F2994A] rounded-xl font-bold shadow-sm">🛠️</div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Mendukung Jasa & Barang Preloved</h3>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                  Tidak hanya toko fisik. Asisten harian, jasa teknis panggilan, hingga transaksi jual-beli barang bekas layak pakai antar tetangga kini bisa ditemukan dengan aman.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECONDARY ENGAGEMENT BLOCK (Share & PWA Install) */}
        <div className="px-6 py-8 bg-gray-50/60 border-b border-gray-100 text-center">
          <div className="max-w-md mx-auto">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Akses Lebih Cepat</h3>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-800 shadow-sm transition-all active:scale-95"
              >
                🔗 Bagikan ke Tetangga
              </button>
              {isInstallable && (
                <button
                  onClick={handleInstall}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-[#0D5C3A] hover:bg-[#0A472D] text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 animate-pulse"
                >
                  📲 Pasang Aplikasi Lokaku
                </button>
              )}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="px-6 py-8 bg-white border-b border-gray-100">
          <div className="max-w-md mx-auto">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 pl-1">Pertanyaan Umum (FAQ)</h2>
            <div className="space-y-2">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-gray-100 rounded-xl overflow-hidden bg-[#F9FBFA]">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100/50 font-bold text-xs text-gray-800 flex justify-between items-center transition-colors gap-2"
                  >
                    <span>{faq.q}</span>
                    <span className="text-gray-400 flex-shrink-0 text-[10px]">{openFaq === index ? '▲' : '▼'}</span>
                  </button>
                  {openFaq === index && (
                    <div className="px-4 py-3 bg-white text-xs text-gray-500 leading-relaxed border-t border-gray-100/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between bg-green-50/40 border border-green-100 rounded-xl px-4 py-3">
              <span className="text-xs text-gray-600 font-medium">🔍 Punya pertanyaan spesifik lain?</span>
              <button
                onClick={() => navigate('/pusat-bantuan')}
                className="text-xs font-bold text-[#0D5C3A] hover:underline flex-shrink-0"
              >
                Hubungi Bantuan →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#1A2521] text-gray-400 border-t border-gray-900 mt-auto">
        <div className="p-6 text-center max-w-md mx-auto w-full space-y-6">
          <div className="py-2">
            <p className="text-xs text-gray-400 mb-3">Punya usaha dagang, layanan jasa, atau barang bekas layak pakai?</p>
            <button
              onClick={() => navigate('/login?tab=daftar')}
              className="inline-flex items-center justify-center px-4 py-2 bg-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all border border-white/10"
            >
              Daftarkan Usaha Anda Sekarang →
            </button>
          </div>

          <hr className="border-gray-800" />

          <div className="flex flex-col items-center gap-4">
            <div className="w-full px-4 py-3.5 bg-amber-950/40 border border-amber-900/40 rounded-2xl text-left">
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                <strong className="text-amber-400 font-bold block mb-1 text-center text-xs">⚠️ Imbauan Keamanan Bertransaksi:</strong>
                Lokaku adalah platform hyperlocal. Kami mengimbau penjual dan pembeli untuk selalu berhati-hati saat bertransaksi. Periksa detail produk/jasa secara langsung saat bertemu dan <span className="font-bold text-amber-400 underline">hindari melakukan pembayaran di awal sebelum kesepakatan benar-benar pasti.</span>
              </p>
            </div>

            {/* Social Media Grid */}
            <div className="grid grid-cols-5 gap-1.5 w-full">
              <a href="https://www.instagram.com/mylokaku/" target="_blank" rel="noreferrer"
                className="text-[10px] font-bold text-gray-300 border border-white/5 bg-white/5 hover:bg-white/10 py-2 rounded-xl transition-colors text-center">
                Instagram
              </a>
              <a href="https://www.tiktok.com/@mylokaku" target="_blank" rel="noreferrer"
                className="text-[10px] font-bold text-gray-300 border border-white/5 bg-white/5 hover:bg-white/10 py-2 rounded-xl transition-colors text-center">
                TikTok
              </a>
              <a href="https://www.youtube.com/@Mylokaku" target="_blank" rel="noreferrer"
                className="text-[10px] font-bold text-gray-300 border border-white/5 bg-white/5 hover:bg-white/10 py-2 rounded-xl transition-colors text-center">
                YouTube
              </a>
              <a href="https://www.facebook.com/profile.php?id=61590479860836" target="_blank" rel="noreferrer"
                className="text-[10px] font-bold text-gray-300 border border-white/5 bg-white/5 hover:bg-white/10 py-2 rounded-xl transition-colors text-center">
                Facebook
              </a>
              <a href="https://x.com/mylokaku" target="_blank" rel="noreferrer"
                className="text-[10px] font-bold text-gray-300 border border-white/5 bg-white/5 hover:bg-white/10 py-2 rounded-xl transition-colors text-center">
                Twitter
              </a>
            </div>

            <p className="text-[10px] text-gray-500 font-medium">&copy; {new Date().getFullYear()} Lokaku. Hak Cipta Dilindungi.</p>
          </div>
        </div>
      </div>
    </div>
  )
}