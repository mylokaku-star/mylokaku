import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

export default function EditTokoPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadingLokasi, setLoadingLokasi] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [form, setForm] = useState({
    nama: '',
    deskripsi: '',
    kategori: '',
    alamat: '',
    telepon: '',
    lat: '',
    lng: '',
    foto_url: '',
  })
  const [tokoId, setTokoId] = useState('')

  useEffect(() => {
    loadToko()
  }, [])

  async function loadToko() {
    const { data: userData } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('toko')
      .select('*')
      .eq('user_id', userData.user?.id)
      .single()
    if (data) {
      setTokoId(data.id)
      setForm({
        nama: data.nama || '',
        deskripsi: data.deskripsi || '',
        kategori: data.kategori || '',
        alamat: data.alamat || '',
        telepon: data.telepon || '',
        lat: data.lat ? data.lat.toString() : '',
        lng: data.lng ? data.lng.toString() : '',
        foto_url: data.foto_url || '',
      })
    }
    setLoading(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleUploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 2MB')
      return
    }
    setUploadingFoto(true)
    const ext = file.name.split('.').pop()
    const fileName = `${tokoId}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('toko-foto')
      .upload(fileName, file, { upsert: true })
    if (uploadError) {
      toast.error('Gagal upload foto')
      setUploadingFoto(false)
      return
    }
    const { data: urlData } = supabase.storage
      .from('toko-foto')
      .getPublicUrl(fileName)
    setForm(f => ({ ...f, foto_url: urlData.publicUrl }))
    setUploadingFoto(false)
    toast.success('Foto berhasil diupload!')
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

  async function handleSave() {
    if (!form.nama || !form.kategori || !form.alamat) {
      toast.error('Nama, kategori, dan alamat wajib diisi')
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('toko')
      .update({
        nama: form.nama,
        deskripsi: form.deskripsi,
        kategori: form.kategori,
        alamat: form.alamat,
        telepon: form.telepon,
        lat: form.lat ? parseFloat(form.lat) : null,
        lng: form.lng ? parseFloat(form.lng) : null,
        foto_url: form.foto_url,
      })
      .eq('id', tokoId)
    setSaving(false)
    if (error) {
      toast.error('Gagal menyimpan: ' + error.message)
    } else {
      toast.success('Toko berhasil diupdate!')
      navigate('/dashboard')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Memuat...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-800">
          ← Kembali
        </button>
        <span className="font-semibold text-gray-800">Edit Toko</span>
      </div>

      <div className="max-w-lg mx-auto p-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">

          <div>
            <label className="text-sm text-gray-600 block mb-2">Foto Toko</label>
            {form.foto_url && (
              <img
                src={form.foto_url}
                alt="Foto toko"
                className="w-full h-40 object-cover rounded-lg mb-2"
              />
            )}
            <label className={`w-full flex items-center justify-center border border-dashed border-gray-300 rounded-lg py-3 text-sm cursor-pointer hover:bg-gray-50 transition ${uploadingFoto ? 'opacity-50' : ''}`}>
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadFoto}
                disabled={uploadingFoto}
                className="hidden"
              />
              {uploadingFoto ? '⏳ Mengupload...' : '📷 Pilih Foto Toko (maks 2MB)'}
            </label>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">Nama Toko *</label>
            <input
              name="nama"
              value={form.nama}
              onChange={handleChange}
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
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 resize-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-2">Lokasi di Peta</label>
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
                ✅ Lokasi: {parseFloat(form.lat).toFixed(5)}, {parseFloat(form.lng).toFixed(5)}
              </p>
            )}
            <div className="flex gap-2 mt-2">
              <input
                name="lat"
                value={form.lat}
                onChange={handleChange}
                placeholder="Latitude: -6.2088"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400"
              />
              <input
                name="lng"
                value={form.lng}
                onChange={handleChange}
                placeholder="Longitude: 106.8456"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>

        </div>
      </div>
    </div>
  )
}