import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

export default function ProfilPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [toko, setToko] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editNama, setEditNama] = useState('')
  const [savingNama, setSavingNama] = useState(false)
  const [formPassword, setFormPassword] = useState({ baru: '', konfirmasi: '' })
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    loadProfil()
  }, [])

  async function loadProfil() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { navigate('/login'); return }
    setUser(userData.user)

    // Load profil nama
    const { data: profileData } = await supabase
      .from('profiles').select('*').eq('id', userData.user.id).single()
    setProfile(profileData)
    setEditNama(profileData?.nama || '')

    const { data: tokoData } = await supabase
      .from('toko').select('*').eq('user_id', userData.user.id).single()
    setToko(tokoData)
    setLoading(false)
  }

  async function handleSimpanNama() {
    if (!editNama.trim()) { toast.error('Nama tidak boleh kosong'); return }
    if (editNama.trim().length < 2) { toast.error('Nama minimal 2 karakter'); return }
    setSavingNama(true)
    if (profile) {
      const { error } = await supabase
        .from('profiles').update({ nama: editNama.trim() }).eq('id', user.id)
      if (error) { toast.error('Gagal simpan nama') }
      else {
        setProfile({ ...profile, nama: editNama.trim() })
        toast.success('Nama berhasil diubah!')
      }
    } else {
      // Belum punya profil, insert baru
      const nomorWa = user.email?.replace('@lokaku.app', '')
      const { error } = await supabase
        .from('profiles').insert({ id: user.id, nama: editNama.trim(), nomor_wa: nomorWa })
      if (error) { toast.error('Gagal simpan nama') }
      else {
        setProfile({ id: user.id, nama: editNama.trim() })
        toast.success('Nama berhasil disimpan!')
      }
    }
    setSavingNama(false)
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

  function getNomorWA() {
    const email = user?.email || ''
    return email.replace('@lokaku.app', '')
  }

  function getInisial() {
    const nama = profile?.nama || user?.email || '?'
    return nama.charAt(0).toUpperCase()
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
            {getInisial()}
          </div>
          {/* Tampilkan nama, bukan nomor WA */}
          <p className="text-white font-bold text-lg">
            {profile?.nama || 'Belum ada nama'}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            📱 +{getNomorWA()}
          </p>
          <p className="text-gray-500 text-xs mt-0.5">
            Member sejak {new Date(user?.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-6 space-y-4">

        {/* Edit Nama */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4">Nama Tampilan</p>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nama Kamu</label>
              <input
                type="text"
                value={editNama}
                onChange={e => setEditNama(e.target.value)}
                placeholder="Masukkan nama kamu"
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition"
              />
              <p className="text-xs text-gray-400 mt-1">Nama ini yang tampil di chat dan profil kamu</p>
            </div>
            <button
              onClick={handleSimpanNama}
              disabled={savingNama || editNama.trim() === profile?.nama}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl py-3 text-sm font-bold transition shadow-sm disabled:opacity-50"
            >
              {savingNama ? 'Menyimpan...' : 'Simpan Nama'}
            </button>
          </div>
        </div>

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
