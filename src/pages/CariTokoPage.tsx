import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { KATEGORI_TOKO, KATEGORI_JASA, KATEGORI_PRELOVED } from '../lib/kategori'

function hitungJarak(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
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

function getJenisInfo(t: any) {
  if (t.jenis === 'jasa')
    return {
      label: 'Jasa', status: 'TERSEDIA',
      badgeStyle: { background: '#dbeafe', color: '#1d4ed8' },
      cardGradient: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
      primaryBtnStyle: { background: '#2563eb', color: 'white' },
      secondaryBtnStyle: { background: '#f97316', color: 'white' },
    }
  if (t.jenis === 'preloved')
    return {
      label: 'Preloved', status: 'DIJUAL',
      badgeStyle: { background: '#f3e8ff', color: '#7e22ce' },
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
  if (jenis !== 'semua') return JENIS_CONFIG[jenis].icon
  if (contohToko?.jenis === 'jasa') return '🛠️'
  if (contohToko?.jenis === 'preloved') return '♻️'
  return '🏪'
}

interface TokoCardProps {
  t: any
  userLat: number | null
  userLng: number | null
  onDetail: (id: string) => void
  onChat: (id: string) => void
}

function TokoCard({ t, userLat, userLng, onDetail, onChat }: TokoCardProps) {
  const info = getJenisInfo(t)
  const jarak =
    userLat && userLng && t.lat && t.lng
      ? hitungJarak(userLat, userLng, t.lat, t.lng)
      : null

  return (
    <div style={{
      width: '200px',
      flexShrink: 0,
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #f1f5f9',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {t.foto_url ? (
        <img src={t.foto_url} alt={t.nama}
          style={{ width: '100%', height: '112px', objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{
          width: '100%', height: '112px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '32px', background: info.cardGradient,
        }}>
          {t.jenis === 'jasa' ? '🛠️' : t.jenis === 'preloved' ? '♻️' : '🏪'}
        </div>
      )}

      <div style={{ padding: '10px 10px 6px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '4px' }}>
          <span style={{
            fontWeight: 700, fontSize: '11px', color: '#111827',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
          }} title={t.nama}>
            {t.nama}
          </span>
          <span style={{
            ...info.badgeStyle,
            fontSize: '9px', padding: '2px 6px', borderRadius: '999px',
            fontWeight: 800, flexShrink: 0,
          }}>
            {info.status}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af', fontWeight: 500 }}>
          <span>{info.label}</span>
          {jarak !== null && <span>📍 {formatJarak(jarak)}</span>}
        </div>

        {t.alamat && (
          <p style={{
            fontSize: '10px', color: '#9ca3af',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            📍 {t.alamat}
          </p>
        )}
      </div>

      <div style={{ padding: '0 10px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        <button
          onClick={() => onDetail(t.id)}
          style={{
            ...info.primaryBtnStyle,
            fontSize: '11px', padding: '7px 0',
            borderRadius: '10px', fontWeight: 700,
            border: 'none', cursor: 'pointer', textAlign: 'center',
          }}
        >
          {t.jenis === 'preloved' ? 'Barang' : t.jenis === 'jasa' ? 'Detail' : 'Toko'}
        </button>
        <button
          onClick={() => onChat(t.id)}
          style={{
            ...info.secondaryBtnStyle,
            fontSize: '11px', padding: '7px 0',
            borderRadius: '10px', fontWeight: 700,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px',
          }}
        >
          Chat 💬
        </button>
      </div>
    </div>
  )
}

interface KategoriStripProps {
  namaKategori: string
  daftarToko: any[]
  jenis: JenisFilter
  userLat: number | null
  userLng: number | null
  onDetail: (id: string) => void
  onChat: (id: string) => void
}

function KategoriStrip({ namaKategori, daftarToko, jenis, userLat, userLng, onDetail, onChat }: KategoriStripProps) {
  const icon = getIconKategori(jenis, daftarToko[0])

  return (
    <section style={{ marginBottom: '8px' }}>
      <div style={{ padding: '0 16px', marginBottom: '8px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
          <span>{icon}</span>
          {namaKategori}
          <span style={{ fontSize: '11px', fontWeight: 400, color: '#9ca3af' }}>({daftarToko.length})</span>
        </h2>
      </div>

      {/* ── FIX: width 100vw pada outer, minWidth max-content pada inner ── */}
      <div style={{
        overflowX: 'auto',
        overflowY: 'visible',
        width: '100vw',
        WebkitOverflowScrolling: 'touch' as any,
        msOverflowStyle: 'none' as any,
        scrollbarWidth: 'none' as any,
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          gap: '12px',
          paddingLeft: '16px',
          paddingRight: '24px',
          minWidth: 'max-content',
        }}>
          {daftarToko.map((t) => (
            <TokoCard
              key={t.id}
              t={t}
              userLat={userLat}
              userLng={userLng}
              onDetail={onDetail}
              onChat={onChat}
            />
          ))}
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
      <div style={{
        overflowX: 'auto',
        width: '100vw',
        msOverflowStyle: 'none' as any,
        scrollbarWidth: 'none' as any,
      }}>
        <div style={{
          display: 'flex', flexDirection: 'row', flexWrap: 'nowrap',
          gap: '12px', paddingLeft: '16px', paddingRight: '24px',
          minWidth: 'max-content',
        }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ width: '200px', flexShrink: 0, height: '224px', background: '#e5e7eb', borderRadius: '16px' }} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default function CariTokoPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [toko, setToko] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
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

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude) },
      () => {}
    )
    loadToko()
  }, [])

  useEffect(() => { filter() }, [search, kategori, jenis, toko, sortByJarak, userLat, userLng])
  useEffect(() => { setKategori('') }, [jenis])

  async function loadToko() {
    const { data } = await supabase
      .from('toko').select('*').eq('is_buka', true).order('created_at', { ascending: false })
    setToko(data || [])
    setLoading(false)
  }

  function filter() {
    let hasil = [...toko]
    if (jenis === 'toko') hasil = hasil.filter((t) => !t.jenis || t.jenis === 'toko')
    else if (jenis === 'jasa') hasil = hasil.filter((t) => t.jenis === 'jasa')
    else if (jenis === 'preloved') hasil = hasil.filter((t) => t.jenis === 'preloved')
    if (search)
      hasil = hasil.filter((t) =>
        t.nama?.toLowerCase().includes(search.toLowerCase()) ||
        t.kategori?.toLowerCase().includes(search.toLowerCase()) ||
        t.deskripsi?.toLowerCase().includes(search.toLowerCase())
      )
    if (kategori) hasil = hasil.filter((t) => t.kategori === kategori)
    if (sortByJarak && userLat && userLng) {
      hasil = hasil
        .map((t) => ({ ...t, jarak: t.lat && t.lng ? hitungJarak(userLat, userLng, t.lat, t.lng) : 9999 }))
        .sort((a, b) => a.jarak - b.jarak)
    }
    setFiltered(hasil)
  }

  const filteredGrouped = filtered.reduce((grup, item) => {
    const kat = item.kategori || 'Lainnya'
    if (!grup[kat]) grup[kat] = []
    grup[kat].push(item)
    return grup
  }, {} as Record<string, any[]>)

  const masterKategoriList =
    jenis === 'jasa'     ? KATEGORI_JASA :
    jenis === 'toko'     ? KATEGORI_TOKO :
    jenis === 'preloved' ? KATEGORI_PRELOVED :
    [...KATEGORI_TOKO, ...KATEGORI_JASA, ...KATEGORI_PRELOVED]

  const masterKategoriFlat = masterKategoriList.flatMap((g) => g.items)
  const sortedKategoriKeys = [
    ...masterKategoriFlat.filter((k) => filteredGrouped[k]),
    ...Object.keys(filteredGrouped).filter((k) => !masterKategoriFlat.includes(k)),
  ]

  const counts = {
    toko:     toko.filter((t) => !t.jenis || t.jenis === 'toko').length,
    jasa:     toko.filter((t) => t.jenis === 'jasa').length,
    preloved: toko.filter((t) => t.jenis === 'preloved').length,
  }

  const grupList =
    jenis === 'jasa'     ? KATEGORI_JASA :
    jenis === 'toko'     ? KATEGORI_TOKO :
    jenis === 'preloved' ? KATEGORI_PRELOVED :
    [...KATEGORI_TOKO, ...KATEGORI_JASA, ...KATEGORI_PRELOVED]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      <div className="bg-white px-4 pt-4 pb-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm">
              L
            </div>
            <div>
              <span className="font-extrabold text-gray-900 text-sm">Lokaku</span>
              <p className="text-xs text-gray-400 leading-none">Temukan kebutuhan sekitar</p>
            </div>
          </div>
          {userLat && (
            <button
              onClick={() => setSortByJarak(!sortByJarak)}
              className={`text-xs px-3 py-1.5 rounded-xl border-2 font-bold transition ${sortByJarak ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-500 border-gray-200'}`}
            >
              📍 Terdekat
            </button>
          )}
        </div>

        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari toko, jasa, atau barang preloved..."
            className="w-full border-2 border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-green-400 bg-gray-50 transition"
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', overflowX: 'auto', paddingBottom: '4px', msOverflowStyle: 'none' as any, scrollbarWidth: 'none' as any }}>
          {(Object.entries(JENIS_CONFIG) as [JenisFilter, typeof JENIS_CONFIG.semua][]).map(([j, cfg]) => (
            <button
              key={j}
              onClick={() => setJenis(j)}
              className={`flex items-center gap-1 text-xs px-3 py-2 rounded-xl border-2 font-bold transition flex-shrink-0 ${jenis === j ? cfg.activeBg : 'bg-white text-gray-500 border-gray-100'}`}
            >
              {cfg.icon} {cfg.label}
            </button>
          ))}
          <button
            onClick={() => setShowKategori(!showKategori)}
            className={`flex items-center gap-1 text-xs px-3 py-2 rounded-xl border-2 font-bold transition flex-shrink-0 ${kategori ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-500 border-gray-100'}`}
            style={{ marginLeft: 'auto' }}
          >
            {kategori ? '✕ Reset' : '☰ Kategori'}
          </button>
        </div>

        {showKategori && (
          <select
            value={kategori}
            onChange={(e) => { setKategori(e.target.value); setShowKategori(false) }}
            className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 bg-gray-50 transition mb-2"
          >
            <option value="">Semua Kategori</option>
            {grupList.map((grup) => (
              <optgroup key={grup.grup} label={`── ${grup.grup}`}>
                {grup.items.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </optgroup>
            ))}
          </select>
        )}

        {kategori && (
          <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">
            {kategori}
          </span>
        )}
      </div>

      <div className="py-4 space-y-6">
        <p className="text-xs text-gray-400 font-medium px-4">
          {loading
            ? 'Memuat...'
            : jenis === 'semua'
            ? `${counts.toko} toko · ${counts.jasa} jasa · ${counts.preloved} preloved aktif`
            : `${filtered.length} ${JENIS_CONFIG[jenis].label.toLowerCase()} aktif`}
        </p>

        {loading ? (
          <>
            <SkeletonStrip />
            <SkeletonStrip />
            <SkeletonStrip />
          </>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-4xl mb-3">{JENIS_CONFIG[jenis].icon}</p>
            <p className="text-gray-600 font-semibold text-sm">
              Belum ada {JENIS_CONFIG[jenis].label.toLowerCase()} tersedia
            </p>
            <p className="text-gray-400 text-xs mt-1">Coba kata kunci atau kategori lain</p>
          </div>
        ) : (
          sortedKategoriKeys.map((namaKategori) => (
            <KategoriStrip
              key={namaKategori}
              namaKategori={namaKategori}
              daftarToko={filteredGrouped[namaKategori]}
              jenis={jenis}
              userLat={userLat}
              userLng={userLng}
              onDetail={(id) => navigate(`/toko/${id}`)}
              onChat={(id) => navigate(`/chat/${id}`)}
            />
          ))
        )}
      </div>

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
