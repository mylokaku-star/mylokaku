import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { KATEGORI_TOKO, KATEGORI_JASA } from '../lib/kategori'
import { kompresGambar, validasiGambar, formatUkuran } from '../lib/imageHelper'

type JenisDaftar = 'toko' | 'jasa' | 'preloved'

const TAG_PRELOVED = ['Campuran', 'Pakaian', 'Elektronik', 'Otomotif', 'Furnitur', 'Mainan Anak', 'Buku', 'Gadget', 'Aksesori', 'Lainnya']

const JENIS_CONFIG = {
  toko: { 
    icon: '🏪', label: 'Toko Retail', border: 'border-emerald-500', bg: 'bg-emerald-50/70', text: 'text-emerald-700', focusBorder: 'focus:border-emerald-500',
    btn: 'from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/10' 
  },
  jasa: { 
    icon: '🛠️', label: 'Jasa Panggilan', border: 'border-blue-500', bg: 'bg-blue-50/70', text: 'text-blue-700', focusBorder: 'focus:border-blue-500',
    btn: 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-600/10' 
  },
  preloved: { 
    icon: '♻️', label: 'Bursa Preloved', border: 'border-purple-500', bg: 'bg-purple-50/70', text: 'text-purple-700', focusBorder: 'focus:border-purple-500',
    btn: 'from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 shadow-purple-600/10' 
  },
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
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { navigate('/login'); return }

      const { data: tokoList, error } = await supabase
        .from('toko')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })

      if (error || !tokoList || tokoList.length === 0) {
        toast.error('Unit usaha tidak ditemukan')
        navigate('/buat-toko')
        return
      }

      setSemuaToko(tokoList)

      const tokoIdFromUrl = searchParams.get('toko')
      const tokoTerpilih = tokoList.find(t => t.id === tokoIdFromUrl) || tokoList[0]
      isiFormDariToko(tokoTerpilih)
    } catch {
      toast.error('Gagal mengambil data dari server')
    } finally {
      setLoading(false)
    }
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
    if (data.jenis === 'preloved' && data.tag_barang) {
      setTagPreloved(Array.isArray(data.tag_barang) ? data.tag_barang : [])
    } else {
      setTagPreloved([])
    }
  }

  function pindahToko(t: any) {
    isiFormDariToko(t)
    setInfoFoto('')
    toast.success(`Beralih mengedit: ${t.nama}`)
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
    if (!tokoId) { toast.error('Unit usaha belum termuat sempurna'); return }

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
        if (uploadError) { toast.error('Gagal mengunggah berkas foto'); return }
      
      const { data: urlData } = supabase.storage.from('toko-foto').getPublicUrl(fileName)
      setForm(f => ({ ...f, foto_url: urlData.publicUrl }))
      toast.success('Foto utama berhasil diperbarui!')
    } catch {
      toast.error('Gagal mengompresi gambar')
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
        toast.success('Koordinat presisi berhasil didapatkan!')
      },
      () => { 
        setLoadingLokasi(false)
        toast.error('Akses GPS ditolak. Silakan isi manual koordinat Anda.') 
      }
    )
  }

  async function handleSave() {
    if (!form.nama || !form.alamat) {
      toast.error('Nama entitas dan alamat wajib dilengkapi'); return
    }
    if (jenis !== 'preloved' && !form.kategori) {
      toast.error('Silakan tentukan kategori usaha Anda'); return
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
    if (error) { 
      toast.error('Gagal menyimpan pembaruan: ' + error.message) 
    } else { 
      toast.success('Profil toko berhasil dimutakhirkan!')
      navigate('/dashboard') 
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-[3px] border-slate-200 border-t-slate-800 rounded-full animate-spin mb-3"></div>
      <p className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">Membuka Berkas Lapak...</p>
    </div>
  )

  const cfg = JENIS_CONFIG[jenis]
  const grupList = jenis === 'toko' ? KATEGORI_TOKO : KATEGORI_JASA
  const labelNama = jenis === 'toko' ? 'Nama Toko' : jenis === 'jasa' ? 'Nama / Brand Jasa' : 'Nama Lapak Preloved'
  const labelAlamat = jenis === 'toko' ? 'Alamat Fisik Toko' : jenis === 'jasa' ? 'Cakupan Area Layanan' : 'Lokasi Rumah Penjual'
  const labelDeskripsi = jenis === 'toko' ? 'Deskripsi Utama Toko' : jenis === 'jasa' ? 'Keahlian & Layanan Jasa' : 'Aturan Main & Kondisi Barang'

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 text-slate-800 font-medium antialiased">

      {/* 1. TOP PREMIUM BAR */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 sticky top-0 z-30 shadow-sm/50 backdrop-blur-md bg-white/95">
        <div className="max-w-md mx-auto flex items-center gap-3.5">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 border border-slate-100 hover:bg-slate-100 active:scale-95 transition"
          >
            ←
          </button>
          <div>
            <h1 className="font-black text-slate-900 text-base tracking-tight">Pengaturan Lapak</h1>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Edit {cfg.label}</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-5 space-y-5">

        {/* 2. DYNAMIC STORE SWITCHER (FOR MULTI-STORE MERCHANTS) */}
        {semuaToko.length > 1 && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-2.5">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest pl-0.5">
              Kelola Lapak Lain Milik Anda
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {semuaToko.map(t => {
                const isSelected = tokoId === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => pindahToko(t)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black border transition-all active:scale-95
                      ${isSelected 
                        ? 'border-slate-900 bg-slate-950 text-white shadow-sm' 
                        : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100/70'}`}
                  >
                    <span>{t.jenis === 'jasa' ? '🛠️' : t.jenis === 'preloved' ? '♻️' : '🏪'}</span>
                    {t.nama}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 3. PREMIUM PHOTO HERO CONTAINER */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group">
          {form.foto_url ? (
            <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
              <img src={form.foto_url} alt="Banner Toko" className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
          ) : (
            <div className="w-full h-32 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-4xl shadow-inner">
              {cfg.icon}
            </div>
          )}
          <div className="p-4 space-y-2.5 bg-white">
            <label className={`w-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl py-3.5 text-xs cursor-pointer hover:bg-slate-50 transition-all font-black uppercase tracking-wider text-slate-500 ${uploadingFoto ? 'opacity-40 pointer-events-none' : ''}`}>
              <input type="file" accept="image/*" onChange={handleUploadFoto} disabled={uploadingFoto} className="hidden" />
              {uploadingFoto ? '⏳ Memproses & Mengunggah...' : '📷 Ganti Banner Utama'}
            </label>
            {infoFoto && (
              <div className={`text-[11px] font-black text-center px-3 py-1 rounded-md bg-slate-50 inline-block mx-auto w-full border border-slate-100 ${cfg.text}`}>
                Selesai Dikompresi: {infoFoto}
              </div>
            )}
            <p className="text-[10px] text-slate-400 text-center font-medium">Sistem otomatis mengoptimalkan ukuran gambar demi menghemat kuota</p>
          </div>
        </div>

        {/* 4. REACTIVE MODEL SELECTION */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-3">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest pl-0.5">Klasifikasi Lapak</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(JENIS_CONFIG) as [JenisDaftar, typeof JENIS_CONFIG.toko][]).map(([j, c]) => (
              <button 
                key={j} 
                type="button"
                onClick={() => handleJenisChange(j)}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl border-2 transition-all font-black text-xs ${
                  jenis === j 
                    ? `${c.border} ${c.bg} ${c.text} shadow-sm` 
                    : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200'}`}
              >
                <span className="text-base">{c.icon}</span> 
                <span className="text-[10px] tracking-tight">{j === 'toko' ? 'Retail' : j === 'jasa' ? 'Jasa' : 'Preloved'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 5. MAIN FORM INPUTS */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest pl-0.5">Detail Informasi Utama</p>

          <div>
            <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">{labelNama} *</label>
            <input name="nama" value={form.nama} onChange={handleChange}
              className={`w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm outline-none bg-slate-50/50 transition-all font-semibold ${cfg.focusBorder} focus:bg-white`} />
          </div>

          {/* DYNAMIC COMPONENT: KATEGORI (RETAIL & JASA) */}
          {jenis !== 'preloved' && (
            <div>
              <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">Kategori Utama *</label>
              <select name="kategori" value={form.kategori} onChange={handleChange}
                className={`w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm outline-none bg-slate-50/50 transition-all font-semibold ${cfg.focusBorder} focus:bg-white`}>
                <option value="">Pilih rumpun kategori</option>
                {grupList.map(grup => (
                  <optgroup key={grup.grup} label={`── ${grup.grup}`}>
                    {grup.items.map(item => <option key={item} value={item}>{item}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
          )}

          {/* DYNAMIC COMPONENT: TAGS (PRELOVED) */}
          {jenis === 'preloved' && (
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 block uppercase tracking-wide">
                Fokus Jenis Barang <span className="text-[10px] font-bold text-slate-400 normal-case">(Bisa pilih lebih dari satu)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TAG_PRELOVED.map(tag => {
                  const terpilih = tagPreloved.includes(tag)
                  return (
                    <button key={tag} type="button" onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all active:scale-95
                        ${terpilih
                          ? 'border-purple-400 bg-purple-50 text-purple-700 shadow-sm'
                          : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'}`}>
                      {terpilih ? '✓ ' : ''}{tag}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">{labelAlamat} *</label>
            <input name="alamat" value={form.alamat} onChange={handleChange}
              className={`w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm outline-none bg-slate-50/50 transition-all font-semibold ${cfg.focusBorder} focus:bg-white`} />
          </div>

          <div>
            <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">Nomor WhatsApp Transaksi</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-sm font-bold text-slate-400 pointer-events-none">+62</span>
              <input name="telepon" value={form.telepon} onChange={handleChange} placeholder="8123456789"
                className={`w-full border-2 border-slate-100 rounded-xl pl-14 pr-4 py-3 text-sm outline-none bg-slate-50/50 transition-all font-semibold ${cfg.focusBorder} focus:bg-white`} />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium pl-0.5">Digunakan warga sekitar untuk menanyakan stok atau negosiasi langsung</p>
          </div>

          <div>
            <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">{labelDeskripsi}</label>
            {jenis === 'preloved' && (
              <p className="text-[11px] text-slate-400 mb-2 leading-relaxed font-medium">
                Sebutkan kesepakatan toko (misal: "Hanya COD sekitar komplek", "Bisa nego tipis", dll).
              </p>
            )}
            <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange} rows={3}
              placeholder={
                jenis === 'preloved'
                  ? 'Contoh: Koleksi pribadi terawat, rata-rata mulus 90%. Nego santai via obrolan.'
                  : jenis === 'jasa' ? 'Tulis keahlian, pengalaman kerja, atau garansi pengerjaan jasa Anda...' : 'Tulis jam kerja, keunikan produk, atau info pengiriman...'
              }
              className={`w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm outline-none bg-slate-50/50 transition-all font-semibold resize-none h-24 ${cfg.focusBorder} focus:bg-white`} />
          </div>
        </div>

        {/* 6. IMMERSIVE RADAR LOCATION GEOLOCATION */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-3.5">
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest pl-0.5">Penetapan Titik Radar</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5 pl-0.5">Sesuaikan koordinat agar lapak muncul akurat di perimeter peta warga sekitar</p>
          </div>
          
          <button type="button" onClick={ambilLokasi} disabled={loadingLokasi}
            className={`w-full border-2 border-dashed border-slate-200 text-slate-600 text-xs py-3.5 rounded-2xl font-black uppercase tracking-wider hover:bg-slate-50 transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-inner/50`}>
            {loadingLokasi ? (
              <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            ) : '📍 Perbarui Koordinat via GPS Perangkat'}
          </button>

          {form.lat && form.lng && (
            <div className="text-[10px] font-black text-emerald-600 bg-emerald-50/60 border border-emerald-100 px-3 py-1.5 rounded-xl inline-block w-full text-center tracking-wide">
              ✓ TERPETAKAN: {parseFloat(form.lat).toFixed(6)}, {parseFloat(form.lng).toFixed(6)}
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-1">
              <span className="text-[9px] text-slate-400 font-bold uppercase pl-1 block mb-1">Latitude</span>
              <input name="lat" value={form.lat} onChange={handleChange} placeholder="-6.2088"
                className={`w-full border-2 border-slate-100 rounded-xl px-3 py-2.5 text-xs outline-none bg-slate-50/50 font-mono font-bold ${cfg.focusBorder} focus:bg-white`} />
            </div>
            <div className="flex-1">
              <span className="text-[9px] text-slate-400 font-bold uppercase pl-1 block mb-1">Longitude</span>
              <input name="lng" value={form.lng} onChange={handleChange} placeholder="106.8456"
                className={`w-full border-2 border-slate-100 rounded-xl px-3 py-2.5 text-xs outline-none bg-slate-50/50 font-mono font-bold ${cfg.focusBorder} focus:bg-white`} />
            </div>
          </div>
        </div>

        {/* 7. SUMMIT SAVE BUTTON */}
        <button 
          onClick={handleSave} 
          disabled={saving}
          className={`w-full text-white rounded-2xl py-4 text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-98 disabled:opacity-40 bg-gradient-to-r ${cfg.btn}`}
        >
          {saving ? '⏳ Menyimpan Pembaruan...' : `💾 Simpan Perubahan ${cfg.label}`}
        </button>

      </div>
    </div>
  )
}