import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

type PeranUser = 'semua' | 'pembeli' | 'penjual'

const allFaqs = [
  // Kategori: Mulai Berjualan (Penjual)
  {
    peran: "penjual",
    kategori: "jualan",
    q: "Bagaimana cara mendaftarkan toko atau usaha saya di Lokaku?",
    a: "Klik tombol 'Daftar' di halaman utama, buat akun menggunakan nomor WhatsApp, lalu pilih 'Daftarkan Usaha'. Isi nama toko, kategori, jam operasional, dan pasang lokasi GPS Anda. Toko Anda akan langsung tampil di peta area sekitar.",
    popular: true,
  },
  {
    peran: "penjual",
    kategori: "jualan",
    q: "Apakah mendaftarkan usaha di Lokaku berbayar?",
    a: "Tidak, pendaftaran dasar gratis 100% untuk semua pelaku UMKM. Kami berkomitmen membantu pelaku usaha lokal agar lebih mudah ditemukan oleh masyarakat sekitar.",
    popular: false,
  },
  {
    peran: "penjual",
    kategori: "jualan",
    q: "Bagaimana cara mengatur status 'Buka' atau 'Tutup' toko saya?",
    a: "Masuk ke Dashboard Toko Anda, lalu geser sakelar status di bagian atas halaman. Status realtime ini langsung mengubah penanda toko Anda di peta pembeli agar mereka tahu Anda sedang menerima pesanan.",
    popular: true,
  },
  // Kategori: Fitur Peta & Pencarian (Pembeli / Umum)
  {
    peran: "pembeli",
    kategori: "fitur",
    q: "Bagaimana cara mencari toko terdekat dari lokasi saya saat ini?",
    a: "Aktifkan GPS pada handphone Anda, lalu buka halaman 'Peta' atau 'Cari'. Sistem Lokaku secara otomatis mendeteksi keberadaan Anda dan menampilkan deretan UMKM aktif dalam radius terdekat terlebih dahulu.",
    popular: true,
  },
  {
    peran: "pembeli",
    kategori: "fitur",
    q: "Apakah saya bisa bertransaksi langsung atau bayar di tempat (COD)?",
    a: "Lokaku menyediakan tombol interaktif untuk terhubung langsung ke WhatsApp penjual. Anda bisa bernegosiasi, memesan, dan menyepakati metode pembayaran COD atau kurir langsung dengan pemilik toko tanpa perantara komisi.",
    popular: true,
  },
  {
    peran: "penjual",
    kategori: "fitur",
    q: "Bagaimana cara membuat promo atau event diskon toko?",
    a: "Buka menu 'Buat Promo' dari Dashboard Toko Anda. Masukkan foto pamflet, judul promo, deskripsi singkat, dan atur masa berlaku. Promo Anda otomatis disebarkan ke pengguna dalam radius hingga 10 km.",
    popular: false,
  },
  // Kategori: Akun & Keamanan (Umum)
  {
    peran: "semua",
    kategori: "akun",
    q: "Mengapa sistem meminta izin akses lokasi/GPS perangkat saya?",
    a: "Lokaku adalah platform berbasis peta wilayah (geolocation). Izin lokasi sangat diperlukan agar pembeli bisa melihat arah jalan ke toko Anda, atau agar sistem dapat mengukur jarak akurat antara pembeli dan penjual terdekat.",
    popular: false,
  },
  {
    peran: "semua",
    kategori: "akun",
    q: "Bagaimana jika saya mengganti nomor WhatsApp atau lupa kata sandi?",
    a: "Anda dapat menuju menu 'Profil' untuk memperbarui data nomor WhatsApp. Jika Anda keluar akun dan lupa kata sandi, gunakan tautan 'Lupa Kata Sandi' pada halaman masuk untuk menyetel ulang sandi Anda.",
    popular: false,
  }
]

