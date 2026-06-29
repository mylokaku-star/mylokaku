import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import PromoSlider from '../components/PromoSlider'

// Cache profile agar tidak flicker saat kembali ke halaman
let profileCache: any = null
let profileCacheTime = 0
const PROFILE_CACHE_TTL = 30_000 // 30 detik

export default function DashboardPage() {
  const navigate = useNavigate()
  const [semuaToko, setSemuaToko] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [namaUser, setNamaUser] = useState('')
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLng, setUserLng] = useState<number | null>(null)
  const [hapusTarget, setHapusTarget] = useState<any>(null)
  const [menghapus, setMenghapus] = useState(false)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude) },
      () => {}
    )
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { navigate('/login'); return }

      const sekarang = Date.now()
      if (profileCache && (sekarang - profileCacheTime < PROFILE_CACHE_TTL)) {
        setNamaUser(profileCache.nama || '')
        setIsAdmin(profileCache.is_admin || false)
      } else {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', userData.user.id).maybeSingle()
        if (p) {
          profileCache = p
          profileCacheTime = sekarang
          setNamaUser(p.nama || '')
          setIsAdmin(p.is_admin || false)
        }
      }

      const { data: tokoData } = await supabase
        .from('toko')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })

      const listToko = tokoData || []
      setSemuaToko(listToko)

      if (listToko.length > 0) {
        const tokoIds = listToko.map((t: any) => t.id)
        let totalUnread = 0
        await Promise.all(tokoIds.map(async (id: string) => {
          const { count } = await supabase
            .from('pesan')
            .select('*', { count: 'exact', head: true })
            .eq('toko_id', id)
            .eq('is_penjual', false)
            .eq('is_read', false)
          totalUnread += count || 0
        }))
        setUnreadCount(totalUnread)
      }

    } catch (err: any) {
      toast.error('Gagal memuat data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function toggleBuka(tokoId: string, currentStatus: boolean) {
    setUpdatingStatusId(tokoId)
    const nextStatus = !currentStatus
    const { error } = await supabase.from('toko').update({ is_buka: nextStatus }).eq('id', tokoId)
    setUpdatingStatusId(null)
    if (error) {
      toast.error('Gagal mengubah status operasional')
    } else {
      setSemuaToko(prev => prev.map(t => t.id === tokoId ? { ...t, is_buka: nextStatus } : t))
      toast.success(nextStatus ? 'Toko Buka! Sekarang terlihat di radar warga.' : 'Toko Ditutup Sementara.')
    }
  }

  async function konfirmasiHapusToko() {
    if (!hapusTarget) return
    setMenghapus(true)
    const { error } = await supabase.from('toko').delete().eq('id', hapusTarget.id)
    setMenghapus(false)
    setHapusTarget(null)
    if (error) {
      toast.error('Gagal menghapus toko')
    } else {
      toast.success('Toko berhasil dihapus')
      setSemuaToko(prev => prev.filter(t => t.id !== hapusTarget.id))
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F9FBFA] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-green-100 border-t-green-600 rounded-full animate-spin mb-3"></div>
      <p className="text-xs font-black text-green-800 tracking-wider animate-pulse uppercase">Membuka Ruang Kendali...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F6F9F8] pb-28 text-gray-900 antialiased font-medium">
      <div className="bg-white border-b border-gray-100 px-4 pt-6 pb-4 sticky top-0 z-30 shadow-sm/50">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Pusat Mitra Lokaku</p>
            <h1 className="text-base font-black text-gray-900 mt-1 tracking-tight">Halo, {namaUser || 'Mitra Warga'} 👋</h1>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <button onClick={() => navigate('/admin')} className="bg-red-50 text-red-600 border border-red-100 text-[11px] px-3 py-1.5 rounded-xl font-bold active:scale-95 transition">
                👑 Admin Panel
              </button>
            )}
            <button onClick={() => navigate('/profil')} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200 text-sm active:scale-95 transition">
              👤
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        <div className="space-y-1.5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Info & Papan Pengumuman Warga</p>
          <PromoSlider lat={userLat} lng={userLng} />
        </div>

        {semuaToko.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-6 text-center shadow-sm space-y-5">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-inner">🏪</div>
            <div className="space-y-1">
              <h3 className="font-black text-slate-900 text-base">Mulai Buka Usaha & Jasa Kamu</h3>
              <p className="text-xs text-gray-400 max-w-[280px] mx-auto leading-relaxed">Dapatkan akses pasar lokal langsung dari tetangga sekitar rumah.</p>
            </div>
            <button
              onClick={() => navigate('/buat-toko')}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-md shadow-green-900/10 active:scale-98 transition-all"
            >
              🚀 Daftarkan Toko atau Jasa Sekarang
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex justify-between items-center pl-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Daftar Toko ({semuaToko.length})</p>
              <button
                onClick={() => navigate('/buat-toko')}
                className="text-[11px] font-extrabold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-100 hover:bg-green-100 transition"
              >
                ➕ Tambah Baru
              </button>
            </div>

            {semuaToko.map((t) => (
              <div key={t.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all">
                <div className={`p-4 transition-colors duration-300 flex items-center justify-between border-b ${
                  t.is_buka ? 'bg-emerald-50/60 border-emerald-100/50' : 'bg-gray-50 border-gray-100'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${t.is_buka ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></div>
                    <div>
                      <h2 className="font-black text-sm text-gray-900 leading-tight">{t.nama}</h2>
                      <p className="text-[11px] text-gray-400 mt-0.5 font-semibold uppercase tracking-wider">
                        {t.jenis === 'jasa' ? '💼 Penyedia Jasa' : t.jenis === 'preloved' ? '♻️ Bursa Preloved' : '🏪 Toko Retail'}
                      </p>
                    </div>
                  </div>
                  <button
                    disabled={updatingStatusId === t.id}
                    onClick={() => toggleBuka(t.id, t.is_buka)}
                    className={`text-xs px-4 py-2 rounded-xl font-black border tracking-wide transition-all active:scale-95 flex items-center gap-1.5 shadow-sm ${
                      t.is_buka ? 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50' : 'bg-gray-900 border-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {updatingStatusId === t.id ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : t.is_buka ? '🟢 Buka' : '🔴 Tutup'}
                  </button>
                </div>

                <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-50 bg-white">
                  {/* ← FIX: navigate ke /chat/:id bukan /chat-list-penjual/:id */}
                  <button onClick={() => navigate(`/chat/${t.id}`)} className="p-3.5 text-center hover:bg-gray-50/50 transition flex flex-col items-center justify-center gap-0.5 group">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">💬</span>
                      <span className={`text-sm font-black ${unreadCount > 0 ? 'text-orange-500' : 'text-gray-800'}`}>
                        {unreadCount} Pesan
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Chat Masuk Pembeli</p>
                  </button>

                  <div className="p-3.5 text-center flex flex-col items-center justify-center gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">📍</span>
                      <span className="text-sm font-black text-gray-800">
                        {t.lat && t.lng ? 'Terpetakan' : 'Belum Set'}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Koordinat Radar</p>
                  </div>
                </div>

                <div className="p-4 bg-white grid grid-cols-2 gap-3">
                  {/* ← FIX: /produk?toko= bukan /kelola-produk/:id */}
                  <button onClick={() => navigate(`/produk?toko=${t.id}`)} className="border border-gray-100 bg-slate-50/50 hover:bg-slate-50 p-3.5 rounded-2xl text-left active:scale-95 transition-all flex flex-col gap-2">
                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-sm shadow-inner">📦</div>
                    <div>
                      <h4 className="text-xs font-black text-gray-900">Kelola Produk</h4>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">Atur menu barang / jasa</p>
                    </div>
                  </button>

                  {/* ← FIX: /buat-promo bukan /buat-promo/:id */}
                  <button onClick={() => navigate('/buat-promo')} className="border border-gray-100 bg-slate-50/50 hover:bg-slate-50 p-3.5 rounded-2xl text-left active:scale-95 transition-all flex flex-col gap-2">
                    <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-sm shadow-inner">🔥</div>
                    <div>
                      <h4 className="text-xs font-black text-gray-900">Buat Promo</h4>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">Siar diskon di papan warga</p>
                    </div>
                  </button>

                  {/* ← FIX: /edit-toko?toko= bukan /edit-toko/:id */}
                  <button onClick={() => navigate(`/edit-toko?toko=${t.id}`)} className="border border-gray-100 bg-slate-50/50 hover:bg-slate-50 p-3.5 rounded-2xl text-left active:scale-95 transition-all flex flex-col gap-2">
                    <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-sm shadow-inner">⚙️</div>
                    <div>
                      <h4 className="text-xs font-black text-gray-900">Edit Toko</h4>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">Ubah banner, jam, & lokasi</p>
                    </div>
                  </button>

                  <button onClick={() => setHapusTarget(t)} className="border border-red-50 bg-red-50/20 hover:bg-red-50/50 p-3.5 rounded-2xl text-left active:scale-95 transition-all flex flex-col gap-2">
                    <div className="w-8 h-8 bg-red-50 text-red-500 rounded-xl flex items-center justify-center text-sm shadow-inner">🗑️</div>
                    <div>
                      <h4 className="text-xs font-black text-red-600">Hapus Toko</h4>
                      <p className="text-[10px] text-red-400 font-medium mt-0.5">Hapus permanen badan bisnis</p>
                    </div>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {hapusTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl">
            <div className="text-center space-y-2">
              <span className="text-4xl block animate-bounce">⚠️</span>
              <h3 className="font-black text-gray-900 text-base">Konfirmasi Hapus Toko?</h3>
              <p className="text-xs text-gray-500 leading-relaxed px-2">
                Toko "<strong>{hapusTarget.nama}</strong>" beserta semua produk, chat, dan promo akan dihapus permanen.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setHapusTarget(null)} disabled={menghapus} className="flex-1 border-2 border-gray-100 text-gray-500 py-3 rounded-xl text-xs font-bold hover:bg-gray-50 transition disabled:opacity-50">Batalkan</button>
              <button onClick={konfirmasiHapusToko} disabled={menghapus} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-xs font-black shadow-md transition disabled:opacity-50 flex items-center justify-center">
                {menghapus ? 'Memproses...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 flex shadow-[0_-4px_24px_rgba(0,0,0,0.04)] z-40 max-w-md mx-auto pb-safe">
        <button onClick={() => navigate('/cari')} className="flex-1 py-3.5 flex flex-col items-center gap-1 transition active:scale-95"><span className="text-lg leading-none">🔍</span><span className="text-[10px] font-bold text-gray-400">Cari</span></button>
        <button onClick={() => navigate('/peta')} className="flex-1 py-3.5 flex flex-col items-center gap-1 transition active:scale-95"><span className="text-lg leading-none">🗺️</span><span className="text-[10px] font-bold text-gray-400">Peta</span></button>
        <button onClick={() => navigate('/dashboard')} className="flex-1 py-3.5 flex flex-col items-center gap-1 transition active:scale-95"><span className="text-lg leading-none">🏪</span><span className="text-[10px] font-black text-green-700">Toko</span></button>
        <button onClick={() => navigate('/profil')} className="flex-1 py-3.5 flex flex-col items-center gap-1 transition active:scale-95"><span className="text-lg leading-none">👤</span><span className="text-[10px] font-bold text-gray-400">Profil</span></button>
      </div>
    </div>
  )
}
