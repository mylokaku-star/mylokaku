import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function DetailTokoPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [toko, setToko] = useState<any>(null)
  const [produk, setProduk] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDetail()
  }, [id])

  async function loadDetail() {
    const { data: tokoData } = await supabase
      .from('toko')
      .select('*')
      .eq('id', id)
      .single()
    setToko(tokoData)
    const { data: produkData } = await supabase
      .from('produk')
      .select('*')
      .eq('toko_id', id)
    setProduk(produkData || [])
    setLoading(false)
  }

  function hubungiWhatsapp() {
    if (!toko?.telepon) return
    const nomor = toko.telepon.replace(/^0/, '62')
    const pesan = encodeURIComponent(`Halo, saya menemukan toko ${toko.nama} di Lokaku. Apakah masih buka?`)
    window.open(`https://wa.me/${nomor}?text=${pesan}`, '_blank')
  }

  function formatHarga(harga: number) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(harga)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Memuat...</p>
      </div>
    )
  }

  if (!toko) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Toko tidak ditemukan</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Hero foto */}
      <div className="relative">
        {toko.foto_url ? (
          <img src={toko.foto_url} alt={toko.nama} className="w-full h-56 object-cover" />
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-6xl">🏪</div>
        )}
        <button
          onClick={() => navigate('/cari')}
          className="absolute top-4 left-4 bg-white/90 backdrop-blur text-gray-700 px-3 py-1.5 rounded-xl text-sm font-semibold shadow"
        >
          ← Kembali
        </button>
        <span className={`absolute top-4 right-4 text-xs px-3 py-1.5 rounded-xl font-bold shadow ${toko.is_buka ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {toko.is_buka ? '🟢 BUKA' : '🔴 TUTUP'}
        </span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* Info Toko */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <h1 className="font-extrabold text-gray-900 text-xl mb-1">{toko.nama}</h1>
          <span className="inline-block text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-semibold mb-3">{toko.kategori}</span>
          {toko.alamat && (
            <p className="text-sm text-gray-500 mb-2 flex items-start gap-1">
              <span>📍</span> {toko.alamat}
            </p>
          )}
          {toko.deskripsi && (
            <p className="text-sm text-gray-500 leading-relaxed">{toko.deskripsi}</p>
          )}
          {toko.telepon && (
            <button
              onClick={hubungiWhatsapp}
              className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl py-3 text-sm font-bold transition shadow-sm shadow-green-100"
            >
              💬 Hubungi via WhatsApp
            </button>
          )}
        </div>

        {/* Produk */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-gray-900">Produk & Layanan</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full font-semibold">{produk.length} item</span>
          </div>

          {produk.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center">
              <span className="text-4xl mb-2 block">📦</span>
              <p className="text-gray-400 text-sm">Belum ada produk</p>
            </div>
          ) : (
            <div className="space-y-3">
              {produk.map(p => (
                <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  {p.foto_url && (
                    <img src={p.foto_url} alt={p.nama} className="w-full h-36 object-cover" />
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-sm">{p.nama}</h3>
                        {p.deskripsi && (
                          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{p.deskripsi}</p>
                        )}
                      </div>
                      <span className="text-sm font-extrabold text-red-600 ml-3 whitespace-nowrap">
                        {formatHarga(p.harga)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom WhatsApp */}
      {toko.telepon && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg">
          <button
            onClick={hubungiWhatsapp}
            className="w-full max-w-lg mx-auto block bg-green-600 hover:bg-green-700 text-white rounded-2xl py-3.5 text-sm font-extrabold transition shadow-lg shadow-green-100"
          >
            💬 Hubungi via WhatsApp
          </button>
        </div>
      )}
    </div>
  )
}