import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

function formatHarga(harga: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(harga)
}

export default function KeranjangPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [keranjangPerToko, setKeranjangPerToko] = useState<Record<string, any>>({})
  const [wishlist, setWishlist] = useState<any[]>([])
  const [tab, setTab] = useState<'keranjang' | 'wishlist'>('keranjang')
  const [processing, setProcessing] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { navigate('/login'); return }
    setUser(userData.user)

    await Promise.all([loadKeranjang(userData.user.id), loadWishlist(userData.user.id)])
    setLoading(false)
  }

  async function loadKeranjang(uid: string) {
    const { data } = await supabase
      .from('keranjang')
      .select('*, produk:produk_id(id, nama, harga, foto_url, deskripsi), toko:toko_id(id, nama, foto_url, jenis, alamat, is_buka)')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })

    const grouped: Record<string, any> = {}
    for (const item of (data || [])) {
      const tokoId = item.toko_id
      if (!grouped[tokoId]) {
        grouped[tokoId] = { toko: item.toko, items: [] }
      }
      grouped[tokoId].items.push(item)
    }
    setKeranjangPerToko(grouped)
  }

  async function loadWishlist(uid: string) {
    const { data } = await supabase
      .from('wishlist_produk')
      .select('*, produk:produk_id(id, nama, harga, foto_url, deskripsi, toko_id), toko:toko_id(id, nama, jenis)')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    setWishlist(data || [])
  }

  async function tambah(keranjangId: string, jumlahSekarang: number) {
    await supabase.from('keranjang').update({ jumlah: jumlahSekarang + 1 }).eq('id', keranjangId)
    await loadKeranjang(user.id)
  }

  async function kurang(keranjangId: string, jumlahSekarang: number, tokoId: string) {
    if (jumlahSekarang <= 1) {
      await supabase.from('keranjang').delete().eq('id', keranjangId)
    } else {
      await supabase.from('keranjang').update({ jumlah: jumlahSekarang - 1 }).eq('id', keranjangId)
    }
    await loadKeranjang(user.id)
  }

  async function hapusItem(keranjangId: string) {
    await supabase.from('keranjang').delete().eq('id', keranjangId)
    await loadKeranjang(user.id)
    toast.success('Item dihapus dari keranjang')
  }

  async function hapusSemuaToko(tokoId: string) {
    if (!confirm('Hapus semua item dari toko ini?')) return
    await supabase.from('keranjang').delete().eq('user_id', user.id).eq('toko_id', tokoId)
    await loadKeranjang(user.id)
    toast.success('Semua item dihapus')
  }

  async function pesanToko(tokoId: string) {
    const group = keranjangPerToko[tokoId]
    if (!group) return
    setProcessing(true)
    const itemList = group.items.map((k: any) => `${k.produk?.nama} x${k.jumlah}`).join(', ')
    const { error } = await supabase.from('pesan').insert({
      toko_id: tokoId,
      pengirim_id: user.id,
      pengirim_email: user.email,
      pembeli_id: user.id,
      isi: `Halo, saya ingin memesan:\n${itemList}\n\nApakah tersedia?`,
      is_penjual: false,
    })
    setProcessing(false)
    if (error) { toast.error('Gagal kirim pesanan'); return }
    toast.success('Pesanan dikirim ke chat!')
    navigate(`/chat/${tokoId}`)
  }

  async function pindahKeKeranjang(item: any) {
    if (!user) return
    // Cek apakah sudah ada di keranjang
    const { data: existing } = await supabase.from('keranjang')
      .select('id, jumlah').eq('user_id', user.id).eq('produk_id', item.produk_id).single()
    if (existing) {
      await supabase.from('keranjang').update({ jumlah: existing.jumlah + 1 }).eq('id', existing.id)
    } else {
      await supabase.from('keranjang').insert({ user_id: user.id, produk_id: item.produk_id, toko_id: item.toko_id, jumlah: 1 })
    }
    toast.success('Ditambahkan ke keranjang!')
    await loadKeranjang(user.id)
    setTab('keranjang')
  }

  async function hapusWishlist(wishlistId: string) {
    await supabase.from('wishlist_produk').delete().eq('id', wishlistId)
    await loadWishlist(user.id)
    toast.success('Dihapus dari wishlist')
  }

  function totalToko(tokoId: string) {
    const group = keranjangPerToko[tokoId]
    if (!group) return 0
    return group.items.reduce((acc: number, k: any) => acc + (k.produk?.harga || 0) * k.jumlah, 0)
  }

  function totalItem() {
    return Object.values(keranjangPerToko).reduce((acc: number, g: any) => acc + g.items.reduce((a: number, k: any) => a + k.jumlah, 0), 0)
  }

  const tokoIds = Object.keys(keranjangPerToko)

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Memuat...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate('/profil')}
          className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">
          ←
        </button>
        <div className="flex-1">
          <h1 className="font-extrabold text-gray-900 text-base">Keranjang & Wishlist</h1>
          <p className="text-xs text-gray-400">{totalItem()} item di keranjang · {wishlist.length} wishlist</p>
        </div>
      </div>

      {/* Tab */}
      <div className="flex gap-2 px-4 py-3 bg-white border-b border-gray-100">
        <button onClick={() => setTab('keranjang')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition border-2 ${tab === 'keranjang' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-500 border-gray-100'}`}>
          Keranjang {totalItem() > 0 && `(${totalItem()})`}
        </button>
        <button onClick={() => setTab('wishlist')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition border-2 ${tab === 'wishlist' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-500 border-gray-100'}`}>
          Wishlist {wishlist.length > 0 && `(${wishlist.length})`}
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">

        {/* KERANJANG */}
        {tab === 'keranjang' && (
          <>
            {tokoIds.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-sm text-center mt-4">
                <span className="text-5xl mb-4 block">🛒</span>
                <h3 className="font-extrabold text-gray-900 text-lg mb-2">Keranjang kosong</h3>
                <p className="text-gray-400 text-sm mb-6">Tambahkan produk dari toko yang kamu suka</p>
                <button onClick={() => navigate('/cari')}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-3.5 rounded-2xl text-sm">
                  Jelajahi Toko
                </button>
              </div>
            ) : (
              <>
                {tokoIds.map(tokoId => {
                  const group = keranjangPerToko[tokoId]
                  const toko = group.toko
                  return (
                    <div key={tokoId} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                      {/* Header Toko */}
                      <div className="flex items-center gap-3 p-4 border-b border-gray-50">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0">
                          {toko?.jenis === 'jasa' ? '🛠️' : toko?.jenis === 'preloved' ? '♻️' : '🏪'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">{toko?.nama || 'Toko'}</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold ${toko?.is_buka ? 'text-green-600' : 'text-red-500'}`}>
                              {toko?.is_buka ? 'Buka' : 'Tutup'}
                            </span>
                            {toko?.alamat && <span className="text-xs text-gray-400 truncate">· {toko.alamat}</span>}
                          </div>
                        </div>
                        <button onClick={() => hapusSemuaToko(tokoId)}
                          className="text-xs text-red-400 hover:text-red-600 transition flex-shrink-0">
                          Hapus semua
                        </button>
                      </div>

                      {/* Item-item */}
                      <div className="divide-y divide-gray-50">
                        {group.items.map((k: any) => (
                          <div key={k.id} className="flex items-center gap-3 p-4">
                            {k.produk?.foto_url ? (
                              <img src={k.produk.foto_url} alt={k.produk.nama}
                                className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📦</div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 text-sm truncate">{k.produk?.nama}</p>
                              <p className="text-sm font-extrabold text-red-600 mt-0.5">{formatHarga(k.produk?.harga || 0)}</p>
                              {k.produk?.deskripsi && <p className="text-xs text-gray-400 truncate mt-0.5">{k.produk.deskripsi}</p>}
                            </div>
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              <button onClick={() => hapusItem(k.id)} className="text-xs text-gray-300 hover:text-red-400 transition">✕</button>
                              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
                                <button onClick={() => kurang(k.id, k.jumlah, tokoId)}
                                  className="w-7 h-7 bg-white rounded-lg flex items-center justify-center font-bold text-gray-700 shadow-sm text-sm">−</button>
                                <span className="font-extrabold text-gray-900 text-sm w-4 text-center">{k.jumlah}</span>
                                <button onClick={() => tambah(k.id, k.jumlah)}
                                  className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center font-bold text-white shadow-sm text-sm">+</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Footer Toko */}
                      <div className="p-4 bg-gray-50 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-400">Total {group.items.reduce((a: number, k: any) => a + k.jumlah, 0)} item</p>
                          <p className="font-extrabold text-gray-900">{formatHarga(totalToko(tokoId))}</p>
                        </div>
                        <button onClick={() => pesanToko(tokoId)} disabled={processing || !toko?.is_buka}
                          className="bg-gradient-to-r from-red-500 to-red-600 text-white text-sm px-5 py-2.5 rounded-xl font-bold disabled:opacity-50 transition">
                          {!toko?.is_buka ? 'Toko Tutup' : 'Pesan via Chat'}
                        </button>
                      </div>
                    </div>
                  )
                })}

                {/* Total Semua */}
                {tokoIds.length > 1 && (
                  <div className="bg-gray-900 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">{tokoIds.length} toko · {totalItem()} item</p>
                      <p className="font-extrabold text-white text-lg">
                        {formatHarga(Object.keys(keranjangPerToko).reduce((acc, id) => acc + totalToko(id), 0))}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 text-right leading-relaxed">Pesan per toko<br/>via tombol di atas</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* WISHLIST */}
        {tab === 'wishlist' && (
          <>
            {wishlist.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-sm text-center mt-4">
                <span className="text-5xl mb-4 block">🤍</span>
                <h3 className="font-extrabold text-gray-900 text-lg mb-2">Wishlist kosong</h3>
                <p className="text-gray-400 text-sm mb-6">Simpan produk incaran kamu dengan klik ikon hati</p>
                <button onClick={() => navigate('/cari')}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-3.5 rounded-2xl text-sm">
                  Jelajahi Produk
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {wishlist.map((item: any) => (
                  <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex">
                    {item.produk?.foto_url ? (
                      <img src={item.produk.foto_url} alt={item.produk?.nama}
                        className="w-24 h-24 object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-24 h-24 bg-gray-100 flex items-center justify-center text-3xl flex-shrink-0">📦</div>
                    )}
                    <div className="flex-1 p-3 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{item.produk?.nama}</p>
                      <p className="text-sm font-extrabold text-red-600 mt-0.5">{formatHarga(item.produk?.harga || 0)}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {item.toko?.jenis === 'jasa' ? '🛠️' : item.toko?.jenis === 'preloved' ? '♻️' : '🏪'} {item.toko?.nama}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => pindahKeKeranjang(item)}
                          className="flex-1 bg-red-500 text-white text-xs py-1.5 rounded-lg font-bold">
                          + Keranjang
                        </button>
                        <button onClick={() => navigate(`/toko/${item.toko_id}`)}
                          className="flex-1 border border-gray-200 text-gray-600 text-xs py-1.5 rounded-lg font-semibold">
                          Lihat Toko
                        </button>
                        <button onClick={() => hapusWishlist(item.id)}
                          className="w-8 border border-red-100 text-red-400 text-xs py-1.5 rounded-lg font-semibold">
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex shadow-lg">
        <button onClick={() => navigate('/cari')} className="flex-1 py-3 flex flex-col items-center gap-0.5">
          <span className="text-lg">🔍</span>
          <span className="text-xs font-medium text-gray-400">Cari</span>
        </button>
        <button onClick={() => navigate('/peta')} className="flex-1 py-3 flex flex-col items-center gap-0.5">
          <span className="text-lg">🗺️</span>
          <span className="text-xs font-medium text-gray-400">Peta</span>
        </button>
        <button onClick={() => navigate('/dashboard')} className="flex-1 py-3 flex flex-col items-center gap-0.5">
          <span className="text-lg">🏪</span>
          <span className="text-xs font-medium text-gray-400">Toko</span>
        </button>
        <button onClick={() => navigate('/profil')} className="flex-1 py-3 flex flex-col items-center gap-0.5">
          <span className="text-lg">👤</span>
          <span className="text-xs font-bold text-red-600">Profil</span>
        </button>
      </div>
    </div>
  )
}
