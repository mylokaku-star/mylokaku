import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { kompresGambar, validasiGambar, formatUkuran } from '../lib/imageHelper'

type JenisDaftar = 'toko' | 'jasa' | 'preloved'

const CONFIG_TEMA = {
  toko: { aksen: 'emerald', border: 'focus:border-emerald-500', btn: 'bg-emerald-600 hover:bg-emerald-700 text-white', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  jasa: { aksen: 'blue', border: 'focus:border-blue-500', btn: 'bg-blue-600 hover:bg-blue-700 text-white', badge: 'bg-blue-50 text-blue-700 border-blue-100' },
  preloved: { aksen: 'purple', border: 'focus:border-purple-500', btn: 'bg-purple-600 hover:bg-purple-700 text-white', badge: 'bg-purple-50 text-purple-700 border-purple-100' },
}

export default function ProdukPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [produk, setProduk] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tokoId, setTokoId] = useState('')
  const [semuaToko, setSemuaToko] = useState<any[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ nama: '', harga: '', deskripsi: '', foto_url: '' })
  const [saving, setSaving] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [infoFoto, setInfoFoto] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { loadAwal() }, [])

  async function loadAwal() {
    setLoading(true)
    setError(null)

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      setError('Sesi masuk kedaluwarsa. Silakan masuk kembali.')
      setLoading(false)
      return
    }

    const { data: tokoList, error: tokoError } = await supabase
      .from('toko')
      .select('id, nama, jenis')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })

    if (tokoError) {
      setError('Gagal mengambil data toko: ' + tokoError.message)
      setLoading(false)
      return
    }

    if (!tokoList || tokoList.length === 0) {
      setError('Belum ada toko terdaftar. Daftarkan lapak Anda terlebih dahulu.')
      setLoading(false)
      return
    }

    setSemuaToko(tokoList)

    const tokoIdFromUrl = searchParams.get('toko')
    const tokoTerpilih = tokoList.find(t => t.id === tokoIdFromUrl) || tokoList[0]

    await loadProduk(tokoTerpilih.id)
  }

  async function loadProduk(idToko: string) {
    setLoading(true)
    setError(null)
    setTokoId(idToko)
    setSearchQuery('')

    const { data: produkData, error: produkError } = await supabase
      .from('produk')
      .select('*')
      .eq('toko_id', idToko)
      .order('created_at', { ascending: false })

    if (produkError) {
      setError('Gagal memuat katalog produk: ' + produkError.message)
      setLoading(false)
      return
    }

    setProduk(produkData || [])
    setLoading(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleUploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const galatValidasi = validasiGambar(file, 10)
    if (galatValidasi) { toast.error(galatValidasi); return }

    setUploadingFoto(true)
    setInfoFoto('')

    try {
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
      toast.success('Foto produk berhasil diperbarui!')
    } catch {
      toast.error('Gagal memproses gambar')
    } finally {
      setUploadingFoto(false)
    }
  }

  function startEdit(p: any) {
    setEditId(p.id)
    setInfoFoto('')
    setForm({ nama: p.nama, harga: p.harga.toString(), deskripsi: p.deskripsi || '', foto_url: p.foto_url || '' })
  }

  function cancelEdit() {
    setEditId(null)
    setForm({ nama: '', harga: '', deskripsi: '', foto_url: '' })
  }

  async function handleSave(id: string) {
    if (!form.nama || !form.harga) { toast.error('Nama barang dan harga harus diisi'); return }
    setSaving(true)
    
    const { error } = await supabase.from('produk').update({
      nama: form.nama, 
      harga: parseInt(form.harga), 
      deskripsi: form.deskripsi, 
      foto_url: form.foto_url,
    }).eq('id', id)
    
    setSaving(false)
    if (error) { 
      toast.error('Gagal memperbarui katalog: ' + error.message) 
    } else { 
      toast.success('Informasi produk berhasil dimutakhirkan!')
      setEditId(null)
      loadProduk(tokoId) 
    }
  }

  async function handleHapus(id: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini dari katalog?')) return
    const { error } = await supabase.from('produk').delete().eq('id', id)
    if (error) { 
      toast.error('Gagal menghapus item: ' + error.message) 
    } else { 
      toast.success('Produk berhasil dihapus dari sistem')
      loadProduk(tokoId) 
    }
  }

  function formatHarga(harga: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(harga)
  }

  const tokoAktif = semuaToko.find(t => t.id === tokoId)
  const jenisToko: JenisDaftar = tokoAktif?.jenis || 'toko'
  const tema = CONFIG_TEMA[jenisToko]

  const filteredProduk = produk.filter(p => 
    p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.deskripsi && p.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading && semuaToko.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-slate-200 border-t-slate-800 rounded-full animate-spin mb-3"></div>
        <p className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">Sinkronisasi Etalase Usaha...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="bg-white border-b border-slate-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
          <button onClick={() => navigate('/dashboard')} className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 border border-slate-100 hover:bg-slate-100 transition">←</button>
          <span className="font-black text-slate-900 text-sm tracking-tight">Pusat Inventaris</span>
        </div>
        <div className="max-w-md mx-auto p-6 text-center py-20 bg-white rounded-3xl border border-slate-100 mt-6 shadow-sm">
          <p className="text-4xl mb-3">🛠️</p>
          <p className="text-slate-800 font-black text-sm uppercase tracking-wide">Konfigurasi Terhambat</p>
          <p className="text-slate-400 text-xs mt-1 mb-6 leading-relaxed">{error}</p>
          <button onClick={loadAwal} className="bg-slate-950 text-white text-xs px-6 py-3 rounded-xl font-black uppercase tracking-wider shadow-sm active:scale-95 transition-all">Hubungkan Ulang</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 text-slate-800 font-medium antialiased">
      
      {/* HEADER UTAMA */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm/50 backdrop-blur-md bg-white/95">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 border border-slate-100 hover:bg-slate-100 active:scale-95 transition-all">←</button>
          <div>
            <h1 className="font-black text-slate-900 text-base tracking-tight">Katalog Produk</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Kelola Dagangan Anda</p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/tambah-produk?toko=${tokoId}`)}
          className={`text-xs px-4 py-2.5 rounded-xl font-black uppercase tracking-wider active:scale-95 transition-all shadow-sm ${tema.btn}`}
        >
          + Baru
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 pt-5 space-y-4">
        
        {/* MULTI-STORE MANAGEMENT CAROUSEL */}
        {semuaToko.length > 1 && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-2.5">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest pl-0.5">Pilih Etalase Toko Aktif</p>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {semuaToko.map(t => {
                const isActive = tokoId === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => loadProduk(t.id)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black border transition-all active:scale-95
                      ${isActive ? 'border-slate-950 bg-slate-950 text-white shadow-sm' : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                  >
                    <span>{t.jenis === 'jasa' ? '🛠️' : t.jenis === 'preloved' ? '♻️' : '🏪'}</span>
                    {t.nama}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* SEARCH FILTER INTEGRATION */}
        {produk.length > 0 && (
          <div className="relative">
            <input 
              type="text"
              placeholder={`Cari dari ${produk.length} koleksi produk Anda...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200/80 rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold outline-none focus:border-slate-400 transition-all shadow-inner/5"
            />
            <span className="absolute left-3.5 top-3.5 text-base pointer-events-none opacity-40">🔍</span>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-3.5 text-xs text-slate-400 hover:text-slate-600 font-bold">✕</button>
            )}
          </div>
        )}

        {/* MAIN DISPLAY ZONE */}
        {loading ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Memperbarui List...</p>
          </div>
        ) : filteredProduk.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm px-6">
            <p className="text-5xl mb-4">📦</p>
            <p className="text-slate-800 font-black text-sm uppercase tracking-wide">Katalog Kosong</p>
            <p className="text-slate-400 text-xs mt-1 mb-6 leading-relaxed">
              {searchQuery ? 'Tidak ada produk yang cocok dengan kata kunci Anda.' : 'Usaha hebat dimulai dari satu langkah kecil. Mari unggah menu atau barang dagangan perdana Anda!'}
            </p>
            <button
              onClick={() => searchQuery ? setSearchQuery('') : navigate(`/tambah-produk?toko=${tokoId}`)}
              className={`text-xs px-6 py-3 rounded-xl font-black uppercase tracking-wider active:scale-95 transition-all shadow-md ${tema.btn}`}
            >
              {searchQuery ? 'Reset Pencarian' : '+ Produk Pertama'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProduk.map(p => (
              <div key={p.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm transition-all duration-300">
                {editId === p.id ? (
                  
                  /* MODALISTIC INTEGRATED INLINE EDIT SUITE */
                  <div className="p-5 space-y-4 border-2 border-slate-900 bg-slate-50/20">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Editor Parameter Produk</p>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${tema.badge}`}>Materi Live</span>
                    </div>
                    
                    {/* Image Edit Zone */}
                    <div>
                      <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Visual Komoditas</label>
                      {form.foto_url && (
                        <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-slate-100 mb-2 border border-slate-100">
                          <img src={form.foto_url} alt="Crop preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <label className={`w-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl py-3 text-xs cursor-pointer hover:bg-white transition-all font-bold text-slate-500 ${uploadingFoto ? 'opacity-40 pointer-events-none' : ''}`}>
                        <input type="file" accept="image/*" onChange={handleUploadFoto} disabled={uploadingFoto} className="hidden" />
                        {uploadingFoto ? '⚡ Memproses Gambar...' : '📷 Ganti Foto & Auto Kompres'}
                      </label>
                      {infoFoto && <p className="text-[10px] font-bold text-emerald-600 text-center mt-1">Selesai: {infoFoto}</p>}
                    </div>

                    {/* Text Inputs */}
                    <div>
                      <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Nama Produk / Jasa *</label>
                      <input name="nama" value={form.nama} onChange={handleChange}
                        className={`w-full border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none bg-white transition-all font-semibold ${tema.border}`} />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Nilai Tukar / Harga Jual (Rp) *</label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-sm font-black text-slate-400">Rp</span>
                        <input name="harga" type="number" value={form.harga} onChange={handleChange}
                          className={`w-full border-2 border-slate-100 rounded-xl pl-12 pr-4 py-2.5 text-sm outline-none bg-white font-mono font-bold transition-all ${tema.border}`} />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Deskripsi & Keunggulan</label>
                      <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange} rows={2}
                        className={`w-full border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none bg-white transition-all font-semibold resize-none h-20 ${tema.border}`} />
                    </div>

                    {/* Action Triggers */}
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => handleSave(p.id)} disabled={saving}
                        className={`flex-1 text-xs py-3 rounded-xl font-black uppercase tracking-wider active:scale-95 transition-all ${tema.btn} disabled:opacity-40`}>
                        {saving ? 'Menyimpan...' : 'Simpan'}
                      </button>
                      <button onClick={cancelEdit}
                        className="flex-1 bg-white border border-slate-200 text-slate-600 text-xs py-3 rounded-xl font-black uppercase tracking-wider hover:bg-slate-50 active:scale-95 transition-all">
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  
                  /* STANDARD CARD COMPONENT VIEW */
                  <>
                    {p.foto_url && (
                      <div className="w-full aspect-[16/10] bg-slate-50 overflow-hidden relative border-b border-slate-100">
                        <img src={p.foto_url} alt={p.nama} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <h3 className="font-black text-slate-900 text-sm tracking-tight leading-snug">{p.nama}</h3>
                        <span className="text-sm font-black text-slate-900 whitespace-nowrap bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">{formatHarga(p.harga)}</span>
                      </div>
                      
                      {p.deskripsi && <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1 line-clamp-3">{p.deskripsi}</p>}
                      
                      <div className="flex gap-2 mt-4 pt-3 border-t border-slate-50">
                        <button onClick={() => startEdit(p)}
                          className="flex-1 bg-slate-50 border border-slate-100 text-slate-700 text-xs py-2.5 rounded-xl font-black uppercase tracking-wider hover:bg-slate-100 active:scale-95 transition-all">
                          ⚙️ Ubah Data
                        </button>
                        <button onClick={() => handleHapus(p.id)}
                          className="w-12 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl flex items-center justify-center text-sm active:scale-95 transition-all"
                          title="Hapus Produk">
                          🗑️
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}