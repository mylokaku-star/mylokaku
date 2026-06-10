import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

const allFaqs = [
  // Kategori: Mulai Berjualan
  {
    kategori: "jualan",
    q: "Bagaimana cara mendaftarkan toko atau usaha saya di Lokaku?",
    a: "Klik tombol 'Daftar' di halaman utama, buat akun, lalu pilih 'Daftarkan Usaha'. Isi nama toko, kategori, jam operasional, dan lokasi. Toko Anda akan langsung tampil di peta area sekitar.",
    popular: true,
  },
  {
    kategori: "jualan",
    q: "Apakah mendaftarkan usaha di Lokaku berbayar?",
    a: "Saat ini pendaftaran dasar gratis untuk semua pelaku UMKM. Kami percaya setiap usaha kecil berhak tampil dan ditemukan.",
    popular: false,
  },
  {
    kategori: "jualan",
    q: "Jenis usaha apa saja yang bisa didaftarkan?",
    a: "Toko kelontong, warung makan, jasa laundry, jasa servis elektronik, salon, bengkel, asisten rumah tangga, hingga usaha jasa lainnya. Selama halal dan legal, semua bisa masuk Lokaku.",
    popular: false,
  },
  {
    kategori: "jualan",
    q: "Bagaimana cara mengatur status 'Buka' atau 'Tutup' toko saya?",
    a: "Masuk ke Dashboard Toko Anda, lalu geser tombol status di bagian atas. Status realtime ini yang memberi tahu calon pembeli apakah usaha Anda sedang buka saat ini.",
    popular: false,
  },
  // Kategori: Tips Berbelanja
  {
    kategori: "belanja",
    q: "Bagaimana cara mencari barang preloved di sekitar saya?",
    a: "Klik menu 'Barang Preloved' di halaman utama. Aktifkan lokasi Anda agar sistem menampilkan barang dari penjual terdekat. Gunakan filter kategori atau kata kunci untuk mempersempit pencarian.",
    popular: true,
  },
  {
    kategori: "belanja",
    q: "Apakah tersedia fitur COD (bayar di tempat)?",
    a: "Sistem pembayaran dan pengiriman sepenuhnya disepakati antara pembeli dan penjual secara langsung. Lokaku sangat menganjurkan COD untuk transaksi pertama demi keamanan kedua pihak.",
    popular: true,
  },
  {
    kategori: "belanja",
    q: "Bagaimana cara menghubungi penjual setelah menemukan barang?",
    a: "Setiap listing barang atau profil toko memiliki tombol kontak. Anda bisa menghubungi penjual langsung via WhatsApp atau fitur chat internal Lokaku.",
    popular: false,
  },
  // Kategori: Keamanan & Akun
  {
    kategori: "keamanan",
    q: "Saya lupa kata sandi, bagaimana cara meresetnya?",
    a: "Klik 'Masuk' lalu pilih 'Lupa Kata Sandi'. Masukkan email terdaftar Anda, dan kami akan mengirimkan tautan reset password dalam beberapa menit.",
    popular: true,
  },
  {
    kategori: "keamanan",
    q: "Bagaimana cara menghindari penipuan saat bertransaksi?",
    a: "Hindari transfer uang sebelum bertemu atau verifikasi barang. Pilih COD untuk transaksi pertama. Jika ada yang mencurigakan, laporkan ke Customer Service kami segera.",
    popular: true,
  },
  {
    kategori: "keamanan",
    q: "Bagaimana cara melaporkan pengguna atau listing yang mencurigakan?",
    a: "Setiap profil toko dan listing barang memiliki tombol 'Laporkan'. Pilih alasan laporan, tambahkan keterangan jika perlu, lalu kirim. Tim kami akan menindaklanjuti dalam 1x24 jam.",
    popular: false,
  },
  {
    kategori: "keamanan",
    q: "Apakah data pribadi saya aman di Lokaku?",
    a: "Data Anda dilindungi sesuai kebijakan privasi Lokaku. Kami tidak menjual atau membagikan data pribadi Anda kepada pihak ketiga tanpa persetujuan Anda.",
    popular: false,
  },
]

const categories = [
  { id: "semua", label: "Semua", emoji: "📋" },
  { id: "jualan", label: "Mulai Berjualan/Jasa", emoji: "🏪" },
  { id: "belanja", label: "Tips Berbelanja", emoji: "🛍️" },
  { id: "keamanan", label: "Keamanan & Akun", emoji: "🛡️" },
]

