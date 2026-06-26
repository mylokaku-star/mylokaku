import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { KATEGORI_TOKO, KATEGORI_JASA, KATEGORI_PRELOVED } from '../lib/kategori'
import PromoSlider from '../components/PromoSlider'

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

const JENIS_CONFIG = {
  semua:    { icon: '🏠', label: 'Semua',    activeBg: 'bg-green-600 text-white border-green-600' },
  toko:     { icon: '🏪', label: 'Toko',     activeBg: 'bg-green-600 text-white border-green-600' },
  jasa:     { icon: '🛠️', label: 'Jasa',     activeBg: 'bg-blue-600 text-white border-blue-600' },
  preloved: { icon: '♻️', label: 'Preloved', activeBg: 'bg-purple-600 text-white border-purple-600' },
  favorit:  { icon: '❤️', label: 'Favorit',  activeBg: 'bg-red-500 text-white border-red-500' },
}

function getJenisInfo(t: any) {
  if (t.jenis === 'jasa') return {
    label: 'Jasa', status: 'TERSEDIA',
    badgeStyle: { background: '#dbeafe', color: '#1d4ed8' },
    cardGradient: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
    primaryBtnStyle: { background: '#2563eb', color: 'white' },
    secondaryBtnStyle: { background: '#f97316', color: 'white' },
  }
  if (t.jenis === 'preloved') return {
    label: 'Preloved', status: 'DIJUAL',
    badgeStyle: { background: '#f3e8ff', color: '#7c3aed' },
    cardGradient: 'linear-gradient(135deg, #faf5ff, #f3e8ff)',
    primaryBtnStyle: { background: '#9333ea', color: 'white' },
    secondaryBtnStyle: { background: '#f97316', color: 'white' },
  }
  return {
    label: 'Toko', status: 'BUKA',
    badgeStyle: { background: '#dcfce7', color: '#15803d' },
    cardGradient: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
    primaryBtnStyle: { background: '#16a34a', color: 'white' },
    secondaryBtnStyle: { background: '#f97316', color: 'white' },
  }
}

function getIconKategori(jenis: JenisFilter, contohToko?: any) {
  if (jenis !== 'semua' && jenis !== 'favorit') return JENIS_CONFIG[jenis as keyof typeof JENIS_CONFIG].icon
  if (contohToko?.jenis === 'jasa') return '🛠️'
  if (contohToko?.jenis === 'preloved') return '♻️'
  return '🏪'
}

