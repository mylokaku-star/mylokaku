import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

// Fungsi adaptif untuk membersihkan & menstandardisasi nomor WA Indonesia
function standarisasiNomorWA(nomor: string) {
  let bersih = nomor.replace(/\D/g, '') // Hapus semua karakter non-angka (spasi, strip, plus)
  
  if (bersih.startsWith('0')) {
    bersih = '62' + bersih.slice(1)
  } else if (bersih.startsWith('8')) {
    bersih = '62' + bersih
  }
  
  return bersih
}

function nomorKeEmail(nomorBersih: string) {
  return `${nomorBersih}@lokaku.app`
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<'masuk' | 'daftar'>(
    searchParams.get('tab') === 'daftar' ? 'daftar' : 'masuk'
  )
  const [nomor, setNomor] = useState('')
  const [nama, setNama] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleMasuk() {
    if (!nomor || !password) { 
      toast.error('Nomor WA dan kata sandi wajib diisi')
      return 
    }
    
    setLoading(true)
    const nomorBersih = standarisasiNomorWA(nomor)
    const email = nomorKeEmail(nomorBersih)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      setLoading(false)
      toast.error('Nomor WA atau kata sandi salah, silakan periksa kembali')
    } else {
      toast.success('Selamat datang kembali!')
      navigate('/dashboard')
    }
  }

  async function handleDaftar() {
    if (!nomor || !password || !nama) { toast.error('Semua kolom wajib diisi'); return }
    if (nama.trim().length < 2) { toast.error('Nama lengkap minimal 2 karakter'); return }
    
    const nomorBersih = standarisasiNomorWA(nomor)
    if (nomorBersih.length < 10 || nomorBersih.length > 15) { 
      toast.error('Nomor WhatsApp tidak valid (terlahu pendek/panjang)')
      return 
    }
    if (password.length < 6) { toast.error('Kata sandi minimal 6 karakter'); return }
    
    setLoading(true)
    const email = nomorKeEmail(nomorBersih)

    // Proses pendaftaran akun auth Supabase
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setLoading(false)
      toast.error('Gagal mendaftar: ' + error.message)
      return
    }

    if (data.user) {
      // Masukkan metadata user ke tabel profiles bisnis Anda
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        nama: nama.trim(),
        nomor_wa: nomorBersih,
      })

      if (profileError) {
        setLoading(false)
        toast.error('Gagal membuat data profil: ' + profileError.message)
        return
      }

      // UX IMPORVEMENT: Jika supabase otomatis membuat sesi, langsung arahkan ke dashboard
      if (data.session) {
        toast.success('Pendaftaran berhasil! Menyiapkan etalase Anda...')
        navigate('/dashboard')
        return
      }
    }

    setLoading(false)
    toast.success('Pendaftaran sukses! Silakan masuk.')
    setTab('masuk')
    setNama('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-white flex items-center justify-center p-4 antialiased font-medium text-slate-800">
      <div className="w-full max-w-md">

        {/* LOGO */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-md shadow-emerald-200 mb-3 animate-fade-in">
            L
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Lokaku</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Platform Hub UMKM Lokal Indonesia</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-100/70 border border-slate-100 p-6 sm:p-8">

          {/* TAB SWITCHER */}
          <div className="flex bg-slate-100 rounded-2xl p-1 mb-5">
            <button
              onClick={() => { if(!loading) setTab('masuk') }}
              disabled={loading}
              className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${tab === 'masuk' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Masuk
            </button>
            <button
              onClick={() => { if(!loading) setTab('daftar') }}
              disabled={loading}
              className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${tab === 'daftar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Daftar Baru
            </button>
          </div>

          {/* DYNAMIC METADATA HINT */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 mb-5 flex items-start gap-2.5">
            <span className="text-lg leading-none mt-0.5">💡</span>
            <p className="text-xs text-emerald-800 font-semibold leading-relaxed">
              {tab === 'masuk'
                ? 'Gunakan nomor WhatsApp aktif Anda dan kata sandi untuk masuk kembali.'
                : 'Pendaftaran instan pakai nomor WhatsApp — Praktis tanpa perlu verifikasi email!'}
            </p>
          </div>

          {/* MAIN INPUT CONTAINER */}
          <div className="space-y-4">

            {tab === 'daftar' && (
              <div>
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Nama Lengkap Pemilik *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">👤</span>
                  <input
                    type="text"
                    placeholder="Contoh: Budi Setiawan"
                    value={nama}
                    onChange={e => setNama(e.target.value)}
                    disabled={loading}
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold outline-none focus:border-emerald-500 bg-slate-50/50 transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">No. Handphone / WhatsApp *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">📱</span>
                <input
                  type="tel"
                  placeholder="Contoh: 08123456789"
                  value={nomor}
                  onChange={e => setNomor(e.target.value)}
                  disabled={loading}
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold outline-none focus:border-emerald-500 bg-slate-50/50 font-mono transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Kata Sandi / Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={tab === 'daftar' ? 'Minimal 6 karakter' : 'Masukkan password anda'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  onKeyDown={e => e.key === 'Enter' && (tab === 'masuk' ? handleMasuk() : handleDaftar())}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-500 bg-slate-50/50 transition-all pr-12 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm p-1 hover:text-slate-600 transition"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              {tab === 'masuk' && (
                <div className="text-right mt-1.5">
                  <button
                    type="button"
                    onClick={() => navigate('/lupa-password')}
                    className="text-[11px] font-bold text-slate-400 hover:text-emerald-600 transition"
                  >
                    Lupa Kata Sandi?
                  </button>
                </div>
              )}
            </div>

            {/* ACTION SUBMIT BUTTON */}
            <button
              onClick={tab === 'masuk' ? handleMasuk : handleDaftar}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3.5 text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-100 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              )}
              {loading ? 'Menyinkronkan Akun...' : tab === 'masuk' ? 'Masuk ke Dasbor' : 'Daftar Lapak Sekarang'}
            </button>
          </div>

          <p className="text-center text-[10px] text-slate-400 mt-5 leading-relaxed font-semibold">
            Dengan melanjutkan, Anda menyetujui seluruh ketentuan privasi & syarat penggunaan layanan Lokaku.
          </p>
        </div>

        {/* GUEST MODE LINK */}
        <button 
          onClick={() => navigate('/cari')} 
          disabled={loading}
          className="w-full text-center text-xs text-slate-400 font-bold mt-5 hover:text-slate-600 transition disabled:opacity-30"
        >
          Jelajahi ekosistem toko tanpa masuk akun →
        </button>
      </div>
    </div>
  )
}