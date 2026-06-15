import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Promo {
  id: string
  judul: string
  gambar_url: string
  jenis: 'promo' | 'event'
  tanggal_mulai: string
  tanggal_berakhir: string
  toko: { nama: string; alamat: string }
}

interface PromoSliderProps {
  lat?: number | null
  lng?: number | null
}

function hitungJarak(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatTanggal(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PromoSlider({ lat, lng }: PromoSliderProps) {
  const navigate = useNavigate()
  const [promos, setPromos] = useState<Promo[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => { loadPromos() }, [lat, lng])

  async function loadPromos() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('promos')
      .select(`
        id, judul, gambar_url, jenis, tanggal_mulai, tanggal_berakhir, lat, lng,
        toko:toko_id ( nama, alamat )
      `)
      .eq('status', 'aktif')
      .lte('tanggal_mulai', today)
      .gte('tanggal_berakhir', today)
      .order('created_at', { ascending: false })

    if (error || !data) { setLoading(false); return }

    // Filter radius 10km jika ada koordinat
    let filtered = data as any[]
    if (lat && lng) {
      filtered = data.filter((p: any) => {
        if (!p.lat || !p.lng) return true // tampilkan jika tidak ada koordinat
        return hitungJarak(lat, lng, p.lat, p.lng) <= (p.radius_km || 10)
      })
    }

    setPromos(filtered)
    setLoading(false)
  }

  function handleScroll() {
    if (!scrollRef.current) return
    const idx = Math.round(scrollRef.current.scrollLeft / scrollRef.current.offsetWidth)
    setActiveIdx(idx)
  }

  if (loading) return (
    <div className="px-4">
      <div className="flex gap-3 overflow-hidden">
        {[1, 2].map(i => (
          <div key={i} className="flex-shrink-0 w-72 aspect-[2/1] bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  )

  if (promos.length === 0) return null

  return (
    <div className="space-y-2">
      {/* Slider */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-4 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {promos.map((promo) => (
          <div
            key={promo.id}
            onClick={() => navigate(`/promo/${promo.id}`)}
            className="flex-shrink-0 w-72 snap-start cursor-pointer"
          >
            <div className="relative rounded-2xl overflow-hidden aspect-[2/1] shadow-md">
              <img
                src={promo.gambar_url}
                alt={promo.judul}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              {/* Badge jenis */}
              <div className={`absolute top-2 left-2 px-2.5 py-1 rounded-xl text-xs font-bold
                ${promo.jenis === 'promo' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'}`}>
                {promo.jenis === 'promo' ? '🏷️ Promo' : '🎪 Event'}
              </div>

              {/* Info bawah */}
              <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5">
                <p className="text-white font-bold text-sm leading-tight line-clamp-1">{promo.judul}</p>
                <p className="text-white/80 text-xs mt-0.5 line-clamp-1">{promo.toko?.nama}</p>
                <p className="text-white/60 text-xs mt-0.5">
                  s/d {formatTanggal(promo.tanggal_berakhir)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dot indicator */}
      {promos.length > 1 && (
        <div className="flex justify-center gap-1.5 px-4">
          {promos.map((_, i) => (
            <div key={i}
              className={`rounded-full transition-all ${i === activeIdx ? 'w-4 h-1.5 bg-green-500' : 'w-1.5 h-1.5 bg-gray-200'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
