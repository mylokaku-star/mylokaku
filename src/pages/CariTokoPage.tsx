import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function hitungJarak(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function formatJarak(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

export default function CariTokoPage() {
  const navigate = useNavigate()
  const [toko, setToko] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [kategori, setKategori] = useState('')
  const [loading, setLoading] = useState(true)
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLng, setUserLng] = useState<number | null>(null)
  const [sortByJarak, setSortByJarak] = useState(false)

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLat(pos.coords.latitude)
        setUserLng(pos.coords.longitude)
      },
      () => {}
    )
    loadToko()
  }, [])

  useEffect(() => {
    filter()
  }, [search, kategori, toko, sortByJarak, userLat, userLng])

  async function loadToko() {
    const { data } = await supabase
      .from('toko')
      .select('*')
      .eq('is_buka', true)
      .order('created_at', { ascending: false })
    setToko(data || [])
    setLoading(false)
  }

  function filter() {
    let hasil = [...toko]
    if (search) {
      hasil = hasil.filter(t =>
        t.nama.toLowerCase().includes(search.toLowerCase()) ||
        t.kategori.toLowerCase().includes(search.toLowerCase())
      )
    }
    if (kategori) {
      hasil = hasil.filter(t => t.kategori === kategori)
    }
    if (sortByJarak && userLat && userLng) {
      hasil = hasil
        .map(t => ({
          ...t,
          jarak: t.lat && t.lng ? hitungJarak(userLat, userLng, t.lat, t.lng) : 9999,
        }))
        .sort((a, b) => a.jarak - b.jarak)
    }
    setFiltered(hasil)
  }

  function hubungiWhatsapp(telepon: string, namaToko: string) {
    const nomor = telepon.replace(/^0/, '62')
    const pesan = encodeURIComponent(`Halo, saya menemukan toko ${namaToko} di Lokaku. Apakah masih buka?`)
    window.open(`https://wa.me/${nomor}?text=${pesan}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">L</div>
          <span className="font-semibold text-gray-800">Lokaku</span>
          <span className="ml-auto text-xs text-gray-400">Temukan kebutuhan sekitar</span>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari toko atau produk..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 mb-2"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['', 'Kuliner', 'Sembako', 'Fashion', 'Kesehatan', 'Bengkel', 'Laundry', 'Salon & Kecantikan', 'Elektronik', 'Lainnya'].map(k => (
            <button
              key={k}
              onClick={() => setKategori(k)}
              className={`text-xs px-3 py-1 rounded-full whitespace-nowrap border transition ${kategori === k ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              {k === '' ? 'Semua' : k}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-400">
            {loading ? 'Memuat...' : `${filtered.length} toko sedang buka`}
          </p>
          {userLat && (
            <button
              onClick={() => setSortByJarak(!sortByJarak)}
              className={`text-xs px-3 py-1 rounded-full border transition ${sortByJarak ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              📍 Terdekat
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Memuat toko...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm">Tidak ada toko yang ditemukan</p>
            <p className="text-gray-300 text-xs mt-1">Coba kata kunci lain</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(t => (
              <div key={t.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {t.foto_url && (
                  <img src={t.foto_url} alt={t.nama} className="w-full h-36 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm">{t.nama}</h3>
                      <span className="text-xs text-gray-400">{t.kategori}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        BUKA
                      </span>
                      {userLat && userLng && t.lat && t.lng && (
                        <span className="text-xs text-gray-400">
                          📍 {formatJarak(hitungJarak(userLat, userLng, t.lat, t.lng))}
                        </span>
                      )}
                    </div>
                  </div>
                  {t.alamat && (
                    <p className="text-xs text-gray-500 mb-2">📍 {t.alamat}</p>
                  )}
                  {t.deskripsi && (
                    <p className="text-xs text-gray-400 mb-3 line-clamp-2">{t.deskripsi}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/toko/${t.id}`)}
                      className="flex-1 border border-gray-200 text-gray-600 text-xs py-1.5 rounded-lg hover:bg-gray-50 transition"
                    >
                      Lihat Toko
                    </button>
                    {t.telepon && (
                      <button
                        onClick={() => hubungiWhatsapp(t.telepon, t.nama)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1.5 rounded-lg transition"
                      >
                        WhatsApp
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex">
        <button onClick={() => navigate('/cari')} className="flex-1 py-3 text-xs text-red-600 font-medium">
          🔍 Cari
        </button>
        <button onClick={() => navigate('/peta')} className="flex-1 py-3 text-xs text-gray-400">
          🗺️ Peta
        </button>
        <button onClick={() => navigate('/dashboard')} className="flex-1 py-3 text-xs text-gray-400">
          🏪 Toko Saya
        </button>
      </div>
    </div>
  )
}