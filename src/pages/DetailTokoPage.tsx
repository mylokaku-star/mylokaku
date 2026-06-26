import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

export default function DetailTokoPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [toko, setToko] = useState<any>(null)
  const [ownerProfile, setOwnerProfile] = useState<any>(null)
  const [produk, setProduk] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [keranjang, setKeranjang] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [ulasan, setUlasan] = useState<any[]>([])
  const [ratingRata, setRatingRata] = useState(0)
  const [formUlasan, setFormUlasan] = useState({ rating: 0, komentar: '' })
  const [savingUlasan, setSavingUlasan] = useState(false)
  const [sudahUlasan, setSudahUlasan] = useState(false)
  const [showFormUlasan, setShowFormUlasan] = useState(false)
  const [profileMap, setProfileMap] = useState<Record<string, any>>({})

  // Follow & Wishlist
  const [isFollowed, setIsFollowed] = useState(false)
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())

  useEffect(() => { loadDetail() }, [id])

  async function loadDetail() {
    const { data: userData } = await supabase.auth.getUser()
    setUser(userData.user)

    const [{ data: tokoData }, { data: produkData }] = await Promise.all([
      supabase.from('toko').select('*').eq('id', id).single(),
      supabase.from('produk').select('*').eq('toko_id', id),
    ])
    setToko(tokoData)
    setProduk(produkData || [])

    if (tokoData?.user_id) {
      const { data: ownerData } = await supabase.from('profiles').select('nama, is_verified').eq('id', tokoData.user_id).single()
      setOwnerProfile(ownerData)
    }

    if (userData.user) {
      const [{ data: keranjangData }, { data: followData }, { data: wishData }] = await Promise.all([
        supabase.from('keranjang').select('*').eq('user_id', userData.user.id).eq('toko_id', id),
        supabase.from('langganan_toko').select('id').eq('user_id', userData.user.id).eq('toko_id', id).single().catch(() => ({ data: null })),
        supabase.from('wishlist_produk').select('produk_id').eq('user_id', userData.user.id),
      ])
      setKeranjang(keranjangData || [])
      setIsFollowed(!!followData)
      setWishlistIds(new Set((wishData || []).map((w: any) => w.produk_id)))
    }

    await loadUlasan(userData.user?.id)
    setLoading(false)
  }

  async function loadUlasan(userId?: string) {
    const { data } = await supabase.from('ulasan').select('*').eq('toko_id', id).order('created_at', { ascending: false })
    const list = data || []
    setUlasan(list)
    if (list.length > 0) setRatingRata(list.reduce((acc: number, u: any) => acc + u.rating, 0) / list.length)
    if (userId) setSudahUlasan(list.some((u: any) => u.user_id === userId))
    const userIds = [...new Set(list.map((u: any) => u.user_id))]
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, nama, username, is_verified').in('id', userIds)
      const map: Record<string, any> = {}
      profiles?.forEach((p: any) => { map[p.id] = p })
      setProfileMap(map)
    }
  }

  async function toggleFollow() {
    if (!user) { navigate('/login'); return }
    if (isFollowed) {
      await supabase.from('langganan_toko').delete().eq('user_id', user.id).eq('toko_id', id)
      setIsFollowed(false)
      toast.success('Berhenti mengikuti toko ini')
    } else {
      await supabase.from('langganan_toko').insert({ user_id: user.id, toko_id: id })
      setIsFollowed(true)
      toast.success('Mengikuti toko ini! Muncul di tab Favorit kamu.')
    }
  }

  async function toggleWishlist(produkId: string) {
    if (!user) { navigate('/login'); return }
    if (wishlistIds.has(produkId)) {
      await supabase.from('wishlist_produk').delete().eq('user_id', user.id).eq('produk_id', produkId)
      const next = new Set(wishlistIds); next.delete(produkId)
      setWishlistIds(next)
      toast.success('Dihapus dari wishlist')
    } else {
      await supabase.from('wishlist_produk').insert({ user_id: user.id, produk_id: produkId, toko_id: id })
      const next = new Set(wishlistIds); next.add(produkId)
      setWishlistIds(next)
      toast.success('Ditambahkan ke wishlist!')
    }
  }

  async function kirimUlasan() {
    if (!user) { navigate('/login'); return }
    if (formUlasan.rating === 0) { toast.error('Pilih rating dulu'); return }
    if (!formUlasan.komentar.trim()) { toast.error('Komentar tidak boleh kosong'); return }
    setSavingUlasan(true)
    const { error } = await supabase.from('ulasan').insert({ toko_id: id, user_id: user.id, rating: formUlasan.rating, komentar: formUlasan.komentar.trim() })
    setSavingUlasan(false)
    if (error) { toast.error('Gagal kirim ulasan') }
    else { toast.success('Ulasan berhasil dikirim!'); setFormUlasan({ rating: 0, komentar: '' }); setShowFormUlasan(false); await loadUlasan(user.id) }
  }

  async function hapusUlasan(ulasanId: string) {
    const { error } = await supabase.from('ulasan').delete().eq('id', ulasanId)
    if (!error) { toast.success('Ulasan dihapus'); await loadUlasan(user?.id) }
  }

  async function tambahKeranjang(produkItem: any) {
    if (!user) { navigate('/login'); return }
    const existing = keranjang.find(k => k.produk_id === produkItem.id)
    if (existing) {
      const { error } = await supabase.from('keranjang').update({ jumlah: existing.jumlah + 1 }).eq('id', existing.id)
      if (!error) setKeranjang(prev => prev.map(k => k.id === existing.id ? { ...k, jumlah: k.jumlah + 1 } : k))
    } else {
      const { data, error } = await supabase.from('keranjang').insert({ user_id: user.id, toko_id: id, produk_id: produkItem.id, jumlah: 1 }).select().single()
      if (!error && data) setKeranjang(prev => [...prev, data])
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

  function getJumlah(produkId: string) { return keranjang.find(k => k.produk_id === produkId)?.jumlah || 0 }
  function totalKeranjang() { return keranjang.reduce((acc, k) => acc + k.jumlah, 0) }
  function totalHarga() { return keranjang.reduce((acc, k) => { const p = produk.find(p => p.id === k.produk_id); return acc + (p?.harga || 0) * k.jumlah }, 0) }

  async function pesanSekarang() {
    if (!user) { navigate('/login'); return }
    if (keranjang.length === 0) { toast.error('Keranjang masih kosong'); return }
    const itemList = keranjang.map(k => { const p = produk.find(p => p.id === k.produk_id); return `${p?.nama} x${k.jumlah}` }).join(', ')
    await supabase.from('pesan').insert({ toko_id: id, pengirim_id: user.id, pengirim_email: user.email, pembeli_id: user.id, isi: `Halo, saya ingin memesan: ${itemList}. Apakah tersedia?`, is_penjual: false })
    navigate(`/chat/${id}`)
    toast.success('Pesanan dikirim ke chat!')
  }

  function formatHarga(harga: number) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(harga) }
  function formatTanggal(ts: string) { return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }

  function renderBintang(nilai: number, onClick?: (n: number) => void) {
    return (
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(n => (
          <button key={n} onClick={() => onClick?.(n)}
            className={`text-xl ${onClick ? 'cursor-pointer hover:scale-110 transition' : 'cursor-default'} ${n <= nilai ? 'text-yellow-400' : 'text-gray-200'}`}>★</button>
        ))}
      </div>
    )
  }

  function BadgeVerifikasi({ size = 14 }: { size?: number }) {
    return (
      <span title="Akun Terverifikasi Lokaku" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, background: '#3b82f6', color: 'white', borderRadius: '50%', fontSize: size * 0.6, fontWeight: 'bold', flexShrink: 0 }}>✓</span>
    )
  }

  const isOwner = user && toko && user.id === toko.user_id
  const isVerified = ownerProfile?.is_verified || false

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400 text-sm">Memuat...</p></div>
  if (!toko) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400 text-sm">Toko tidak ditemukan</p></div>

  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* Hero */}
      <div className="relative">
        {toko.foto_url ? (
          <img src={toko.foto_url} alt={toko.nama} className="w-full h-56 object-cover" />
        ) : (
          <div className={`w-full h-40 flex items-center justify-center text-6xl ${toko.jenis === 'jasa' ? 'bg-gradient-to-br from-blue-500 to-blue-700' : toko.jenis === 'preloved' ? 'bg-gradient-to-br from-purple-500 to-purple-700' : 'bg-gradient-to-br from-green-500 to-green-700'}`}>
            {toko.jenis === 'jasa' ? '🛠️' : toko.jenis === 'preloved' ? '♻️' : '🏪'}
          </div>
        )}
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 bg-white/90 backdrop-blur text-gray-700 px-3 py-1.5 rounded-xl text-sm font-semibold shadow">← Kembali</button>
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {/* Tombol Follow */}
          {!isOwner && (
            <button onClick={toggleFollow}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow transition ${isFollowed ? 'bg-red-500 text-white' : 'bg-white/90 backdrop-blur text-gray-700'}`}>
              {isFollowed ? '❤️ Mengikuti' : '🤍 Ikuti'}
            </button>
          )}
          <span className={`text-xs px-3 py-1.5 rounded-xl font-bold shadow ${toko.is_buka ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {toko.is_buka ? 'BUKA' : 'TUTUP'}
          </span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* Info Toko */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-extrabold text-gray-900 text-xl">{toko.nama}</h1>
              {isVerified && <BadgeVerifikasi size={18} />}
            </div>
            {toko.jenis === 'jasa' && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold ml-2 flex-shrink-0">Jasa</span>}
            {toko.jenis === 'preloved' && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold ml-2 flex-shrink-0">Preloved</span>}
          </div>

          {isVerified && (
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">✓ Penjual Terverifikasi</span>
            </div>
          )}

          <span className="inline-block text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-semibold mb-2">{toko.kategori}</span>

          {ulasan.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              {renderBintang(Math.round(ratingRata))}
              <span className="text-sm font-bold text-gray-700">{ratingRata.toFixed(1)}</span>
              <span className="text-xs text-gray-400">({ulasan.length} ulasan)</span>
            </div>
          )}

          {toko.alamat && <p className="text-sm text-gray-500 mb-2">📍 {toko.alamat}</p>}
          {toko.deskripsi && <p className="text-sm text-gray-500 leading-relaxed mb-3">{toko.deskripsi}</p>}

          {!isOwner && (
            <div className="flex gap-2">
              <button onClick={() => navigate(`/chat/${toko.id}`)}
                className={`flex-1 text-white rounded-2xl py-3 text-sm font-bold transition shadow-sm ${toko.jenis === 'jasa' ? 'bg-blue-600 hover:bg-blue-700' : toko.jenis === 'preloved' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700'}`}>
                💬 {toko.jenis === 'jasa' ? 'Hubungi Penyedia' : 'Chat Penjual'}
              </button>
              <button onClick={toggleFollow}
                className={`px-4 rounded-2xl py-3 text-sm font-bold transition border-2 ${isFollowed ? 'bg-red-50 border-red-200 text-red-500' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                {isFollowed ? '❤️' : '🤍'}
              </button>
            </div>
          )}
        </div>

        {/* Produk */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-gray-900">{toko.jenis === 'jasa' ? 'Layanan' : toko.jenis === 'preloved' ? 'Barang Dijual' : 'Produk & Layanan'}</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full font-semibold">{produk.length} item</span>
          </div>
          {produk.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center">
              <span className="text-4xl mb-2 block">{toko.jenis === 'jasa' ? '🛠️' : toko.jenis === 'preloved' ? '♻️' : '📦'}</span>
              <p className="text-gray-400 text-sm">Belum ada {toko.jenis === 'jasa' ? 'layanan' : 'produk'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {produk.map(p => {
                const jumlah = getJumlah(p.id)
                return (
                  <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="relative">
                      {p.foto_url && <img src={p.foto_url} alt={p.nama} className="w-full h-36 object-cover" />}
                      {/* Tombol Wishlist */}
                      {!isOwner && (
                        <button onClick={() => toggleWishlist(p.id)}
                          className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow text-sm">
                          {wishlistIds.has(p.id) ? '❤️' : '🤍'}
                        </button>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-sm">{p.nama}</h3>
                      {p.deskripsi && <p className="text-xs text-gray-400 mt-0.5">{p.deskripsi}</p>}
                      <span className="text-sm font-extrabold text-red-600 mt-1 block">{formatHarga(p.harga)}</span>
                      {!isOwner && (jumlah === 0 ? (
                        <button onClick={() => tambahKeranjang(p)} className="w-full mt-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl py-2.5 text-sm font-bold transition hover:from-red-600 hover:to-red-700">
                          Tambah ke Keranjang
                        </button>
                      ) : (
                        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-1 mt-3">
                          <button onClick={() => kurangKeranjang(p)} className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-gray-700 shadow-sm hover:bg-gray-100 transition text-lg">−</button>
                          <span className="font-extrabold text-gray-900">{jumlah}</span>
                          <button onClick={() => tambahKeranjang(p)} className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center font-bold text-white shadow-sm hover:bg-red-700 transition text-lg">+</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Ulasan */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-gray-900">Rating & Ulasan</h2>
            {ulasan.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-400 text-sm">★</span>
                <span className="text-sm font-bold text-gray-700">{ratingRata.toFixed(1)}</span>
                <span className="text-xs text-gray-400">/ 5</span>
              </div>
            )}
          </div>

          {!isOwner && user && !sudahUlasan && (
            <button onClick={() => setShowFormUlasan(!showFormUlasan)} className="w-full mb-3 border-2 border-dashed border-yellow-300 bg-yellow-50 text-yellow-700 text-sm py-3 rounded-2xl font-semibold hover:bg-yellow-100 transition">
              Tulis Ulasan
            </button>
          )}
          {!user && (
            <button onClick={() => navigate('/login')} className="w-full mb-3 border-2 border-dashed border-gray-200 text-gray-400 text-sm py-3 rounded-2xl font-semibold hover:bg-gray-50 transition">
              Login untuk memberikan ulasan
            </button>
          )}

          {showFormUlasan && (
            <div className="bg-white rounded-3xl border border-yellow-100 shadow-sm p-5 mb-3">
              <p className="text-sm font-bold text-gray-700 mb-3">Berikan Ulasanmu</p>
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-1.5">Rating</p>
                {renderBintang(formUlasan.rating, n => setFormUlasan(f => ({ ...f, rating: n })))}
                {formUlasan.rating > 0 && <p className="text-xs text-yellow-600 mt-1 font-semibold">{['','Sangat Buruk','Buruk','Cukup','Bagus','Sangat Bagus'][formUlasan.rating]}</p>}
              </div>
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-1.5">Komentar</p>
                <textarea value={formUlasan.komentar} onChange={e => setFormUlasan(f => ({ ...f, komentar: e.target.value }))}
                  placeholder="Ceritakan pengalamanmu..." rows={3}
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400 bg-gray-50 transition resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowFormUlasan(false)} className="flex-1 border-2 border-gray-100 text-gray-500 text-sm py-2.5 rounded-xl font-semibold">Batal</button>
                <button onClick={kirimUlasan} disabled={savingUlasan} className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-white text-sm py-2.5 rounded-xl font-bold disabled:opacity-50">
                  {savingUlasan ? 'Mengirim...' : 'Kirim Ulasan'}
                </button>
              </div>
            </div>
          )}

          {ulasan.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center">
              <span className="text-4xl mb-2 block">⭐</span>
              <p className="text-gray-400 text-sm">Belum ada ulasan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ulasan.map(u => {
                const uProfile = profileMap[u.user_id]
                return (
                  <div key={u.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {(uProfile?.nama || 'P').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-gray-800">{uProfile?.nama || 'Pengguna'}</p>
                            {uProfile?.is_verified && (
                              <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:13, height:13, background:'#3b82f6', color:'white', borderRadius:'50%', fontSize:8, fontWeight:'bold' }}>✓</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{formatTanggal(u.created_at)}</p>
                        </div>
                      </div>
                      {user && u.user_id === user.id && (
                        <button onClick={() => hapusUlasan(u.id)} className="text-xs text-red-400 hover:text-red-600 transition">Hapus</button>
                      )}
                    </div>
                    {renderBintang(u.rating)}
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{u.komentar}</p>
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
            <button onClick={pesanSekarang} className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl py-3.5 text-sm font-extrabold transition shadow-lg hover:from-red-600 hover:to-red-700">
              Pesan Sekarang ({totalKeranjang()})
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
