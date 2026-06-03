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
    <div className="min-h-screen bg-[#f5f0eb] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold mb-2">
            L
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Lokaku</h1>
          <p className="text-sm text-gray-500">Platform UMKM Lokal Indonesia</p>
        </div>

        {/* Tab */}
        <div className="flex border-b mb-6">
          <button
            onClick={() => setTab('masuk')}
            className={`flex-1 pb-2 text-sm font-medium ${tab === 'masuk' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-400'}`}
          >
            Masuk
          </button>
          <button
            onClick={() => setTab('daftar')}
            className={`flex-1 pb-2 text-sm font-medium ${tab === 'daftar' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-400'}`}
          >
            Daftar
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Email</label>
            <input
              type="email"
              placeholder="contoh@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Kata Sandi</label>
            <input
              type="password"
              placeholder="Masukkan kata sandi"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400"
            />
          </div>
          <button
            onClick={tab === 'masuk' ? handleMasuk : handleDaftar}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-50"
          >
            {loading ? 'Memproses...' : tab === 'masuk' ? 'Masuk' : 'Daftar'}
          </button>
        </div>

      </div>
    </div>
  )
}
