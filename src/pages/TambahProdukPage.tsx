import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { kompresGambar, validasiGambar, formatUkuran } from '../lib/imageHelper'

type JenisDaftar = 'toko' | 'jasa' | 'preloved'

const CONFIG_TEMA = {
  toko: { border: 'focus:border-emerald-500', btn: 'bg-emerald-600 hover:bg-emerald-700 text-white', text: 'text-emerald-600', bg: 'bg-emerald-50/50' },
  jasa: { border: 'focus:border-blue-500', btn: 'bg-blue-600 hover:bg-blue-700 text-white', text: 'text-blue-600', bg: 'bg-blue-50/50' },
  preloved: { border: 'focus:border-purple-500', btn: 'bg-purple-600 hover:bg-purple-700 text-white', text: 'text-purple-600', bg: 'bg-purple-50/50' },
}

export default function TambahProdukPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tokoId = searchParams.get('toko') || ''

  const [namaToko, setNamaToko] = useState('')
  const [jenisToko, setJenisToko] = useState<JenisDaftar>('toko')
  const [loadingToko, setLoadingToko] = useState(true)
  
  const [form, setForm] = useState({ nama: '', harga: '', deskripsi: '', foto_url: '' })
  const [saving, setSaving] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [infoFoto, setInfoFoto] = useState('')

  useEffect(() => {
    if (!tokoId) {
      toast.error('ID Toko tidak valid!')
      navigate('/produk')
      return
    }
    ambilDataToko()
  }, [tokoId])

  async function ambilDataToko() {
    setLoadingToko(true)
    const { data, error } = await supabase
      .from('toko')
      .select('nama, jenis')
      .eq('id', tokoId)
      .single()

    if (error || !data) {
      toast.error('Gagal memverifikasi data lapak')
      navigate('/produk')
    } else {
      setNamaToko(data.nama)
      setJenisToko(data.jenis as JenisDaftar)
    }
    setLoadingToko(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleUploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const galatValidasi = validasiGambar(file, 10) // Maksimal 10MB sebelum kompres
    if (galatValidasi) { toast.error(galatValidasi); return }

    setUploadingFoto(true)
    setInfoFoto('')

    try {
      // Kompres otomatis gambar berukuran besar dari kamera HP seller
      const fileKompres = await kompresGambar(file, {
        maxWidth: 700, maxHeight: 700, kualitas: 0.8, maxSizeKB: 300
      })
      
      setInfoFoto(`${formatUkuran(file.size)} → ${formatUkuran(fileKompres.size)}`)
      const ext = file.name.split('.').pop()
      const fileName = `${tokoId}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('produk-foto')
        .upload(fileName, fileKompres, { upsert: true })

      if (uploadError) { toast.error('Gagal menyimpan file foto'); return }

      const { data: urlData } = supabase.storage.from('produk-foto').getPublicUrl(fileName)
      setForm(f => ({ ...f, foto_url: urlData.publicUrl }))
      toast.success('Foto produk berhasil diproses!')
    } catch {
      toast.error('Gagal memproses gambar')
    } finally {
      setUploadingFoto(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nama || !form.harga) { toast.error('Nama barang dan harga wajib diisi!'); return }

    const hargaParsed = parseInt(form.harga, 10)
    if (isNaN(hargaParsed) || hargaParsed < 0) {
      toast.error('Masukkan nominal harga yang valid')
      return
    }

    setSaving(true)

    const { error } = await supabase.from('produk').insert({
      toko_id: tokoId,
      nama: form.nama.trim(),
      harga: hargaParsed,
      deskripsi: form.deskripsi.trim() || null,
      foto_url: form.foto_url || null
    })

    setSaving(false)

    if (error) {
      toast.error('Gagal menambahkan produk: ' + error.message)
    } else {
      toast.success('Produk baru berhasil dipublikasikan!')
      navigate(`/produk?toko=${tokoId}`) // Kembali ke list produk toko tersebut
    }
  }

  const tema = CONFIG_TEMA[jenisToko]

  if (loadingToko) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-slate-200 border-t-slate-800 rounded-full animate-spin mb-3"></div>
        <p className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">Mempersiapkan Formulir...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 text-slate-800 font-medium antialiased">
      
      {/* HEADER NAVIGASI */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-30 shadow-sm bg-white/95 backdrop-blur-md">
        <button 
          onClick={() => navigate(`/produk?toko=${tokoId}`)} 
          className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 border border-slate-100 hover:bg-slate-100 active:scale-95 transition-all"
        >
          ←
        </button>
        <div>
          <h1 className="font-black text-slate-900 text-base tracking-tight">Tambah Produk</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Lapak: {namaToko}</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-5">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-100 p-5 space-y-5 shadow-sm">
          
          {/* ZONA UNGGAH GAMBAR */}
          <div>
            <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1.5">Foto Produk / Jasa</label>
            {form.foto_url ? (
              <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-slate-100 mb-3 border border-slate-100 shadow-inner">
                <img src={form.foto_url} alt="Pratinjau Produk" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => setForm(f => ({ ...f, foto_url: '' }))}
                  className="absolute top-2 right-2 bg-black/70 text-white w-7 h-7 rounded-full text-xs flex items-center justify-center font-bold backdrop-blur-sm"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className={`w-full h-36 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50/50 transition-all text-slate-400 gap-1 ${uploadingFoto ? 'opacity-40 pointer-events-none' : ''}`}>
                <input type="file" accept="image/*" onChange={handleUploadFoto} disabled={uploadingFoto} className="hidden" />
                <span className="text-2xl">📸</span>
                <span className="text-xs font-bold text-slate-500">Pilih atau Ambil Foto</span>
                <span className="text-[10px] text-slate-300 font-medium">Otomatis Dikompres Hemat Kuota</span>
              </label>
            )}
            {uploadingFoto && (
              <div className="flex items-center justify-center gap-2 mt-2 text-slate-500 text-xs font-semibold animate-pulse">
                <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                Mengoptimalkan ukuran gambar...
              </div>
            )}
            {infoFoto && <p className="text-[10px] font-bold text-emerald-600 text-center mt-1.5">✓ Ukuran dioptimalkan: {infoFoto}</p>}
          </div>

          {/* INPUT NAMA */}
          <div>
            <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Nama Produk / Layanan Jasa *</label>
            <input 
              type="text"
              name="nama"
              placeholder="Contoh: Kemeja Flanel Premium, Cuci AC, dll."
              value={form.nama} 
              onChange={handleChange}
              required
              className={`w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none bg-slate-50/50 font-semibold transition-all ${tema.border}`} 
            />
          </div>

          {/* INPUT HARGA */}
          <div>
            <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Harga Jual / Nilai Tukar *</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-sm font-black text-slate-400">Rp</span>
              <input 
                type="number"
                name="harga"
                placeholder="Contoh: 45000"
                value={form.harga} 
                onChange={handleChange}
                min="0"
                required
                className={`w-full border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm outline-none bg-slate-50/50 font-mono font-bold transition-all ${tema.border}`} 
              />
            </div>
          </div>

          {/* INPUT DESKRIPSI */}
          <div>
            <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Deskripsi & Detail Ketentuan</label>
            <textarea 
              name="deskripsi"
              placeholder="Jelaskan ukuran, varian, kondisi barang, atau durasi pengerjaan jasa agar pembeli tertarik..."
              value={form.deskripsi} 
              onChange={handleChange} 
              rows={4}
              className={`w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none bg-slate-50/50 font-semibold resize-none h-28 transition-all ${tema.border}`} 
            />
          </div>

          {/* TOMBOL AKSI */}
          <div className="pt-2">
            <button 
              type="submit" 
              disabled={saving || uploadingFoto}
              className={`w-full text-xs py-3.5 rounded-xl font-black uppercase tracking-wider active:scale-[0.98] transition-all shadow-md disabled:opacity-40 disabled:pointer-events-none ${tema.btn}`}
            >
              {saving ? 'Memproses Penyimpanan...' : '🚀 Publikasikan Produk'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}