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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
      <div className="w-14 h-14 bg-gradient-to-tr from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-green-500/20 animate-bounce">L</div>
      <p className="text-emerald-800 font-bold text-xs mt-3 tracking-wide animate-pulse">Menghubungkan Akun...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 text-gray-800 antialiased">

      {/* Modern Gradient & Glassmorphism Header */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 pt-10 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_45%)]"></div>
        <div className="max-w-md mx-auto text-center relative z-10">
          
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-4xl font-black shadow-xl ring-4 ring-white/10 mx-auto">
              {getInisial()}
            </div>
            {isVerified && (
              <span className="absolute bottom-1 right-1 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center border-2 border-slate-900 text-xs shadow-md font-bold">✓</span>
            )}
          </div>

          <h2 className="text-white font-extrabold text-xl tracking-tight">{form.nama || 'Pengguna Baru'}</h2>
          
          {form.username && (
            <span className="inline-block mt-1 bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1 rounded-full font-semibold border border-emerald-500/20">
              @{form.username}
            </span>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md border border-white/5">
              📱 +{form.nomor_wa}
            </span>
            {form.tanggal_lahir && (
              <span className="bg-white/5 px-2 py-1 rounded-md border border-white/5">
                🎂 {hitungUmur(form.tanggal_lahir)} Tahun
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-500 font-medium mt-3 uppercase tracking-wider">
            Bergabung · {new Date(user?.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-10 space-y-4 relative z-20">

        {/* Counter Stats Grid: Keranjang & Wishlist */}
        <div className="grid grid-cols-2 gap-3.5">
          <button onClick={() => navigate('/keranjang')}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-left active:scale-95 transition-all relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            {jumlahKeranjang > 0 && (
              <span className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-black px-1.5 h-4.5 min-w-[18px] rounded-full flex items-center justify-center shadow-sm">
                {jumlahKeranjang > 9 ? '9+' : jumlahKeranjang}
              </span>
            )}
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-xl mb-3 shadow-inner">🛒</div>
            <p className="font-extrabold text-slate-800 text-sm">Keranjang</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {jumlahKeranjang > 0 ? `${jumlahKeranjang} item siap bayar` : 'Belum ada item'}
            </p>
          </button>

          <button onClick={() => navigate('/keranjang')}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-left active:scale-95 transition-all relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            {jumlahWishlist > 0 && (
              <span className="absolute top-4 right-4 bg-rose-400 text-white text-[10px] font-black px-1.5 h-4.5 min-w-[18px] rounded-full flex items-center justify-center shadow-sm">
                {jumlahWishlist > 9 ? '9+' : jumlahWishlist}
              </span>
            )}
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-xl mb-3 shadow-inner">🤍</div>
            <p className="font-extrabold text-slate-800 text-sm">Wishlist</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {jumlahWishlist > 0 ? `${jumlahWishlist} produk disimpan` : 'Belum ada favorit'}
            </p>
          </button>
        </div>

        {/* Verification Center Badges */}
        <div className="bg-white rounded-2xl border border-slate-100 p-1 divide-y divide-slate-50 shadow-sm">
          {/* WA Verification Bar */}
          <div className="p-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${isVerifiedWA ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>💬</div>
              <div>
                <p className="text-xs font-bold text-slate-800">{isVerifiedWA ? 'WhatsApp Terverifikasi' : 'Verifikasi Nomor WA'}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{isVerifiedWA ? 'Akses chat instan aktif' : 'Konfirmasi kontak aktif kamu'}</p>
              </div>
            </div>
            {isVerifiedWA ? (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 font-black px-2.5 py-1 rounded-md">AKTIF</span>
            ) : (
              <button onClick={() => navigate('/verifikasi-wa')}
                className="text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm transition active:scale-95">
                Konfirmasi
              </button>
            )}
          </div>

          {/* KYC Verification Bar */}
          <div className="p-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${isVerified ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>🛡️</div>
              <div>
                <p className="text-xs font-bold text-slate-800">{isVerified ? 'Akun Terverifikasi Resmi' : 'Verifikasi Identitas (KYC)'}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{isVerified ? 'Lencana centang biru menyala' : 'Dapatkan status penjual terpercaya'}</p>
              </div>
            </div>
            {isVerified ? (
              <span className="text-[10px] bg-blue-100 text-blue-700 font-black px-2.5 py-1 rounded-md">VERIFIED</span>
            ) : (
              <button onClick={() => navigate('/verifikasi')}
                className="text-[11px] bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm transition active:scale-95">
                Ajukan
              </button>
            )}
          </div>
        </div>

        {/* Form Profil Utama */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-3 mb-1">
            <span className="text-sm">📝</span>
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Sunting Data Akun</h3>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">✨ Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-sm">@</span>
              <input name="username" value={form.username} onChange={handleChange} placeholder="budi_sanjaya"
                className="w-full border-2 border-slate-100 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-emerald-500 bg-slate-50/50 focus:bg-white transition" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">👤 Nama Tampilan <span className="text-red-500">*</span></label>
            <input name="nama" value={form.nama} onChange={handleChange} placeholder="Nama sapaan publik"
              className="w-full border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 bg-slate-50/50 focus:bg-white transition" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">💳 Nama Lengkap Sesuai KTP</label>
            <input name="nama_lengkap" value={form.nama_lengkap} onChange={handleChange} placeholder="Nama resmi"
              className="w-full border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 bg-slate-50/50 focus:bg-white transition" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">📧 Alamat Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="kamu@email.com"
              className="w-full border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 bg-slate-50/50 focus:bg-white transition" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">🧬 Jenis Kelamin</label>
            <div className="grid grid-cols-3 gap-2">
              {['Laki-laki', 'Perempuan', 'Lainnya'].map(jk => (
                <button key={jk} onClick={() => setForm(f => ({ ...f, jenis_kelamin: jk }))}
                  className={`py-2 rounded-xl text-xs font-bold border-2 transition-all active:scale-95 ${form.jenis_kelamin === jk ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700' : 'border-slate-100 bg-slate-50/40 text-slate-400'}`}>
                  {jk}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              📅 Tanggal Lahir
            </label>
            <input name="tanggal_lahir" type="date" value={form.tanggal_lahir} onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              className="w-full border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 bg-slate-50/50 focus:bg-white transition" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">🏠 Alamat Domisili</label>
            <textarea name="alamat" value={form.alamat} onChange={handleChange} placeholder="Tuliskan nama jalan, nomor rumah, RT/RW..." rows={2}
              className="w-full border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 bg-slate-50/50 focus:bg-white transition resize-none" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1.5">🔐 Nomor WhatsApp Terikat</label>
            <div className="w-full border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm bg-slate-100/80 text-slate-400 font-semibold select-none">+{form.nomor_wa}</div>
          </div>

          <button onClick={handleSimpanProfil} disabled={saving}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl py-3 text-sm font-extrabold transition-all shadow-md shadow-emerald-500/10 disabled:opacity-50 active:scale-98">
            {saving ? 'Sinkronisasi Data...' : 'Simpan Perubahan'}
          </button>
        </div>

        {/* Manajemen Kelola Unit Bisnis/Toko */}
        {toko && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group">
            <div className="relative">
              {toko.foto_url ? (
                <img src={toko.foto_url} alt={toko.nama} className="w-full h-32 object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="w-full h-24 bg-gradient-to-r from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 text-xs font-bold">Belum Ada Banner Toko</div>
              )}
              <span className={`absolute top-3 right-3 text-[10px] px-2.5 py-1 rounded-md font-black shadow-sm ${toko.is_buka ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                {toko.is_buka ? 'OPERASIONAL' : 'TUTUP'}
              </span>
            </div>
            <div className="p-5">
              <p className="text-[10px] text-indigo-500 font-extrabold uppercase tracking-widest mb-1.5">
                {toko.jenis === 'jasa' ? '💼 Entitas Jasa Anda' : toko.jenis === 'preloved' ? '♻️ Katalog Preloved' : '🏪 Toko Terdaftar'}
              </p>
              <h3 className="font-black text-slate-900 text-base leading-tight">{toko.nama}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{toko.kategori || 'Kategori Umum'}</p>
              
              <button onClick={() => navigate('/dashboard')}
                className="w-full mt-4 bg-slate-50 border border-slate-200 text-slate-700 text-xs py-2.5 rounded-xl font-bold hover:bg-slate-100 hover:text-slate-900 transition active:scale-98">
                Masuk ke Dashboard Manajemen →
              </button>
            </div>
          </div>
        )}

        {/* Rubrik Keamanan Akun */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-3 mb-1">
            <span className="text-sm">🔑</span>
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Kredensial & Sandi</h3>
          </div>
          
          <div className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Kata Sandi Baru</label>
              <input type="password" value={formPassword.baru} onChange={e => setFormPassword(f => ({ ...f, baru: e.target.value }))}
                placeholder="Entri sandi minimal 6 digit"
                className="w-full border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 bg-slate-50/50 focus:bg-white transition" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Konfirmasi Ulang Sandi</label>
              <input type="password" value={formPassword.konfirmasi} onChange={e => setFormPassword(f => ({ ...f, konfirmasi: e.target.value }))}
                placeholder="Verifikasi kesamaan sandi"
                className="w-full border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 bg-slate-50/50 focus:bg-white transition" />
            </div>
            <button onClick={handleGantiPassword} disabled={savingPassword}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2.5 text-xs font-bold transition shadow-md active:scale-98 disabled:opacity-50">
              {savingPassword ? 'Mengganti...' : 'Perbarui Autentikasi'}
            </button>
          </div>
        </div>

        {/* Sesi Keluar */}
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
          <button onClick={handleLogout}
            className="w-full bg-rose-50/50 hover:bg-rose-50 border border-rose-100 text-rose-600 text-xs py-3 rounded-xl font-extrabold transition active:scale-98">
            Terminasi Sesi Keluar (Logout)
          </button>
        </div>

      </div>

      {/* Kontemporer Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-100 flex shadow-[0_-4px_24px_rgba(0,0,0,0.04)] z-[1000] pb-safe">
        <button onClick={() => navigate('/cari')} className="flex-1 py-3 flex flex-col items-center gap-1 active:scale-95 transition-transform">
          <span className="text-xl">🔍</span>
          <span className="text-[10px] font-bold text-slate-400">Cari</span>
        </button>
        <button onClick={() => navigate('/peta')} className="flex-1 py-3 flex flex-col items-center gap-1 active:scale-95 transition-transform">
          <span className="text-xl">🗺️</span>
          <span className="text-[10px] font-bold text-slate-400">Peta</span>
        </button>
        <button onClick={() => navigate('/dashboard')} className="flex-1 py-3 flex flex-col items-center gap-1 active:scale-95 transition-transform">
          <span className="text-xl">🏪</span>
          <span className="text-[10px] font-bold text-slate-400">Toko</span>
        </button>
        <button onClick={() => navigate('/profil')} className="flex-1 py-3 flex flex-col items-center gap-1 active:scale-95 transition-transform">
          <span className="text-xl">👤</span>
          <span className="text-[10px] font-black text-emerald-600">Profil</span>
        </button>
      </div>

    </div>
  )
}