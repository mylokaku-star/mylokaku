import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

export default function ProfilPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [toko, setToko] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [formPassword, setFormPassword] = useState({ baru: '', konfirmasi: '' })
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    loadProfil()
  }, [])

  async function loadProfil() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      navigate('/login')
      return
    }
    setUser(userData.user)
    const { data: tokoData } = await supabase
      .from('toko')
      .select('*')
      .eq('user_id', userData.user.id)
      .single()
    setToko(tokoData)
    setLoading(false)
  }

  async function handleGantiPassword() {
    if (!formPassword.baru || !formPassword.konfirmasi) {
      toast.error('Semua field wajib diisi')
      return
    }
    if (formPassword.baru !== formPassword.konfirmasi) {
      toast.error('Kata sandi tidak cocok')
      return
    }
    if (formPassword.baru.length < 6) {
      toast.error('Kata sandi minimal 6 karakter')
      return
    }
    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: formPassword.baru })
    setSavingPassword(false)
    if (error) {
      toast.error('Gagal ganti kata sandi')
    } else {
      toast.success('Kata sandi berhasil diubah!')
      setFormPassword({ baru: '', konfirmasi: '' })
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Memuat...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">

      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">L</div>
          <span className="font-semibold text-gray-800">Profil Saya</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">

        {/* Info Akun */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-2xl font-bold">
              {user?.email?.[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{user?.email}</p>
              <p className="text-xs text-gray-400">Member sejak {new Date(user?.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* Info Toko */}
        {toko && (
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Toko Saya</p>
            {toko.foto_url && (
              <img src={toko.foto_url} alt={toko.nama} className="w-full h-32 object-cover rounded-lg mb-3" />
            )}
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-semibold text-gray-800">{toko.nama}</h3>
                <p className="text-xs text-gray-400">{toko.kategori}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${toko.is_buka ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {toko.is_buka ? 'BUKA' : 'TUTUP'}
              </span>
            </div>
            {toko.alamat && <p className="text-xs text-gray-500">📍 {toko.alamat}</p>}
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full mt-3 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50 transition"
            >
              Kelola Toko →
            </button>
          </div>
        )}

        {/* Ganti Password */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Ganti Kata Sandi</p>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Kata Sandi Baru</label>
              <input
                type="password"
                value={formPassword.baru}
                onChange={e => setFormPassword(f => ({ ...f, baru: e.target.value }))}
                placeholder="Minimal 6 karakter"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Konfirmasi Kata Sandi</label>
              <input
                type="password"
                value={formPassword.konfirmasi}
                onChange={e => setFormPassword(f => ({ ...f, konfirmasi: e.target.value }))}
                placeholder="Ulangi kata sandi baru"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400"
              />
            </div>
            <button
              onClick={handleGantiPassword}
              disabled={savingPassword}
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 text-sm font-medium transition disabled:opacity-50"
            >
              {savingPassword ? 'Menyimpan...' : 'Ganti Kata Sandi'}
            </button>
          </div>
        </div>

        {/* Keluar */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full border border-red-200 text-red-600 text-sm py-2 rounded-lg hover:bg-red-50 transition"
          >
            Keluar dari Akun
          </button>
        </div>

      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex">
        <button onClick={() => navigate('/cari')} className="flex-1 py-3 text-xs text-gray-400">
          🔍 Cari
        </button>
        <button onClick={() => navigate('/peta')} className="flex-1 py-3 text-xs text-gray-400">
          🗺️ Peta
        </button>
        <button onClick={() => navigate('/dashboard')} className="flex-1 py-3 text-xs text-gray-400">
          🏪 Toko
        </button>
        <button onClick={() => navigate('/profil')} className="flex-1 py-3 text-xs text-red-600 font-medium">
          👤 Profil
        </button>
      </div>

    </div>
  )
}