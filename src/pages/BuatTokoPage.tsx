import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { KATEGORI_TOKO, KATEGORI_JASA, KATEGORI_PRELOVED } from '../lib/kategori'

type JenisDaftar = 'toko' | 'jasa' | 'preloved'

export default function BuatTokoPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingLokasi, setLoadingLokasi] = useState(false)
  const [jenis, setJenis] = useState<JenisDaftar>('toko')
  const [form, setForm] = useState({
    nama: '', deskripsi: '', kategori: '', alamat: '', telepon: '', lat: '', lng: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleJenisChange(j: JenisDaftar) {
    setJenis(j)
    setForm(f => ({ ...f, kategori: '' }))
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
      toast.error('Nama, kategori, dan alamat wajib diisi'); return
    }
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      toast.error('Silakan login terlebih dahulu')
      setLoading(false); navigate('/login'); return
    }
    const { error } = await supabase.from('toko').insert({
      nama: form.nama,
      deskripsi: form.deskripsi || null,
      kategori: form.kategori,
      jenis,
      alamat: form.alamat,
      telepon: form.telepon || null,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
      user_id: userData.user.id,
      is_buka: false,
    })
    setLoading(false)
    if (error) { toast.error('Gagal mendaftar: ' + error.message) }
    else {
      const msg = jenis === 'toko' ? 'Toko berhasil dibuat! 🎉' : jenis === 'jasa' ? 'Jasa berhasil didaftarkan! 🎉' : 'Barang preloved berhasil didaftarkan! 🎉'
      toast.success(msg)
      navigate('/dashboard')
    }
  }

  const grupList = jenis === 'toko' ? KATEGORI_TOKO : jenis === 'jasa' ? KATEGORI_JASA : KATEGORI_PRELOVED

  const jenisConfig = {
    toko: { icon: '🏪', label: 'Pemilik Toko', sub: 'Jualan produk fisik', border: 'border-green-500', bg: 'bg-green-50', text: 'text-green-700', btn: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-100', infoBg: 'bg-green-50', infoText: 'text-green-700' },
    jasa: { icon: '🛠️', label: 'Penyedia Jasa', sub: 'Tawarkan layanan', border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', btn: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-100', infoBg: 'bg-blue-50', infoText: 'text-blue-700' },
    preloved: { icon: '♻️', label: 'Jual Barang Bekas', sub: 'Preloved & secondhand', border: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', btn: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-purple-100', infoBg: 'bg-purple-50', infoText: 'text-purple-700' },
  }

  const cfg = jenisConfig[jenis]

  const infoText = {
    toko: 'Daftarkan tokomu dan mulai ditemukan pembeli di sekitarmu secara realtime.',
    jasa: 'Tawarkan jasamu ke warga sekitar. Tidak perlu punya toko fisik!',
    preloved: 'Jual barang bekas milikmu ke warga sekitar. Mudah, cepat, dan gratis!',
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate('/dashboard')} className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">←</button>
        <div>
          <h1 className="font-extrabold text-gray-900 text-base">Daftar Toko / Jasa / Preloved</h1>
          <p className="text-xs text-gray-400">Gratis selamanya</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">

        {/* Pilih Jenis */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Saya ingin daftar sebagai</p>
          <div className="grid grid-cols-3 gap-2">
            {(['toko', 'jasa', 'preloved'] as JenisDaftar[]).map(j => {
              const c = jenisConfig[j]
              return (
                <button key={j} onClick={() => handleJenisChange(j)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition font-bold text-xs ${jenis === j ? `${c.border} ${c.bg} ${c.text}` : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
                  <span className="text-2xl">{c.icon}</span>
                  <span>{c.label}</span>
                  <span className="font-normal opacity-70 text-center leading-tight">{c.sub}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Info */}
        <div className={`rounded-2xl px-4 py-3 flex items-start gap-2 ${cfg.infoBg}`}>
          <span className="text-lg">{cfg.icon}</span>
          <p className={`text-xs leading-relaxed ${cfg.infoText}`}>{infoText[jenis]}</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
            Info {jenis === 'toko' ? 'Toko' : jenis === 'jasa' ? 'Jasa' : 'Barang Preloved'}
          </p>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">
              {jenis === 'toko' ? 'Nama Toko' : jenis === 'jasa' ? 'Nama / Brand Jasa' : 'Nama / Judul Barang'} *
            </label>
            <input name="nama" value={form.nama} onChange={handleChange}
              placeholder={jenis === 'toko' ? 'contoh: Warung Bu Sari' : jenis === 'jasa' ? 'contoh: Laundry Pak Budi' : 'contoh: Jual Motor Honda Beat 2020'}
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
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">
              {jenis === 'toko' ? 'Alamat Toko' : jenis === 'jasa' ? 'Area Layanan' : 'Lokasi Penjual'} *
            </label>
            <input name="alamat" value={form.alamat} onChange={handleChange}
              placeholder={jenis === 'toko' ? 'contoh: Jl. Merdeka No. 10' : jenis === 'jasa' ? 'contoh: Kelurahan Sukamaju' : 'contoh: Perum Griya Asri, Blok B2'}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nomor WhatsApp</label>
            <input name="telepon" value={form.telepon} onChange={handleChange} placeholder="08123456789"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">
              {jenis === 'preloved' ? 'Deskripsi Barang (kondisi, alasan jual, harga, dll)' : jenis === 'jasa' ? 'Deskripsi Jasa' : 'Deskripsi Toko'}
            </label>
            <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange} rows={3}
              placeholder={jenis === 'preloved' ? 'contoh: Kondisi 90%, jarang dipakai. Harga Rp 2.500.000 nego.' : jenis === 'toko' ? 'Ceritakan tentang tokomu...' : 'Jelaskan jasa yang kamu tawarkan...'}
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

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading}
          className={`w-full text-white rounded-2xl py-4 text-sm font-extrabold transition shadow-lg disabled:opacity-50 bg-gradient-to-r ${cfg.btn}`}>
          {loading ? 'Menyimpan...' : `${cfg.icon} ${jenis === 'toko' ? 'Daftarkan Toko' : jenis === 'jasa' ? 'Daftarkan Jasa' : 'Pasang Iklan Preloved'}`}
        </button>

      </div>
    </div>
  )
}
