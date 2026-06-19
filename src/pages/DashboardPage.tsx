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
  const [toko, setToko] = useState<any>(null)
  const [semuaToko, setSemuaToko] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isBuka, setIsBuka] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [isVerifiedWA, setIsVerifiedWA] = useState(false)
  const [namaUser, setNamaUser] = useState('')
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLng, setUserLng] = useState<number | null>(null)
  const [hapusTarget, setHapusTarget] = useState<any>(null)
  const [menghapus, setMenghapus] = useState(false)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude) },
      () => {}
    )
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate('/login')
      } else {
        setUser(data.user)
        loadToko(data.user.id)
      }
    })
  }, [])

  async function loadToko(userId: string) {
    let profileData: any = null
    if (profileCache && Date.now() - profileCacheTime < PROFILE_CACHE_TTL) {
      profileData = profileCache
    } else {
      const { data } = await supabase
        .from('profiles')
        .select('nama, is_admin, is_verified, is_wa_verified, nomor_wa, verification_requested_at')
        .eq('id', userId)
        .single()
      profileData = data
      profileCache = data
      profileCacheTime = Date.now()
    }

    setIsAdmin(profileData?.is_admin || false)
    setIsVerified(profileData?.is_verified || false)
    setIsVerifiedWA(profileData?.is_wa_verified || false)
    setNamaUser(profileData?.nama || '')

    // Ambil SEMUA toko milik user (bisa lebih dari 1), bukan .single()
    const { data: tokoList } = await supabase
      .from('toko')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    setSemuaToko(tokoList || [])

    const data = tokoList && tokoList.length > 0 ? tokoList[0] : null
    if (data) {
      setToko(data)
      setIsBuka(data.is_buka)
      loadUnread(data.id)
      subscribeUnread(data.id)
    }
    setLoading(false)
  }

  function subscribeUnread(tokoIdToWatch: string) {
    // Tutup channel lama (kalau ada) sebelum bikin yang baru — pakai ref, bukan setState,
    // supaya tidak ada masalah double-invoke updater function di React
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const newChannel = supabase
      .channel(`unread-${tokoIdToWatch}-${Date.now()}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'pesan',
        filter: `toko_id=eq.${tokoIdToWatch}`,
      }, payload => {
        const msg = payload.new as any
        if (!msg.is_penjual) {
          setUnreadCount(prev => prev + 1)
          toast('💬 Pesan baru masuk!', {
            description: msg.isi?.length > 50 ? msg.isi.slice(0, 50) + '...' : msg.isi,
            duration: 5000,
            action: { label: 'Balas', onClick: () => navigate(`/chat/${tokoIdToWatch}`) },
          })
          let blinkInterval: any
          let original = document.title
          let blink = false
          blinkInterval = setInterval(() => {
            document.title = blink ? `💬 Pesan Baru - Lokaku` : original
            blink = !blink
          }, 1000)
          setTimeout(() => { clearInterval(blinkInterval); document.title = original }, 10000)
          window.addEventListener('focus', () => { clearInterval(blinkInterval); document.title = original }, { once: true })
        }
      })
      .subscribe()

    channelRef.current = newChannel
  }

  function pindahToko(t: any) {
    setToko(t)
    setIsBuka(t.is_buka)
    loadUnread(t.id)
    subscribeUnread(t.id)
  }

  useEffect(() => {
    // Cleanup channel saat komponen unmount (pindah halaman)
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [])

  async function loadUnread(tokoId: string) {
    const { count } = await supabase
      .from('pesan').select('*', { count: 'exact', head: true })
      .eq('toko_id', tokoId).eq('is_penjual', false).eq('is_read', false)
    setUnreadCount(count || 0)
  }

  async function toggleStatus() {
    if (!toko) return
    const newStatus = !isBuka
    const { error } = await supabase.from('toko').update({ is_buka: newStatus }).eq('id', toko.id)
    if (!error) {
      setIsBuka(newStatus)
      toast.success(newStatus ? 'Toko sekarang BUKA! 🎉' : 'Toko sekarang TUTUP')
    }
  }

  async function konfirmasiHapusToko() {
    if (!hapusTarget) return
    setMenghapus(true)
    const { error } = await supabase.from('toko').delete().eq('id', hapusTarget.id)
    setMenghapus(false)
    if (error) {
      toast.error('Gagal menghapus toko: ' + error.message)
      return
    }
    toast.success(`"${hapusTarget.nama}" berhasil dihapus`)
    const sisaToko = semuaToko.filter(t => t.id !== hapusTarget.id)
    setSemuaToko(sisaToko)
    setHapusTarget(null)
    if (toko?.id === hapusTarget.id) {
      const next = sisaToko[0] || null
      if (next) {
        pindahToko(next)
      } else {
        setToko(null)
        if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null }
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <img src="/icon-192x192.png" alt="Lokaku"
            className="w-12 h-12 rounded-2xl object-cover mx-auto mb-3 animate-pulse" />
          <p className="text-gray-400 text-sm">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 pt-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/cari')}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-xl font-bold transition"
          >
            ← Cari Toko
          </button>
          {isAdmin ? (
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-1.5 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-xl font-bold hover:bg-gray-700 transition"
            >
              🛡️ Admin
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        <div className="flex flex-col items-center text-center">
          <img src="/icon-192x192.png" alt="Lokaku"
            className="w-10 h-10 rounded-2xl object-cover mb-2" />
          <p className="text-green-100 text-xs">Selamat datang,</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-white font-bold text-sm">{namaUser || user?.email}</p>
            {isVerified && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                background: '#3b82f6', color: 'white', borderRadius: '99px',
                padding: '1px 7px', fontSize: '10px', fontWeight: 'bold',
              }}>✓ Terverifikasi</span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto -mt-4 space-y-4">

        {/* Promo & Event Slider — header lebih besar & tombol lebih menarik */}
        <div className="space-y-3 px-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-extrabold text-gray-800">🔥 Promo & Event Sekitar</p>
          </div>

          {toko && (
            <button
              onClick={() => navigate('/buat-promo')}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-2xl py-4 px-5 shadow-lg shadow-orange-200 transition flex items-center gap-3 active:scale-[0.98]"
            >
              <span className="text-3xl">🏷️</span>
              <div className="flex-1 text-left">
                <p className="font-extrabold text-sm">Buat Promo / Event Baru</p>
                <p className="text-xs text-white/80 mt-0.5">Jangkau pembeli baru di sekitarmu</p>
              </div>
              <span className="text-xl">›</span>
            </button>
          )}

          <PromoSlider lat={userLat} lng={userLng} />
        </div>

        <div className="px-4 space-y-4">

          {/* Banner verifikasi WA */}
          {!isVerifiedWA && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-sm font-bold text-amber-800">📱 Verifikasi Nomor WA</p>
                <p className="text-xs text-amber-600 mt-0.5">Konfirmasi nomor WhatsApp-mu agar akun lebih aman</p>
              </div>
              <button
                onClick={() => navigate('/verifikasi-wa')}
                className="text-xs bg-amber-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-amber-600 transition flex-shrink-0 ml-3"
              >
                Verifikasi →
              </button>
            </div>
          )}

          {toko ? (
            <>
              {/* Switcher kalau punya lebih dari 1 toko */}
              {semuaToko.length > 1 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 px-1">
                    Toko/Jasa Kamu ({semuaToko.length})
                  </p>
                  <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                    {semuaToko.map(t => (
                      <button
                        key={t.id}
                        onClick={() => pindahToko(t)}
                        className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border-2 transition
                          ${toko?.id === t.id ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 bg-gray-50 text-gray-500'}`}
                      >
                        <span>{t.jenis === 'jasa' ? '🛠️' : t.jenis === 'preloved' ? '♻️' : '🏪'}</span>
                        {t.nama}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
                {toko.foto_url ? (
                  <img src={toko.foto_url} alt={toko.nama} className="w-full h-36 object-cover" />
                ) : (
                  <div className={`w-full h-24 flex items-center justify-center text-4xl ${toko.jenis === 'jasa' ? 'bg-gradient-to-br from-blue-50 to-blue-100' : toko.jenis === 'preloved' ? 'bg-gradient-to-br from-purple-50 to-purple-100' : 'bg-gradient-to-br from-green-50 to-green-100'}`}>
                    {toko.jenis === 'jasa' ? '🛠️' : toko.jenis === 'preloved' ? '♻️' : '🏪'}
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="font-extrabold text-gray-900 text-lg">{toko.nama}</h2>
                      <span className="text-xs text-gray-400 font-medium">{toko.kategori}</span>
                      {toko.alamat && <p className="text-xs text-gray-400 mt-0.5">📍 {toko.alamat}</p>}
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-xl font-bold ${isBuka ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {isBuka ? '🟢 BUKA' : '🔴 TUTUP'}
                    </span>
                  </div>
                  <button
                    onClick={toggleStatus}
                    className={`w-full py-3.5 rounded-2xl text-sm font-extrabold transition shadow-sm ${isBuka ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-100' : 'bg-green-600 hover:bg-green-700 text-white shadow-green-100'}`}
                  >
                    {isBuka ? '🔴 Tutup Toko Sekarang' : '🟢 Buka Toko Sekarang'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => navigate('/edit-toko')}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left hover:shadow-md transition">
                  <span className="text-2xl mb-2 block">✏️</span>
                  <p className="font-bold text-gray-800 text-sm">Edit Toko</p>
                  <p className="text-xs text-gray-400 mt-0.5">Info & foto toko</p>
                </button>
                <button onClick={() => navigate('/produk')}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left hover:shadow-md transition">
                  <span className="text-2xl mb-2 block">📦</span>
                  <p className="font-bold text-gray-800 text-sm">Kelola Produk</p>
                  <p className="text-xs text-gray-400 mt-0.5">Tambah & edit produk</p>
                </button>
                <button onClick={() => navigate(`/toko/${toko.id}`)}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left hover:shadow-md transition">
                  <span className="text-2xl mb-2 block">👁️</span>
                  <p className="font-bold text-gray-800 text-sm">Lihat Toko</p>
                  <p className="text-xs text-gray-400 mt-0.5">Tampilan pembeli</p>
                </button>
                <button onClick={() => navigate(`/chat/${toko.id}`)}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left hover:shadow-md transition relative">
                  {unreadCount > 0 && (
                    <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                  <span className="text-2xl mb-2 block">💬</span>
                  <p className="font-bold text-gray-800 text-sm">Pesan Masuk</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {unreadCount > 0 ? `${unreadCount} pesan baru` : 'Chat pembeli'}
                  </p>
                </button>
              </div>

              <div className={`rounded-2xl p-4 border shadow-sm flex items-center justify-between ${isVerified ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-100'}`}>
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    {isVerified ? '✓ Akun Terverifikasi' : 'Verifikasi Akun'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isVerified ? 'Centang biru aktif di profilmu' : 'Dapatkan centang biru untuk kepercayaan lebih'}
                  </p>
                </div>
                {isVerified ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 32, height: 32, background: '#3b82f6', color: 'white',
                    borderRadius: '50%', fontSize: 16, fontWeight: 'bold', flexShrink: 0,
                  }}>✓</span>
                ) : (
                  <button onClick={() => navigate('/verifikasi')}
                    className="text-xs bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition flex-shrink-0">
                    Ajukan →
                  </button>
                )}
              </div>

              {isAdmin && (
                <button onClick={() => navigate('/admin')}
                  className="w-full bg-gray-900 rounded-2xl p-4 border border-gray-700 shadow-sm text-left hover:bg-gray-800 transition flex items-center gap-3">
                  <span className="text-2xl">🛡️</span>
                  <div>
                    <p className="font-bold text-white text-sm">Dashboard Admin</p>
                    <p className="text-xs text-gray-400 mt-0.5">Kelola verifikasi KYC & pengguna</p>
                  </div>
                </button>
              )}

              <button onClick={() => navigate('/buat-toko')}
                className="w-full border-2 border-dashed border-gray-200 text-gray-400 rounded-2xl py-3.5 text-sm font-bold hover:bg-gray-50 hover:border-green-300 hover:text-green-600 transition">
                + Daftarkan Toko/Jasa/Preloved Lain
              </button>

              {/* Hapus toko ini */}
              <button onClick={() => setHapusTarget(toko)}
                className="w-full border-2 border-red-100 text-red-500 rounded-2xl py-3 text-xs font-bold hover:bg-red-50 transition">
                🗑️ Hapus "{toko.nama}"
              </button>
            </>
          ) : (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="text-5xl mb-4">🏪</div>
              <h2 className="font-extrabold text-gray-900 text-lg mb-2">Belum punya toko</h2>
              <p className="text-gray-400 text-sm mb-6">Buat toko pertamamu dan mulai berjualan sekarang</p>
              <button onClick={() => navigate('/buat-toko')}
                className="bg-green-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-green-700 transition text-sm">
                + Buat Toko Sekarang
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal konfirmasi hapus toko */}
      {hapusTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full">
            <div className="text-center mb-4">
              <span className="text-4xl block mb-3">⚠️</span>
              <h3 className="font-extrabold text-gray-900 text-base">Hapus Toko?</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                "<strong>{hapusTarget.nama}</strong>" beserta semua produk, pesan, dan promo terkait akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setHapusTarget(null)} disabled={menghapus}
                className="flex-1 border-2 border-gray-100 text-gray-600 py-3 rounded-xl text-sm font-bold hover:bg-gray-50 transition disabled:opacity-50">
                Batal
              </button>
              <button onClick={konfirmasiHapusToko} disabled={menghapus}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-600 transition disabled:opacity-50">
                {menghapus ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
