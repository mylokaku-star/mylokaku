import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { KATEGORI_TOKO, KATEGORI_JASA, KATEGORI_PRELOVED } from '../lib/kategori'
import PromoSlider from '../components/PromoSlider'
import { toast } from 'sonner'

function hitungJarak(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos((lat1*Math.PI)/180)*Math.cos((lat2*Math.PI)/180)*Math.sin(dLng/2)*Math.sin(dLng/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}
function formatJarak(km: number) { return km < 1 ? `${Math.round(km*1000)} m` : `${km.toFixed(1)} km` }
function formatHarga(harga: number) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(harga) }

type JenisFilter = 'semua' | 'toko' | 'jasa' | 'preloved' | 'favorit'

const JENIS_CONFIG: Record<JenisFilter, { icon: string; label: string; activeClass: string }> = {
  semua:    { icon: '🏠', label: 'Semua',    activeClass: 'bg-[#0D5C3A] text-white border-[#0D5C3A]' },
  toko:     { icon: '🏪', label: 'Toko',     activeClass: 'bg-[#0D5C3A] text-white border-[#0D5C3A]' },
  jasa:     { icon: '🛠️', label: 'Jasa',     activeClass: 'bg-blue-600 text-white border-blue-600' },
  preloved: { icon: '♻️', label: 'Preloved', activeClass: 'bg-purple-600 text-white border-purple-600' },
  favorit:  { icon: '❤️', label: 'Favorit',  activeClass: 'bg-rose-500 text-white border-rose-500' },
}

function getJenisInfo(t: any) {
  if (t.jenis === 'jasa') return {
    label: 'Jasa', status: 'TERSEDIA',
    badgeStyle: 'bg-blue-50 text-blue-700',
    cardGradient: 'from-blue-50 to-blue-100/50',
    primaryBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
  }
  if (t.jenis === 'preloved') return {
    label: 'Preloved', status: 'DIJUAL',
    badgeStyle: 'bg-purple-50 text-purple-700',
    cardGradient: 'from-purple-50 to-purple-100/50',
    primaryBtn: 'bg-purple-600 hover:bg-purple-700 text-white',
  }
  return {
    label: 'Toko', status: 'BUKA',
    badgeStyle: 'bg-green-50 text-[#0D5C3A]',
    cardGradient: 'from-green-50 to-green-100/50',
    primaryBtn: 'bg-[#0D5C3A] hover:bg-[#0A472D] text-white',
  }
}

function getIconKategori(jenis: JenisFilter, contohToko?: any) {
  if (jenis !== 'semua' && jenis !== 'favorit') return JENIS_CONFIG[jenis].icon
  if (contohToko?.jenis === 'jasa') return '🛠️'
  if (contohToko?.jenis === 'preloved') return '♻️'
  return '🏪'
}

