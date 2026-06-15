import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

type JenisPromo = 'promo' | 'event'

export default function BuatPromoPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingToko, setLoadingToko] = useState(true)
  const [tokoList, setTokoList] = useState<any[]>([])
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    toko_id: '',
    judul: '',
    deskripsi: '',
    jenis: 'promo' as JenisPromo,
    tanggal_mulai: '',
    tanggal_berakhir: '',
  })

  useEffect(() => { loadToko() }, [])

  async function loadToko() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { navigate('/login'); return }

    const { data } = await supabase
      .from('toko')
      .select('id, nama, jenis, lat, lng')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })

    setTokoList(data || [])
    if (data && data.length > 0) {
      setForm(f => ({ ...f, toko_id: data[0].id }))
    }
    setLoadingToko(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      toast.error('Format gambar harus JPG, PNG, atau WebP')
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handleSubmit() {
    if (!form.toko_id) { toast.error('Pilih toko terlebih dahulu'); return }
    if (!form.judul) { toast.error('Judul wajib diisi'); return }
    if (!form.tanggal_mulai || !form.tanggal_berakhir) { toast.error('Tanggal wajib diisi'); return }
    if (form.tanggal_berakhir < form.tanggal_mulai) { toast.error('Tanggal berakhir tidak boleh sebelum tanggal mulai'); return }
    if (!file) { toast.error('Gambar promo wajib diupload'); return }

    setLoading(true)

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { toast.error('Silakan login'); setLoading(false); return }

      // Upload gambar
      const ext = file.name.split('.').pop()
      const fileName = `${userData.user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('promo-foto')
        .upload(fileName, file, { upsert: false })

      if (uploadError) {
        toast.error('Gagal upload gambar: ' + uploadError.message)
        setLoading(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('promo-foto')
        .getPublicUrl(fileName)

      // Ambil lokasi dari toko yang dipilih
      const toko = tokoList.find(t => t.id === form.toko_id)

      const { error } = await supabase.from('promos').insert({
        toko_id: form.toko_id,
        user_id: userData.user.id,
        judul: form.judul,
        deskripsi: form.deskripsi || null,
        gambar_url: urlData.publicUrl,
        jenis: form.jenis,
        tanggal_mulai: form.tanggal_mulai,
        tanggal_berakhir: form.tanggal_berakhir,
        lat: toko?.lat || null,
        lng: toko?.lng || null,
        radius_km: 10,
        status: 'menunggu',
      })

      if (error) {
        toast.error('Gagal membuat promo: ' + error.message)
      } else {
        toast.success('Promo berhasil diajukan! Menunggu persetujuan admin. 🎉')
        navigate('/dashboard')
      }
    } catch {
      toast.error('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const tokoTerpilih = tokoList.find(t => t.id === form.toko_id)

  if (loadingToko) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center text-white font-black text-lg animate-pulse">L</div>
    </div>
  )

  if (tokoList.length === 0) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <span className="text-5xl mb-4">🏪</span>
      <h2 className="font-extrabold text-gray-900 text-lg mb-2">Belum Punya Toko</h2>
      <p className="text-sm text-gray-400 mb-6">Daftarkan toko atau jasa kamu dulu sebelum membuat promo.</p>
      <button onClick={() => navigate('/buat-toko')}
        className="bg-green-500 text-white font-bold px-6 py-3 rounded-2xl text-sm hover:bg-green-600 transition">
        Daftar Toko Sekarang
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-8">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate('/dashboard')}
          className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">←</button>
        <div>
          <h1 className="font-extrabold text-gray-900 text-base">Buat Promo / Event</h1>
          <p className="text-xs text-gray-400">Jangkau pembeli dalam radius 10 km</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">

        {/* Info biaya */}
        <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl px-4 py-3 flex gap-2">
          <span className="text-lg">💳</span>
          <div>
            <p className="text-xs font-bold text-amber-800">Promo Berbayar</p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              Setelah mengajukan, admin akan menghubungi kamu via WhatsApp untuk konfirmasi pembayaran. Promo tayang setelah pembayaran dikonfirmasi.
            </p>
          </div>
        </div>

        {/* Pilih Jenis */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Jenis Konten</p>
          <div className="grid grid-cols-2 gap-3">
            {(['promo', 'event'] as JenisPromo[]).map(j => (
              <button key={j} type="button"
                onClick={() => setForm(f => ({ ...f, jenis: j }))}
                className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition font-bold text-sm
                  ${form.jenis === j
                    ? j === 'promo'
                      ? 'border-orange-400 bg-orange-50 text-orange-700'
                      : 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-gray-100 bg-gray-50 text-gray-400'
                  }`}>
                <span className="text-2xl">{j === 'promo' ? '🏷️' : '🎪'}</span>
                <span className="capitalize">{j === 'promo' ? 'Promo / Diskon' : 'Event'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Detail {form.jenis === 'promo' ? 'Promo' : 'Event'}</p>

          {/* Pilih toko */}
          {tokoList.length > 1 && (
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Toko / Jasa *</label>
              <select name="toko_id" value={form.toko_id} onChange={handleChange}
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 bg-gray-50 transition">
                {tokoList.map(t => (
                  <option key={t.id} value={t.id}>{t.nama}</option>
                ))}
              </select>
            </div>
          )}

          {tokoList.length === 1 && (
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
              <span className="text-xl">🏪</span>
              <div>
                <p className="text-sm font-bold text-gray-800">{tokoTerpilih?.nama}</p>
                <p className="text-xs text-gray-400">Toko yang akan mempromosikan konten ini</p>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">
              Judul {form.jenis === 'promo' ? 'Promo' : 'Event'} *
            </label>
            <input name="judul" value={form.judul} onChange={handleChange}
              placeholder={form.jenis === 'promo' ? 'contoh: Diskon 50% Semua Menu!' : 'contoh: Bazar Ramadan 2025'}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 bg-gray-50 transition" />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Deskripsi</label>
            <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange} rows={3}
              placeholder={form.jenis === 'promo' ? 'Jelaskan detail promo, syarat & ketentuan...' : 'Jelaskan acara, lokasi, tiket, dll...'}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 bg-gray-50 transition resize-none" />
          </div>

          {/* Tanggal */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Tanggal Mulai *</label>
              <input type="date" name="tanggal_mulai" value={form.tanggal_mulai} onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border-2 border-gray-100 rounded-xl px-3 py-3 text-sm outline-none focus:border-orange-400 bg-gray-50 transition" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Tanggal Berakhir *</label>
              <input type="date" name="tanggal_berakhir" value={form.tanggal_berakhir} onChange={handleChange}
                min={form.tanggal_mulai || new Date().toISOString().split('T')[0]}
                className="w-full border-2 border-gray-100 rounded-xl px-3 py-3 text-sm outline-none focus:border-orange-400 bg-gray-50 transition" />
            </div>
          </div>
        </div>

        {/* Upload Gambar */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Gambar Promo *</p>
          <p className="text-xs text-gray-400">Ukuran ideal: 1200×628px (rasio 2:1). Maks 5MB.</p>

          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
            onChange={handleFile} className="hidden" />

          {preview ? (
            <div className="space-y-2">
              <div className="relative rounded-2xl overflow-hidden aspect-[2/1] bg-gray-100">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <button type="button"
                  onClick={() => { setPreview(null); setFile(null); if (fileRef.current) fileRef.current.value = '' }}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-xl flex items-center justify-center text-sm hover:bg-black/70 transition">
                  ✕
                </button>
              </div>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full text-xs text-gray-400 font-semibold py-2 hover:text-gray-600 transition">
                Ganti gambar
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-10 flex flex-col items-center gap-2 hover:bg-gray-50 transition">
              <span className="text-3xl">🖼️</span>
              <span className="text-sm font-semibold text-gray-500">Klik untuk upload gambar</span>
              <span className="text-xs text-gray-300">JPG, PNG, WebP · Maks 5MB</span>
            </button>
          )}
        </div>

        {/* Info radius */}
        <div className="bg-green-50 rounded-2xl px-4 py-3 flex gap-2">
          <span className="text-lg">📍</span>
          <p className="text-xs text-green-700 leading-relaxed">
            Promo/event kamu akan ditampilkan kepada pengguna dalam radius <strong>10 km</strong> dari lokasi tokomu.
          </p>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl py-4 text-sm font-extrabold transition shadow-lg shadow-orange-100 disabled:opacity-50">
          {loading ? 'Mengajukan...' : `${form.jenis === 'promo' ? '🏷️' : '🎪'} Ajukan ${form.jenis === 'promo' ? 'Promo' : 'Event'}`}
        </button>

      </div>
    </div>
  )
}
