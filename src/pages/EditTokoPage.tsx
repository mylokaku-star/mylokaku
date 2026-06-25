import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { KATEGORI_TOKO, KATEGORI_JASA } from '../lib/kategori'
import { kompresGambar, validasiGambar, formatUkuran } from '../lib/imageHelper'

type JenisDaftar = 'toko' | 'jasa' | 'preloved'

const TAG_PRELOVED = ['Campuran', 'Pakaian', 'Elektronik', 'Otomotif', 'Furnitur', 'Mainan Anak', 'Buku', 'Gadget', 'Aksesori', 'Lainnya']

const JENIS_CONFIG = {
  toko:     { icon: '🏪', label: 'Toko',     border: 'border-green-500', bg: 'bg-green-50', text: 'text-green-700', btn: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-100' },
  jasa:     { icon: '🛠️', label: 'Jasa',     border: 'border-blue-500',  bg: 'bg-blue-50',  text: 'text-blue-700',  btn: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-100' },
  preloved: { icon: '♻️', label: 'Preloved',  border: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', btn: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-purple-100' },
}

export default function EditTokoPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadingLokasi, setLoadingLokasi] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [infoFoto, setInfoFoto] = useState<string>('')
  const [tokoId, setTokoId] = useState('')
  const [semuaToko, setSemuaToko] = useState<any[]>([])
  const [jenis, setJenis] = useState<JenisDaftar>('toko')
  const [tagPreloved, setTagPreloved] = useState<string[]>([])
  const [form, setForm] = useState({
    nama: '', deskripsi: '', kategori: '', alamat: '', telepon: '', lat: '', lng: '', foto_url: '',
  })

  useEffect(() => { loadSemuaToko() }, [])

  async function loadSemuaToko() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { navigate('/login'); return }

    const { data: tokoList, error } = await supabase
      .from('toko')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })

    if (error || !tokoList || tokoList.length === 0) {
      toast.error('Toko tidak ditemukan')
      navigate('/buat-toko')
      return
    }

    setSemuaToko(tokoList)

    // Pilih toko dari URL param atau yang pertama
    const tokoIdFromUrl = searchParams.get('toko')
    const tokoTerpilih = tokoList.find(t => t.id === tokoIdFromUrl) || tokoList[0]
    isiFormDariToko(tokoTerpilih)
    setLoading(false)
  }

  function isiFormDariToko(data: any) {
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
    // Restore tag preloved
    if (data.jenis === 'preloved' && data.tag_barang) {
      setTagPreloved(Array.isArray(data.tag_barang) ? data.tag_barang : [])
    } else {
      setTagPreloved([])
    }
  }

  function pindahToko(t: any) {
    isiFormDariToko(t)
    setInfoFoto('')
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleJenisChange(j: JenisDaftar) {
    setJenis(j)
    setForm(f => ({ ...f, kategori: '' }))
    setTagPreloved([])
  }

  function toggleTag(tag: string) {
    setTagPreloved(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  async function handleUploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const errorMsg = validasiGambar(file, 10)
    if (errorMsg) { toast.error(errorMsg); return }
    if (!tokoId) { toast.error('Toko belum dimuat'); return }

    setUploadingFoto(true)
    setInfoFoto('')

    try {
      const fileKompres = await kompresGambar(file, {
        maxWidth: 800, maxHeight: 800, kualitas: 0.75, maxSizeKB: 500,
      })
      setInfoFoto(`${formatUkuran(file.size)} → ${formatUkuran(fileKompres.size)}`)
      const fileName = `${tokoId}-${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('toko-foto').upload(fileName, fileKompres, { upsert: true })
      if (uploadError) { toast.error('Gagal upload foto'); return }
      const { data: urlData } = supabase.storage.from('toko-foto').getPublicUrl(fileName)
      setForm(f => ({ ...f, foto_url: urlData.publicUrl }))
      toast.success('Foto berhasil diupload!')
    } catch {
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
    if (!form.nama || !form.alamat) {
      toast.error('Nama dan alamat wajib diisi'); return
    }
    if (jenis !== 'preloved' && !form.kategori) {
      toast.error('Kategori wajib diisi'); return
    }
    setSaving(true)

    const payload: Record<string, unknown> = {
      nama: form.nama,
      deskripsi: form.deskripsi,
      kategori: jenis === 'preloved'
        ? (tagPreloved.length > 0 ? tagPreloved.join(', ') : 'Campuran')
        : form.kategori,
      jenis,
      alamat: form.alamat,
      telepon: form.telepon,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
      foto_url: form.foto_url,
    }

    if (jenis === 'preloved') {
      payload.tag_barang = tagPreloved.length > 0 ? tagPreloved : null
    }

    const { error } = await supabase.from('toko').update(payload).eq('id', tokoId)
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
  const grupList = jenis === 'toko' ? KATEGORI_TOKO : KATEGORI_JASA
  const labelNama = jenis === 'toko' ? 'Nama Toko' : jenis === 'jasa' ? 'Nama / Brand Jasa' : 'Nama Toko Preloved'
  const labelAlamat = jenis === 'toko' ? 'Alamat Toko' : jenis === 'jasa' ? 'Area Layanan' : 'Lokasi Penjual'
  const labelDeskripsi = jenis === 'toko' ? 'Deskripsi Toko' : jenis === 'jasa' ? 'Deskripsi Jasa' : 'Keterangan & Aturan Main Toko'

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

        {/* Switcher toko kalau punya lebih dari 1 */}
        {semuaToko.length > 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 px-1">
              Pilih Toko yang Diedit
            </p>
            <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {semuaToko.map(t => (
                <button
                  key={t.id}
                  onClick={() => pindahToko(t)}
                  className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border-2 transition
                    ${tokoId === t.id ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 bg-gray-50 text-gray-500'}`}
                >
                  <span>{t.jenis === 'jasa' ? '🛠️' : t.jenis === 'preloved' ? '♻️' : '🏪'}</span>
                  {t.nama}
                </button>
              ))}
            </div>
          </div>
        )}

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
            {infoFoto && <p className="text-xs text-green-600 font-semibold text-center">✅ Ukuran: {infoFoto}</p>}
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

          {/* Kategori — hanya untuk toko & jasa */}
          {jenis !== 'preloved' && (
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
          )}

          {/* Tag Preloved */}
          {jenis === 'preloved' && (
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                Jenis Barang yang Dijual
                <span className="text-xs font-normal text-gray-400 ml-1">(Opsional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {TAG_PRELOVED.map(tag => (
                  <button key={tag} type="button" onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition
                      ${tagPreloved.includes(tag)
                        ? 'border-purple-400 bg-purple-50 text-purple-700'
                        : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-purple-200'}`}>
                    {tagPreloved.includes(tag) ? '✓ ' : ''}{tag}
                  </button>
                ))}
              </div>
              {tagPreloved.length > 0 && (
                <p className="text-xs text-purple-600 font-semibold mt-2">Dipilih: {tagPreloved.join(', ')}</p>
              )}
            </div>
          )}

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
            {jenis === 'preloved' && (
              <p className="text-xs text-gray-400 mb-2 leading-relaxed">
                Jelaskan sistem toko, jam operasional, kebijakan retur, atau cara negosiasi harga.
              </p>
            )}
            <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange} rows={3}
              placeholder={
                jenis === 'preloved'
                  ? 'contoh: "Menjual barang koleksi pribadi. Semua sudah dicuci. Nego halus via WA."'
                  : jenis === 'jasa' ? 'Jelaskan jasa yang ditawarkan...' : ''
              }
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
