import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Promo {
  id: string
  judul: string
  deskripsi: string | null
  gambar_url: string
  jenis: 'promo' | 'event'
  tanggal_mulai: string
  tanggal_berakhir: string
  toko: {
    id: string
    nama: string
    alamat: string
    telepon: string | null
    kategori: string
  }
}

function formatTanggal(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

function sisaHari(tanggalBerakhir: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const berakhir = new Date(tanggalBerakhir)
  berakhir.setHours(0, 0, 0, 0)
  return Math.ceil((berakhir.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default function DetailPromoPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [promo, setPromo] = useState<Promo | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => { loadPromo() }, [id])

  async function loadPromo() {
    const { data, error } = await supabase
      .from('promos')
      .select(`
        id, judul, deskripsi, gambar_url, jenis, tanggal_mulai, tanggal_berakhir,
        toko:toko_id ( id, nama, alamat, telepon, kategori )
      `)
      .eq('id', id)
      .eq('status', 'aktif')
      .single()

    if (error || !data) { setNotFound(true); setLoading(false); return }
    setPromo(data as any)
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center text-white font-black text-lg animate-pulse">L</div>
    </div>
  )

  if (notFound || !promo) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <span className="text-5xl mb-4">😕</span>
      <h2 className="font-extrabold text-gray-900 text-lg mb-2">Promo Tidak Ditemukan</h2>
      <p className="text-sm text-gray-400 mb-6">Promo ini mungkin sudah berakhir atau tidak tersedia.</p>
      <button onClick={() => navigate(-1)}
        className="bg-green-500 text-white font-bold px-6 py-3 rounded-2xl text-sm hover:bg-green-600 transition">
        Kembali
      </button>
    </div>
  )

  const sisa = sisaHari(promo.tanggal_berakhir)
  const isEvent = promo.jenis === 'event'

  return (
    <div className="min-h-screen bg-gray-50 pb-8">

      {/* Gambar hero */}
      <div className="relative">
        <img
          src={promo.gambar_url}
          alt={promo.judul}
          className="w-full aspect-[2/1] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" />

        {/* Tombol kembali */}
        <button onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 bg-black/40 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-black/60 transition">
          ←
        </button>

        {/* Badge */}
        <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-xl text-xs font-bold
          ${isEvent ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'}`}>
          {isEvent ? '🎪 Event' : '🏷️ Promo'}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">

        {/* Judul & sisa waktu */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <h1 className="font-extrabold text-gray-900 text-xl leading-tight">{promo.judul}</h1>

          {/* Sisa hari */}
          <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-xl text-xs font-bold
            ${sisa <= 3 ? 'bg-red-50 text-red-600' : sisa <= 7 ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
            <span>⏰</span>
            {sisa === 0 ? 'Berakhir hari ini!'
              : sisa < 0 ? 'Sudah berakhir'
              : `${sisa} hari lagi`}
          </div>

          {/* Tanggal */}
          <div className="mt-4 space-y-2">
            <div className="flex items-start gap-3">
              <span className="text-lg mt-0.5">📅</span>
              <div>
                <p className="text-xs text-gray-400 font-semibold">{isEvent ? 'Tanggal Event' : 'Periode Promo'}</p>
                <p className="text-sm text-gray-700 font-semibold mt-0.5">
                  {formatTanggal(promo.tanggal_mulai)}
                </p>
                {promo.tanggal_mulai !== promo.tanggal_berakhir && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    s/d {formatTanggal(promo.tanggal_berakhir)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Deskripsi */}
        {promo.deskripsi && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">
              {isEvent ? 'Tentang Event' : 'Detail Promo'}
            </p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{promo.deskripsi}</p>
          </div>
        )}

        {/* Info Toko */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Diselenggarakan oleh</p>
          <div
            onClick={() => navigate(`/toko/${promo.toko.id}`)}
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-2xl p-2 -mx-2 transition"
          >
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-xl flex-shrink-0">
              🏪
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">{promo.toko.nama}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{promo.toko.alamat}</p>
              <p className="text-xs text-green-600 font-semibold mt-0.5">{promo.toko.kategori}</p>
            </div>
            <span className="text-gray-300">›</span>
          </div>
        </div>

        {/* Tombol WA */}
        {promo.toko.telepon && (
          <a
            href={`https://wa.me/${promo.toko.telepon}?text=${encodeURIComponent(`Halo, saya tertarik dengan ${isEvent ? 'event' : 'promo'} "${promo.judul}" yang saya lihat di Lokaku.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl py-4 text-sm font-extrabold transition shadow-lg shadow-green-100"
          >
            <span>💬</span>
            Hubungi via WhatsApp
          </a>
        )}

        <button
          onClick={() => navigate(`/toko/${promo.toko.id}`)}
          className="w-full border-2 border-gray-100 text-gray-600 rounded-2xl py-3.5 text-sm font-bold hover:bg-gray-50 transition"
        >
          Lihat Profil Toko →
        </button>

      </div>
    </div>
  )
}
