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
    if (!userData.user) { navigate('/login'); return }
    setUser(userData.user)
    const { data: tokoData } = await supabase
      .from('toko').select('*').eq('user_id', userData.user.id).single()
    setToko(tokoData)
    setLoading(false)
  }

  async function handleGantiPassword() {
    if (!formPassword.baru || !formPassword.konfirmasi) { toast.error('Semua field wajib diisi'); return }
    if (formPassword.baru !== formPassword.konfirmasi) { toast.error('Kata sandi tidak cocok'); return }
    if (formPassword.baru.length < 6) { toast.error('Minimal 6 karakter'); return }
    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: formPassword.baru })
    setSavingPassword(false)
    if (error) { toast.error('Gagal ganti kata sandi') }
    else { toast.success('Kata sandi berhasil diubah!'); setFormPassword({ baru: '', konfirmasi: '' }) }
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
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* Header */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 px-4 pt-8 pb-12">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-3xl font-black mx-auto mb-3 shadow-lg">
            {user?.email?.[0].toUpperCase()}
          </div>
          <p className="text-white font-bold">{user?.email}</p>
          <p className="text-gray-400 text-xs mt-1">
            Member sejak {new Date(user?.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-6 space-y-4">

        {/* Info Toko */}
        {toko && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {toko.foto_url && (
              <img src={toko.foto_url} alt={toko.nama} className="w-full h-28 object-cover" />
            )}
            <div className="p-5">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Toko Saya</p>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-extrabold text-gray-900">{toko.nama}</h3>
                  <p className="text-xs text-gray-400">{toko.kategori}</p>
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-xl font-bold ${toko.is_buka ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {toko.is_buka ? '🟢 BUKA' : '🔴 TUTUP'}
                </span>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full border-2 border-gray-100 text-gray-600 text-sm py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition"
              >
                Kelola Toko →
              </button>
            </div>
          </div>
        )}

        {/* Ganti Password */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4">Ganti Kata Sandi</p>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Kata Sandi Baru</label>
              <input
                type="password"
                value={formPassword.baru}
                onChange={e => setFormPassword(f => ({ ...f, baru: e.target.value }))}
                placeholder="Minimal 6 karakter"
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Konfirmasi Kata Sandi</label>
              <input
                type="password"
                value={formPassword.konfirmasi}
                onChange={e => setFormPassword(f => ({ ...f, konfirmasi: e.target.value }))}
                placeholder="Ulangi kata sandi baru"
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition"
              />
            </div>
            <button
              onClick={handleGantiPassword}
              disabled={savingPassword}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl py-3 text-sm font-bold transition shadow-sm disabled:opacity-50"
            >
              {savingPassword ? 'Menyimpan...' : 'Ganti Kata Sandi'}
            </button>
          </div>
        </div>

        {/* Keluar */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <button
            onClick={handleLogout}
            className="w-full border-2 border-red-100 text-red-600 text-sm py-3 rounded-xl font-bold hover:bg-red-50 transition"
          >
            Keluar dari Akun
          </button>
        </div>

      </div>

      {/* Bottom nav */}
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
          <span className="text-xs font-medium text-gray-400">Toko</span>
        </button>
        <button onClick={() => navigate('/profil')} className="flex-1 py-3 flex flex-col items-center gap-0.5">
          <span className="text-lg">👤</span>
          <span className="text-xs font-bold text-red-600">Profil</span>
        </button>
      </div>
    </div>
  )
}