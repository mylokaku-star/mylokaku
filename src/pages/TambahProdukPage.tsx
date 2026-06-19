import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { kompresGambar, validasiGambar, formatUkuran } from '../lib/imageHelper'

export default function TambahProdukPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [loadingToko, setLoadingToko] = useState(true)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [infoFoto, setInfoFoto] = useState<string>('')
  const [tokoId, setTokoId] = useState('')
  const [semuaToko, setSemuaToko] = useState<any[]>([])
  const [form, setForm] = useState({
    nama: '',
    harga: '',
    deskripsi: '',
    foto_url: '',
  })

  useEffect(() => { loadToko() }, [])

  async function loadToko() {
    setLoadingToko(true)
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      toast.error('Silakan login terlebih dahulu')
      navigate('/login')
      return
    }

    // Ambil SEMUA toko milik user (bukan .single(), bisa lebih dari 1)
    const { data: tokoList, error } = await supabase
      .from('toko')
      .select('id, nama, jenis')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[TambahProdukPage] tokoError:', error)
      toast.error('Gagal memuat toko: ' + error.message)
      setLoadingToko(false)
      return
    }

    if (!tokoList || tokoList.length === 0) {
      toast.error('Kamu belum punya toko. Buat toko dulu.')
      navigate('/buat-toko')
      return
    }

    setSemuaToko(tokoList)

    // Pilih toko dari query param ?toko=id (dikirim dari ProdukPage), atau toko pertama
    const tokoIdFromUrl = searchParams.get('toko')
    const tokoTerpilih = tokoList.find(t => t.id === tokoIdFromUrl) || tokoList[0]
    setTokoId(tokoTerpilih.id)
    setLoadingToko(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleUploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const errorMsg = validasiGambar(file, 10)
    if (errorMsg) { toast.error(errorMsg); return }

    setUploadingFoto(true)
    setInfoFoto('')

    try {
      const fileKompres = await kompresGambar(file, {
        maxWidth: 800,
        maxHeight: 800,
        kualitas: 0.75,
        maxSizeKB: 500,
      })

      setInfoFoto(`${formatUkuran(file.size)} → ${formatUkuran(fileKompres.size)}`)

      const fileName = `produk-${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('produk-foto').upload(fileName, fileKompres, { upsert: true })

      if (uploadError) { toast.error('Gagal upload foto'); return }

      const { data: urlData } = supabase.storage.from('produk-foto').getPublicUrl(fileName)
      setForm(f => ({ ...f, foto_url: urlData.publicUrl }))
      toast.success('Foto berhasil diupload!')
    } catch (err) {
      toast.error('Gagal memproses foto')
    } finally {
      setUploadingFoto(false)
    }
  }

  async function handleSubmit() {
    if (!form.nama || !form.harga) {
      toast.error('Nama dan harga wajib diisi')
      return
    }
    if (!tokoId) {
      toast.error('Toko tidak ditemukan')
      return
    }
    setLoading(true)

    const { error } = await supabase.from('produk').insert({
      toko_id: tokoId,
      nama: form.nama,
      harga: parseInt(form.harga),
      deskripsi: form.deskripsi,
      foto_url: form.foto_url,
    })
    setLoading(false)
    if (error) {
      toast.error('Gagal tambah produk: ' + error.message)
    } else {
      toast.success('Produk berhasil ditambahkan!')
      navigate(`/produk?toko=${tokoId}`)
    }
  }

  const tokoTerpilih = semuaToko.find(t => t.id === tokoId)

  if (loadingToko) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Memuat...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate(`/produk?toko=${tokoId}`)}
          className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">
          ←
        </button>
        <div>
          <h1 className="font-extrabold text-gray-900 text-base">Tambah Produk</h1>
          <p className="text-xs text-gray-400">Isi detail produk baru</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5">

        {/* Pilih toko kalau punya lebih dari 1 */}
        {semuaToko.length > 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-4">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 px-1">
              Tambahkan ke Toko
            </p>
            <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {semuaToko.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTokoId(t.id)}
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

        {semuaToko.length === 1 && tokoTerpilih && (
          <div className="flex items-center gap-2 mb-4 px-1">
            <span className="text-sm">{tokoTerpilih.jenis === 'jasa' ? '🛠️' : tokoTerpilih.jenis === 'preloved' ? '♻️' : '🏪'}</span>
            <p className="text-xs text-gray-400">
              Menambahkan produk ke <span className="font-bold text-gray-600">{tokoTerpilih.nama}</span>
            </p>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">

          {/* Foto */}
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Foto Produk</p>
            {form.foto_url && (
              <img src={form.foto_url} alt="foto produk" className="w-full h-40 object-cover rounded-2xl mb-3" />
            )}
            <label className={`w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl py-5 cursor-pointer hover:bg-gray-50 transition ${uploadingFoto ? 'opacity-50' : ''}`}>
              <input type="file" accept="image/*" onChange={handleUploadFoto} disabled={uploadingFoto} className="hidden" />
              <span className="text-2xl mb-1">📷</span>
              <p className="text-sm font-semibold text-gray-500">
                {uploadingFoto ? '⏳ Mengkompresi & upload...' : form.foto_url ? 'Ganti Foto' : 'Pilih Foto Produk'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Foto akan dikompresi otomatis</p>
            </label>
            {infoFoto && (
              <p className="text-xs text-green-600 font-semibold mt-2 text-center">✅ Ukuran: {infoFoto}</p>
            )}
          </div>

          {/* Nama */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nama Produk *</label>
            <input name="nama" value={form.nama} onChange={handleChange}
              placeholder="contoh: Nasi Goreng Spesial"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
          </div>

          {/* Harga */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Harga (Rp) *</label>
            <input name="harga" type="number" value={form.harga} onChange={handleChange}
              placeholder="contoh: 15000"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Deskripsi Produk</label>
            <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange}
              placeholder="Deskripsi singkat produk..." rows={3}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition resize-none" />
          </div>

          {/* Simpan */}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl py-4 text-sm font-extrabold transition shadow-lg disabled:opacity-50">
            {loading ? 'Menyimpan...' : '📦 Tambah Produk'}
          </button>

        </div>
      </div>
    </div>
  )
}
