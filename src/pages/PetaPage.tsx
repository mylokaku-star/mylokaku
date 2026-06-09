import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { supabase } from '../lib/supabase'
import { getIconKategori, getWarnaMarker } from '../lib/kategoriIcon'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix default icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function buatCustomIcon(kategori: string, jenis?: string) {
  const emoji = getIconKategori(kategori, jenis)
  const warna = getWarnaMarker(jenis)
  const html = `
    <div style="
      position: relative;
      width: 40px;
      height: 48px;
      display: flex;
      flex-direction: column;
      align-items: center;
    ">
      <div style="
        background: ${warna};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        border: 2.5px solid white;
      ">
        <span style="transform: rotate(45deg); font-size: 17px; line-height: 1;">${emoji}</span>
      </div>
      <div style="
        width: 6px;
        height: 6px;
        background: ${warna};
        border-radius: 50%;
        margin-top: 2px;
        opacity: 0.5;
      "></div>
    </div>
  `
  return L.divIcon({
    html,
    className: '',
    iconSize: [40, 48],
    iconAnchor: [20, 48],
    popupAnchor: [0, -48],
  })
}

function buatUserIcon() {
  const html = `
    <div style="
      width: 18px;
      height: 18px;
      background: #3b82f6;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 0 4px rgba(59,130,246,0.3);
    "></div>
  `
  return L.divIcon({
    html,
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

function SetCenter({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => { map.setView(center, 14) }, [center])
  return null
}

export default function PetaPage() {
  const navigate = useNavigate()
  const [toko, setToko] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [center, setCenter] = useState<[number, number]>([-6.2088, 106.8456])
  const [userPos, setUserPos] = useState<[number, number] | null>(null)
  const [filterJenis, setFilterJenis] = useState<'semua' | 'toko' | 'jasa' | 'preloved'>('semua')

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setCenter(coords)
        setUserPos(coords)
      },
      () => {}
    )
    loadToko()
  }, [])

  async function loadToko() {
    const { data } = await supabase
      .from('toko')
      .select('*')
      .eq('is_buka', true)
      .not('lat', 'is', null)
      .not('lng', 'is', null)
    setToko(data || [])
    setLoading(false)
  }

  const tokoFiltered = toko.filter(t => {
    if (filterJenis === 'toko')     return !t.jenis || t.jenis === 'toko'
    if (filterJenis === 'jasa')     return t.jenis === 'jasa'
    if (filterJenis === 'preloved') return t.jenis === 'preloved'
    return true
  })

  const jumlahToko     = toko.filter(t => !t.jenis || t.jenis === 'toko').length
  const jumlahJasa     = toko.filter(t => t.jenis === 'jasa').length
  const jumlahPreloved = toko.filter(t => t.jenis === 'preloved').length

  return (
    <div className="min-h-screen bg-gray-50 pb-16">

      {/* Header */}
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">L</div>
          <span className="font-bold text-gray-800">Peta Sekitar</span>
          <span className="ml-auto text-xs text-gray-400">
            {jumlahToko} toko · {jumlahJasa} jasa · {jumlahPreloved} preloved
          </span>
        </div>

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {([
            { val: 'semua',    label: '🏠 Semua',    aktif: 'bg-green-600 border-green-600' },
            { val: 'toko',     label: '🏪 Toko',     aktif: 'bg-green-600 border-green-600' },
            { val: 'jasa',     label: '🛠️ Jasa',     aktif: 'bg-blue-600 border-blue-600' },
            { val: 'preloved', label: '♻️ Preloved', aktif: 'bg-amber-500 border-amber-500' },
          ] as const).map(f => (
            <button
              key={f.val}
              onClick={() => setFilterJenis(f.val)}
              className={`text-xs px-3 py-1.5 rounded-xl border-2 font-bold transition whitespace-nowrap flex-shrink-0 ${
                filterJenis === f.val
                  ? `${f.aktif} text-white`
                  : 'bg-white text-gray-500 border-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}

          {userPos && (
            <button
              onClick={() => setCenter([...userPos])}
              className="ml-auto text-xs px-3 py-1.5 rounded-xl border-2 font-bold bg-white text-gray-500 border-gray-100 hover:bg-gray-50 transition whitespace-nowrap flex-shrink-0"
            >
              📍 Lokasiku
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border-b px-4 py-2 flex items-center gap-4 z-10 overflow-x-auto">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-3 h-3 rounded-full bg-green-600"></div>
          <span className="text-xs text-gray-500">Toko</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          <span className="text-xs text-gray-500">Jasa</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span className="text-xs text-gray-500">Preloved</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-3 h-3 rounded-full bg-blue-400 ring-2 ring-blue-200"></div>
          <span className="text-xs text-gray-500">Kamu</span>
        </div>
        <span className="ml-auto text-xs text-gray-400 flex-shrink-0">{tokoFiltered.length} aktif di peta</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-3xl mb-2">🗺️</div>
            <p className="text-gray-400 text-sm">Memuat peta...</p>
          </div>
        </div>
      ) : (
        <MapContainer
          center={center}
          zoom={14}
          style={{ height: 'calc(100vh - 165px)', width: '100%' }}
          zoomControl={true}
        >
          <SetCenter center={center} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {userPos && (
            <Marker position={userPos} icon={buatUserIcon()}>
              <Popup>
                <div className="text-sm text-center">
                  <p className="font-semibold">📍 Lokasi Kamu</p>
                </div>
              </Popup>
            </Marker>
          )}

          {tokoFiltered.map(t => (
            <Marker
              key={t.id}
              position={[t.lat, t.lng]}
              icon={buatCustomIcon(t.kategori, t.jenis)}
            >
              <Popup minWidth={180}>
                <div style={{ fontFamily: 'sans-serif' }}>
                  <div style={{
                    background: getWarnaMarker(t.jenis),
                    margin: '-13px -19px 10px',
                    padding: '10px 14px',
                    borderRadius: '4px 4px 0 0',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>{getIconKategori(t.kategori, t.jenis)}</span>
                      <div>
                        <p style={{ color: 'white', fontWeight: 'bold', fontSize: '13px', margin: 0 }}>{t.nama}</p>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '10px', margin: 0 }}>{t.kategori}</p>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '0 2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                      <span style={{
                        background: t.jenis === 'jasa' ? '#dbeafe' : t.jenis === 'preloved' ? '#fef3c7' : '#dcfce7',
                        color:      t.jenis === 'jasa' ? '#1d4ed8' : t.jenis === 'preloved' ? '#92400e'  : '#15803d',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        padding: '2px 8px',
                        borderRadius: '99px',
                      }}>
                        {t.jenis === 'jasa' ? '🛠️ TERSEDIA' : t.jenis === 'preloved' ? '♻️ PRELOVED' : '🟢 BUKA'}
                      </span>
                    </div>

                    {t.alamat && (
                      <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 8px' }}>📍 {t.alamat}</p>
                    )}

                    {t.telepon && (
                      <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 8px' }}>📱 {t.telepon}</p>
                    )}

                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      <button
                        onClick={() => navigate(`/toko/${t.id}`)}
                        style={{
                          flex: 1,
                          background: getWarnaMarker(t.jenis),
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                        }}
                      >
                        Lihat Detail →
                      </button>
                      {t.telepon && (
                        <button
                          onClick={() => {
                            const nomor = t.telepon.replace(/^0/, '62')
                            const pesan = encodeURIComponent(`Halo, saya menemukan ${t.jenis === 'jasa' ? 'jasa' : t.jenis === 'preloved' ? 'barang preloved' : 'toko'} ${t.nama} di Lokaku!`)
                            window.open(`https://wa.me/${nomor}?text=${pesan}`, '_blank')
                          }}
                          style={{
                            background: '#22c55e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          💬
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex shadow-lg z-20">
        <button onClick={() => navigate('/cari')} className="flex-1 py-3 flex flex-col items-center gap-0.5">
          <span className="text-lg">🔍</span>
          <span className="text-xs font-medium text-gray-400">Cari</span>
        </button>
        <button onClick={() => navigate('/peta')} className="flex-1 py-3 flex flex-col items-center gap-0.5">
          <span className="text-lg">🗺️</span>
          <span className="text-xs font-bold text-red-600">Peta</span>
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
