import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

export default function DetailTokoPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [toko, setToko] = useState<any>(null)
  const [produk, setProduk] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [keranjang, setKeranjang] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadDetail()
  }, [id])

  async function loadDetail() {
    const { data: userData } = await supabase.auth.getUser()
    setUser(userData.user)
    const { data: tokoData } = await supabase
      .from('toko').select('*').eq('id', id).single()
    setToko(tokoData)
    const { data: produkData } = await supabase
      .from('produk').select('*').eq('toko_id', id)
    setProduk(produkData || [])
    if (userData.user) {
      const { data: keranjangData } = await supabase
        .from('keranjang').select('*')
        .eq('user_id', userData.user.id)
        .eq('toko_id', id)
      setKeranjang(keranjangData || [])
    }
    setLoading(false)
  }

  async function tambahKeranjang(produkItem: any) {
    if (!user) { navigate('/login'); return }
    const existing = keranjang.find(k => k.produk_id === produkItem.id)
    if (existing) {
      const { error } = await supabase
        .from('keranjang').update({ jumlah: existing.jumlah + 1 }).eq('id', existing.id)
      if (!error) {
        setKeranjang(prev => prev.map(k => k.id === existing.id ? { ...k, jumlah: k.jumlah + 1 } : k))
        toast.success(`+1 ${produkItem.nama}`)
      }
    } else {
      const { data, error } = await supabase
        .from('keranjang')
        .insert({ user_id: user.id, toko_id: id, produk_id: produkItem.id, jumlah: 1 })
        .select().single()
      if (!error && data) {
        setKeranjang(prev => [...prev, data])
        toast.success(`${produkItem.nama} ditambahkan!`)
      }
    }
  }

  async function kurangKeranjang(produkItem: any) {
    const existing = keranjang.find(k => k.produk_id === produkItem.id)
    if (!existing) return
    if (existing.jumlah <= 1) {
      await supabase.from('keranjang').delete().eq('id', existing.id)
      setKeranjang(prev => prev.filter(k => k.id !== existing.id))
    } else {
      await supabase.from('keranjang').update({ jumlah: existing.jumlah - 1 }).eq('id', existing.id)
      setKeranjang(prev => prev.map(k => k.id === existing.id ? { ...k, jumlah: k.jumlah - 1 } : k))
    }
  }

  function getJumlah(produkId: string) {
    return keranjang.find(k => k.produk_id === produkId)?.jumlah || 0
  }

  function totalKeranjang() {
    return keranjang.reduce((acc, k) => acc + k.jumlah, 0)
  }

  function totalHarga() {
    return keranjang.reduce((acc, k) => {
      const p = produk.find(p => p.id === k.produk_id)
      return acc + (p?.harga || 0) * k.jumlah
    }, 0)
  }

  async function pesanSekarang() {
    if (!user) { navigate('/login'); return }
    if (keranjang.length === 0) { toast.error('Keranjang masih kosong'); return }
    const itemList = keranjang.map(k => {
      const p = produk.find(p => p.id === k.produk_id)
      return `${p?.nama} x${k.jumlah}`
    }).join(', ')
    const pesanOtomatis = `Halo, saya ingin memesan: ${itemList}. Apakah tersedia?`
    await supabase.from('pesan').insert({
      toko_id: id,
      pengirim_id: user.id,
      pengirim_email: user.email,
      pembeli_id: user.id,
      isi: pesanOtomatis,
      is_penjual: false,
    })
    navigate(`/chat/${id}`)
    toast.success('Pesanan dikirim ke chat!')
  }

  function formatHarga(harga: number) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
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
    <div className="min-h-screen bg-gray-50 pb-28">

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

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <h1 className="font-extrabold text-gray-900 text-xl mb-1">{toko.nama}</h1>
          <span className="inline-block text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-semibold mb-3">{toko.kategori}</span>
          {toko.alamat && <p className="text-sm text-gray-500 mb-2">📍 {toko.alamat}</p>}
          {toko.deskripsi && <p className="text-sm text-gray-500 leading-relaxed">{toko.deskripsi}</p>}
          <button
            onClick={() => navigate(`/chat/${toko.id}`)}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-3 text-sm font-bold transition shadow-sm"
          >
            💬 Chat dengan Penjual
          </button>
        </div>

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
              {produk.map(p => {
                const jumlah = getJumlah(p.id)
                return (
                  <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    {p.foto_url && (
                      <img src={p.foto_url} alt={p.nama} className="w-full h-36 object-cover" />
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-sm">{p.nama}</h3>
                          {p.deskripsi && <p className="text-xs text-gray-400 mt-0.5">{p.deskripsi}</p>}
                          <span className="text-sm font-extrabold text-red-600 mt-1 block">{formatHarga(p.harga)}</span>
                        </div>
                      </div>
                      {jumlah === 0 ? (
                        <button
                          onClick={() => tambahKeranjang(p)}
                          className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl py-2.5 text-sm font-bold transition hover:from-red-600 hover:to-red-700"
                        >
                          🛒 Tambah ke Keranjang
                        </button>
                      ) : (
                        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-1">
                          <button
                            onClick={() => kurangKeranjang(p)}
                            className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-gray-700 shadow-sm hover:bg-gray-100 transition text-lg"
                          >
                            −
                          </button>
                          <span className="font-extrabold text-gray-900">{jumlah}</span>
                          <button
                            onClick={() => tambahKeranjang(p)}
                            className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center font-bold text-white shadow-sm hover:bg-red-700 transition text-lg"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {totalKeranjang() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-semibold">{totalKeranjang()} item dipilih</span>
              <span className="text-sm font-extrabold text-red-600">{formatHarga(totalHarga())}</span>
            </div>
            <button
              onClick={pesanSekarang}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl py-3.5 text-sm font-extrabold transition shadow-lg shadow-red-100 hover:from-red-600 hover:to-red-700"
            >
              🛒 Pesan Sekarang ({totalKeranjang()})
            </button>
          </div>
        </div>
      )}

    </div>
  )
}