export default function PusatBantuan() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [activeKategori, setActiveKategori] = useState("semua")
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [showPopular, setShowPopular] = useState(true)

  const waNumber = "6287856672344"
  const waMessage = encodeURIComponent("Halo Lokaku, saya butuh bantuan lebih lanjut.")
  const waLink = `https://wa.me/${waNumber}?text=${waMessage}`

  const filtered = useMemo(() => {
    return allFaqs.filter((faq) => {
      const matchKategori = activeKategori === "semua" || faq.kategori === activeKategori
      const matchSearch =
        search.trim() === "" ||
        faq.q.toLowerCase().includes(search.toLowerCase()) ||
        faq.a.toLowerCase().includes(search.toLowerCase())
      return matchKategori && matchSearch
    })
  }, [search, activeKategori])

  const popularFaqs = allFaqs.filter((f) => f.popular)

  const displayedFaqs = search.trim() !== "" || activeKategori !== "semua" ? filtered : showPopular ? popularFaqs : allFaqs

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 font-bold text-sm"
        >
          ←
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
            L
          </div>
          <span className="font-bold text-base text-gray-800">Pusat Bantuan</span>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 max-w-md mx-auto w-full space-y-7">
        {/* Search Bar */}
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setActiveKategori("semua")
              setShowPopular(false)
            }}
            placeholder="Cari pertanyaan Anda di sini..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setShowPopular(true) }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
            >
              ×
            </button>
          )}
        </div>

        {/* Kategori */}
        {search.trim() === "" && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Kategori Bantuan</p>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveKategori(cat.id)
                    setShowPopular(cat.id === "semua")
                    setOpenFaq(null)
                  }}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all ${
                    activeKategori === cat.id
                      ? "bg-green-50 border-green-200 shadow-sm"
                      : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span
                    className={`text-xs font-bold leading-tight ${
                      activeKategori === cat.id ? "text-green-700" : "text-gray-700"
                    }`}
                  >
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Daftar FAQ */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            {search.trim() !== ""
              ? `Hasil pencarian "${search}" (${filtered.length})`
              : activeKategori !== "semua"
              ? categories.find((c) => c.id === activeKategori)?.label
              : showPopular
              ? "Paling Sering Ditanyakan ⭐"
              : "Semua Pertanyaan"}
          </p>

          {displayedFaqs.length === 0 ? (
            <div className="text-center py-10">
              <span className="text-4xl block mb-3">🔍</span>
              <p className="text-sm text-gray-500">Pertanyaan tidak ditemukan.</p>
              <p className="text-xs text-gray-400 mt-1">Coba kata kunci lain atau hubungi CS kami.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayedFaqs.map((faq, index) => (
                <div key={index} className="border border-gray-100 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full text-left px-4 py-3.5 bg-gray-50 hover:bg-gray-100 font-semibold text-sm text-gray-800 flex justify-between items-start gap-3 transition-colors"
                  >
                    <span className="flex-1 leading-snug">{faq.q}</span>
                    <span className="text-gray-400 text-xs mt-0.5 flex-shrink-0">
                      {openFaq === index ? '▲' : '▼'}
                    </span>
                  </button>
                  {openFaq === index && (
                    <div className="px-4 py-3.5 bg-white text-xs text-gray-500 leading-relaxed border-t border-gray-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tombol lihat semua (hanya muncul di mode popular) */}
          {showPopular && search.trim() === "" && activeKategori === "semua" && (
            <button
              onClick={() => setShowPopular(false)}
              className="mt-4 w-full text-center text-xs font-semibold text-green-600 hover:text-green-700 py-2 border border-green-100 rounded-xl bg-green-50 hover:bg-green-100 transition-colors"
            >
              Lihat semua pertanyaan →
            </button>
          )}
        </div>

        {/* CTA Hubungi CS */}
        <div className="border border-gray-100 rounded-3xl p-5 text-center bg-gray-50 space-y-3">
          <p className="text-sm font-bold text-gray-800">Masih Bingung atau Butuh Bantuan Lain?</p>
          <p className="text-xs text-gray-400 leading-relaxed">Tim kami siap membantu Anda secara langsung.</p>
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-6 py-3 rounded-full transition-all shadow-sm"
          >
            💬 Hubungi Customer Service
          </a>
        </div>
      </div>
    </div>
  )
}
