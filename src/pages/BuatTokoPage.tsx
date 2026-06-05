import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

export default function BuatTokoPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingLokasi, setLoadingLokasi] = useState(false)
  const [form, setForm] = useState({
    nama: '', deskripsi: '', kategori: '', alamat: '', telepon: '', lat: '', lng: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function ambilLokasi() {
    setLoadingLokasi(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({ ...f, lat: pos.coords.latitude.toString(), lng: pos.coords.longitude.toString() }))
        setLoadingLokasi(false)
        toast.success('Lokasi berhasil diambil!')
      },
      () => { setLoadingLokasi(false); toast.error('Gagal ambil lokasi. Pastikan GPS aktif.') }
    )
  }

  async function handleSubmit() {
    if (!form.nama || !form.kategori || !form.alamat) {
      toast.error('Nama, kategori, dan alamat wajib diisi')
      return
    }

    setLoading(true)

    const { data: userData } = await supabase.auth.getUser()
    
    if (!userData.user) {
      toast.error('Silakan login terlebih dahulu')
      setLoading(false)
      navigate('/login')
      return
    }

    const insertData = {
      nama: form.nama,
      deskripsi: form.deskripsi || null,
      kategori: form.kategori,
      alamat: form.alamat,
      telepon: form.telepon || null,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
      user_id: userData.user.id,
      is_buka: false,
    }

    const { error } = await supabase.from('toko').insert(insertData)

    setLoading(false)

    if (error) {
      console.error('Error insert toko:', error)
      toast.error('Gagal membuat toko: ' + error.message)
    } else {
      toast.success('Toko berhasil dibuat! 🎉')
      navigate('/dashboard')
    }
  }

  const kategoriList = ['Kuliner', 'Sembako', 'Fashion', 'Kesehatan', 'Bengkel', 'Laundry', 'Salon & Kecantikan', 'Elektronik', 'Lainnya']

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate('/dashboard')} className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">←</button>
        <span className="font-extrabold text-gray-900">Buat Toko</span>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-3xl p-6 text-white text-center">
          <span className="text-4xl mb-2 block">🏪</span>
          <h2 className="font-extrabold text-lg">Daftarkan Tokomu!</h2>
          <p className="text-green-100 text-xs mt-1">Gratis selamanya. Mulai ditemukan pembeli di sekitarmu.</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Info Toko</p>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nama Toko *</label>
            <input name="nama" value={form.nama} onChange={handleChange} placeholder="contoh: Warung Bu Sari"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Kategori *</label>
            <select name="kategori" value={form.kategori} onChange={handleChange}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition">
              <option value="">Pilih kategori</option>
              {kategoriList.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Alamat *</label>
            <input name="alamat" value={form.alamat} onChange={handleChange} placeholder="contoh: Jl. Merdeka No. 10"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nomor WhatsApp</label>
            <input name="telepon" value={form.telepon} onChange={handleChange} placeholder="08123456789"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Deskripsi Toko</label>
            <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange}
              placeholder="Ceritakan tentang tokomu..." rows={3}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition resize-none" />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Lokasi di Peta</p>
          <button type="button" onClick={ambilLokasi} disabled={loadingLokasi}
            className="w-full border-2 border-dashed border-gray-200 text-gray-500 text-sm py-3 rounded-2xl font-semibold hover:bg-gray-50 transition disabled:opacity-50">
            {loadingLokasi ? 'Mengambil lokasi...' : '📍 Ambil Lokasi Saat Ini (GPS)'}
          </button>
          {form.lat && form.lng && (
            <p className="text-xs text-green-600 font-semibold">✅ Lokasi: {parseFloat(form.lat).toFixed(5)}, {parseFloat(form.lng).toFixed(5)}</p>
          )}
          <div className="flex gap-2">
            <input name="lat" value={form.lat} onChange={handleChange} placeholder="Latitude: -6.2088"
              className="flex-1 border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
            <input name="lng" value={form.lng} onChange={handleChange} placeholder="Longitude: 106.8456"
              className="flex-1 border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
          </div>
          <p className="text-xs text-gray-300">Cari koordinat di maps.google.com → klik kanan → "What's here"</p>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl py-4 text-sm font-extrabold transition shadow-lg shadow-red-100 disabled:opacity-50">
          {loading ? 'Menyimpan...' : '🚀 Buat Toko Sekarang'}
        </button>
      </div>
    </div>
  )
}