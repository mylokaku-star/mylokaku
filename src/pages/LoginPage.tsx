import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

export default function LoginPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'masuk' | 'daftar'>('masuk')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleMasuk() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      toast.error('Email atau kata sandi salah')
    } else {
      toast.success('Berhasil masuk!')
      navigate('/dashboard')
    }
  }

  async function handleDaftar() {
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) {
      toast.error('Gagal daftar: ' + error.message)
    } else {
      toast.success('Berhasil daftar! Silakan masuk.')
      setTab('masuk')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg mb-3">L</div>
          <h1 className="text-2xl font-extrabold text-gray-900">Lokaku</h1>
          <p className="text-sm text-gray-400 mt-1">Platform UMKM Lokal Indonesia</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">

          {/* Tab */}
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
            <button
              onClick={() => setTab('masuk')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition ${tab === 'masuk' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
            >
              Masuk
            </button>
            <button
              onClick={() => setTab('daftar')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition ${tab === 'daftar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
            >
              Daftar
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Email</label>
              <input
                type="email"
                placeholder="contoh@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Kata Sandi</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition pr-12"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <button
              onClick={tab === 'masuk' ? handleMasuk : handleDaftar}
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl py-3.5 text-sm font-bold transition shadow-lg shadow-red-100 disabled:opacity-50"
            >
              {loading ? 'Memproses...' : tab === 'masuk' ? 'Masuk ke Lokaku' : 'Buat Akun Gratis'}
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Dengan mendaftar, kamu setuju dengan syarat & ketentuan Lokaku
          </p>
        </div>

        <button onClick={() => navigate('/cari')} className="w-full text-center text-sm text-gray-400 mt-4 hover:text-gray-600 transition">
          Lihat toko tanpa login →
        </button>
      </div>
    </div>
  )
}