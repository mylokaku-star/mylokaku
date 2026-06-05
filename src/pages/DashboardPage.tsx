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
    const { data } = await supabase
      .from('toko').select('*').eq('user_id', userId).single()
    if (data) {
      setToko(data)
      setIsBuka(data.is_buka)
      loadUnread(data.id)

      // Realtime unread + toast notifikasi
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

            // Toast notifikasi pesan baru
            toast('💬 Pesan baru masuk!', {
              description: msg.isi?.length > 50
                ? msg.isi.slice(0, 50) + '...'
                : msg.isi,
              duration: 5000,
              action: {
                label: 'Balas',
                onClick: () => navigate(`/chat/${data.id}`),
              },
            })

            // Judul tab berkedip
            let blinkInterval: any
            let original = document.title
            let blink = false
            blinkInterval = setInterval(() => {
              document.title = blink ? `💬 Pesan Baru - Lokaku` : original
              blink = !blink
            }, 1000)
            // Stop berkedip setelah 10 detik atau waktu tab difokus
            setTimeout(() => {
              clearInterval(blinkInterval)
              document.title = original
            }, 10000)
            window.addEventListener('focus', () => {
              clearInterval(blinkInterval)
              document.title = original
            }, { once: true })
          }
        })
        .subscribe()
    }
    setLoading(false)
  }

  async function loadUnread(tokoId: string) {
    const { count } = await supabase
      .from('pesan')
      .select('*', { count: 'exact', head: true })
      .eq('toko_id', tokoId)
      .eq('is_penjual', false)
      .eq('is_read', false)
    setUnreadCount(count || 0)
  }

  async function toggleStatus() {
    if (!toko) return
    const newStatus = !isBuka
    const { error } = await supabase
      .from('toko').update({ is_buka: newStatus }).eq('id', toko.id)
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

      <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 pt-6 pb-8">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white font-black text-lg">L</div>
            <span className="font-extrabold text-white text-lg">Lokaku</span>
          </div>
        </div>
        <p className="text-green-100 text-xs mt-2">Selamat datang,</p>
        <p className="text-white font-bold text-sm">{user?.email}</p>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4">

        {toko ? (
          <>
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
              {toko.foto_url ? (
                <img src={toko.foto_url} alt={toko.nama} className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-24 bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center text-4xl">🏪</div>
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
              <button
                onClick={() => navigate('/edit-toko')}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left hover:shadow-md transition"
              >
                <span className="text-2xl mb-2 block">✏️</span>
                <p className="font-bold text-gray-800 text-sm">Edit Toko</p>
                <p className="text-xs text-gray-400 mt-0.5">Info & foto toko</p>
              </button>
              <button
                onClick={() => navigate('/produk')}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left hover:shadow-md transition"
              >
                <span className="text-2xl mb-2 block">📦</span>
                <p className="font-bold text-gray-800 text-sm">Kelola Produk</p>
                <p className="text-xs text-gray-400 mt-0.5">Tambah & edit produk</p>
              </button>
              <button
                onClick={() => navigate(`/toko/${toko.id}`)}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left hover:shadow-md transition"
              >
                <span className="text-2xl mb-2 block">👁️</span>
                <p className="font-bold text-gray-800 text-sm">Lihat Toko</p>
                <p className="text-xs text-gray-400 mt-0.5">Tampilan pembeli</p>
              </button>
              <button
                onClick={() => navigate(`/chat/${toko.id}`)}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left hover:shadow-md transition relative"
              >
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
          </>
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center mt-4">
            <span className="text-5xl mb-4 block">🏪</span>
            <h3 className="font-extrabold text-gray-900 text-lg mb-2">Belum punya toko</h3>
            <p className="text-gray-400 text-sm mb-6">Daftarkan tokomu sekarang dan mulai ditemukan pembeli di sekitarmu!</p>
            <button
              onClick={() => navigate('/buat-toko')}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-extrabold py-3.5 rounded-2xl text-sm shadow-lg shadow-red-100 hover:from-red-600 hover:to-red-700 transition"
            >
              + Buat Toko Sekarang
            </button>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex shadow-lg">
        <button onClick={() => navigate('/cari')} className="flex-1 py-3 flex flex-col items-center gap-0.5">
          <span className="text-lg">🔍</span>
          <span className="text-xs font-medium text-gray-400">Cari</span>
        </button>
        <button onClick={() => navigate('/peta')} className="flex-1 py-3 flex flex-col items-center gap-0.5">
          <span className="text-lg">🗺️</span>
          <span className="text-xs font-medium text-gray-400">Peta</span>
        </button>
        <button onClick={() => navigate('/dashboard')} className="flex-1 py-3 flex flex-col items-center gap-0.5">
          <span className="text-lg">🏪</span>
          <span className="text-xs font-bold text-red-600">Toko</span>
        </button>
        <button onClick={() => navigate('/profil')} className="flex-1 py-3 flex flex-col items-center gap-0.5">
          <span className="text-lg">👤</span>
          <span className="text-xs font-medium text-gray-400">Profil</span>
        </button>
      </div>

    </div>
  )
}
