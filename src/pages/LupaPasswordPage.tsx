import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'


type Step = 'verifikasi' | 'password_baru' | 'sukses'

export default function LupaPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('verifikasi')
  const [loading, setLoading] = useState(false)

  // Step 1 — verifikasi identitas
  const [nomor, setNomor] = useState('')
  const [nama, setNama] = useState('')

  // Step 2 — password baru
  const [passwordBaru, setPasswordBaru] = useState('')
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showKonfirmasi, setShowKonfirmasi] = useState(false)

  // Token dari Edge Function setelah verifikasi berhasil
  const [resetToken, setResetToken] = useState('')

  async function handleVerifikasi() {
    if (!nomor || !nama) {
      toast.error('Nomor WA dan nama wajib diisi')
      return
    }
    if (nomor.replace(/\D/g, '').length < 9) {
      toast.error('Nomor WA tidak valid')
      return
    }

    setLoading(true)
    try {
      const nomorBersih = nomor.replace(/\D/g, '').replace(/^0/, '62')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-password-verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ nomor_wa: nomorBersih, nama: nama.trim() }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Nomor WA atau nama tidak cocok')
        return
      }

      setResetToken(data.token)
      setStep('password_baru')
      toast.success('Identitas terverifikasi! Buat kata sandi baru.')
    } catch {
      toast.error('Gagal terhubung ke server. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword() {
    if (!passwordBaru || !konfirmasiPassword) {
      toast.error('Semua field wajib diisi')
      return
    }
    if (passwordBaru.length < 6) {
      toast.error('Kata sandi minimal 6 karakter')
      return
    }
    if (passwordBaru !== konfirmasiPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-password-update`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ token: resetToken, password_baru: passwordBaru }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Gagal mereset kata sandi')
        return
      }

      setStep('sukses')
    } catch {
      toast.error('Gagal terhubung ke server. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const kekuatanPassword = (() => {
    if (passwordBaru.length === 0) return null
    if (passwordBaru.length < 6) return { label: 'Terlalu pendek', color: 'bg-red-400', width: 'w-1/4' }
    if (passwordBaru.length < 8) return { label: 'Lemah', color: 'bg-orange-400', width: 'w-2/4' }
    if (/[A-Z]/.test(passwordBaru) && /[0-9]/.test(passwordBaru)) return { label: 'Kuat', color: 'bg-green-500', width: 'w-full' }
    return { label: 'Sedang', color: 'bg-yellow-400', width: 'w-3/4' }
  })()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => step === 'password_baru' ? setStep('verifikasi') : navigate('/login')}
          className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-200 transition"
        >
          ←
        </button>
        <div>
          <h1 className="font-extrabold text-gray-900 text-base">Lupa Kata Sandi</h1>
          <p className="text-xs text-gray-400">
            {step === 'verifikasi' ? 'Langkah 1 dari 2 · Verifikasi identitas'
              : step === 'password_baru' ? 'Langkah 2 dari 2 · Buat kata sandi baru'
              : 'Selesai'}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full px-6 py-8">

        {/* Progress bar */}
        {step !== 'sukses' && (
          <div className="flex gap-2 mb-8">
            <div className={`h-1.5 flex-1 rounded-full transition-all ${step === 'verifikasi' || step === 'password_baru' ? 'bg-green-500' : 'bg-gray-200'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all ${step === 'password_baru' ? 'bg-green-500' : 'bg-gray-200'}`} />
          </div>
        )}

        {/* ===== STEP 1: VERIFIKASI ===== */}
        {step === 'verifikasi' && (
          <div className="space-y-6">
            <div>
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-2xl mb-4">
                🔐
              </div>
              <h2 className="text-xl font-extrabold text-gray-900">Verifikasi dulu, ya</h2>
              <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                Masukkan nomor WA dan nama yang kamu daftarkan. Kalau cocok, kamu bisa buat kata sandi baru.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nomor WhatsApp</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-semibold">📱</span>
                  <input
                    type="tel"
                    value={nomor}
                    onChange={e => setNomor(e.target.value)}
                    placeholder="08123456789"
                    className="w-full border-2 border-gray-100 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nama yang Terdaftar</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">👤</span>
                  <input
                    type="text"
                    value={nama}
                    onChange={e => setNama(e.target.value)}
                    placeholder="Nama lengkapmu"
                    className="w-full border-2 border-gray-100 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition"
                  />
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl px-4 py-3 flex gap-2">
              <span className="text-base">⚠️</span>
              <p className="text-xs text-amber-700 leading-relaxed">
                Pastikan nama yang kamu masukkan <strong>persis sama</strong> dengan nama saat mendaftar, termasuk huruf besar/kecilnya.
              </p>
            </div>

            <button
              onClick={handleVerifikasi}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl py-4 text-sm font-extrabold transition shadow-lg shadow-green-100 disabled:opacity-50"
            >
              {loading ? 'Memverifikasi...' : 'Verifikasi Identitas →'}
            </button>

            <button
              onClick={() => navigate('/login')}
              className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition font-semibold py-2"
            >
              Ingat kata sandi? Masuk di sini
            </button>
          </div>
        )}

        {/* ===== STEP 2: PASSWORD BARU ===== */}
        {step === 'password_baru' && (
          <div className="space-y-6">
            <div>
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-2xl mb-4">
                🔑
              </div>
              <h2 className="text-xl font-extrabold text-gray-900">Buat kata sandi baru</h2>
              <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                Pilih kata sandi baru yang mudah kamu ingat tapi sulit ditebak orang lain.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Kata Sandi Baru</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={passwordBaru}
                    onChange={e => setPasswordBaru(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:border-green-400 bg-gray-50 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>

                {/* Kekuatan password */}
                {kekuatanPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${kekuatanPassword.color} ${kekuatanPassword.width}`} />
                    </div>
                    <p className={`text-xs font-semibold ${
                      kekuatanPassword.label === 'Kuat' ? 'text-green-600'
                      : kekuatanPassword.label === 'Sedang' ? 'text-yellow-600'
                      : 'text-red-500'
                    }`}>
                      {kekuatanPassword.label}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Konfirmasi Kata Sandi</label>
                <div className="relative">
                  <input
                    type={showKonfirmasi ? 'text' : 'password'}
                    value={konfirmasiPassword}
                    onChange={e => setKonfirmasiPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    className={`w-full border-2 rounded-xl px-4 py-3 pr-12 text-sm outline-none bg-gray-50 transition
                      ${konfirmasiPassword.length > 0
                        ? passwordBaru === konfirmasiPassword
                          ? 'border-green-400'
                          : 'border-red-300'
                        : 'border-gray-100 focus:border-green-400'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKonfirmasi(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                  >
                    {showKonfirmasi ? '🙈' : '👁️'}
                  </button>
                </div>
                {konfirmasiPassword.length > 0 && passwordBaru !== konfirmasiPassword && (
                  <p className="text-xs text-red-500 font-semibold mt-1">Kata sandi tidak cocok</p>
                )}
                {konfirmasiPassword.length > 0 && passwordBaru === konfirmasiPassword && (
                  <p className="text-xs text-green-600 font-semibold mt-1">✓ Kata sandi cocok</p>
                )}
              </div>
            </div>

            <button
              onClick={handleResetPassword}
              disabled={loading || passwordBaru !== konfirmasiPassword || passwordBaru.length < 6}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl py-4 text-sm font-extrabold transition shadow-lg shadow-green-100 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : '🔑 Simpan Kata Sandi Baru'}
            </button>
          </div>
        )}

        {/* ===== SUKSES ===== */}
        {step === 'sukses' && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center text-4xl mx-auto">
              ✅
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Kata sandi berhasil diubah!</h2>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                Sekarang kamu bisa masuk menggunakan kata sandi yang baru.
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl py-4 text-sm font-extrabold transition shadow-lg shadow-green-100"
            >
              Masuk Sekarang →
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
