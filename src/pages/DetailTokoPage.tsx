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
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate('/cari')} className="text-gray-500 hover:text-gray-800">
          ← Kembali
        </button>
        <span className="font-semibold text-gray-800 truncate">{toko.nama}</span>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">

        {/* Info Toko */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="font-semibold text-gray-800 text-lg">{toko.nama}</h1>
              <span className="text-xs text-gray-400">{toko.kategori}</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${toko.is_buka ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
              {toko.is_buka ? 'BUKA' : 'TUTUP'}
            </span>
          </div>

          {toko.alamat && (
            <p className="text-sm text-gray-500 mb-2">📍 {toko.alamat}</p>
          )}

          {toko.deskripsi && (
            <p className="text-sm text-gray-500 mb-3">{toko.deskripsi}</p>
          )}

          {toko.telepon && (
            <button
              onClick={hubungiWhatsapp}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg py-2.5 text-sm font-medium transition"
            >
              💬 Hubungi via WhatsApp
            </button>
          )}
        </div>

        {/* Daftar Produk */}
        <div>
          <h2 className="font-semibold text-gray-700 mb-3">
            Produk & Layanan
            <span className="text-xs text-gray-400 font-normal ml-2">({produk.length} item)</span>
          </h2>

          {produk.length === 0 ? (
            <div className="bg-white rounded-xl p-6 border border-gray-100 text-center">
              <p className="text-gray-400 text-sm">Belum ada produk</p>
            </div>
          ) : (
            <div className="space-y-2">
              {produk.map(p => (
                <div key={p.id} className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800 text-sm">{p.nama}</h3>
                      {p.deskripsi && (
                        <p className="text-xs text-gray-400 mt-0.5">{p.deskripsi}</p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-red-600 ml-3">
                      {formatHarga(p.harga)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Bottom WhatsApp button */}
      {toko.telepon && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
          <button
            onClick={hubungiWhatsapp}
            className="w-full max-w-lg mx-auto block bg-green-600 hover:bg-green-700 text-white rounded-lg py-3 text-sm font-medium transition"
          >
            💬 Hubungi via WhatsApp
          </button>
        </div>
      )}

    </div>
  )
}