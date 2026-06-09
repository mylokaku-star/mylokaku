import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LupaPasswordPage() {
  const navigate = useNavigate()
  const [nomor, setNomor] = useState('')

  function handleKirim() {
    if (!nomor) {
      alert('Silakan masukkan nomor WhatsApp Anda terlebih dahulu')
      return
    }

    // Bersihkan format nomor WA agar standar (mengubah 08 menjadi 62)
    const nomorBersih = nomor.replace(/\D/g, '').replace(/^0/, '62')
    
    // Teks pesan yang akan dikirim ke WhatsApp CS
    const pesan = encodeURIComponent(
      `Halo Admin Lokaku, saya lupa kata sandi untuk akun Lokaku saya dengan nomor WhatsApp: ${nomorBersih}. Mohon bantuannya untuk reset kata sandi.`
    )
    
    // Buka WhatsApp CS otomatis
    window.open(`https://wa.me/6287856672344?text=${pesan}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Tombol Kembali */}
        <button 
          onClick={() => navigate('/login')}
          className="text-sm font-semibold text-gray-500 hover:text-green-600 mb-6 flex items-center gap-1 transition"
        >
          ← Kembali ke Login
        </button>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-6">
            <span className="text-4xl">🔑</span>
            <h1 className="text-2xl font-extrabold text-gray-900 mt-3">Lupa Kata Sandi?</h1>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Jangan khawatir! Masukkan nomor WhatsApp Anda di bawah ini untuk meminta pemulihan kata sandi kepada Admin Lokaku.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nomor WhatsApp Terdaftar</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">📱</span>
                <input
                  type="tel"
                  placeholder="contoh: 08123456789"
                  value={nomor}
                  onChange={e => setNomor(e.target.value)}
                  className="w-full border-2 border-gray-100 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition"
                />
              </div>
            </div>

            <button
              onClick={handleKirim}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl py-3.5 text-sm font-bold transition shadow-lg shadow-green-100"
            >
              Minta Reset via WhatsApp
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}