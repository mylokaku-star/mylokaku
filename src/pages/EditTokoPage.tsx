import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

const KATEGORI_TOKO = [
  'Kuliner & Makanan',
  'Sembako & Kebutuhan Rumah',
  'Fashion & Pakaian',
  'Kesehatan & Apotek',
  'Salon & Kecantikan',
  'Elektronik & Gadget',
  'Toko Lainnya',
]

const KATEGORI_JASA = [
  'Jasa Kebersihan',
  'Supir & Antar Jemput',
  'Laundry / Cuci / Setrika',
  'Servis',
  'Tukang & Renovasi',
  'Privat & Les',
  'Jasa Lainnya',
]

export default function EditTokoPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadingLokasi, setLoadingLokasi] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [tokoId, setTokoId] = useState('')
  const [jenis, setJenis] = useState<'toko' | 'jasa'>('toko')
  const [form, setForm] = useState({
    nama: '', deskripsi: '', kategori: '', alamat: '', telepon: '', lat: '', lng: '', foto_url: '',
  })

  useEffect(() => { loadToko() }, [])

  async function loadToko() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { navigate('/login'); return }

    const { data } = await supabase
      .from('toko').select('*').eq('user_id', userData.user.id).single()

    if (data) {
      setTokoId(data.id)
      setJenis(data.jenis || 'toko')
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
    } else {
      toast.error('Toko tidak ditemukan')
      navigate('/buat-toko')
    }
    setLoading(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleJenisChange(j: 'toko' | 'jasa') {
    setJenis(j)
    setForm(f => ({ ...f, kategori: '' }))
  }

  async function handleUploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Ukuran foto maksimal 2MB'); return }
    if (!tokoId) { toast.error('Toko belum dimuat'); return }
    setUploadingFoto(true)
    const ext = file.name.split('.').pop()
    const fileName = `${tokoId}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('toko-foto').upload(fileName, file, { upsert: true })
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
        jenis: jenis,
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
      toast.success('Berhasil diupdate!')
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

  const kategoriList = jenis === 'toko' ? KATEGORI_TOKO : KATEGORI_JASA

  return (
    <div className="min-h-screen bg-gray-50 pb-8">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate('/dashboard')} className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">
          ←
        </button>
        <div>
          <h1 className="font-extrabold text-gray-900 text-base">Edit {jenis === 'toko' ? 'Toko' : 'Jasa'}</h1>
          <p className="text-xs text-gray-400">Update info {jenis === 'toko' ? 'toko' : 'jasa'} kamu</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">

        {/* Foto */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {form.foto_url ? (
            <img src={form.foto_url} alt="Foto" className="w-full h-40 object-cover" />
          ) : (
            <div className="w-full h-28 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-4xl">
              {jenis === 'toko' ? '🏪' : '🛠️'}
            </div>
          )}
          <div className="p-4">
            <label className={`w-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl py-3 text-sm cursor-pointer hover:bg-gray-50 transition font-semibold text-gray-500 ${uploadingFoto ? 'opacity-50' : ''}`}>
              <input type="file" accept="image/*" onChange={handleUploadFoto} disabled={uploadingFoto} className="hidden" />
              {uploadingFoto ? '⏳ Mengupload...' : '📷 Ganti Foto (maks 2MB)'}
            </label>
          </div>
        </div>

        {/* Pilih Jenis */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Jenis</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleJenisChange('toko')}
              className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition font-bold text-sm ${
                jenis === 'toko'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-100 bg-gray-50 text-gray-400'
              }`}
            >
              <span>🏪</span> Toko
            </button>
            <button
              onClick={() => handleJenisChange('jasa')}
              className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition font-bold text-sm ${
                jenis === 'jasa'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-100 bg-gray-50 text-gray-400'
              }`}
            >
              <span>🛠️</span> Jasa
            </button>
          </div>
        </div>

        {/* Form Info */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
            Info {jenis === 'toko' ? 'Toko' : 'Jasa'}
          </p>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">
              {jenis === 'toko' ? 'Nama Toko' : 'Nama / Brand Jasa'} *
            </label>
            <input
              name="nama"
              value={form.nama}
              onChange={handleChange}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Kategori *</label>
            <select
              name="kategori"
              value={form.kategori}
              onChange={handleChange}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition"
            >
              <option value="">Pilih kategori</option>
              {kategoriList.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">
              {jenis === 'toko' ? 'Alamat Toko' : 'Area Layanan'} *
            </label>
            <input
              name="alamat"
              value={form.alamat}
              onChange={handleChange}
              placeholder={jenis === 'jasa' ? 'contoh: Kelurahan Sukamaju, Kec. Cimanggis' : ''}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nomor WhatsApp</label>
            <input
              name="telepon"
              value={form.telepon}
              onChange={handleChange}
              placeholder="08123456789"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">
              {jenis === 'toko' ? 'Deskripsi Toko' : 'Deskripsi Jasa'}
            </label>
            <textarea
              name="deskripsi"
              value={form.deskripsi}
              onChange={handleChange}
              placeholder={jenis === 'jasa' ? 'Jelaskan jasa yang ditawarkan, pengalaman, harga, dll...' : ''}
              rows={3}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition resize-none"
            />
          </div>
        </div>

        {/* Lokasi */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Lokasi di Peta</p>
          <button
            type="button"
            onClick={ambilLokasi}
            disabled={loadingLokasi}
            className="w-full border-2 border-dashed border-gray-200 text-gray-500 text-sm py-3 rounded-2xl font-semibold hover:bg-gray-50 transition disabled:opacity-50"
          >
            {loadingLokasi ? 'Mengambil lokasi...' : '📍 Ambil Lokasi Saat Ini (GPS)'}
          </button>
          {form.lat && form.lng && (
            <p className="text-xs text-green-600 font-semibold">✅ Lokasi: {parseFloat(form.lat).toFixed(5)}, {parseFloat(form.lng).toFixed(5)}</p>
          )}
          <div className="flex gap-2">
            <input
              name="lat"
              value={form.lat}
              onChange={handleChange}
              placeholder="Latitude: -6.2088"
              className="flex-1 border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 bg-gray-50 transition"
            />
            <input
              name="lng"
              value={form.lng}
              onChange={handleChange}
              placeholder="Longitude: 106.8456"
              className="flex-1 border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 bg-gray-50 transition"
            />
          </div>
        </div>

        {/* Simpan */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full text-white rounded-2xl py-4 text-sm font-extrabold transition shadow-lg disabled:opacity-50 ${
            jenis === 'toko'
              ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-100'
              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-100'
          }`}
        >
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>

      </div>
    </div>
  )
}
