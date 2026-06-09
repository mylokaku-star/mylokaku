import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [toko, setToko] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isBuka, setIsBuka] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isVerified, setIsVerified] = useState(false)       // centang biru toko (KYC)
  const [isVerifiedWA, setIsVerifiedWA] = useState(false)   // verifikasi nomor WA
  const [namaUser, setNamaUser] = useState('')

  useEffect(() => {
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
    const { data: profileData } = await supabase
      .from('profiles')
      .select('nama, is_admin, is_verified, nomor_wa, verification_requested_at')
      .eq('id', userId)
      .single()

    setIsAdmin(profileData?.is_admin || false)
    setIsVerified(profileData?.is_verified || false)
    setIsVerifiedWA(profileData?.is_verified || false)
    setNamaUser(profileData?.nama || '')

    const { data } = await supabase
      .from('toko').select('*').eq('user_id', userId).single()
    if (data) {
      setToko(data)
      setIsBuka(data.is_buka)
      loadUnread(data.id)

      supabase
        .channel(`unread-${data.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'pesan',
          filter: `toko_id=eq.${data.id}`,
        }, payload => {
          const msg = payload.new as any
          if (!msg.is_penjual) {
            setUnreadCount(prev => prev + 1)
            toast('💬 Pesan baru masuk!', {
              description: msg.isi?.length > 50 ? msg.isi.slice(0, 50) + '...' : msg.isi,
              duration: 5000,
              action: { label: 'Balas', onClick: () => navigate(`/chat/${data.id}`) },
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
    }
    setLoading(false)
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center text-white font-black text-xl mx-auto mb-3 animate-pulse">L</div>
          <p className="text-gray-400 text-sm">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 pt-6 pb-8">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white font-black text-lg">L</div>
            <span className="font-extrabold text-white text-lg">Lokaku</span>
          </div>
          {isAdmin && (
            <button onClick={() => navigate('/admin')}
              className="flex items-center gap-1.5 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-xl font-bold hover:bg-gray-700 transition">
              🛡️ Admin
            </button>
          )}
        </div>
        <p className="text-green-100 text-xs mt-2">Selamat datang,</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-white font-bold text-sm">
            {namaUser || user?.email}
          </p>
          {isVerified && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              background: '#3b82f6', color: 'white', borderRadius: '99px',
              padding: '1px 7px', fontSize: '10px', fontWeight: 'bold',
            }}>
              ✓ Terverifikasi
            </span>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4">

        {/* Banner verifikasi WA — TERPISAH dari centang biru toko */}
        {!isVerifiedWA && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-sm font-bold text-amber-800">📱 Verifikasi Nomor WA</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Konfirmasi nomor WhatsApp-mu agar akun lebih aman
              </p>
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
                <button onClick={toggleStatus}
                  className={`w-full py-3.5 rounded-2xl text-sm font-extrabold transition shadow-sm ${isBuka ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-100' : 'bg-green-600 hover:bg-green-700 text-white shadow-green-100'}`}>
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

            {/* Verifikasi centang biru toko (KYC) — tidak diubah */}
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

            {/* Tombol admin */}
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
  )
}
