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
    nama: '', deskripsi: '', kategori: '', alamat: '', telepon: '', lat: '', lng: '', foto_url: '',
  })
  const [tokoId, setTokoId] = useState('')

  useEffect(() => { loadToko() }, [])

  async function loadToko() {
    const { data: userData } = await supabase.auth.getUser()
    const { data } = await supabase.from('toko').select('*').eq('user_id', userData.user?.id).single()
    if (data) {
      setTokoId(data.id)
      setForm({
        nama: data.nama || '', deskripsi: data.deskripsi || '', kategori: data.kategori || '',
        alamat: data.alamat || '', telepon: data.telepon || '',
        lat: data.lat ? data.lat.toString() : '', lng: data.lng ? data.lng.toString() : '',
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
    if (file.size > 2 * 1024 * 1024) { toast.error('Ukuran foto maksimal 2MB'); return }
    setUploadingFoto(true)
    const ext = file.name.split('.').pop()
    const fileName = `${tokoId}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('toko-foto').upload(fileName, file, { upsert: true })
    if (uploadError) { toast.error('Gagal upload foto'); setUploadingFoto(false); return }
    const { data: urlData } = supabase.storage.from('toko-foto').getPublicUrl(fileName)
    setForm(f => ({ ...f, foto_url: urlData.publicUrl }))
    setUploadingFoto(false)
    toast.success('Foto berhasil diupload!')
  }

  function ambilLokasi() {
    setLoadingLokasi(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({ ...f, lat: pos.coords.latitude.toString(), lng: pos.coords.longitude.toString() }))
        setLoadingLokasi(false)
        toast.success('Lokasi berhasil diambil!')
      },
      () => { setLoadingLokasi(false); toast.error('Gagal ambil lokasi') }
    )
  }

  async function handleSave() {
    if (!form.nama || !form.kategori || !form.alamat) { toast.error('Nama, kategori, dan alamat wajib diisi'); return }
    setSaving(true)
    const { error } = await supabase.from('toko').update({
      nama: form.nama, deskripsi: form.deskripsi, kategori: form.kategori,
      alamat: form.alamat, telepon: form.telepon,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
      foto_url: form.foto_url,
    }).eq('id', tokoId)
    setSaving(false)
    if (error) { toast.error('Gagal menyimpan: ' + error.message) }
    else { toast.success('Toko berhasil diupdate!'); navigate('/dashboard') }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Memuat...</p>
      </div>
    )
  }

  const kategoriList = ['Kuliner', 'Sembako', 'Fashion', 'Kesehatan', 'Bengkel', 'Laundry', 'Salon & Kecantikan', 'Elektronik', 'Lainnya']

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate('/dashboard')} className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">←</button>
        <span className="font-extrabold text-gray-900">Edit Toko</span>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">

        {/* Foto */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {form.foto_url ? (
            <img src={form.foto_url} alt="Foto toko" className="w-full h-44 object-cover" />
          ) : (
            <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl">🏪</div>
          )}
          <div className="p-4">
            <label className={`w-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl py-3 text-sm cursor-pointer hover:bg-gray-50 transition font-semibold text-gray-500 ${uploadingFoto ? 'opacity-50' : ''}`}>
              <input type="file" accept="image/*" onChange={handleUploadFoto} disabled={uploadingFoto} className="hidden" />
              {uploadingFoto ? '⏳ Mengupload...' : '📷 Ganti Foto Toko (maks 2MB)'}
            </label>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Info Toko</p>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nama Toko *</label>
            <input name="nama" value={form.nama} onChange={handleChange}
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
            <input name="alamat" value={form.alamat} onChange={handleChange}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nomor WhatsApp</label>
            <input name="telepon" value={form.telepon} onChange={handleChange} placeholder="08123456789"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Deskripsi</label>
            <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange} rows={3}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition resize-none" />
          </div>
        </div>

        {/* Lokasi */}
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
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl py-4 text-sm font-extrabold transition shadow-lg shadow-red-100 disabled:opacity-50">
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </div>
  )
}