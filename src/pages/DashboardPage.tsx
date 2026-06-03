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
      .from('toko')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (data) {
      setToko(data)
      setIsBuka(data.is_buka)
    }
    setLoading(false)
  }

  async function toggleStatus() {
    if (!toko) return
    const newStatus = !isBuka
    const { error } = await supabase
      .from('toko')
      .update({ is_buka: newStatus })
      .eq('id', toko.id)
    if (!error) {
      setIsBuka(newStatus)
      toast.success(newStatus ? 'Toko sekarang BUKA' : 'Toko sekarang TUTUP')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Memuat...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">

      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">L</div>
          <span className="font-semibold text-gray-800">Lokaku</span>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600 transition">
          Keluar
        </button>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">

        {/* Selamat datang */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Selamat datang,</p>
          <p className="font-semibold text-gray-800">{user?.email}</p>
        </div>

        {/* Status Toko */}
        {toko ? (
          <div className="bg-white rounded-xl p-4 border border-gray-100">

            {/* Foto toko */}
            {toko.foto_url && (
              <img
                src={toko.foto_url}
                alt={toko.nama}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
            )}

            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold text-gray-800">{toko.nama}</h2>
                <p className="text-sm text-gray-500">{toko.kategori}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${isBuka ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {isBuka ? 'BUKA' : 'TUTUP'}
              </span>
            </div>

            <button
              onClick={toggleStatus}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition ${isBuka ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
            >
              {isBuka ? 'Tutup Toko Sekarang' : 'Buka Toko Sekarang'}
            </button>

            <button
              onClick={() => navigate('/edit-toko')}
              className="w-full mt-2 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50 transition"
            >
              ✏️ Edit Info Toko & Foto
            </button>

            <button
              onClick={() => navigate('/tambah-produk')}
              className="w-full mt-2 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50 transition"
            >
              + Tambah Produk
            </button>

          </div>
        ) : (
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <p className="text-gray-500 text-sm mb-3">Kamu belum punya toko</p>
            <button
              onClick={() => navigate('/buat-toko')}
              className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg transition"
            >
              + Buat Toko Sekarang
            </button>
          </div>
        )}

      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex">
        <button onClick={() => navigate('/cari')} className="flex-1 py-3 text-xs text-gray-400">
          🔍 Cari
        </button>
        <button onClick={() => navigate('/peta')} className="flex-1 py-3 text-xs text-gray-400">
          🗺️ Peta
        </button>
        <button onClick={() => navigate('/dashboard')} className="flex-1 py-3 text-xs text-red-600 font-medium">
          🏪 Toko Saya
        </button>
      </div>

    </div>
  )
}