export default function PusatBantuan() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [activeKategori, setActiveKategori] = useState("semua")
  const [activePeran, setActivePeran] = useState<PeranUser>("semua")
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [showPopular, setShowPopular] = useState(true)

  // Menyaring FAQ secara cerdas berdasarkan input pencarian, kategori tab, dan peran pengguna
  const filteredFaqs = useMemo(() => {
    return allFaqs.filter((faq, index) => {
      // Filter Peran (Masyarakat Umum vs Pelaku UMKM)
      if (activePeran !== 'semua' && faq.peran !== 'semua' && faq.peran !== activePeran) {
        return false
      }
      // Filter Kategori Topik
      if (activeKategori !== "semua" && faq.kategori !== activeKategori) {
        return false
      }
      // Filter Berdasarkan Tampilan Populer saja
      if (showPopular && !search.trim() && !faq.popular && activeKategori === "semua" && activePeran === "semua") {
        return false
      }
      // Filter Kata Kunci Pencarian
      if (search.trim() !== "") {
        const query = search.toLowerCase()
        return faq.q.toLowerCase().includes(query) || faq.a.toLowerCase().includes(query)
      }
      return true
    })
  }, [search, activeKategori, activePeran, showPopular])

  // Menentukan pesan otomatis WhatsApp yang disesuaikan dengan fokus bantuan user
  const pesanWaOtomatis = useMemo(() => {
    const dasarText = "Halo CS Lokaku, saya butuh bantuan mengenai platform Lokaku. "
    if (activePeran === 'penjual') return encodeURIComponent(dasarText + "[Kategori: Pelaku UMKM / Pendaftaran Usaha]")
    if (activePeran === 'pembeli') return encodeURIComponent(dasarText + "[Kategori: Pembeli / Masalah Pencarian Peta]")
    return encodeURIComponent(dasarText)
  }, [activePeran])

  const waLink = `https://wa.me/6281290005391?text=${pesanWaOtomatis}`

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 text-slate-800 font-medium antialiased">
      
      {/* HEADER UTAMA */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-30 shadow-sm/50 backdrop-blur-md bg-white/95">
        <button 
          onClick={() => navigate(-1)} 
          className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 border border-slate-100 hover:bg-slate-100 active:scale-95 transition-all"
        >
          ←
        </button>
        <div>
          <h1 className="font-black text-slate-900 text-base tracking-tight">Pusat Bantuan</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Solusi & Panduan Penggunaan</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-5 space-y-4">
        
        {/* KOTAK PENCARIAN UTAMA */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-3">
          <p className="text-sm font-black text-slate-900 tracking-tight">Ada yang bisa kami bantu?</p>
          <div className="relative">
            <input
              type="text"
              placeholder="Ketik kata kunci (misal: 'peta', 'toko', 'gratis')..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                if (e.target.value.trim() !== "") setShowPopular(false)
              }}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold outline-none focus:border-emerald-500 bg-white transition-all shadow-inner/5"
            />
            <span className="absolute left-3.5 top-3.5 text-base pointer-events-none opacity-40">🔍</span>
            {search && (
              <button 
                onClick={() => { setSearch(""); setShowPopular(true); }} 
                className="absolute right-3.5 top-3.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* SEGMENTASI TARGET USER (KEMUDAHAN UTAMA) */}
        <div className="grid grid-cols-3 bg-slate-100 rounded-2xl p-1 gap-1">
          {(['semua', 'pembeli', 'penjual'] as PeranUser[]).map((peran) => (
            <button
              key={peran}
              onClick={() => {
                setActivePeran(peran)
                setOpenFaq(null)
              }}
              className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${
                activePeran === peran 
                  ? 'bg-slate-950 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {peran === 'semua' ? 'Semua' : peran === 'pembeli' ? '🛍️ Pembeli' : '🏪 UMKM'}
            </button>
          ))}
        </div>

        {/* FILTER SUB-KATEGORI TOPIK */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {[
            { id: "semua", label: "✨ Semua Topik" },
            { id: "jualan", label: "🏪 Mulai Jualan" },
            { id: "fitur", label: "🗺️ Fitur & Transaksi" },
            { id: "akun", label: "🔐 Akun & Profil" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveKategori(cat.id)
                setOpenFaq(null)
                if (cat.id !== "semua") setShowPopular(false)
              }}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                activeKategori === cat.id
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-extrabold shadow-sm/10'
                  : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* PANEL DAFTAR FAQ */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-50 pb-2.5 mb-2 pl-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
              {search.trim() ? "Hasil Pencarian" : showPopular ? "🔥 Pertanyaan Terpopuler" : "Daftar Pertanyaan"}
            </h2>
            {showPopular && !search.trim() && activeKategori === "semua" && activePeran === "semua" && (
              <button 
                onClick={() => setShowPopular(false)} 
                className="text-[11px] font-bold text-emerald-600 hover:underline"
              >
                Lihat Semua
              </button>
            )}
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-3xl mb-2">🤷</p>
              <p className="text-slate-800 font-bold text-sm">Pertanyaan tidak ditemukan</p>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">Coba ganti kata kunci atau ubah filter peran di atas.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFaqs.map((faq, index) => {
                const isOpen = openFaq === index
                return (
                  <div 
                    key={index} 
                    className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                      isOpen ? 'border-slate-300 bg-slate-50/40' : 'border-slate-100 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full text-left px-4 py-3.5 flex items-center justify-between gap-3"
                    >
                      <span className="text-xs font-black text-slate-900 leading-snug">{faq.q}</span>
                      <span className={`text-slate-400 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs text-slate-500 font-medium leading-relaxed border-t border-slate-100/60 bg-white">
                        {faq.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* CTA HUBUNGI HUB LIVE CHAT (CS WHATSAPP) */}
        <div className="border border-slate-100 rounded-3xl p-5 text-center bg-white shadow-sm space-y-3">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-700 text-xl rounded-full flex items-center justify-center mx-auto">
            💬
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-black text-slate-900 tracking-tight">Belum menemukan jawaban?</p>
            <p className="text-slate-400 text-xs leading-relaxed px-4">
              Tim Support Lokaku siap memandu dan melayani Anda secara personal via Chat.
            </p>
          </div>
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md shadow-emerald-100 active:scale-[0.98]"
          >
            <span>Hubungi Layanan CS</span>
            <span className="bg-emerald-700 text-[10px] px-1.5 py-0.5 rounded-md font-bold">Online</span>
          </a>
        </div>

      </div>
    </div>
  )
}