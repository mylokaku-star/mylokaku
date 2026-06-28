import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { supabase } from '../lib/supabase'
import { getIconKategori, getWarnaMarker } from '../lib/kategoriIcon'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix default icon bawaan Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Kustomisasi Marker Toko
function buatCustomIcon(kategori: string, jenis?: string) {
  const emoji = getIconKategori(kategori, jenis)
  const warna = getWarnaMarker(jenis)
  const html = `
    <div style="
      position: relative;
      width: 44px;
      height: 52px;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: transform 0.2s;
    ">
      <div style="
        background: ${warna};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        border: 2.5px solid white;
      ">
        <span style="transform: rotate(45deg); font-size: 18px; line-height: 1;">${emoji}</span>
      </div>
      <div style="
        width: 6px;
        height: 6px;
        background: rgba(0,0,0,0.4);
        border-radius: 50%;
        margin-top: 4px;
        filter: blur(1px);
      "></div>
    </div>
  `
  return L.divIcon({
    html,
    className: 'hover:-translate-y-1 transition-transform',
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    popupAnchor: [0, -48],
  })
}

// Marker Pengguna dengan Efek Radar Berdenyut (Pulse)
function buatUserIcon() {
  const html = `
    <style>
      @keyframes radar-pulse {
        0% { transform: scale(0.8); opacity: 0.8; }
        100% { transform: scale(3); opacity: 0; }
      }
    </style>
    <div style="position: relative; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 100%; height: 100%; background: #3b82f6; border-radius: 50%; animation: radar-pulse 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;"></div>
      <div style="
        position: relative;
        width: 18px;
        height: 18px;
        background: #2563eb;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        z-index: 2;
      "></div>
    </div>
  `
  return L.divIcon({
    html,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

// Komponen Pembantu untuk menggerakkan kamera peta
function MapController({ center, userPos }: { center: [number, number], userPos: [number, number] | null }) {
  const map = useMap()
  
  // Expose fungsi flyTo ke objek window agar tombol FAB di luar scope Leaflet bisa memanggilnya
  useEffect(() => {
    (window as any).recenterMap = () => {
      if (userPos) map.flyTo(userPos, 15, { animate: true, duration: 1.5 })
    }
    return () => { delete (window as any).recenterMap }
  }, [map, userPos])

  useEffect(() => { map.setView(center, 14) }, [center, map])
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

  return (
    <div className="min-h-screen bg-gray-100 relative overflow-hidden">

      {/* OVERLAY HEADER: Glassmorphism Floating UI ditaruh di atas peta */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-4 pointer-events-none">
        
        {/* Info Box */}
        <div className="bg-white/90 backdrop-blur-md border border-white/50 shadow-lg rounded-2xl p-3 mb-3 pointer-events-auto flex justify-between items-center transition-all">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-inner">L</div>
            <div>
              <h1 className="font-extrabold text-gray-900 leading-none">Radar Lokasi</h1>
              <p className="text-[10px] text-green-700 font-bold mt-0.5 tracking-wide">
                Ditemukan {tokoFiltered.length} titik aktif
              </p>
            </div>
          </div>
        </div>

        {/* Floating Filter Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto pb-2">
          {([
            { val: 'semua',    label: '🏠 Semua',    aktif: 'bg-green-600 border-green-600 text-white shadow-md shadow-green-900/20' },
            { val: 'toko',     label: '🏪 Toko',     aktif: 'bg-green-600 border-green-600 text-white shadow-md shadow-green-900/20' },
            { val: 'jasa',     label: '🛠️ Jasa',     aktif: 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-900/20' },
            { val: 'preloved', label: '♻️ Preloved', aktif: 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-900/20' },
          ] as const).map(f => (
            <button
              key={f.val}
              onClick={() => setFilterJenis(f.val)}
              className={`text-[11px] px-4 py-2 rounded-full border-[1.5px] font-extrabold transition-all whitespace-nowrap flex-shrink-0 active:scale-95 ${
                filterJenis === f.val
                  ? f.aktif
                  : 'bg-white/90 backdrop-blur-sm text-gray-600 border-gray-200/80 hover:bg-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-screen pb-20 bg-[#F9FBFA]">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
          <p className="text-green-700 font-bold text-sm animate-pulse">Menyinkronkan satelit radar...</p>
        </div>
      ) : (
        <MapContainer
          center={center}
          zoom={14}
          // Hilangkan zoom control default agar peta terlihat lebih lega & estetik
          zoomControl={false} 
          style={{ height: 'calc(100vh - 64px)', width: '100%', zIndex: 10 }}
        >
          <MapController center={center} userPos={userPos} />
          
          {/* MENGGUNAKAN TILE MAP MODERN (Carto Voyager) YANG JAUH LEBIH BERSIH DARI OSM DEFAULT */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {userPos && (
            <Marker position={userPos} icon={buatUserIcon()}>
              <Popup className="custom-popup">
                <div className="text-center font-bold text-gray-800 text-xs">
                  📍 Kamu di sini
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
              <Popup minWidth={200} className="rounded-2xl overflow-hidden shadow-xl">
                <div style={{ fontFamily: 'sans-serif', margin: '-14px -20px -14px -20px' }}>
                  {/* Header Popup Modern */}
                  <div style={{
                    background: getWarnaMarker(t.jenis),
                    padding: '12px 16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '24px', background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '12px' }}>
                        {getIconKategori(t.kategori, t.jenis)}
                      </span>
                      <div>
                        <p style={{ color: 'white', fontWeight: '900', fontSize: '14px', margin: 0, lineHeight: '1.2' }}>{t.nama}</p>
                        <span style={{ color: 'white', fontSize: '9px', fontWeight: 'bold', background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '99px', display: 'inline-block', marginTop: '4px' }}>
                           {t.jenis === 'jasa' ? 'LAYANAN JASA' : t.jenis === 'preloved' ? 'BARANG BEKAS' : 'TOKO'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body Popup */}
                  <div style={{ padding: '12px 16px', background: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                      <span style={{
                        background: t.jenis === 'jasa' ? '#dbeafe' : t.jenis === 'preloved' ? '#fef3c7' : '#dcfce7',
                        color:      t.jenis === 'jasa' ? '#1d4ed8' : t.jenis === 'preloved' ? '#92400e'  : '#15803d',
                        fontSize: '10px',
                        fontWeight: '900',
                        padding: '3px 8px',
                        borderRadius: '6px',
                      }}>
                        {t.jenis === 'jasa' ? '🛠️ TERSEDIA' : t.jenis === 'preloved' ? '♻️ DIJUAL' : '🟢 SEDANG BUKA'}
                      </span>
                    </div>

                    {t.alamat && (
                      <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        <span style={{ fontWeight: 'bold', color:'#374151' }}>Alamat:</span> {t.alamat}
                      </p>
                    )}

                    {/* Action Buttons Group */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        onClick={() => navigate(`/toko/${t.id}`)}
                        style={{
                          flex: 1,
                          background: 'white',
                          color: getWarnaMarker(t.jenis),
                          border: `1.5px solid ${getWarnaMarker(t.jenis)}`,
                          borderRadius: '10px',
                          padding: '8px',
                          fontSize: '11px',
                          fontWeight: '800',
                          cursor: 'pointer',
                        }}
                      >
                        Detail →
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
                            borderRadius: '10px',
                            padding: '8px 12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
                          }}
                        >
                          💬 Chat
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

      {/* FAB: Floating Action Button untuk memusatkan lokasi */}
      {userPos && !loading && (
        <button
          onClick={() => {
            if ((window as any).recenterMap) {
              (window as any).recenterMap()
            }
          }}
          className="absolute bottom-[80px] right-4 z-[1000] w-12 h-12 bg-white rounded-full shadow-lg shadow-black/20 flex items-center justify-center border border-gray-100 active:scale-90 transition-transform"
        >
          <span className="text-xl">🎯</span>
        </button>
      )}

      {/* Bottom Nav Sticky Bawah */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 flex shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-[1001] pb-safe">
        <button onClick={() => navigate('/cari')} className="flex-1 py-3.5 flex flex-col items-center gap-1 group">
          <span className="text-lg group-active:scale-110 transition-transform">🔍</span>
          <span className="text-[10px] font-bold text-gray-400">Cari</span>
        </button>
        <button onClick={() => navigate('/peta')} className="flex-1 py-3.5 flex flex-col items-center gap-1 group">
          <span className="text-lg group-active:scale-110 transition-transform">🗺️</span>
          <span className="text-[10px] font-black text-red-600">Peta</span>
        </button>
        <button onClick={() => navigate('/dashboard')} className="flex-1 py-3.5 flex flex-col items-center gap-1 group">
          <span className="text-lg group-active:scale-110 transition-transform">🏪</span>
          <span className="text-[10px] font-bold text-gray-400">Toko</span>
        </button>
        <button onClick={() => navigate('/profil')} className="flex-1 py-3.5 flex flex-col items-center gap-1 group">
          <span className="text-lg group-active:scale-110 transition-transform">👤</span>
          <span className="text-[10px] font-bold text-gray-400">Profil</span>
        </button>
      </div>

    </div>
  )
}