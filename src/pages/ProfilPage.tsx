import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

export default function ProfilPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [toko, setToko] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formPassword, setFormPassword] = useState({ baru: '', konfirmasi: '' })
  const [savingPassword, setSavingPassword] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [isVerifiedWA, setIsVerifiedWA] = useState(false)
  const [jumlahKeranjang, setJumlahKeranjang] = useState(0)
  const [jumlahWishlist, setJumlahWishlist] = useState(0)
  const [form, setForm] = useState({
    username: '', nama: '', nama_lengkap: '', email: '',
    jenis_kelamin: '', alamat: '', tanggal_lahir: '', nomor_wa: '',
  })

  useEffect(() => { loadProfil() }, [])

  async function loadProfil() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { navigate('/login'); return }
    setUser(userData.user)

    const { data: profileData } = await supabase
      .from('profiles').select('*').eq('id', userData.user.id).single()

    const nomorWa = userData.user.email?.replace('@lokaku.app', '') || ''

    if (profileData) {
      setForm({
        username: profileData.username || '',
        nama: profileData.nama || '',
        nama_lengkap: profileData.nama_lengkap || '',
        email: profileData.email || '',
        jenis_kelamin: profileData.jenis_kelamin || '',
        alamat: profileData.alamat || '',
        tanggal_lahir: profileData.tanggal_lahir || '',
        nomor_wa: profileData.nomor_wa || nomorWa,
      })
      setIsVerified(profileData.is_verified || false)
      setIsVerifiedWA(profileData.is_wa_verified || false)
    } else {
      setForm(f => ({ ...f, nomor_wa: nomorWa }))
    }

    const [{ data: tokoData }, { count: keranjangCount }, { count: wishlistCount }] = await Promise.all([
      supabase.from('toko').select('*').eq('user_id', userData.user.id).maybeSingle(),
      supabase.from('keranjang').select('*', { count: 'exact', head: true }).eq('user_id', userData.user.id),
      supabase.from('wishlist_produk').select('*', { count: 'exact', head: true }).eq('user_id', userData.user.id),
    ])

    setToko(tokoData)
    setJumlahKeranjang(keranjangCount || 0)
    setJumlahWishlist(wishlistCount || 0)
    setLoading(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSimpanProfil() {
    if (!form.nama.trim()) { toast.error('Nama tampilan wajib diisi'); return }
    if (form.username && !/^[a-zA-Z0-9_]+$/.test(form.username)) {
      toast.error('Username hanya boleh huruf, angka, dan underscore'); return
    }
    setSaving(true)
    if (form.username) {
      const { data: existingUser } = await supabase
        .from('profiles').select('id')
        .eq('username', form.username.toLowerCase()).neq('id', user.id).single()
      if (existingUser) { toast.error('Username sudah dipakai'); setSaving(false); return }
    }
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      username: form.username ? form.username.toLowerCase() : null,
      nama: form.nama.trim(),
      nama_lengkap: form.nama_lengkap.trim() || null,
      email: form.email.trim() || null,
      jenis_kelamin: form.jenis_kelamin || null,
      alamat: form.alamat.trim() || null,
      tanggal_lahir: form.tanggal_lahir || null,
      nomor_wa: form.nomor_wa || null,
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    if (error) {
      if (error.code === '23505') { toast.error('Username sudah dipakai') }
      else { toast.error('Gagal menyimpan: ' + error.message) }
    } else { toast.success('Profil berhasil disimpan!') }
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

  function getInisial() { return (form.nama || form.nama_lengkap || '?').charAt(0).toUpperCase() }
  function hitungUmur(tanggal: string) {
    if (!tanggal) return null
    return new Date().getFullYear() - new Date(tanggal).getFullYear()
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center text-white font-black text-xl mx-auto mb-3 animate-pulse">L</div>
        <p className="text-gray-400 text-sm">Memuat profil...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 px-4 pt-8 pb-14">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-3xl font-black mx-auto mb-3 shadow-lg">
            {getInisial()}
          </div>
          <div className="flex items-center justify-center gap-2">
            <p className="text-white font-bold text-lg">{form.nama || 'Belum ada nama'}</p>
            {isVerified && (
              <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:18, height:18, background:'#3b82f6', color:'white', borderRadius:'50%', fontSize:11, fontWeight:'bold' }}>✓</span>
            )}
          </div>
          {form.username && <p className="text-green-400 text-sm mt-0.5">@{form.username}</p>}
          <div className="flex items-center justify-center gap-2 mt-1">
            <p className="text-gray-400 text-xs">+{form.nomor_wa}</p>
            {isVerifiedWA && <span className="text-xs bg-green-700 text-green-200 px-2 py-0.5 rounded-full font-semibold">WA Verified</span>}
          </div>
          {form.tanggal_lahir && <p className="text-gray-500 text-xs mt-0.5">{hitungUmur(form.tanggal_lahir)} tahun</p>}
          <p className="text-gray-500 text-xs mt-0.5">
            Member sejak {new Date(user?.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-6 space-y-4">

        {/* Keranjang & Wishlist */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate('/keranjang')}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left hover:shadow-md transition relative">
            {jumlahKeranjang > 0 && (
              <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {jumlahKeranjang > 9 ? '9+' : jumlahKeranjang}
              </span>
            )}
            <span className="text-2xl mb-2 block">🛒</span>
            <p className="font-bold text-gray-800 text-sm">Keranjang</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {jumlahKeranjang > 0 ? `${jumlahKeranjang} item siap beli` : 'Belum ada item'}
            </p>
          </button>
          <button onClick={() => navigate('/keranjang')}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left hover:shadow-md transition relative">
            {jumlahWishlist > 0 && (
              <span className="absolute top-3 right-3 bg-red-400 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {jumlahWishlist > 9 ? '9+' : jumlahWishlist}
              </span>
            )}
            <span className="text-2xl mb-2 block">🤍</span>
            <p className="font-bold text-gray-800 text-sm">Wishlist</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {jumlahWishlist > 0 ? `${jumlahWishlist} produk disimpan` : 'Belum ada produk'}
            </p>
          </button>
        </div>

        {/* Verifikasi WA */}
        <div className={`rounded-2xl p-4 border shadow-sm flex items-center justify-between ${isVerifiedWA ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'}`}>
          <div>
            <p className="text-sm font-bold text-gray-800">{isVerifiedWA ? 'Nomor WA Terverifikasi' : 'Verifikasi Nomor WA'}</p>
            <p className="text-xs text-gray-400 mt-0.5">{isVerifiedWA ? 'Nomor WA kamu sudah dikonfirmasi' : 'Konfirmasi kepemilikan nomor WA'}</p>
          </div>
          {isVerifiedWA ? (
            <span className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">✓</span>
          ) : (
            <button onClick={() => navigate('/verifikasi-wa')}
              className="text-xs bg-green-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-green-700 transition flex-shrink-0">
              Verifikasi
            </button>
          )}
        </div>

        {/* Verifikasi KYC */}
        <div className={`rounded-2xl p-4 border shadow-sm flex items-center justify-between ${isVerified ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-100'}`}>
          <div>
            <p className="text-sm font-bold text-gray-800">{isVerified ? 'Akun Terverifikasi' : 'Verifikasi Akun (KYC)'}</p>
            <p className="text-xs text-gray-400 mt-0.5">{isVerified ? 'Centang biru aktif di profilmu' : 'Dapatkan centang biru kepercayaan'}</p>
          </div>
          {isVerified ? (
            <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:32, height:32, background:'#3b82f6', color:'white', borderRadius:'50%', fontSize:16, fontWeight:'bold', flexShrink:0 }}>✓</span>
          ) : (
            <button onClick={() => navigate('/verifikasi')}
              className="text-xs bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition flex-shrink-0">
              Ajukan
            </button>
          )}
        </div>

        {/* Form Profil */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Informasi Profil</p>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Username <span className="text-gray-400 font-normal">(tampil di chat)</span></label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
              <input name="username" value={form.username} onChange={handleChange} placeholder="contoh: budi123"
                className="w-full border-2 border-gray-100 rounded-xl pl-8 pr-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nama Tampilan <span className="text-red-500">*</span></label>
            <input name="nama" value={form.nama} onChange={handleChange} placeholder="Nama yang tampil ke pengguna lain"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nama Lengkap</label>
            <input name="nama_lengkap" value={form.nama_lengkap} onChange={handleChange} placeholder="Nama sesuai KTP"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="contoh@email.com"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Jenis Kelamin</label>
            <div className="grid grid-cols-3 gap-2">
              {['Laki-laki', 'Perempuan', 'Lainnya'].map(jk => (
                <button key={jk} onClick={() => setForm(f => ({ ...f, jenis_kelamin: jk }))}
                  className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition ${form.jenis_kelamin === jk ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
                  {jk}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">
              Tanggal Lahir {form.tanggal_lahir && <span className="text-gray-400 font-normal ml-2">({hitungUmur(form.tanggal_lahir)} tahun)</span>}
            </label>
            <input name="tanggal_lahir" type="date" value={form.tanggal_lahir} onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Alamat</label>
            <textarea name="alamat" value={form.alamat} onChange={handleChange} placeholder="Alamat lengkap kamu" rows={2}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition resize-none" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nomor WhatsApp <span className="text-gray-400 font-normal">(tidak bisa diubah)</span></label>
            <div className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm bg-gray-100 text-gray-500">+{form.nomor_wa}</div>
          </div>
          <button onClick={handleSimpanProfil} disabled={saving}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl py-3.5 text-sm font-bold transition shadow-sm disabled:opacity-50">
            {saving ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
        </div>

        {/* Info Toko */}
        {toko && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {toko.foto_url && <img src={toko.foto_url} alt={toko.nama} className="w-full h-28 object-cover" />}
            <div className="p-5">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">
                {toko.jenis === 'jasa' ? 'Jasa Saya' : toko.jenis === 'preloved' ? 'Preloved Saya' : 'Toko Saya'}
              </p>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-extrabold text-gray-900">{toko.nama}</h3>
                  <p className="text-xs text-gray-400">{toko.kategori}</p>
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-xl font-bold ${toko.is_buka ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {toko.is_buka ? 'BUKA' : 'TUTUP'}
                </span>
              </div>
              <button onClick={() => navigate('/dashboard')}
                className="w-full border-2 border-gray-100 text-gray-600 text-sm py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition">
                Kelola {toko.jenis === 'jasa' ? 'Jasa' : toko.jenis === 'preloved' ? 'Preloved' : 'Toko'} →
              </button>
            </div>
          </div>
        )}

        {/* Keamanan */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4">Keamanan Akun</p>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Kata Sandi Baru</label>
              <input type="password" value={formPassword.baru} onChange={e => setFormPassword(f => ({ ...f, baru: e.target.value }))}
                placeholder="Minimal 6 karakter"
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Konfirmasi Kata Sandi</label>
              <input type="password" value={formPassword.konfirmasi} onChange={e => setFormPassword(f => ({ ...f, konfirmasi: e.target.value }))}
                placeholder="Ulangi kata sandi baru"
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
            </div>
            <button onClick={handleGantiPassword} disabled={savingPassword}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl py-3 text-sm font-bold transition shadow-sm disabled:opacity-50">
              {savingPassword ? 'Menyimpan...' : 'Ganti Kata Sandi'}
            </button>
          </div>
        </div>

        {/* Keluar */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <button onClick={handleLogout}
            className="w-full border-2 border-red-100 text-red-600 text-sm py-3 rounded-xl font-bold hover:bg-red-50 transition">
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