function ShimmerCard() {
  return (
    <div className="w-[170px] flex-shrink-0 bg-white rounded-2xl border border-gray-100 p-3 space-y-3 shadow-sm animate-pulse">
      <div className="w-full h-24 bg-gray-200 rounded-xl"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        <div className="h-2 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="h-7 bg-gray-200 rounded-lg"></div>
        <div className="h-7 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  )
}

function TokoCard({ t, userLat, userLng, onDetail, onChat, isFollowed, onToggleFollow }: {
  t: any; userLat: number | null; userLng: number | null
  onDetail: (id: string) => void; onChat: (id: string) => void
  isFollowed: boolean; onToggleFollow: ((id: string) => void) | null
}) {
  const info = getJenisInfo(t)
  const jarak = userLat && userLng && t.lat && t.lng ? hitungJarak(userLat, userLng, t.lat, t.lng) : null
  return (
    <div className="w-[170px] flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between transition-all duration-200 active:scale-95 snap-start select-none">
      <div className="relative group">
        {t.foto_url ? (
          <img src={t.foto_url} alt={t.nama} className="w-full h-28 object-cover block pointer-events-none" />
        ) : (
          <div className={`w-full h-28 flex items-center justify-center text-3xl bg-gradient-to-br ${info.cardGradient}`}>
            {t.jenis === 'jasa' ? '🛠️' : t.jenis === 'preloved' ? '♻️' : '🏪'}
          </div>
        )}
        {onToggleFollow && (
          <button onClick={(e) => { e.stopPropagation(); onToggleFollow(t.id) }}
            className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm border-none rounded-full w-7 h-7 flex items-center justify-center cursor-pointer shadow-sm active:scale-90 transition-transform text-sm">
            {isFollowed ? '❤️' : '🤍'}
          </button>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col justify-between gap-2">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="font-bold text-xs text-gray-900 truncate flex-1" title={t.nama}>{t.nama}</span>
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black flex-shrink-0 ${info.badgeStyle}`}>{info.status}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold mb-1">
            <span>{info.label}</span>
            {jarak !== null && <span className="text-[#0D5C3A]">📍 {formatJarak(jarak)}</span>}
          </div>
          {t.alamat && <p className="text-[10px] text-gray-400 truncate">🏠 {t.alamat}</p>}
        </div>
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <button onClick={() => onDetail(t.id)} className={`text-[11px] py-2 rounded-xl font-bold border-none cursor-pointer text-center transition-colors ${info.primaryBtn}`}>
            {t.jenis === 'jasa' ? 'Detail' : 'Toko'}
          </button>
          <button onClick={() => onChat(t.id)} className="bg-[#F2994A] hover:bg-[#D06D19] text-white text-[11px] py-2 rounded-xl font-bold border-none cursor-pointer flex items-center justify-center gap-0.5 transition-colors">
            Chat 💬
          </button>
        </div>
      </div>
    </div>
  )
}

function ProdukCard({ p, userLat, userLng, onDetail, onChat, isWishlisted, onToggleWishlist, onTambahKeranjang, userId }: {
  p: any; userLat: number | null; userLng: number | null
  onDetail: (id: string) => void; onChat: (id: string) => void
  isWishlisted: boolean; onToggleWishlist: ((produkId: string, tokoId: string) => void) | null
  onTambahKeranjang: ((produkId: string, tokoId: string) => void) | null
  userId: string | null
}) {
  const jarak = userLat && userLng && p.toko?.lat && p.toko?.lng ? hitungJarak(userLat, userLng, p.toko.lat, p.toko.lng) : null
  return (
    <div className="w-[170px] flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between transition-all duration-200 active:scale-95 snap-start select-none">
      <div className="relative">
        {p.foto_url ? (
          <img src={p.foto_url} alt={p.nama} className="w-full h-28 object-cover block pointer-events-none" />
        ) : (
          <div className="w-full h-28 flex items-center justify-center text-3xl bg-gradient-to-br from-purple-50 to-purple-100/60">♻️</div>
        )}
        {onToggleWishlist && (
          <button onClick={(e) => { e.stopPropagation(); onToggleWishlist(p.id, p.toko_id) }}
            className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm border-none rounded-full w-7 h-7 flex items-center justify-center cursor-pointer shadow-sm active:scale-90 transition-transform text-sm">
            {isWishlisted ? '❤️' : '🤍'}
          </button>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col justify-between gap-2">
        <div>
          <span className="font-bold text-xs text-gray-900 truncate block" title={p.nama}>{p.nama}</span>
          <span className="font-extrabold text-xs text-purple-700 block mt-0.5">{formatHarga(p.harga)}</span>
          <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold mt-1">
            <span className="truncate max-w-[90px]">🏪 {p.toko?.nama || '-'}</span>
            {jarak !== null && <span className="text-purple-600 flex-shrink-0">📍 {formatJarak(jarak)}</span>}
          </div>
        </div>
        {/* 3 tombol: Detail, Keranjang, Chat */}
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onDetail(p.toko_id)}
              className="bg-purple-600 hover:bg-purple-700 text-white text-[11px] py-2 rounded-xl font-bold border-none cursor-pointer text-center transition-colors">
              Lihat Toko
            </button>
            <button
              onClick={() => onChat(p.toko_id)}
              className="bg-[#F2994A] hover:bg-[#D06D19] text-white text-[11px] py-2 rounded-xl font-bold border-none cursor-pointer text-center transition-colors">
              Chat 💬
            </button>
          </div>
          {onTambahKeranjang && (
            <button
              onClick={(e) => { e.stopPropagation(); onTambahKeranjang(p.id, p.toko_id) }}
              className="w-full bg-red-500 hover:bg-red-600 text-white text-[11px] py-2 rounded-xl font-bold border-none cursor-pointer transition-colors flex items-center justify-center gap-1">
              🛒 + Keranjang
            </button>
          )}
          {!userId && (
            <button
              onClick={() => onDetail(p.toko_id)}
              className="w-full bg-gray-100 text-gray-500 text-[11px] py-2 rounded-xl font-semibold border-none cursor-pointer transition-colors">
              Login untuk beli
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ScrollStrip({ children, title, icon, count }: {
  children: React.ReactNode; title: string; icon: string; count: number
}) {
  return (
    <section className="mb-2">
      <div className="sticky top-[108px] z-30 bg-[#F9FBFA]/95 backdrop-blur-md py-2.5 px-4 mb-2 border-y border-gray-100/60 flex justify-between items-center">
        <h2 className="text-xs font-black text-gray-800 flex items-center gap-1.5 uppercase tracking-wider">
          <span className="text-sm">{icon}</span>{title}
        </h2>
        <span className="text-[10px] font-bold text-[#0D5C3A] bg-green-50 px-2 py-0.5 rounded-full">
          {count} Layanan
        </span>
      </div>
      <div className="overflow-x-auto w-full no-scrollbar snap-x snap-mandatory scroll-smooth">
        <div className="flex gap-3 px-4 pb-4 w-max">
          {children}
        </div>
      </div>
    </section>
  )
}

export default function CariTokoPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [toko, setToko] = useState<any[]>([])
  const [produkPreloved, setProdukPreloved] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [filteredProduk, setFilteredProduk] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [kategori, setKategori] = useState('')
  const [jenis, setJenis] = useState<JenisFilter>(() => {
    const param = searchParams.get('kategori')
    if (param === 'preloved' || param === 'toko' || param === 'jasa') return param
    return 'semua'
  })
  const [loading, setLoading] = useState(true)
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLng, setUserLng] = useState<number | null>(null)
  const [sortByJarak, setSortByJarak] = useState(false)
  const [showKategori, setShowKategori] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set())
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())
  const [tokoFavorit, setTokoFavorit] = useState<any[]>([])
  const [produkWishlist, setProdukWishlist] = useState<any[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [isSearchInputFocused, setIsSearchInputFocused] = useState(false)
  const [visibleTokoCount, setVisibleTokoCount] = useState(4)
  const [visibleProdukCount, setVisibleProdukCount] = useState(4)
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const history = localStorage.getItem('lokaku_search_history')
    if (history) setSearchHistory(JSON.parse(history))
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude) },
      () => {}
    )
    loadData()
  }, [])

  useEffect(() => { filter(); setVisibleTokoCount(4); setVisibleProdukCount(4) }, [search, kategori, jenis, toko, produkPreloved, sortByJarak, userLat, userLng])
  useEffect(() => { setKategori('') }, [jenis])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleTokoCount(prev => prev + 4)
          setVisibleProdukCount(prev => prev + 4)
        }
      },
      { threshold: 0.1 }
    )
    if (loaderRef.current) observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [filtered, filteredProduk])

  const simpanKataKunciKeHistori = (kataKunci: string) => {
    if (!kataKunci.trim()) return
    const cleaned = kataKunci.trim()
    const updated = [cleaned, ...searchHistory.filter(h => h !== cleaned)].slice(0, 5)
    setSearchHistory(updated)
    localStorage.setItem('lokaku_search_history', JSON.stringify(updated))
  }

  const hapusSemuaHistori = () => {
    setSearchHistory([])
    localStorage.removeItem('lokaku_search_history')
  }

  async function loadData() {
    const { data: userData } = await supabase.auth.getUser()
    const uid = userData.user?.id || null
    setUserId(uid)
    const [{ data: tokoData }, { data: produkData }] = await Promise.all([
      supabase.from('toko').select('*').eq('is_buka', true).in('jenis', ['toko', 'jasa', 'preloved']).order('created_at', { ascending: false }),
      supabase.from('produk').select('id, nama, harga, deskripsi, foto_url, kategori, toko_id, toko:toko_id(id, nama, lat, lng, alamat, is_buka, jenis)').order('created_at', { ascending: false }),
    ])
    const allToko = tokoData || []
    const produkAktif = (produkData || []).filter((p: any) => p.toko?.jenis === 'preloved' && p.toko?.is_buka === true)
    setToko(allToko)
    setProdukPreloved(produkAktif)
    if (uid) await loadFavorit(uid, allToko, produkAktif)
    setLoading(false)
  }

  async function loadFavorit(uid: string, allToko: any[], allProduk: any[]) {
    const [{ data: followData }, { data: wishData }] = await Promise.all([
      supabase.from('langganan_toko').select('toko_id').eq('user_id', uid),
      supabase.from('wishlist_produk').select('produk_id').eq('user_id', uid),
    ])
    const fids = new Set((followData || []).map((f: any) => f.toko_id as string))
    const wids = new Set((wishData || []).map((w: any) => w.produk_id as string))
    setFollowedIds(fids)
    setWishlistIds(wids)
    setTokoFavorit(allToko.filter((t: any) => fids.has(t.id)))
    setProdukWishlist(allProduk.filter((p: any) => wids.has(p.id)))
  }

  async function toggleFollow(tokoId: string) {
    if (!userId) { navigate('/login'); return }
    if (followedIds.has(tokoId)) {
      await supabase.from('langganan_toko').delete().eq('user_id', userId).eq('toko_id', tokoId)
      const next = new Set(followedIds); next.delete(tokoId)
      setFollowedIds(next)
      setTokoFavorit(prev => prev.filter((t: any) => t.id !== tokoId))
    } else {
      await supabase.from('langganan_toko').insert({ user_id: userId, toko_id: tokoId })
      const next = new Set(followedIds); next.add(tokoId)
      setFollowedIds(next)
      const t = toko.find((t: any) => t.id === tokoId)
      if (t) setTokoFavorit(prev => [...prev, t])
    }
  }

  async function toggleWishlist(produkId: string, tokoId: string) {
    if (!userId) { navigate('/login'); return }
    if (wishlistIds.has(produkId)) {
      await supabase.from('wishlist_produk').delete().eq('user_id', userId).eq('produk_id', produkId)
      const next = new Set(wishlistIds); next.delete(produkId)
      setWishlistIds(next)
      setProdukWishlist(prev => prev.filter((p: any) => p.id !== produkId))
    } else {
      await supabase.from('wishlist_produk').insert({ user_id: userId, produk_id: produkId, toko_id: tokoId })
      const next = new Set(wishlistIds); next.add(produkId)
      setWishlistIds(next)
      const p = produkPreloved.find((p: any) => p.id === produkId)
      if (p) setProdukWishlist(prev => [...prev, p])
    }
  }

  async function tambahKeranjang(produkId: string, tokoId: string) {
    if (!userId) { navigate('/login'); return }
    const { data: existing } = await supabase.from('keranjang')
      .select('id, jumlah').eq('user_id', userId).eq('produk_id', produkId).maybeSingle()
    if (existing) {
      await supabase.from('keranjang').update({ jumlah: existing.jumlah + 1 }).eq('id', existing.id)
    } else {
      await supabase.from('keranjang').insert({ user_id: userId, produk_id: produkId, toko_id: tokoId, jumlah: 1 })
    }
    toast.success('Ditambahkan ke keranjang!', {
      action: { label: 'Lihat', onClick: () => navigate('/keranjang') }
    })
  }

  function filter() {
    let hasilToko = [...toko]
    if (jenis === 'toko') hasilToko = hasilToko.filter((t: any) => !t.jenis || t.jenis === 'toko')
    else if (jenis === 'jasa') hasilToko = hasilToko.filter((t: any) => t.jenis === 'jasa')
    else if (jenis === 'preloved' || jenis === 'favorit') hasilToko = []
    else hasilToko = hasilToko.filter((t: any) => t.jenis !== 'preloved')
    if (search && jenis !== 'preloved' && jenis !== 'favorit')
      hasilToko = hasilToko.filter((t: any) => t.nama?.toLowerCase().includes(search.toLowerCase()) || t.kategori?.toLowerCase().includes(search.toLowerCase()))
    if (kategori && jenis !== 'preloved' && jenis !== 'favorit')
      hasilToko = hasilToko.filter((t: any) => t.kategori === kategori)
    if (sortByJarak && userLat && userLng && jenis !== 'preloved' && jenis !== 'favorit')
      hasilToko = hasilToko.map((t: any) => ({ ...t, jarak: t.lat && t.lng ? hitungJarak(userLat, userLng, t.lat, t.lng) : 9999 })).sort((a: any, b: any) => a.jarak - b.jarak)
    setFiltered(hasilToko)

    let hasilProduk = [...produkPreloved]
    if (jenis !== 'preloved' && jenis !== 'semua' && jenis !== 'favorit') hasilProduk = []
    if (search && (jenis === 'preloved' || jenis === 'semua'))
      hasilProduk = hasilProduk.filter((p: any) => p.nama?.toLowerCase().includes(search.toLowerCase()) || p.toko?.nama?.toLowerCase().includes(search.toLowerCase()))
    if (kategori && (jenis === 'preloved' || jenis === 'semua'))
      hasilProduk = hasilProduk.filter((p: any) => p.kategori === kategori)
    if (sortByJarak && userLat && userLng && (jenis === 'preloved' || jenis === 'semua'))
      hasilProduk = hasilProduk.map((p: any) => ({ ...p, jarak: p.toko?.lat && p.toko?.lng ? hitungJarak(userLat, userLng, p.toko.lat, p.toko.lng) : 9999 })).sort((a: any, b: any) => a.jarak - b.jarak)
    setFilteredProduk(hasilProduk)
  }

  const filteredGrouped = filtered.reduce((g: Record<string, any[]>, t: any) => { const k = t.kategori || 'Lainnya'; if (!g[k]) g[k] = []; g[k].push(t); return g }, {})
  const produkGrouped = filteredProduk.reduce((g: Record<string, any[]>, p: any) => { const k = p.kategori || 'Lainnya'; if (!g[k]) g[k] = []; g[k].push(p); return g }, {})
  const masterKategoriList = jenis === 'jasa' ? KATEGORI_JASA : jenis === 'toko' ? KATEGORI_TOKO : jenis === 'preloved' ? KATEGORI_PRELOVED : [...KATEGORI_TOKO, ...KATEGORI_JASA, ...KATEGORI_PRELOVED]
  const masterKategoriFlat = masterKategoriList.flatMap(g => g.items)
  const sortedTokoKeys = [...masterKategoriFlat.filter(k => filteredGrouped[k]), ...Object.keys(filteredGrouped).filter(k => !masterKategoriFlat.includes(k))]
  const visibleTokoKeys = sortedTokoKeys.slice(0, visibleTokoCount)
  const kategoriPreloved = KATEGORI_PRELOVED.flatMap(g => g.items)
  const sortedProdukKeys = [...kategoriPreloved.filter(k => produkGrouped[k]), ...Object.keys(produkGrouped).filter(k => !kategoriPreloved.includes(k))]
  const visibleProdukKeys = sortedProdukKeys.slice(0, visibleProdukCount)
  const grupList = jenis === 'jasa' ? KATEGORI_JASA : jenis === 'toko' ? KATEGORI_TOKO : jenis === 'preloved' ? KATEGORI_PRELOVED : [...KATEGORI_TOKO, ...KATEGORI_JASA, ...KATEGORI_PRELOVED]
  const adaHasil = jenis === 'preloved' ? filteredProduk.length > 0 : jenis === 'semua' ? filtered.length > 0 || filteredProduk.length > 0 : filtered.length > 0
  const adaFavorit = tokoFavorit.length > 0 || produkWishlist.length > 0

  return (
    <div className="min-h-screen bg-[#F9FBFA] pb-24 antialiased text-gray-900 scroll-smooth">

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md px-4 pt-4 pb-3 sticky top-0 z-50 border-b border-gray-100/60 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0D5C3A] rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">L</div>
            <div>
              <span className="font-black text-gray-950 text-sm tracking-tight">lokaku<span className="text-[#0D5C3A]">.id</span></span>
              <p className="text-[10px] text-gray-400 font-medium leading-none">Radar Layanan Sekitar</p>
            </div>
          </div>
          {userLat && (
            <button onClick={() => setSortByJarak(!sortByJarak)}
              className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition-all active:scale-95 shadow-sm ${sortByJarak ? 'bg-[#0D5C3A] text-white border-[#0D5C3A]' : 'bg-white text-gray-500 border-gray-200'}`}>
              📍 Terdekat
            </button>
          )}
        </div>

        {jenis !== 'favorit' && (
          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              value={search}
              onFocus={() => setIsSearchInputFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchInputFocused(false), 200)}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && simpanKataKunciKeHistori(search)}
              placeholder={jenis === 'preloved' ? 'Cari barang bekas/preloved...' : 'Ketik toko, jasa panggilan, warung...'}
              className="w-full border border-gray-200 bg-gray-50 rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none focus:border-[#0D5C3A] focus:bg-white transition-all font-medium text-gray-800" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600">✕</button>
            )}
          </div>
        )}

        {isSearchInputFocused && jenis !== 'favorit' && (
          <div className="absolute left-0 right-0 bg-white border-b border-gray-200 shadow-xl px-4 py-3 z-50 space-y-3">
            {searchHistory.length > 0 ? (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Terakhir Dicari</span>
                  <button onClick={hapusSemuaHistori} className="text-[10px] font-bold text-red-500 hover:underline">Hapus</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {searchHistory.map((h, i) => (
                    <button key={i} onClick={() => setSearch(h)} className="text-[11px] bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full text-gray-700 font-medium border border-gray-100">
                      ⏱️ {h}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 text-center py-1 font-medium">Belum ada riwayat pencarian.</p>
            )}
            <div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">Paling Banyak Dicari</span>
              <div className="flex flex-wrap gap-1.5">
                {['Sol Sepatu', 'LPG Keliling', 'Sembako Madura', 'Jasa AC', 'Baju Anak'].map((populer) => (
                  <button key={populer} onClick={() => { setSearch(populer); simpanKataKunciKeHistori(populer) }} className="text-[11px] bg-green-50/60 hover:bg-green-50 text-[#0D5C3A] px-3 py-1.5 rounded-full font-bold border border-green-100/50">
                    🔥 {populer}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-1.5 overflow-x-auto no-scrollbar pb-1">
          {(Object.entries(JENIS_CONFIG) as [JenisFilter, typeof JENIS_CONFIG.semua][]).map(([j, cfg]) => (
            <button key={j} onClick={() => setJenis(j)}
              className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl border font-bold transition-all flex-shrink-0 active:scale-95 ${jenis === j ? cfg.activeClass : 'bg-white text-gray-500 border-gray-200/80'}`}>
              <span>{cfg.icon}</span> {cfg.label}
            </button>
          ))}
          {jenis !== 'favorit' && (
            <button onClick={() => setShowKategori(!showKategori)}
              className={`flex items-center gap-1 text-xs px-3 py-2 rounded-xl border font-bold transition-all flex-shrink-0 ml-auto active:scale-95 ${kategori ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-white text-gray-500 border-gray-200'}`}>
              {kategori ? '✕ Reset' : '☰ Kategori'}
            </button>
          )}
        </div>
        {kategori && <span className="inline-block text-[10px] bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full font-bold border border-rose-100 mt-1">Saringan: {kategori}</span>}
      </div>

      {/* Modal Kategori */}
      {showKategori && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowKategori(false)}>
          <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl max-h-[75vh] overflow-y-auto p-6 flex flex-col gap-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-black text-sm text-gray-900 uppercase tracking-wide">Pilih Kategori</h3>
              <button onClick={() => setShowKategori(false)} className="text-gray-400 text-lg font-bold">✕</button>
            </div>
            <button onClick={() => { setKategori(''); setShowKategori(false) }}
              className="w-full text-left py-2.5 px-3 hover:bg-gray-50 rounded-xl font-bold text-xs text-rose-600 bg-rose-50/50">
              ✨ Semua Kategori (Reset)
            </button>
            <div className="space-y-4">
              {grupList.map(grup => (
                <div key={grup.grup} className="space-y-1.5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{grup.grup}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {grup.items.map(item => (
                      <button key={item} onClick={() => { setKategori(item); setShowKategori(false) }}
                        className={`text-left text-xs p-2.5 rounded-xl border transition-colors truncate font-semibold ${kategori === item ? 'bg-[#0D5C3A]/10 text-[#0D5C3A] border-[#0D5C3A]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
                        🔹 {item}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="py-4 space-y-4">

        {/* Tab Favorit */}
        {jenis === 'favorit' && (
          <div className="space-y-4">
            {!userId ? (
              <div className="text-center py-16 px-4 bg-white rounded-2xl mx-4 border border-gray-100 shadow-sm">
                <p className="text-4xl mb-2">❤️</p>
                <p className="text-gray-800 font-bold text-sm">Masuk Akun Terlebih Dahulu</p>
                <button onClick={() => navigate('/login')} className="mt-4 bg-[#0D5C3A] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-sm">Login Sekarang</button>
              </div>
            ) : !adaFavorit ? (
              <div className="text-center py-16 px-4 bg-white rounded-2xl mx-4 border border-gray-100 shadow-sm">
                <p className="text-4xl mb-2">🤍</p>
                <p className="text-gray-800 font-bold text-sm">Belum Ada yang Disimpan</p>
                <p className="text-gray-400 text-xs mt-1">Klik ikon hati di toko atau produk</p>
              </div>
            ) : (
              <>
                {tokoFavorit.length > 0 && (
                  <ScrollStrip title="Toko & Jasa Langganan" icon="🏪" count={tokoFavorit.length}>
                    {tokoFavorit.map((t: any) => (
                      <TokoCard key={t.id} t={t} userLat={userLat} userLng={userLng}
                        onDetail={(id: string) => navigate(`/toko/${id}`)}
                        onChat={(id: string) => navigate(`/chat/${id}`)}
                        isFollowed={followedIds.has(t.id)} onToggleFollow={toggleFollow} />
                    ))}
                  </ScrollStrip>
                )}
                {produkWishlist.length > 0 && (
                  <ScrollStrip title="Produk Preloved Disimpan" icon="🛍️" count={produkWishlist.length}>
                    {produkWishlist.map((p: any) => (
                      <ProdukCard key={p.id} p={p} userLat={userLat} userLng={userLng}
                        onDetail={(id: string) => navigate(`/toko/${id}`)}
                        onChat={(id: string) => navigate(`/chat/${id}`)}
                        isWishlisted={wishlistIds.has(p.id)} onToggleWishlist={toggleWishlist}
                        onTambahKeranjang={userId ? tambahKeranjang : null} userId={userId} />
                    ))}
                  </ScrollStrip>
                )}
              </>
            )}
          </div>
        )}

        {/* Pencarian Utama */}
        {jenis !== 'favorit' && (
          <>
            {jenis === 'semua' && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Promo & Berita Warga</p>
                <PromoSlider lat={userLat} lng={userLng} />
              </div>
            )}

            {loading ? (
              <div className="space-y-4 px-4">
                <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                  {[1,2,3].map((n) => <ShimmerCard key={n} />)}
                </div>
              </div>
            ) : !adaHasil ? (
              <div className="text-center py-14 px-6 bg-white rounded-3xl mx-4 border border-gray-100 shadow-sm flex flex-col items-center">
                <p className="text-5xl mb-3">🛰️</p>
                <h4 className="text-gray-900 font-extrabold text-sm">Radar Belum Menemukan Hasil</h4>
                <p className="text-gray-400 text-xs mt-1 mb-5 max-w-[250px] mx-auto leading-relaxed">Tidak ada layanan "{search || kategori}" di sekitarmu.</p>
                <button onClick={() => { setSearch(''); setKategori(''); setJenis('semua') }}
                  className="bg-[#0D5C3A] hover:bg-[#0A472D] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95">
                  🔄 Reset Pencarian
                </button>
              </div>
            ) : (
              <>
                {jenis !== 'preloved' && visibleTokoKeys.map(namaKategori => (
                  <ScrollStrip key={namaKategori} title={namaKategori} icon={getIconKategori(jenis, filteredGrouped[namaKategori]?.[0])} count={filteredGrouped[namaKategori].length}>
                    {filteredGrouped[namaKategori].map((t: any) => (
                      <TokoCard key={t.id} t={t} userLat={userLat} userLng={userLng}
                        onDetail={(id: string) => navigate(`/toko/${id}`)}
                        onChat={(id: string) => navigate(`/chat/${id}`)}
                        isFollowed={followedIds.has(t.id)} onToggleFollow={userId ? toggleFollow : null} />
                    ))}
                  </ScrollStrip>
                ))}

                {(jenis === 'preloved' || jenis === 'semua') && visibleProdukKeys.length > 0 && (
                  <>
                    {jenis === 'semua' && (
                      <div className="px-4 pt-4 border-t border-gray-200/50 mt-4">
                        <p className="text-xs font-black text-purple-700 uppercase tracking-wider">♻️ Bursa Preloved Tetangga</p>
                      </div>
                    )}
                    {visibleProdukKeys.map(namaKategori => (
                      <ScrollStrip key={namaKategori} title={namaKategori} icon="♻️" count={produkGrouped[namaKategori].length}>
                        {produkGrouped[namaKategori].map((p: any) => (
                          <ProdukCard key={p.id} p={p} userLat={userLat} userLng={userLng}
                            onDetail={(id: string) => navigate(`/toko/${id}`)}
                            onChat={(id: string) => navigate(`/chat/${id}`)}
                            isWishlisted={wishlistIds.has(p.id)} onToggleWishlist={userId ? toggleWishlist : null}
                            onTambahKeranjang={userId ? tambahKeranjang : null} userId={userId} />
                        ))}
                      </ScrollStrip>
                    ))}
                  </>
                )}

                {((jenis !== 'preloved' && visibleTokoCount < sortedTokoKeys.length) ||
                  ((jenis === 'preloved' || jenis === 'semua') && visibleProdukCount < sortedProdukKeys.length)) && (
                  <div ref={loaderRef} className="flex justify-center py-4">
                    <div className="w-5 h-5 border-2 border-[#0D5C3A] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 flex shadow-xl shadow-black/10 z-50 max-w-md mx-auto">
        <button onClick={() => navigate('/cari')} className="flex-1 py-3.5 flex flex-col items-center gap-1">
          <span className="text-base leading-none">🔍</span>
          <span className="text-[10px] font-black tracking-wide text-[#0D5C3A]">Cari</span>
        </button>
        <button onClick={() => navigate('/peta')} className="flex-1 py-3.5 flex flex-col items-center gap-1 group">
          <span className="text-base leading-none group-active:scale-110 transition-transform">🗺️</span>
          <span className="text-[10px] font-bold tracking-wide text-gray-400">Peta</span>
        </button>
        <button onClick={() => navigate('/dashboard')} className="flex-1 py-3.5 flex flex-col items-center gap-1 group">
          <span className="text-base leading-none group-active:scale-110 transition-transform">🏪</span>
          <span className="text-[10px] font-bold tracking-wide text-gray-400">Toko</span>
        </button>
        <button onClick={() => navigate('/profil')} className="flex-1 py-3.5 flex flex-col items-center gap-1 group">
          <span className="text-base leading-none group-active:scale-110 transition-transform">👤</span>
          <span className="text-[10px] font-bold tracking-wide text-gray-400">Profil</span>
        </button>
      </div>
    </div>
  )
}
