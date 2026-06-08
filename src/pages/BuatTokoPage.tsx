import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { KATEGORI_TOKO, KATEGORI_JASA } from '../lib/kategori'

export default function BuatTokoPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingLokasi, setLoadingLokasi] = useState(false)
  const [jenis, setJenis] = useState<'toko' | 'jasa'>('toko')
  const [form, setForm] = useState({
    nama: '', deskripsi: '', kategori: '', alamat: '', telepon: '', lat: '', lng: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleJenisChange(j: 'toko' | 'jasa') {
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
    if (error) {
      toast.error('Gagal mendaftar: ' + error.message)
    } else {
      toast.success(jenis === 'toko' ? 'Toko berhasil dibuat! 🎉' : 'Jasa berhasil didaftarkan! 🎉')
      navigate('/dashboard')
    }
  }

  const grupList = jenis === 'toko' ? KATEGORI_TOKO : KATEGORI_JASA

  return (
    <div className="min-h-screen bg-gray-50 pb-8">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate('/dashboard')} className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">←</button>
        <div>
          <h1 className="font-extrabold text-gray-900 text-base">Daftar Toko / Jasa</h1>
          <p className="text-xs text-gray-400">Gratis selamanya</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">

        {/* Pilih Jenis */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Saya ingin daftar sebagai</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleJenisChange('toko')}
              className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition font-bold text-sm ${jenis === 'toko' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
              <span className="text-3xl">🏪</span>
              <span>Pemilik Toko</span>
              <span className="text-xs font-normal opacity-70">Jualan produk fisik</span>
            </button>
            <button onClick={() => handleJenisChange('jasa')}
              className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition font-bold text-sm ${jenis === 'jasa' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
              <span className="text-3xl">🛠️</span>
              <span>Penyedia Jasa</span>
              <span className="text-xs font-normal opacity-70">Tawarkan layanan</span>
            </button>
          </div>
        </div>

        {/* Info */}
        <div className={`rounded-2xl px-4 py-3 flex items-start gap-2 ${jenis === 'toko' ? 'bg-green-50' : 'bg-blue-50'}`}>
          <span className="text-lg">{jenis === 'toko' ? '🏪' : '🛠️'}</span>
          <p className={`text-xs leading-relaxed ${jenis === 'toko' ? 'text-green-700' : 'text-blue-700'}`}>
            {jenis === 'toko' ? 'Daftarkan tokomu dan mulai ditemukan pembeli di sekitarmu secara realtime.' : 'Tawarkan jasamu ke warga sekitar. Tidak perlu punya toko fisik!'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Info {jenis === 'toko' ? 'Toko' : 'Jasa'}</p>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">{jenis === 'toko' ? 'Nama Toko' : 'Nama / Brand Jasa'} *</label>
            <input name="nama" value={form.nama} onChange={handleChange}
              placeholder={jenis === 'toko' ? 'contoh: Warung Bu Sari' : 'contoh: Laundry Pak Budi'}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
          </div>

          {/* Kategori dengan optgroup */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Kategori *</label>
            <select name="kategori" value={form.kategori} onChange={handleChange}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition">
              <option value="">Pilih kategori {jenis === 'toko' ? 'toko' : 'jasa'}</option>
              {grupList.map(grup => (
                <optgroup key={grup.grup} label={`── ${grup.grup}`}>
                  {grup.items.map(item => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">{jenis === 'toko' ? 'Alamat Toko' : 'Area Layanan'} *</label>
            <input name="alamat" value={form.alamat} onChange={handleChange}
              placeholder={jenis === 'toko' ? 'contoh: Jl. Merdeka No. 10' : 'contoh: Kelurahan Sukamaju, Kec. Cimanggis'}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nomor WhatsApp</label>
            <input name="telepon" value={form.telepon} onChange={handleChange} placeholder="08123456789"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">{jenis === 'toko' ? 'Deskripsi Toko' : 'Deskripsi Jasa'}</label>
            <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange} rows={3}
              placeholder={jenis === 'toko' ? 'Ceritakan tentang tokomu...' : 'Jelaskan jasa yang kamu tawarkan, pengalaman, harga, dll...'}
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
          <p className="text-xs text-gray-300">Cari koordinat di maps.google.com → klik kanan → "What's here"</p>
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading}
          className={`w-full text-white rounded-2xl py-4 text-sm font-extrabold transition shadow-lg disabled:opacity-50 ${jenis === 'toko' ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-100' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-100'}`}>
          {loading ? 'Menyimpan...' : jenis === 'toko' ? '🏪 Daftarkan Toko Sekarang' : '🛠️ Daftarkan Jasa Sekarang'}
        </button>

      </div>
    </div>
  )
}
