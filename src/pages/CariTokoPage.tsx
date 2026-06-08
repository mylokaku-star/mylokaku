import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const [toko, setToko] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [kategori, setKategori] = useState('')
  const [jenis, setJenis] = useState<JenisFilter>('semua')
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
    if (t.jenis === 'jasa') return { label: 'Jasa', status: 'TERSEDIA', badgeBg: 'bg-blue-100 text-blue-700', cardBg: 'from-blue-50 to-blue-100', btnBg: 'bg-blue-600 hover:bg-blue-700' }
    if (t.jenis === 'preloved') return { label: 'Preloved', status: 'DIJUAL', badgeBg: 'bg-purple-100 text-purple-700', cardBg: 'from-purple-50 to-purple-100', btnBg: 'bg-purple-600 hover:bg-purple-600' }
    return { label: 'Toko', status: 'BUKA', badgeBg: 'bg-gray-100 text-gray-500', cardBg: 'from-green-50 to-green-100', btnBg: 'bg-green-600 hover:bg-green-700' }
  }

  function getEmoji(t: any) {
    if (t.jenis === 'jasa') return '🛠️'
    if (t.jenis === 'preloved') return '♻️'
    return '🏪'
  }

  function hubungiWhatsapp(telepon: string, nama: string, jenisItem: string) {
    const nomor = telepon.replace(/^0/, '62')
    const pesan = encodeURIComponent(
      jenisItem === 'jasa' ? `Halo, saya menemukan jasa ${nama} di Lokaku. Apakah masih tersedia?` :
      jenisItem === 'preloved' ? `Halo, saya tertarik dengan ${nama} yang dijual di Lokaku. Apakah masih tersedia?` :
      `Halo, saya menemukan toko ${nama} di Lokaku. Apakah masih buka?`
    )
    window.open(`https://wa.me/${nomor}?text=${pesan}`, '_blank')
  }

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
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
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

      <div className="max-w-lg mx-auto px-4 py-4">
        <p className="text-xs text-gray-400 font-medium mb-4">
          {loading ? 'Memuat...' : jenis === 'semua'
            ? `${counts.toko} toko · ${counts.jasa} jasa · ${counts.preloved} preloved aktif`
            : `${filtered.length} ${JENIS_CONFIG[jenis].label.toLowerCase()} aktif`}
        </p>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-48 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">{JENIS_CONFIG[jenis].icon}</p>
            <p className="text-gray-600 font-semibold text-sm">Belum ada {JENIS_CONFIG[jenis].label.toLowerCase()} tersedia</p>
            <p className="text-gray-400 text-xs mt-1">Coba kata kunci atau kategori lain</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(t => {
              const info = getJenisInfo(t)
              return (
                <div key={t.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition">
                  {t.foto_url ? (
                    <img src={t.foto_url} alt={t.nama} className="w-full h-40 object-cover" />
                  ) : (
                    <div className={`w-full h-24 flex items-center justify-center text-3xl bg-gradient-to-br ${info.cardBg}`}>
                      {getEmoji(t)}
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-bold text-gray-900 text-sm truncate">{t.nama}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${info.badgeBg}`}>{info.label}</span>
                        </div>
                        <span className="text-xs text-gray-400">{t.kategori}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${info.badgeBg}`}>{info.status}</span>
                        {userLat && userLng && t.lat && t.lng && (
                          <span className="text-xs text-gray-400 font-medium">📍 {formatJarak(hitungJarak(userLat, userLng, t.lat, t.lng))}</span>
                        )}
                      </div>
                    </div>
                    {t.alamat && <p className="text-xs text-gray-400 mt-1">📍 {t.alamat}</p>}
                    {t.deskripsi && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{t.deskripsi}</p>}
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => navigate(`/toko/${t.id}`)}
                        className="flex-1 border-2 border-gray-100 text-gray-600 text-xs py-2 rounded-xl font-semibold hover:bg-gray-50 transition">
                        {t.jenis === 'preloved' ? 'Lihat Barang' : t.jenis === 'jasa' ? 'Lihat Detail' : 'Lihat Toko'}
                      </button>
                      {t.telepon && (
                        <button onClick={() => hubungiWhatsapp(t.telepon, t.nama, t.jenis)}
                          className={`flex-1 text-white text-xs py-2 rounded-xl font-semibold transition ${info.btnBg}`}>
                          💬 WhatsApp
                        </button>
                      )}
                      <button onClick={() => navigate(`/chat/${t.id}`)}
                        className="w-10 border-2 border-gray-100 text-gray-500 text-xs py-2 rounded-xl font-semibold hover:bg-gray-50 transition flex items-center justify-center">
                        🗨️
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex shadow-lg">
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
