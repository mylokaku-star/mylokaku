import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { KATEGORI_TOKO, KATEGORI_JASA, KATEGORI_PRELOVED } from '../lib/kategori'

function hitungJarak(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos((lat1*Math.PI)/180)*Math.cos((lat2*Math.PI)/180)*Math.sin(dLng/2)*Math.sin(dLng/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function formatJarak(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

type JenisFilter = 'semua' | 'toko' | 'jasa' | 'preloved'

const JENIS_CONFIG = {
  semua:    { icon: '🏠', label: 'Semua',    activeBg: 'bg-green-600 text-white border-green-600' },
  toko:     { icon: '🏪', label: 'Toko',     activeBg: 'bg-green-600 text-white border-green-600' },
  jasa:     { icon: '🛠️', label: 'Jasa',     activeBg: 'bg-blue-600 text-white border-blue-600' },
  preloved: { icon: '♻️', label: 'Preloved', activeBg: 'bg-purple-600 text-white border-purple-600' },
}

export default function CariTokoPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [toko, setToko] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [kategori, setKategori] = useState('')
  // ✅ Baca ?kategori=preloved dari URL, default ke 'semua'
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

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude) },
      () => {}
    )
    loadToko()
  }, [])

  useEffect(() => { filter() }, [search, kategori, jenis, toko, sortByJarak, userLat, userLng])
  useEffect(() => { setKategori('') }, [jenis])

  async function loadToko() {
    const { data } = await supabase.from('toko').select('*').eq('is_buka', true).order('created_at', { ascending: false })
    setToko(data || [])
    setLoading(false)
  }

  function filter() {
    let hasil = [...toko]
    if (jenis === 'toko') hasil = hasil.filter(t => !t.jenis || t.jenis === 'toko')
    else if (jenis === 'jasa') hasil = hasil.filter(t => t.jenis === 'jasa')
    else if (jenis === 'preloved') hasil = hasil.filter(t => t.jenis === 'preloved')
    if (search) hasil = hasil.filter(t =>
      t.nama?.toLowerCase().includes(search.toLowerCase()) ||
      t.kategori?.toLowerCase().includes(search.toLowerCase()) ||
      t.deskripsi?.toLowerCase().includes(search.toLowerCase())
    )
    if (kategori) hasil = hasil.filter(t => t.kategori === kategori)
    if (sortByJarak && userLat && userLng) {
      hasil = hasil.map(t => ({ ...t, jarak: t.lat && t.lng ? hitungJarak(userLat, userLng, t.lat, t.lng) : 9999 }))
        .sort((a, b) => a.jarak - b.jarak)
    }
    setFiltered(hasil)
  }

  function getJenisInfo(t: any) {
    if (t.jenis === 'jasa') return { label: 'Jasa', status: 'TERSEDIA', badgeBg: 'bg-blue-100 text-blue-700', cardBg: 'from-blue-50 to-blue-100', primaryBtnBg: 'bg-blue-600 hover:bg-blue-700 text-white', secondaryBtnBg: 'bg-orange-500 hover:bg-orange-600 text-white' }
    if (t.jenis === 'preloved') return { label: 'Preloved', status: 'DIJUAL', badgeBg: 'bg-purple-100 text-purple-700', cardBg: 'from-purple-50 to-purple-100', primaryBtnBg: 'bg-purple-600 hover:bg-purple-700 text-white', secondaryBtnBg: 'bg-orange-500 hover:bg-orange-600 text-white' }
    return { label: 'Toko', status: 'BUKA', badgeBg: 'bg-green-100 text-green-700', cardBg: 'from-green-50 to-green-100', primaryBtnBg: 'bg-green-600 hover:bg-green-700 text-white', secondaryBtnBg: 'bg-orange-500 hover:bg-orange-600 text-white' }
  }

  function getIconKategori(daftarTokoKategori: any[]) {
    if (jenis !== 'semua') return JENIS_CONFIG[jenis].icon
    const contohToko = daftarTokoKategori[0]
    if (contohToko?.jenis === 'jasa') return '🛠️'
    if (contohToko?.jenis === 'preloved') return '♻️'
    return '🏪'
  }

  function kelompokkanBerdasarkanKategori(items: any[]) {
    return items.reduce((grup, item) => {
      const kat = item.kategori || 'Lainnya'
      if (!grup[kat]) grup[kat] = []
      grup[kat].push(item)
      return grup
    }, {} as Record<string, any[]>)
  }

  const filteredGrouped: Record<string, any[]> = kelompokkanBerdasarkanKategori(filtered)
  const grupList = jenis === 'jasa' ? KATEGORI_JASA : jenis === 'toko' ? KATEGORI_TOKO : jenis === 'preloved' ? KATEGORI_PRELOVED : [...KATEGORI_TOKO, ...KATEGORI_JASA, ...KATEGORI_PRELOVED]

  const counts = {
    toko: toko.filter(t => !t.jenis || t.jenis === 'toko').length,
    jasa: toko.filter(t => t.jenis === 'jasa').length,
    preloved: toko.filter(t => t.jenis === 'preloved').length,
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm">L</div>
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

        {/* Search */}
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari toko, jasa, atau barang preloved..."
            className="w-full border-2 border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
        </div>

        {/* Filter Jenis */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1" style={{ display: 'flex', overflowX: 'auto' }}>
          {(Object.entries(JENIS_CONFIG) as [JenisFilter, typeof JENIS_CONFIG.semua][]).map(([j, cfg]) => (
            <button key={j} onClick={() => setJenis(j)}
              className={`flex items-center gap-1 text-xs px-3 py-2 rounded-xl border-2 font-bold transition flex-shrink-0 ${jenis === j ? cfg.activeBg : 'bg-white text-gray-500 border-gray-100'}`}>
              {cfg.icon} {cfg.label}
            </button>
          ))}
          <button onClick={() => setShowKategori(!showKategori)}
            className={`ml-auto flex items-center gap-1 text-xs px-3 py-2 rounded-xl border-2 font-bold transition flex-shrink-0 ${kategori ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-500 border-gray-100'}`}>
            {kategori ? '✕ Reset' : '☰ Kategori'}
          </button>
        </div>

        {/* Dropdown kategori */}
        {showKategori && (
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

        {kategori && (
          <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">{kategori}</span>
        )}
      </div>

      {/* Konten Utama */}
      <div className="w-full py-4 overflow-x-hidden">
        <p className="text-xs text-gray-400 font-medium mb-4 px-4">
          {loading ? 'Memuat...' : jenis === 'semua'
            ? `${counts.toko} toko · ${counts.jasa} jasa · ${counts.preloved} preloved aktif`
            : `${filtered.length} ${JENIS_CONFIG[jenis].label.toLowerCase()} aktif`}
        </p>

        {loading ? (
          <div className="space-y-6 px-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
                <div className="flex gap-4 overflow-x-hidden">
                  {[1, 2, 3].map(j => <div key={j} className="bg-white rounded-2xl h-56 w-48 flex-shrink-0 animate-pulse" />)}
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-4xl mb-3">{JENIS_CONFIG[jenis].icon}</p>
            <p className="text-gray-600 font-semibold text-sm">Belum ada {JENIS_CONFIG[jenis].label.toLowerCase()} tersedia</p>
            <p className="text-gray-400 text-xs mt-1">Coba kata kunci atau kategori lain</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(filteredGrouped).map(([namaKategori, daftarToko]) => (
              <div key={namaKategori} className="space-y-2">
                <h2 className="text-sm font-bold text-gray-800 px-4 flex items-center gap-1.5">
                  <span>{getIconKategori(daftarToko)}</span> {namaKategori} <span className="text-xs font-normal text-gray-400">({daftarToko.length})</span>
                </h2>
                <div
                  className="px-4 pb-2 snap-x snap-mandatory"
                  style={{ display: 'flex', flexDirection: 'row', overflowX: 'auto', WebkitOverflowScrolling: 'touch', gap: '12px' }}
                >
                  {daftarToko.map(t => {
                    const info = getJenisInfo(t)
                    return (
                      <div
                        key={t.id}
                        className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm flex flex-col justify-between snap-start"
                        style={{ width: '180px', flexShrink: 0 }}
                      >
                        <div className="p-3 pb-2">
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <h3 className="font-bold text-gray-900 text-xs truncate flex-1" title={t.nama}>{t.nama}</h3>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black flex-shrink-0 ${info.badgeBg}`}>{info.status}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium">
                            <span>{info.label}</span>
                            {userLat && userLng && t.lat && t.lng && (
                              <span>📍 {formatJarak(hitungJarak(userLat, userLng, t.lat, t.lng))}</span>
                            )}
                          </div>
                        </div>
                        <div className="px-3">
                          {t.foto_url ? (
                            <img src={t.foto_url} alt={t.nama} className="w-full h-24 object-cover rounded-xl" />
                          ) : (
                            <div className={`w-full h-24 flex items-center justify-center text-2xl bg-gradient-to-br ${info.cardBg} rounded-xl`}>
                              {t.jenis === 'jasa' ? '🛠️' : t.jenis === 'preloved' ? '♻️' : '🏪'}
                            </div>
                          )}
                          {t.alamat && <p className="text-[10px] text-gray-400 mt-1.5 truncate">📍 {t.alamat}</p>}
                        </div>
                        <div className="p-3 pt-2 grid grid-cols-4 gap-1.5">
                          <button onClick={() => navigate(`/toko/${t.id}`)}
                            className={`col-span-2 text-[11px] py-2 rounded-xl font-bold transition text-center ${info.primaryBtnBg}`}>
                            {t.jenis === 'preloved' ? 'Barang' : t.jenis === 'jasa' ? 'Detail' : 'Toko'}
                          </button>
                          <button onClick={() => navigate(`/chat/${t.id}`)}
                            className={`col-span-2 text-[11px] py-2 rounded-xl font-bold transition flex items-center justify-center gap-1 ${info.secondaryBtnBg}`}>
                            Chat 💬
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex shadow-lg z-20">
        <button onClick={() => navigate('/cari')} className="flex-1 py-3 flex flex-col items-center gap-0.5">
          <span className="text-lg">🔍</span><span className="text-xs font-bold text-red-600">Cari</span>
        </button>
        <button onClick={() => navigate('/peta')} className="flex-1 py-3 flex flex-col items-center gap-0.5">
          <span className="text-lg">🗺️</span><span className="text-xs font-medium text-gray-400">Peta</span>
        </button>
        <button onClick={() => navigate('/dashboard')} className="flex-1 py-3 flex flex-col items-center gap-0.5">
          <span className="text-lg">🏪</span><span className="text-xs font-medium text-gray-400">Toko</span>
        </button>
        <button onClick={() => navigate('/profil')} className="flex-1 py-3 flex flex-col items-center gap-0.5">
          <span className="text-lg">👤</span><span className="text-xs font-medium text-gray-400">Profil</span>
        </button>
      </div>
    </div>
  )
}
