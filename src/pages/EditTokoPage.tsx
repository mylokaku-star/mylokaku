import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { KATEGORI_TOKO, KATEGORI_JASA, KATEGORI_PRELOVED } from '../lib/kategori'
import { kompresGambar, validasiGambar, formatUkuran } from '../lib/imageHelper'

type JenisDaftar = 'toko' | 'jasa' | 'preloved'

const JENIS_CONFIG = {
  toko:     { icon: '🏪', label: 'Toko',    border: 'border-green-500', bg: 'bg-green-50', text: 'text-green-700', btn: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-100' },
  jasa:     { icon: '🛠️', label: 'Jasa',    border: 'border-blue-500',  bg: 'bg-blue-50',  text: 'text-blue-700',  btn: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-100' },
  preloved: { icon: '♻️', label: 'Preloved', border: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', btn: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-purple-100' },
}

export default function EditTokoPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadingLokasi, setLoadingLokasi] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [infoFoto, setInfoFoto] = useState<string>('')
  const [tokoId, setTokoId] = useState('')
  const [jenis, setJenis] = useState<JenisDaftar>('toko')
  const [form, setForm] = useState({
    nama: '', deskripsi: '', kategori: '', alamat: '', telepon: '', lat: '', lng: '', foto_url: '',
  })

  useEffect(() => { loadToko() }, [])

  async function loadToko() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { navigate('/login'); return }
    const { data } = await supabase.from('toko').select('*').eq('user_id', userData.user.id).single()
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

  function handleJenisChange(j: JenisDaftar) {
    setJenis(j)
    setForm(f => ({ ...f, kategori: '' }))
  }

  async function handleUploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validasi
    const errorMsg = validasiGambar(file, 10)
    if (errorMsg) { toast.error(errorMsg); return }
    if (!tokoId) { toast.error('Toko belum dimuat'); return }

    setUploadingFoto(true)
    setInfoFoto('')

    try {
      // Kompresi sebelum upload
      const fileKompres = await kompresGambar(file, {
        maxWidth: 800,
        maxHeight: 800,
        kualitas: 0.75,
        maxSizeKB: 500,
      })

      setInfoFoto(`${formatUkuran(file.size)} → ${formatUkuran(fileKompres.size)}`)

      const ext = 'jpg'
      const fileName = `${tokoId}-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('toko-foto').upload(fileName, fileKompres, { upsert: true })

      if (uploadError) { toast.error('Gagal upload foto'); return }

      const { data: urlData } = supabase.storage.from('toko-foto').getPublicUrl(fileName)
      setForm(f => ({ ...f, foto_url: urlData.publicUrl }))
      toast.success('Foto berhasil diupload!')
    } catch (err) {
      toast.error('Gagal memproses foto')
    } finally {
      setUploadingFoto(false)
    }
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
      toast.error('Nama, kategori, dan alamat wajib diisi'); return
    }
    setSaving(true)
    const { error } = await supabase.from('toko').update({
      nama: form.nama,
      deskripsi: form.deskripsi,
      kategori: form.kategori,
      jenis,
      alamat: form.alamat,
      telepon: form.telepon,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
      foto_url: form.foto_url,
    }).eq('id', tokoId)
    setSaving(false)
    if (error) { toast.error('Gagal menyimpan: ' + error.message) }
    else { toast.success('Berhasil diupdate!'); navigate('/dashboard') }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Memuat...</p>
    </div>
  )

  const cfg = JENIS_CONFIG[jenis]
  const grupList = jenis === 'toko' ? KATEGORI_TOKO : jenis === 'jasa' ? KATEGORI_JASA : KATEGORI_PRELOVED
  const labelNama = jenis === 'toko' ? 'Nama Toko' : jenis === 'jasa' ? 'Nama / Brand Jasa' : 'Nama / Judul Barang'
  const labelAlamat = jenis === 'toko' ? 'Alamat Toko' : jenis === 'jasa' ? 'Area Layanan' : 'Lokasi Penjual'
  const labelDeskripsi = jenis === 'toko' ? 'Deskripsi Toko' : jenis === 'jasa' ? 'Deskripsi Jasa' : 'Deskripsi Barang (kondisi, harga, dll)'
  const placeholderDeskripsi = jenis === 'preloved' ? 'contoh: Kondisi 90%, jarang dipakai. Harga Rp 2.500.000 nego.' : jenis === 'jasa' ? 'Jelaskan jasa yang ditawarkan...' : ''

  return (
    <div className="min-h-screen bg-gray-50 pb-8">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate('/dashboard')} className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">←</button>
        <div>
          <h1 className="font-extrabold text-gray-900 text-base">Edit {cfg.icon} {cfg.label}</h1>
          <p className="text-xs text-gray-400">Update info {cfg.label.toLowerCase()} kamu</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">

        {/* Foto */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {form.foto_url ? (
            <img src={form.foto_url} alt="Foto" className="w-full h-40 object-cover" />
          ) : (
            <div className="w-full h-28 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-4xl">
              {cfg.icon}
            </div>
          )}
          <div className="p-4 space-y-2">
            <label className={`w-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl py-3 text-sm cursor-pointer hover:bg-gray-50 transition font-semibold text-gray-500 ${uploadingFoto ? 'opacity-50' : ''}`}>
              <input type="file" accept="image/*" onChange={handleUploadFoto} disabled={uploadingFoto} className="hidden" />
              {uploadingFoto ? '⏳ Mengkompresi & upload...' : '📷 Ganti Foto (otomatis dikompresi)'}
            </label>
            {infoFoto && (
              <p className="text-xs text-green-600 font-semibold text-center">✅ Ukuran: {infoFoto}</p>
            )}
            <p className="text-xs text-gray-400 text-center">Foto akan dikompresi otomatis sebelum upload</p>
          </div>
        </div>

        {/* Pilih Jenis */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Jenis</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(JENIS_CONFIG) as [JenisDaftar, typeof JENIS_CONFIG.toko][]).map(([j, c]) => (
              <button key={j} onClick={() => handleJenisChange(j)}
                className={`flex items-center justify-center gap-1.5 py-3 rounded-2xl border-2 transition font-bold text-xs ${jenis === j ? `${c.border} ${c.bg} ${c.text}` : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
                <span>{c.icon}</span> {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Info */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Info {cfg.label}</p>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">{labelNama} *</label>
            <input name="nama" value={form.nama} onChange={handleChange}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Kategori *</label>
            <select name="kategori" value={form.kategori} onChange={handleChange}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition">
              <option value="">Pilih kategori</option>
              {grupList.map(grup => (
                <optgroup key={grup.grup} label={`── ${grup.grup}`}>
                  {grup.items.map(item => <option key={item} value={item}>{item}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">{labelAlamat} *</label>
            <input name="alamat" value={form.alamat} onChange={handleChange}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nomor WhatsApp</label>
            <input name="telepon" value={form.telepon} onChange={handleChange} placeholder="08123456789"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">{labelDeskripsi}</label>
            <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange} rows={3}
              placeholder={placeholderDeskripsi}
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

        {/* Simpan */}
        <button onClick={handleSave} disabled={saving}
          className={`w-full text-white rounded-2xl py-4 text-sm font-extrabold transition shadow-lg disabled:opacity-50 bg-gradient-to-r ${cfg.btn}`}>
          {saving ? 'Menyimpan...' : `${cfg.icon} Simpan Perubahan`}
        </button>

      </div>
    </div>
  )
}
