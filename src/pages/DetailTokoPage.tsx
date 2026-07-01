import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

function formatHarga(harga: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(harga)
}

export default function DetailTokoPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [toko, setToko] = useState<any>(null)
  const [produk, setProduk] = useState<any[]>([])
  const [promo, setPromo] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowed, setIsFollowed] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (id) {
      loadDetailToko()
    }
  }, [id])

  async function loadDetailToko() {
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    const uid = userData.user?.id || null
    setUserId(uid)

    const { data: tokoData, error: tokoError } = await supabase
      .from('toko')
      .select('*')
      .eq('id', id)
      .single()

    if (tokoError || !tokoData) {
      toast.error('Toko tidak ditemukan atau telah dihapus')
      navigate('/cari')
      return
    }
    setToko(tokoData)

    const [{ data: produkData }, { data: promoData }] = await Promise.all([
      supabase.from('produk').select('*').eq('toko_id', id).order('created_at', { ascending: false }),
      supabase.from('promo').select('*').eq('toko_id', id).order('created_at', { ascending: false })
    ])

    setProduk(produkData || [])
    setPromo(promoData || [])

    if (uid) {
      const [{ data: followData }, { data: wishData }] = await Promise.all([
        supabase.from('langganan_toko').select('id').eq('user_id', uid).eq('toko_id', id).maybeSingle(),
        supabase.from('wishlist_produk').select('produk_id').eq('user_id', uid).eq('toko_id', id)
      ])
      setIsFollowed(!!followData)
      setWishlistIds(new Set((wishData || []).map((w: any) => w.produk_id)))
    }

    setLoading(false)
  }

  async function toggleFollow() {
    if (!userId) { toast.error('Silakan login terlebih dahulu'); navigate('/login'); return }
    if (isFollowed) {
      await supabase.from('langganan_toko').delete().eq('user_id', userId).eq('toko_id', id)
      setIsFollowed(false)
      toast.success('Batal mengikuti toko')
    } else {
      await supabase.from('langganan_toko').insert({ user_id: userId, toko_id: id })
      setIsFollowed(true)
      toast.success('Berhasil mengikuti toko ❤️')
    }
  }

  async function toggleWishlist(produkId: string) {
    if (!userId) { toast.error('Silakan login terlebih dahulu'); navigate('/login'); return }
    const next = new Set(wishlistIds)
    if (next.has(produkId)) {
      await supabase.from('wishlist_produk').delete().eq('user_id', userId).eq('produk_id', produkId)
      next.delete(produkId)
      toast.success('Dihapus dari wishlist')
    } else {
      await supabase.from('wishlist_produk').insert({ user_id: userId, produk_id: produkId, toko_id: id })
      next.add(produkId)
      toast.success('Ditambahkan ke wishlist ❤️')
    }
    setWishlistIds(next)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 animate-pulse">
        <div className="w-16 h-16 bg-slate-200 rounded-full" />
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="h-3 bg-slate-200 rounded w-1/4" />
      </div>
    )
  }

  const temaWarna = toko?.jenis === 'jasa' ? 'blue' : toko?.jenis === 'preloved' ? 'purple' : 'green'
  const configTema = {
    green: { bg: 'bg-green-600', hover: 'hover:bg-green-700', text: 'text-green-600', light: 'bg-green-50', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100', border: 'border-green-100' },
    blue: { bg: 'bg-blue-600', hover: 'hover:bg-blue-700', text: 'text-blue-600', light: 'bg-blue-50', badge: 'bg-blue-50 text-blue-700 border-blue-100', border: 'border-blue-100' },
    purple: { bg: 'bg-purple-600', hover: 'hover:bg-purple-700', text: 'text-purple-600', light: 'bg-purple-50', badge: 'bg-purple-50 text-purple-700 border-purple-100', border: 'border-purple-100' },
  }[temaWarna]

  return (
    <div className="min-h-screen bg-[#F6F9F8] pb-28 text-slate-900 font-medium antialiased">
      
      <div className="relative max-w-md mx-auto bg-white border-b border-gray-100 shadow-sm">
        <div className="h-36 w-full bg-slate-100 relative overflow-hidden">
          {toko?.foto_url ? (
            <img src={toko.foto_url} alt="" className="w-full h-full object-cover blur-md opacity-40 scale-115" />
          ) : (
            <div className={`w-full h-full ${configTema.bg} opacity-10`} />
          )}
          <button onClick={() => navigate(-1)} className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm shadow-md rounded-xl w-9 h-9 flex items-center justify-center border-none font-black text-gray-700 active:scale-90 transition">
            ←
          </button>
        </div>

        <div className="px-4 pb-4 -mt-12 relative z-10 flex flex-col items-center text-center">
          {toko?.foto_url ? (
            <img src={toko.foto_url} alt={toko.nama} className="w-24 h-24 rounded-3xl object-cover ring-4 ring-white shadow-md bg-white block" />
          ) : (
            <div className={`w-24 h-24 rounded-3xl ring-4 ring-white shadow-md flex items-center justify-center text-4xl bg-white`}>
              {toko?.jenis === 'jasa' ? '🛠️' : toko?.jenis === 'preloved' ? '♻️' : '🏪'}
            </div>
          )}

          <div className="mt-3 space-y-1 w-full max-w-xs">
            <h1 className="font-black text-lg text-slate-900 tracking-tight leading-snug flex items-center justify-center gap-1.5">
              {toko?.nama}
            </h1>
            <div className="flex items-center justify-center gap-2">
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-black uppercase ${configTema.badge}`}>
                {toko?.jenis || 'Toko'}
              </span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-black ${toko?.is_buka ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                {toko?.is_buka ? '🟢 Buka' : '🔴 Tutup'}
              </span>
            </div>
            {toko?.alamat && <p className="text-xs text-slate-400 font-semibold mt-1">📍 {toko.alamat}</p>}
            {toko?.deskripsi && <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100/60">{toko.deskripsi}</p>}
          </div>

          <div className="w-full grid grid-cols-2 gap-2 mt-4 max-w-xs">
            <button onClick={toggleFollow} className={`w-full text-xs py-3 rounded-xl font-black transition active:scale-95 border border-transparent shadow-sm flex items-center justify-center gap-1.5 ${
              isFollowed ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : `${configTema.bg} text-white ${configTema.hover}`
            }`}>
              {isFollowed ? '❤️ Diikuti' : '🤍 Ikuti'}
            </button>
            {toko?.telepon && (
              <a href={`https://wa.me/${toko.telepon.replace(/\D/g, '').replace(/^0/, '62')}`} target="_blank" rel="noreferrer" 
                 className="w-full text-xs py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black transition active:scale-95 shadow-sm text-center flex items-center justify-center gap-1.5">
                💬 WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        
        {promo.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Promo Khusus Toko 🎉</h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {promo.map((pr: any) => (
                <div key={pr.id} className="w-72 shrink-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-4 text-white shadow-md relative overflow-hidden flex flex-col justify-between h-28">
                  <div className="absolute right-[-10px] bottom-[-10px] text-6xl opacity-15 select-none">🏷️</div>
                  <div>
                    <h3 className="font-black text-sm tracking-tight">{pr.nama}</h3>
                    <p className="text-[11px] opacity-90 font-medium mt-1 line-clamp-2">{pr.deskripsi}</p>
                  </div>
                  {pr.kode_promo && (
                    <div className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg w-max border border-white/30">
                      <span className="text-[10px] font-black uppercase tracking-wider">Kode: {pr.kode_promo}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
            {toko?.jenis === 'jasa' ? 'Layanan & Jasa' : 'Katalog Produk'} ({produk.length})
          </h2>

          {produk.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center shadow-sm space-y-2">
              <span className="text-3xl block">📦</span>
              <p className="text-sm font-black text-slate-800">Katalog Masih Kosong</p>
              <p className="text-xs text-slate-400">Belum ada produk atau daftar layanan yang ditambahkan oleh pemilik usaha ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {produk.map((p: any) => (
                <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col transition duration-300 hover:shadow-md">
                  <div className="relative aspect-square w-full bg-slate-50">
                    {p.foto_url ? (
                      <img src={p.foto_url} alt={p.nama} className="w-full h-full object-cover block" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl bg-slate-100">📦</div>
                    )}
                    <button onClick={() => toggleWishlist(p.id)} className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm border-none rounded-full w-7 h-7 flex items-center justify-center cursor-pointer shadow-md text-sm active:scale-90 transition">
                      {wishlistIds.has(p.id) ? '❤️' : '🤍'}
                    </button>
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                    <div className="space-y-0.5">
                      <h3 className="font-black text-xs text-slate-900 truncate" title={p.nama}>{p.nama}</h3>
                      <p className={`font-black text-xs ${configTema.text}`}>{formatHarga(p.harga)}</p>
                      {p.deskripsi && <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mt-1 font-medium">{p.deskripsi}</p>}
                    </div>

                    <button onClick={() => navigate(`/chat/${id}`)} className={`w-full text-[10px] py-2 rounded-xl font-black text-center border active:scale-95 transition shadow-sm bg-orange-500 text-white hover:bg-orange-600 border-transparent shadow-orange-900/10`}>
                      Pesan Sekarang 💬
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 flex shadow-[0_-4px_24px_rgba(0,0,0,0.04)] z-40 max-w-md mx-auto pb-safe">
        <button onClick={() => navigate('/cari')} className="flex-1 py-3.5 flex flex-col items-center gap-1 transition active:scale-95">
          <span className="text-lg leading-none">🔍</span>
          <span className="text-[10px] font-bold text-gray-400">Cari</span>
        </button>
        <button onClick={() => navigate('/peta')} className="flex-1 py-3.5 flex flex-col items-center gap-1 transition active:scale-95">
          <span className="text-lg leading-none">🗺️</span>
          <span className="text-[10px] font-bold text-gray-400">Peta</span>
        </button>
        <button onClick={() => navigate('/dashboard')} className="flex-1 py-3.5 flex flex-col items-center gap-1 transition active:scale-95">
          <span className="text-lg leading-none">🏪</span>
          <span className="text-[10px] font-black text-green-700">Toko</span>
        </button>
        <button onClick={() => navigate('/profil')} className="flex-1 py-3.5 flex flex-col items-center gap-1 transition active:scale-95">
          <span className="text-lg leading-none">👤</span>
          <span className="text-[10px] font-bold text-gray-400">Profil</span>
        </button>
      </div>

    </div>
  )
}
