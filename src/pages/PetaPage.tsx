import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { supabase } from '../lib/supabase'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

export default function PetaPage() {
  const navigate = useNavigate()
  const [toko, setToko] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [center, setCenter] = useState<[number, number]>([-6.2088, 106.8456])

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => setCenter([pos.coords.latitude, pos.coords.longitude]),
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

  return (
    <div className="min-h-screen bg-gray-50 pb-16">

      {/* Header */}
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">L</div>
          <span className="font-semibold text-gray-800">Peta Toko Sekitar</span>
          <span className="ml-auto text-xs text-green-600">{toko.length} toko buka</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-400 text-sm">Memuat peta...</p>
        </div>
      ) : (
        <MapContainer
          center={center}
          zoom={14}
          style={{ height: 'calc(100vh - 110px)', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {toko.map(t => (
            <Marker key={t.id} position={[t.lat, t.lng]}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{t.nama}</p>
                  <p className="text-gray-500 text-xs">{t.kategori}</p>
                  {t.alamat && <p className="text-gray-500 text-xs">📍 {t.alamat}</p>}
                  <button
                    onClick={() => navigate(`/toko/${t.id}`)}
                    className="mt-2 text-xs text-red-600 font-medium"
                  >
                    Lihat Detail →
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex z-20">
        <button onClick={() => navigate('/cari')} className="flex-1 py-3 text-xs text-gray-400">
          🔍 Cari
        </button>
        <button onClick={() => navigate('/peta')} className="flex-1 py-3 text-xs text-red-600 font-medium">
          🗺️ Peta
        </button>
        <button onClick={() => navigate('/dashboard')} className="flex-1 py-3 text-xs text-gray-400">
          🏪 Toko Saya
        </button>
      </div>

    </div>
  )
}