function TokoCard({ t, userLat, userLng, onDetail, onChat, isFollowed, onToggleFollow }: any) {
  const info = getJenisInfo(t)
  const jarak = userLat && userLng && t.lat && t.lng ? hitungJarak(userLat, userLng, t.lat, t.lng) : null
  return (
    <div style={{ width: '200px', flexShrink: 0, background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative' }}>
        {t.foto_url ? (
          <img src={t.foto_url} alt={t.nama} style={{ width: '100%', height: '112px', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '112px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', background: info.cardGradient }}>
            {t.jenis === 'jasa' ? '🛠️' : t.jenis === 'preloved' ? '♻️' : '🏪'}
          </div>
        )}
        {onToggleFollow && (
          <button onClick={(e) => { e.stopPropagation(); onToggleFollow(t.id) }}
            style={{ position: 'absolute', top: '6px', right: '6px', background: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', fontSize: '14px' }}>
            {isFollowed ? '❤️' : '🤍'}
          </button>
        )}
      </div>
      <div style={{ padding: '10px 10px 6px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '4px' }}>
          <span style={{ fontWeight: 700, fontSize: '11px', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }} title={t.nama}>{t.nama}</span>
          <span style={{ ...info.badgeStyle, fontSize: '9px', padding: '2px 6px', borderRadius: '999px', fontWeight: 800, flexShrink: 0 }}>{info.status}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af', fontWeight: 500 }}>
          <span>{info.label}</span>
          {jarak !== null && <span>📍 {formatJarak(jarak)}</span>}
        </div>
        {t.alamat && <p style={{ fontSize: '10px', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {t.alamat}</p>}
      </div>
      <div style={{ padding: '0 10px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        <button onClick={() => onDetail(t.id)} style={{ ...info.primaryBtnStyle, fontSize: '11px', padding: '7px 0', borderRadius: '10px', fontWeight: 700, border: 'none', cursor: 'pointer', textAlign: 'center' }}>
          {t.jenis === 'jasa' ? 'Detail' : t.jenis === 'preloved' ? 'Toko' : 'Toko'}
        </button>
        <button onClick={() => onChat(t.id)} style={{ ...info.secondaryBtnStyle, fontSize: '11px', padding: '7px 0', borderRadius: '10px', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
          Chat 💬
        </button>
      </div>
    </div>
  )
}

function ProdukCard({ p, userLat, userLng, onDetail, onChat, isWishlisted, onToggleWishlist }: any) {
  const jarak = userLat && userLng && p.toko?.lat && p.toko?.lng ? hitungJarak(userLat, userLng, p.toko.lat, p.toko.lng) : null
  return (
    <div style={{ width: '160px', flexShrink: 0, background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative' }}>
        {p.foto_url ? (
          <img src={p.foto_url} alt={p.nama} style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', background: 'linear-gradient(135deg, #faf5ff, #f3e8ff)' }}>♻️</div>
        )}
        {onToggleWishlist && (
          <button onClick={(e) => { e.stopPropagation(); onToggleWishlist(p.id, p.toko_id) }}
            style={{ position: 'absolute', top: '6px', right: '6px', background: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', fontSize: '14px' }}>
            {isWishlisted ? '❤️' : '🤍'}
          </button>
        )}
      </div>
      <div style={{ padding: '8px 8px 4px', flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <span style={{ fontWeight: 700, fontSize: '11px', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.nama}>{p.nama}</span>
        <span style={{ fontWeight: 800, fontSize: '12px', color: '#7c3aed' }}>{formatHarga(p.harga)}</span>
        <span style={{ fontSize: '10px', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🏪 {p.toko?.nama || '-'}</span>
        {jarak !== null && <span style={{ fontSize: '10px', color: '#9ca3af' }}>📍 {formatJarak(jarak)}</span>}
      </div>
      <div style={{ padding: '0 8px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
        <button onClick={() => onDetail(p.toko_id)} style={{ background: '#9333ea', color: 'white', fontSize: '10px', padding: '6px 0', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Detail</button>
        <button onClick={() => onChat(p.toko_id)} style={{ background: '#f97316', color: 'white', fontSize: '10px', padding: '6px 0', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Chat 💬</button>
      </div>
    </div>
  )
}

function ScrollStrip({ children, title, icon, count }: any) {
  return (
    <section style={{ marginBottom: '8px' }}>
      <div style={{ padding: '0 16px', marginBottom: '8px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
          <span>{icon}</span>{title}<span style={{ fontSize: '11px', fontWeight: 400, color: '#9ca3af' }}>({count})</span>
        </h2>
      </div>
      <div style={{ overflowX: 'auto', width: '100vw', WebkitOverflowScrolling: 'touch' as any, msOverflowStyle: 'none' as any, scrollbarWidth: 'none' as any }}>
        <div style={{ display: 'flex', gap: '12px', paddingLeft: '16px', paddingRight: '24px', minWidth: 'max-content' }}>
          {children}
        </div>
      </div>
    </section>
  )
}

function SkeletonStrip() {
  return (
    <section style={{ marginBottom: '8px' }}>
      <div style={{ padding: '0 16px', marginBottom: '8px' }}>
        <div style={{ height: '14px', background: '#e5e7eb', borderRadius: '6px', width: '30%' }} />
      </div>
      <div style={{ overflowX: 'auto', width: '100vw' }}>
        <div style={{ display: 'flex', gap: '12px', paddingLeft: '16px', paddingRight: '24px', minWidth: 'max-content' }}>
          {[1,2,3].map(i => <div key={i} style={{ width: '160px', flexShrink: 0, height: '200px', background: '#e5e7eb', borderRadius: '16px' }} />)}
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

  // Favorit & Wishlist
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set())
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())
  const [tokoFavorit, setTokoFavorit] = useState<any[]>([])
  const [produkWishlist, setProdukWishlist] = useState<any[]>([])

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude) },
      () => {}
    )
    loadData()
  }, [])

  useEffect(() => { filter() }, [search, kategori, jenis, toko, produkPreloved, sortByJarak, userLat, userLng])
  useEffect(() => { setKategori('') }, [jenis])

  async function loadData() {
    const { data: userData } = await supabase.auth.getUser()
    const uid = userData.user?.id || null
    setUserId(uid)

    const [{ data: tokoData }, { data: produkData }] = await Promise.all([
      supabase.from('toko').select('*').eq('is_buka', true).in('jenis', ['toko', 'jasa', 'preloved']).order('created_at', { ascending: false }),
      supabase.from('produk').select('id, nama, harga, deskripsi, foto_url, kategori, toko_id, toko:toko_id(id, nama, lat, lng, alamat, is_buka, jenis)').order('created_at', { ascending: false }),
    ])

    const produkAktif = (produkData || []).filter((p: any) => p.toko?.jenis === 'preloved' && p.toko?.is_buka === true)
    setToko(tokoData || [])
    setProdukPreloved(produkAktif)

    if (uid) {
      await loadFavorit(uid, tokoData || [], produkAktif)
    }

    setLoading(false)
  }

  async function loadFavorit(uid: string, allToko: any[], allProduk: any[]) {
    const [{ data: followData }, { data: wishData }] = await Promise.all([
      supabase.from('langganan_toko').select('toko_id').eq('user_id', uid),
      supabase.from('wishlist_produk').select('produk_id').eq('user_id', uid),
    ])

    const fids = new Set((followData || []).map((f: any) => f.toko_id))
    const wids = new Set((wishData || []).map((w: any) => w.produk_id))
    setFollowedIds(fids)
    setWishlistIds(wids)

    setTokoFavorit(allToko.filter(t => fids.has(t.id)))
    setProdukWishlist(allProduk.filter(p => wids.has(p.id)))
  }

  async function toggleFollow(tokoId: string) {
    if (!userId) { navigate('/login'); return }
    if (followedIds.has(tokoId)) {
      await supabase.from('langganan_toko').delete().eq('user_id', userId).eq('toko_id', tokoId)
      const next = new Set(followedIds); next.delete(tokoId)
      setFollowedIds(next)
      setTokoFavorit(prev => prev.filter(t => t.id !== tokoId))
    } else {
      await supabase.from('langganan_toko').insert({ user_id: userId, toko_id: tokoId })
      const next = new Set(followedIds); next.add(tokoId)
      setFollowedIds(next)
      const t = toko.find(t => t.id === tokoId)
      if (t) setTokoFavorit(prev => [...prev, t])
    }
  }

  async function toggleWishlist(produkId: string, tokoId: string) {
    if (!userId) { navigate('/login'); return }
    if (wishlistIds.has(produkId)) {
      await supabase.from('wishlist_produk').delete().eq('user_id', userId).eq('produk_id', produkId)
      const next = new Set(wishlistIds); next.delete(produkId)
      setWishlistIds(next)
      setProdukWishlist(prev => prev.filter(p => p.id !== produkId))
    } else {
      await supabase.from('wishlist_produk').insert({ user_id: userId, produk_id: produkId, toko_id: tokoId })
      const next = new Set(wishlistIds); next.add(produkId)
      setWishlistIds(next)
      const p = produkPreloved.find(p => p.id === produkId)
      if (p) setProdukWishlist(prev => [...prev, p])
    }
  }

  function filter() {
    let hasilToko = [...toko]
    if (jenis === 'toko') hasilToko = hasilToko.filter(t => !t.jenis || t.jenis === 'toko')
    else if (jenis === 'jasa') hasilToko = hasilToko.filter(t => t.jenis === 'jasa')
    else if (jenis === 'preloved' || jenis === 'favorit') hasilToko = []
    else hasilToko = hasilToko.filter(t => t.jenis !== 'preloved')
    if (search && jenis !== 'preloved' && jenis !== 'favorit')
      hasilToko = hasilToko.filter(t => t.nama?.toLowerCase().includes(search.toLowerCase()) || t.kategori?.toLowerCase().includes(search.toLowerCase()))
    if (kategori && jenis !== 'preloved' && jenis !== 'favorit') hasilToko = hasilToko.filter(t => t.kategori === kategori)
    if (sortByJarak && userLat && userLng && jenis !== 'preloved' && jenis !== 'favorit')
      hasilToko = hasilToko.map(t => ({ ...t, jarak: t.lat && t.lng ? hitungJarak(userLat, userLng, t.lat, t.lng) : 9999 })).sort((a, b) => a.jarak - b.jarak)
    setFiltered(hasilToko)

    let hasilProduk = [...produkPreloved]
    if (jenis !== 'preloved' && jenis !== 'semua' && jenis !== 'favorit') hasilProduk = []
    if (search && (jenis === 'preloved' || jenis === 'semua'))
      hasilProduk = hasilProduk.filter(p => p.nama?.toLowerCase().includes(search.toLowerCase()) || p.toko?.nama?.toLowerCase().includes(search.toLowerCase()))
    if (kategori && (jenis === 'preloved' || jenis === 'semua')) hasilProduk = hasilProduk.filter(p => p.kategori === kategori)
    if (sortByJarak && userLat && userLng && (jenis === 'preloved' || jenis === 'semua'))
      hasilProduk = hasilProduk.map(p => ({ ...p, jarak: p.toko?.lat && p.toko?.lng ? hitungJarak(userLat, userLng, p.toko.lat, p.toko.lng) : 9999 })).sort((a, b) => a.jarak - b.jarak)
    setFilteredProduk(hasilProduk)
  }

  const filteredGrouped = filtered.reduce((g, t) => { const k = t.kategori || 'Lainnya'; if (!g[k]) g[k] = []; g[k].push(t); return g }, {} as Record<string, any[]>)
  const produkGrouped = filteredProduk.reduce((g, p) => { const k = p.kategori || 'Lainnya'; if (!g[k]) g[k] = []; g[k].push(p); return g }, {} as Record<string, any[]>)

  const masterKategoriList = jenis === 'jasa' ? KATEGORI_JASA : jenis === 'toko' ? KATEGORI_TOKO : jenis === 'preloved' ? KATEGORI_PRELOVED : [...KATEGORI_TOKO, ...KATEGORI_JASA, ...KATEGORI_PRELOVED]
  const masterKategoriFlat = masterKategoriList.flatMap(g => g.items)
  const sortedTokoKeys = [...masterKategoriFlat.filter(k => filteredGrouped[k]), ...Object.keys(filteredGrouped).filter(k => !masterKategoriFlat.includes(k))]
  const kategoriPreloved = KATEGORI_PRELOVED.flatMap(g => g.items)
  const sortedProdukKeys = [...kategoriPreloved.filter(k => produkGrouped[k]), ...Object.keys(produkGrouped).filter(k => !kategoriPreloved.includes(k))]

  const grupList = jenis === 'jasa' ? KATEGORI_JASA : jenis === 'toko' ? KATEGORI_TOKO : jenis === 'preloved' ? KATEGORI_PRELOVED : [...KATEGORI_TOKO, ...KATEGORI_JASA, ...KATEGORI_PRELOVED]
  const adaHasil = jenis === 'preloved' ? filteredProduk.length > 0 : jenis === 'semua' ? filtered.length > 0 || filteredProduk.length > 0 : filtered.length > 0
  const adaFavorit = tokoFavorit.length > 0 || produkWishlist.length > 0

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img src="/icon-192x192.png" alt="Lokaku" className="w-8 h-8 rounded-xl object-cover" />
            <div>
              <span className="font-extrabold text-gray-900 text-sm">Lokaku</span>
              <p className="text-xs text-gray-400 leading-none">Temukan kebutuhan sekitar</p>
            </div>
          </div>
          {userLat && (
            <button onClick={() => setSortByJarak(!sortByJarak)}
              className={`text-xs px-3 py-1.5 rounded-xl border-2 font-bold transition ${sortByJarak ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-500 border-gray-200'}`}>
              📍 Terdekat
            </button>
          )}
        </div>

        {jenis !== 'favorit' && (
          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={jenis === 'preloved' ? 'Cari barang preloved...' : 'Cari toko, jasa, atau barang...'}
              className="w-full border-2 border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
          </div>
        )}

        {/* Tab Filter */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', overflowX: 'auto', paddingBottom: '4px', msOverflowStyle: 'none' as any, scrollbarWidth: 'none' as any }}>
          {(Object.entries(JENIS_CONFIG) as [JenisFilter, any][]).map(([j, cfg]) => (
            <button key={j} onClick={() => setJenis(j)}
              className={`flex items-center gap-1 text-xs px-3 py-2 rounded-xl border-2 font-bold transition flex-shrink-0 ${jenis === j ? cfg.activeBg : 'bg-white text-gray-500 border-gray-100'}`}>
              {cfg.icon} {cfg.label}
            </button>
          ))}
          {jenis !== 'favorit' && (
            <button onClick={() => setShowKategori(!showKategori)}
              className={`flex items-center gap-1 text-xs px-3 py-2 rounded-xl border-2 font-bold transition flex-shrink-0 ${kategori ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-500 border-gray-100'}`}
              style={{ marginLeft: 'auto' }}>
              {kategori ? '✕ Reset' : '☰ Kategori'}
            </button>
          )}
        </div>

        {showKategori && jenis !== 'favorit' && (
          <select value={kategori} onChange={e => { setKategori(e.target.value); setShowKategori(false) }}
            className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 bg-gray-50 transition mb-2">
            <option value="">Semua Kategori</option>
            {grupList.map(grup => (
              <optgroup key={grup.grup} label={`── ${grup.grup}`}>
                {grup.items.map(item => <option key={item} value={item}>{item}</option>)}
              </optgroup>
            ))}
          </select>
        )}
        {kategori && <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">{kategori}</span>}
      </div>

      <div className="py-4 space-y-4">

        {/* TAB FAVORIT */}
        {jenis === 'favorit' && (
          <div className="space-y-4">
            {!userId ? (
              <div className="text-center py-16 px-4">
                <p className="text-4xl mb-3">❤️</p>
                <p className="text-gray-600 font-semibold text-sm">Login untuk melihat favorit</p>
                <button onClick={() => navigate('/login')} className="mt-4 bg-red-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold">Login</button>
              </div>
            ) : !adaFavorit ? (
              <div className="text-center py-16 px-4">
                <p className="text-4xl mb-3">🤍</p>
                <p className="text-gray-600 font-semibold text-sm">Belum ada favorit</p>
                <p className="text-gray-400 text-xs mt-1">Klik ikon hati di card toko atau produk untuk menyimpan</p>
                <button onClick={() => setJenis('semua')} className="mt-4 bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold">Jelajahi Sekarang</button>
              </div>
            ) : (
              <>
                {tokoFavorit.length > 0 && (
                  <ScrollStrip title="Toko & Jasa Langganan" icon="🏪" count={tokoFavorit.length}>
                    {tokoFavorit.map(t => (
                      <TokoCard key={t.id} t={t} userLat={userLat} userLng={userLng}
                        onDetail={id => navigate(`/toko/${id}`)} onChat={id => navigate(`/chat/${id}`)}
                        isFollowed={followedIds.has(t.id)} onToggleFollow={toggleFollow} />
                    ))}
                  </ScrollStrip>
                )}
                {produkWishlist.length > 0 && (
                  <ScrollStrip title="Produk Wishlist" icon="🛍️" count={produkWishlist.length}>
                    {produkWishlist.map(p => (
                      <ProdukCard key={p.id} p={p} userLat={userLat} userLng={userLng}
                        onDetail={id => navigate(`/toko/${id}`)} onChat={id => navigate(`/chat/${id}`)}
                        isWishlisted={wishlistIds.has(p.id)} onToggleWishlist={toggleWishlist} />
                    ))}
                  </ScrollStrip>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB SEMUA / TOKO / JASA / PRELOVED */}
        {jenis !== 'favorit' && (
          <>
            {jenis === 'semua' && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4">Promo & Event Sekitar</p>
                <PromoSlider lat={userLat} lng={userLng} />
              </div>
            )}

            <p className="text-xs text-gray-400 font-medium px-4">
              {loading ? 'Memuat...' : jenis === 'semua'
                ? `${toko.filter(t => t.jenis !== 'preloved').length} toko/jasa · ${produkPreloved.length} barang preloved`
                : jenis === 'preloved' ? `${filteredProduk.length} barang preloved`
                : `${filtered.length} ${JENIS_CONFIG[jenis].label.toLowerCase()} aktif`}
            </p>

            {loading ? (
              <><SkeletonStrip /><SkeletonStrip /><SkeletonStrip /></>
            ) : !adaHasil ? (
              <div className="text-center py-16 px-4">
                <p className="text-4xl mb-3">{JENIS_CONFIG[jenis].icon}</p>
                <p className="text-gray-600 font-semibold text-sm">Belum ada {JENIS_CONFIG[jenis].label.toLowerCase()} tersedia</p>
                <p className="text-gray-400 text-xs mt-1">Coba kata kunci atau kategori lain</p>
              </div>
            ) : (
              <>
                {jenis !== 'preloved' && sortedTokoKeys.map(namaKategori => (
                  <ScrollStrip key={namaKategori} title={namaKategori} icon={getIconKategori(jenis, filteredGrouped[namaKategori]?.[0])} count={filteredGrouped[namaKategori].length}>
                    {filteredGrouped[namaKategori].map(t => (
                      <TokoCard key={t.id} t={t} userLat={userLat} userLng={userLng}
                        onDetail={id => navigate(`/toko/${id}`)} onChat={id => navigate(`/chat/${id}`)}
                        isFollowed={followedIds.has(t.id)} onToggleFollow={userId ? toggleFollow : null} />
                    ))}
                  </ScrollStrip>
                ))}

                {(jenis === 'preloved' || jenis === 'semua') && sortedProdukKeys.length > 0 && (
                  <>
                    {jenis === 'semua' && <div className="px-4"><p className="text-sm font-extrabold text-purple-700">♻️ Barang Preloved</p></div>}
                    {sortedProdukKeys.map(namaKategori => (
                      <ScrollStrip key={namaKategori} title={namaKategori} icon="♻️" count={produkGrouped[namaKategori].length}>
                        {produkGrouped[namaKategori].map(p => (
                          <ProdukCard key={p.id} p={p} userLat={userLat} userLng={userLng}
                            onDetail={id => navigate(`/toko/${id}`)} onChat={id => navigate(`/chat/${id}`)}
                            isWishlisted={wishlistIds.has(p.id)} onToggleWishlist={userId ? toggleWishlist : null} />
                        ))}
                      </ScrollStrip>
                    ))}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex shadow-lg z-20">
        <button onClick={() => navigate('/cari')} className="flex-1 py-3 flex flex-col items-center gap-0.5">
          <span className="text-lg">🔍</span>
          <span className="text-xs font-bold text-red-600">Cari</span>
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
          <span className="text-xs font-medium text-gray-400">Profil</span>
        </button>
      </div>
    </div>
  )
}
