import { useEffect, useState, useRef } from 'react'
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
  const [user, setUser] = useState<any>(null)
  const [semuaToko, setSemuaToko] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [isVerifiedWA, setIsVerifiedWA] = useState(false)
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
      setUser(userData.user)

      const sekarang = Date.now()
      if (profileCache && (sekarang - profileCacheTime < PROFILE_CACHE_TTL)) {
        setNamaUser(profileCache.nama || '')
        setIsVerified(profileCache.is_verified || false)
        setIsVerifiedWA(profileCache.is_wa_verified || false)
        setIsAdmin(profileCache.is_admin || false)
      } else {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', userData.user.id).maybeSingle()
        if (p) {
          profileCache = p
          profileCacheTime = sekarang
          setNamaUser(p.nama || '')
          setIsVerified(p.is_verified || false)
          setIsVerifiedWA(p.is_wa_verified || false)
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
        const tokoId = listToko[0].id
        const { count } = await supabase
          .from('pesan').select('*', { count: 'exact', head: true })
          .eq('toko_id', tokoId).eq('is_penjual', false).eq('is_read', false)
        setUnreadCount(count || 0)
      }

    } catch (err: any) {
      toast.error('Gagal memuat data bisnis')
    } finally {
      setLoading(false)
    }
  }

  async function toggleBuka(tokoId: string, currentStatus: boolean) {
    setUpdatingStatusId(tokoId)
    const nextStatus = !currentStatus
    
    const { error } = await supabase
      .from('toko')
      .update({ is_buka: nextStatus })
      .eq('id', tokoId)

    setUpdatingStatusId(null)

    if (error) {
      toast.error('Gagal mengubah status operasional')
    } else {
      setSemuaToko(prev => prev.map(t => t.id === tokoId ? { ...t, is_buka: nextStatus } : t))
      toast.success(nextStatus ? 'Toko Buka! Radar warga mendeteksi Anda.' : 'Toko ditutup sementara.')
    }
  }

  async function konfirmasiHapusToko() {
    if (!hapusTarget) return
    setMenghapus(true)
    
    const { error } = await supabase
      .from('toko')
      .delete()
      .eq('id', hapusTarget.id)

    setMenghapus(false)
    setHapusTarget(null)

    if (error) {
      toast.error('Gagal menghapus entitas')
    } else {
      toast.success('Entitas bisnis berhasil dihapus')
      setSemuaToko(prev => prev.filter(t => t.id !== hapusTarget.id))
    }
  }

  function getThemeClasses(jenis: string, isBuka: boolean) {
    if (!isBuka) return {
      badgeBg: 'bg-slate-100 text-slate-500 border-slate-200',
      cardBorder: 'border-rose-200 opacity-90 saturate-[0.8] shadow-sm'
    }
    switch (jenis) {
      case 'jasa':
        return {
          badgeBg: 'bg-blue-50 text-blue-600 border-blue-100',
          cardBorder: 'border-blue-100/70 shadow-md shadow-blue-950/[0.02]'
        }
      case 'preloved':
        return {
          badgeBg: 'bg-purple-50 text-purple-600 border-purple-100',
          cardBorder: 'border-purple-100/70 shadow-md shadow-purple-950/[0.02]'
        }
      default:
        return {
          badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
          cardBorder: 'border-emerald-100/70 shadow-md shadow-emerald-950/[0.02]'
        }
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-[3px] border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-3"></div>
      <p className="text-[11px] font-bold text-emerald-800 tracking-widest animate-pulse uppercase">Menyinkronkan Lapak...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 text-slate-800 antialiased font-medium">
      
      {/* HEADER UTAMA */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 px-4 pt-8 pb-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_50%)]"></div>
        <div className="max-w-md mx-auto flex justify-between items-center relative z-10">
          <div className="space-y-1">
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-black px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-widest">
              Pusat Kendali Mitra
            </span>
            <h1 className="text-white font-black text-xl tracking-tight mt-1">Halo, {namaUser || 'Pemilik Lapak'} 👋</h1>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button onClick={() => navigate('/admin')} className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-[10px] px-2.5 py-1.5 rounded-xl font-black transition tracking-wider uppercase">
                🛡️ Admin
              </button>
            )}
            <button onClick={() => navigate('/profil')} className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center border border-white/10 text-base shadow-lg transition backdrop-blur-sm active:scale-95">
              👤
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-7 space-y-4 relative z-20">
        
        {/* SLIDER PROMO */}
        <div className="space-y-1.5">
          <PromoSlider lat={userLat} lng={userLng} />
        </div>

        {/* 🌟 SPANDUK TINGGI KONTRAS: DAFTARKAN UNIT USAHA BARU */}
        {semuaToko.length > 0 && (
          <button 
            onClick={() => navigate('/buat-toko')}
            className="w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-md active:scale-[0.99] transition-all border border-white/5 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(59,130,246,0.15),transparent_60%)]"></div>
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-9 h-9 bg-emerald-500 text-slate-950 font-black rounded-xl flex items-center justify-center text-base shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                ➕
              </div>
              <div className="text-left">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">Punya Usaha/Jasa Lain?</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Buka cabang atau daftarkan keahlian barumu di radar warga</p>
              </div>
            </div>
            <span className="text-slate-500 text-lg group-hover:translate-x-1 transition-transform relative z-10">→</span>
          </button>
        )}

        {/* LOGIC EMPTY STATE */}
        {semuaToko.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 text-center shadow-md space-y-5">
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-50 to-teal-50 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-inner">🏪</div>
            <div className="space-y-1">
              <h3 className="font-black text-slate-900 text-base tracking-tight">Belum Ada Lapak Terdaftar</h3>
              <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">Mulai jangkau tetangga dan pembeli lokal di sekitarmu dengan mendaftarkan toko fisik atau jasa panggilanmu.</p>
            </div>
            <button 
              onClick={() => navigate('/buat-toko')}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-lg shadow-emerald-600/10 active:scale-98 transition-all"
            >
              🚀 Buat Toko / Jasa Pertama Kamu
            </button>
          </div>
        ) : (
          
          /* MULTI-TOKO INTERACTIVE LIST */
          <div className="space-y-4">
            {semuaToko.map((t) => {
              const theme = getThemeClasses(t.jenis, t.is_buka)
              const adaPesanBaru = unreadCount > 0

              return (
                <div key={t.id} className={`bg-white rounded-3xl border transition-all overflow-hidden ${theme.cardBorder}`}>
                  
                  {/* BARIS UTAMA: IDENTITAS & KONTROL OPERASIONAL */}
                  <div className={`p-4 flex items-center justify-between border-b transition-colors duration-300 ${
                    t.is_buka ? 'bg-slate-50/40 border-slate-100/50' : 'bg-rose-50/10 border-rose-100/20'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-3 w-3">
                        {t.is_buka && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${t.is_buka ? 'bg-emerald-500' : 'bg-rose-400'}`}></span>
                      </div>
                      <div>
                        <h2 className="font-black text-sm text-slate-900 tracking-tight leading-tight">{t.nama}</h2>
                        <span className={`inline-block text-[9px] font-black px-2 py-0.5 mt-1 rounded-md border uppercase tracking-wider ${theme.badgeBg}`}>
                          {t.jenis === 'jasa' ? '💼 Jasa Panggilan' : t.jenis === 'preloved' ? '♻️ Bursa Preloved' : '🏪 Retail Mandiri'}
                        </span>
                      </div>
                    </div>

                    <button
                      disabled={updatingStatusId === t.id}
                      onClick={() => toggleBuka(t.id, t.is_buka)}
                      className={`text-xs px-3.5 py-1.5 rounded-xl font-black border transition-all active:scale-95 flex items-center gap-1.5 shadow-sm ${
                        t.is_buka
                          ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          : 'bg-rose-600 border-rose-600 text-white hover:bg-rose-700'
                      }`}
                    >
                      {updatingStatusId === t.id ? (
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      ) : t.is_buka ? (
                        '🟢 Buka'
                      ) : (
                        '🔴 Tutup'
                      )}
                    </button>
                  </div>

                  {/* 🔥 CRUCIAL HIGH-CONTRAST CHAT & ORDER HUB BANNER */}
                  <button 
                    onClick={() => navigate(`/chat/${t.id}`)}
                    className={`w-full p-4 flex items-center justify-between border-b border-slate-100 transition-all text-left active:scale-[0.99] ${
                      adaPesanBaru 
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/10 animate-pulse' 
                        : 'bg-amber-50/40 hover:bg-amber-50/80 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm ${
                        adaPesanBaru ? 'bg-white text-orange-600' : 'bg-amber-100 text-amber-700'
                      }`}>
                        💬
                      </div>
                      <div>
                        <h3 className={`text-xs font-black uppercase tracking-wider ${adaPesanBaru ? 'text-white' : 'text-slate-900'}`}>
                          {adaPesanBaru ? '🚨 Masuk Pesanan Warga!' : 'Pusat Chat & Transaksi'}
                        </h3>
                        <p className={`text-[11px] font-medium mt-0.5 ${adaPesanBaru ? 'text-orange-50' : 'text-slate-400'}`}>
                          {adaPesanBaru ? `Ada ${unreadCount} pesan belum dibaca! Segera respon.` : 'Konsultasi, nego harga, & detail pesanan'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      {adaPesanBaru ? (
                        <span className="bg-white text-orange-600 text-[9px] font-black px-2 py-0.5 rounded-md shadow-sm">
                          BALAS
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">›</span>
                      )}
                    </div>
                  </button>

                  {/* 3 ACTIONS GRID: SISA MANAJEMEN TOKO */}
                  <div className="p-4 bg-white grid grid-cols-3 gap-2.5">
                    
                    <button 
                      onClick={() => navigate('/produk')}
                      className="border border-slate-100 bg-slate-50/40 hover:bg-slate-50 p-3 rounded-xl text-center active:scale-95 transition-all flex flex-col items-center gap-1.5 group"
                    >
                      <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-sm">📦</div>
                      <span className="text-[11px] font-black text-slate-800 tracking-tight">Katalog Produk</span>
                    </button>

                    <button 
                      onClick={() => navigate('/buat-promo')}
                      className="border border-slate-100 bg-slate-50/40 hover:bg-slate-50 p-3 rounded-xl text-center active:scale-95 transition-all flex flex-col items-center gap-1.5 group"
                    >
                      <div className="w-8 h-8 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center text-sm">🔥</div>
                      <span className="text-[11px] font-black text-slate-800 tracking-tight">Pasang Promo</span>
                    </button>

                    <button 
                      onClick={() => navigate('/edit-toko')}
                      className="border border-slate-100 bg-slate-50/40 hover:bg-slate-50 p-3 rounded-xl text-center active:scale-95 transition-all flex flex-col items-center gap-1.5 group"
                    >
                      <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center text-sm">⚙️</div>
                      <span className="text-[11px] font-black text-slate-800 tracking-tight">Pengaturan</span>
                    </button>

                  </div>

                  {/* AKSES HAPUS DISKRET DI BAGIAN BAWAH KARTU */}
                  <div className="bg-slate-50/30 px-4 py-2 border-t border-slate-100/50 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400">ID: {t.id.slice(0, 8)}...</span>
                    <button 
                      onClick={() => setHapusTarget(t)}
                      className="text-[10px] font-bold text-rose-400 hover:text-rose-600 transition"
                    >
                      🗑️ Hapus Lapak
                    </button>
                  </div>

                </div>
              )
            })}
          </div>
        )}

      </div>

      {/* MODAL KONFIRMASI HAPUS TOKO */}
      {hapusTarget && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl border border-slate-100">
            <div className="text-center space-y-2">
              <span className="text-4xl block">⚠️</span>
              <h3 className="font-black text-slate-950 text-base tracking-tight">Hapus Entitas Usaha?</h3>
              <p className="text-xs text-slate-500 leading-relaxed px-1">
                Lapak "<strong>{hapusTarget.nama}</strong>" beserta seluruh katalog produk, chat, dan kupon promo akan dieliminasi permanen dari radar aplikasi warga.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setHapusTarget(null)} disabled={menghapus} className="flex-1 border-2 border-slate-100 text-slate-500 py-3 rounded-xl text-xs font-bold hover:bg-gray-50 transition">
                Batalkan
              </button>
              <button onClick={konfirmasiHapusToko} disabled={menghapus} className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white py-3 rounded-xl text-xs font-black shadow-md transition disabled:opacity-50">
                {menghapus ? 'Memproses...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-100 flex shadow-[0_-4px_24px_rgba(0,0,0,0.03)] z-40 max-w-md mx-auto pb-safe">
        <button onClick={() => navigate('/cari')} className="flex-1 py-3.5 flex flex-col items-center gap-1 transition active:scale-95">
          <span className="text-lg leading-none">🔍</span>
          <span className="text-[10px] font-bold text-slate-400">Cari</span>
        </button>
        <button onClick={() => navigate('/peta')} className="flex-1 py-3.5 flex flex-col items-center gap-1 transition active:scale-95">
          <span className="text-lg leading-none">🗺️</span>
          <span className="text-[10px] font-bold text-slate-400">Peta</span>
        </button>
        <button onClick={() => navigate('/dashboard')} className="flex-1 py-3.5 flex flex-col items-center gap-1 transition active:scale-95">
          <span className="text-lg leading-none">🏪</span>
          <span className="text-[10px] font-black text-emerald-600">Toko</span>
        </button>
        <button onClick={() => navigate('/profil')} className="flex-1 py-3.5 flex flex-col items-center gap-1 transition active:scale-95">
          <span className="text-lg leading-none">👤</span>
          <span className="text-[10px] font-bold text-slate-400">Profil</span>
        </button>
      </div>

    </div>
  )
}