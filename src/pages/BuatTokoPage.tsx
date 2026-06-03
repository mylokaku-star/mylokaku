import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

export default function BuatTokoPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingLokasi, setLoadingLokasi] = useState(false)
  const [form, setForm] = useState({
    nama: '',
    deskripsi: '',
    kategori: '',
    alamat: '',
    telepon: '',
    lat: '',
    lng: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function ambilLokasi() {
    setLoadingLokasi(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({
          ...f,
          lat: pos.coords.latitude.toString(),
          lng: pos.coords.longitude.toString(),
        }))
        setLoadingLokasi(false)
        toast.success('Lokasi berhasil diambil!')
      },
      () => {
        setLoadingLokasi(false)
        toast.error('Gagal ambil lokasi. Pastikan GPS aktif.')
      }
    )
  }

  async function handleSubmit() {
    if (!form.nama || !form.kategori || !form.alamat) {
      toast.error('Nama, kategori, dan alamat wajib diisi')
      return
    }
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    const { error } = await supabase.from('toko').insert({
      nama: form.nama,
      deskripsi: form.deskripsi,
      kategori: form.kategori,
      alamat: form.alamat,
      telepon: form.telepon,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
      user_id: userData.user?.id,
      is_buka: false,
    })
    setLoading(false)
    if (error) {
      toast.error('Gagal membuat toko: ' + error.message)
    } else {
      toast.success('Toko berhasil dibuat!')
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-800">
          ← Kembali
        </button>
        <span className="font-semibold text-gray-800">Buat Toko</span>
      </div>

      <div className="max-w-lg mx-auto p-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">

          <div>
            <label className="text-sm text-gray-600 block mb-1">Nama Toko *</label>
            <input
              name="nama"
              value={form.nama}
              onChange={handleChange}
              placeholder="contoh: Warung Bu Sari"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">Kategori *</label>
            <select
              name="kategori"
              value={form.kategori}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400"
            >
              <option value="">Pilih kategori</option>
              <option value="Kuliner">Kuliner</option>
              <option value="Sembako">Sembako</option>
              <option value="Fashion">Fashion</option>
              <option value="Kesehatan">Kesehatan</option>
              <option value="Bengkel">Bengkel</option>
              <option value="Laundry">Laundry</option>
              <option value="Salon & Kecantikan">Salon & Kecantikan</option>
              <option value="Elektronik">Elektronik</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">Alamat *</label>
            <input
              name="alamat"
              value={form.alamat}
              onChange={handleChange}
              placeholder="contoh: Jl. Merdeka No. 10"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">Nomor WhatsApp</label>
            <input
              name="telepon"
              value={form.telepon}
              onChange={handleChange}
              placeholder="contoh: 08123456789"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">Deskripsi Toko</label>
            <textarea
              name="deskripsi"
              value={form.deskripsi}
              onChange={handleChange}
              placeholder="Ceritakan tentang toko kamu..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 resize-none"
            />
          </div>

          {/* Lokasi */}
          <div>
            <label className="text-sm text-gray-600 block mb-2">Lokasi Toko di Peta</label>
            <button
              type="button"
              onClick={ambilLokasi}
              disabled={loadingLokasi}
              className="w-full border border-dashed border-gray-300 text-gray-500 text-sm py-2.5 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              {loadingLokasi ? 'Mengambil lokasi...' : '📍 Ambil Lokasi Saat Ini (GPS)'}
            </button>
            {form.lat && form.lng && (
              <p className="text-xs text-green-600 mt-1">
                ✅ Lokasi didapat: {parseFloat(form.lat).toFixed(5)}, {parseFloat(form.lng).toFixed(5)}
              </p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Buat Toko'}
          </button>

        </div>
      </div>
    </div>
  )
}