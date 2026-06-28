import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

type JenisPromo = 'promo' | 'event'

const CONFIG_KONTEN = {
  promo: {
    icon: '🔥',
    label: 'Promo / Diskon Kilat',
    desc: 'Sangat cocok untuk cuci gudang, diskon musiman, atau menu bundling penarik pelanggan baru.',
    border: 'border-amber-500',
    bg: 'bg-amber-50/70',
    text: 'text-amber-700',
    focus: 'focus:border-amber-500'
  },
  event: {
    icon: '🎪',
    label: 'Event / Agenda Khusus',
    desc: 'Gunakan jika Anda mengadakan bazar fisik, live music, grand opening, atau workshop interaktif.',
    border: 'border-indigo-500',
    bg: 'bg-indigo-50/70',
    text: 'text-indigo-700',
    focus: 'focus:border-indigo-500'
  }
}

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
      toast.error('Batas maksimal ukuran berkas gambar adalah 5MB')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      toast.error('Gunakan format berkas standar: JPG, PNG, atau WebP')
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handleSubmit() {
    if (!form.toko_id) { toast.error('Silakan tentukan lapak/usaha Anda'); return }
    if (!form.judul) { toast.error('Tuliskan judul penawaran menarik Anda'); return }
    if (!form.tanggal_mulai || !form.tanggal_berakhir) { toast.error('Tentukan durasi periode penayangan'); return }
    if (form.tanggal_berakhir < form.tanggal_mulai) { toast.error('Tanggal penutupan tidak boleh mendahului tanggal mulai'); return }
    if (!file) { toast.error('Unggah brosur atau foto promo wajib dipenuhi'); return }

    setLoading(true)

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { toast.error('Sesi berakhir, silakan login kembali'); setLoading(false); return }

      const ext = file.name.split('.').pop()
      const fileName = `${userData.user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('promo-foto')
        .upload(fileName, file, { upsert: false })

      if (uploadError) {
        toast.error('Gagal mengunggah materi promo: ' + uploadError.message)
        setLoading(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('promo-foto')
        .getPublicUrl(fileName)

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
        toast.error('Gagal memproses pengajuan: ' + error.message)
      } else {
        toast.success('Campaign berhasil didaftarkan! Bersiaplah kebanjiran pelanggan. 🎉')
        navigate('/dashboard')
      }
    } catch {
      toast.error('Terjadi gangguan jaringan, silakan coba beberapa saat lagi.')
    } finally {
      setLoading(false)
    }
  }

  const tokoTerpilih = tokoList.find(t => t.id === form.toko_id)
  const activeCfg = CONFIG_KONTEN[form.jenis]

  if (loadingToko) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-[3px] border-slate-200 border-t-amber-500 rounded-full animate-spin mb-3"></div>
      <p className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">Membuka Dashboard Pemasaran...</p>
    </div>
  )

  if (tokoList.length === 0) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-4xl mb-4 border border-amber-100 shadow-sm">🏪</div>
      <h2 className="font-black text-slate-900 text-lg mb-1.5">Langkah Anda Sedikit Lagi!</h2>
      <p className="text-xs text-slate-400 max-w-xs mb-6 leading-relaxed">Sebelum bisa menyebarkan brosur promo berdaya jangkau luas, Anda wajib mendaftarkan badan usaha atau jasa Anda terlebih dahulu.</p>
      <button onClick={() => navigate('/buat-toko')}
        className="bg-slate-900 text-white font-black px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider hover:bg-slate-800 shadow-md active:scale-95 transition-all">
        Daftarkan Usaha Saya Sekarang
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 text-slate-800 font-medium antialiased">

      {/* HEADER BANNER */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 sticky top-0 z-30 shadow-sm/50 backdrop-blur-md bg-white/95">
        <div className="max-w-md mx-auto flex items-center gap-3.5">
          <button onClick={() => navigate('/dashboard')}
            className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 border border-slate-100 hover:bg-slate-100 active:scale-95 transition">←</button>
          <div>
            <h1 className="font-black text-slate-900 text-base tracking-tight">Ledakkan Omzet Penjualan</h1>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Sistem Pemasaran Geofencing Radius 10 KM</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-5 space-y-5">

        {/* REFRAMED VALUE PROP CARD */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent border border-amber-200/60 rounded-3xl p-4 flex gap-3.5 shadow-sm">
          <span className="text-2xl mt-0.5 animate-bounce">🚀</span>
          <div>
            <p className="text-xs font-black text-amber-900 uppercase tracking-wide">Premium Spotlight Booster</p>
            <p className="text-[11px] text-amber-800/90 mt-1 leading-relaxed">
              Dapatkan eksposur maksimal di radar aplikasi warga! Tim akselerasi pasar kami akan segera menghubungi Anda via <strong>WhatsApp</strong> setelah formulir dikirim guna validasi kilat dan aktivasi instan banner Anda.
            </p>
          </div>
        </div>

        {/* SELECT KONTEN TYPE */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-3">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest pl-0.5">Pilih Strategi Pemasaran</p>
          <div className="grid grid-cols-2 gap-3">
            {((['promo', 'event'] as JenisPromo[])).map(j => {
              const item = CONFIG_KONTEN[j]
              const active = form.jenis === j
              return (
                <button key={j} type="button"
                  onClick={() => setForm(f => ({ ...f, jenis: j }))}
                  className={`flex flex-col items-center gap-1.5 py-4 px-3 rounded-2xl border-2 transition-all active:scale-97 text-center
                    ${active ? `${item.border} ${item.bg} ${item.text} shadow-sm font-black` : 'border-slate-100 bg-slate-50/50 text-slate-400'}`}>
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-xs tracking-tight">{j === 'promo' ? 'Diskon / Voucher' : 'Agenda / Event'}</span>
                </button>
              )
            })}
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed text-center px-2 mt-1">
            {activeCfg.desc}
          </p>
        </div>

        {/* INPUT FORM FIELDS */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest pl-0.5">Detail Materi Promosi</p>

          {/* Selector Toko */}
          {tokoList.length > 1 && (
            <div>
              <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">Pilih Lapak Yang Dipromosikan *</label>
              <select name="toko_id" value={form.toko_id} onChange={handleChange}
                className={`w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm outline-none bg-slate-50/50 transition-all font-semibold ${activeCfg.focus} focus:bg-white`}>
                {tokoList.map(t => (
                  <option key={t.id} value={t.id}>{t.nama} ({t.jenis.toUpperCase()})</option>
                ))}
              </select>
            </div>
          )}

          {tokoList.length === 1 && (
            <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3.5 border border-slate-100">
              <span className="text-xl">🏪</span>
              <div>
                <p className="text-xs font-black text-slate-800 tracking-tight">{tokoTerpilih?.nama}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Identitas Lapak Penyelenggara</p>
              </div>
            </div>
          )}

          {/* Judul Campaign */}
          <div>
            <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">
              Judul Utama Pemikat Calon Pembeli *
            </label>
            <input name="judul" value={form.judul} onChange={handleChange}
              placeholder={form.jenis === 'promo' ? 'Contoh: Gajian Sale: Diskon Kilat 50% Khusus Hari Ini!' : 'Contoh: Bazar Kuliner Ramadan Komplek 2026'}
              className={`w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm outline-none bg-slate-50/50 transition-all font-semibold ${activeCfg.focus} focus:bg-white`} />
            <p className="text-[9px] text-slate-400 mt-1 pl-0.5">Gunakan kata berenergi: *Diskon, Gratis Ongkir, Hanya Hari Ini, Cuci Gudang*</p>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">Keterangan / Syarat & Ketentuan</label>
            <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange} rows={3}
              placeholder={form.jenis === 'promo' ? 'Contoh: Berlaku dine-in/takeaway, minimal transaksi Rp 50rb. Tunjukkan banner ini ke kasir.' : 'Contoh: Terbuka untuk umum, pendaftaran gratis via WhatsApp, ada doorprize total jutaan rupiah!'}
              className={`w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm outline-none bg-slate-50/50 transition-all font-semibold resize-none h-24 ${activeCfg.focus} focus:bg-white`} />
          </div>

          {/* Durasi Tanggal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">Mulai Tayang *</label>
              <input type="date" name="tanggal_mulai" value={form.tanggal_mulai} onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full border-2 border-slate-100 rounded-xl px-3 py-3 text-xs outline-none bg-slate-50/50 transition-all font-bold ${activeCfg.focus} focus:bg-white`} />
            </div>
            <div>
              <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">Selesai Tayang *</label>
              <input type="date" name="tanggal_berakhir" value={form.tanggal_berakhir} onChange={handleChange}
                min={form.tanggal_mulai || new Date().toISOString().split('T')[0]}
                className={`w-full border-2 border-slate-100 rounded-xl px-3 py-3 text-xs outline-none bg-slate-50/50 transition-all font-bold ${activeCfg.focus} focus:bg-white`} />
            </div>
          </div>
        </div>

        {/* UPLOAD FLYER PROMO WITH LIVE VISUAL PREVIEW MOCKUP */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-3">
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest pl-0.5">Desain Brosur Digital *</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5 pl-0.5">Rasio ideal landscape 2:1 (Contoh: 1200×628px) maks. 5MB</p>
          </div>

          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
            onChange={handleFile} className="hidden" />

          {preview ? (
            <div className="space-y-2">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block pl-0.5">Simulasi Tampilan Brosur Anda:</span>
              <div className="relative rounded-2xl overflow-hidden aspect-[2/1] bg-slate-100 shadow-inner group border border-slate-100">
                <img src={preview} alt="Preview Ads" className="w-full h-full object-cover" />
                <button type="button"
                  onClick={() => { setPreview(null); setFile(null); if (fileRef.current) fileRef.current.value = '' }}
                  className="absolute top-2.5 right-2.5 w-8 h-8 bg-black/60 backdrop-blur-md text-white rounded-xl flex items-center justify-center text-xs hover:bg-black/80 transition-all">
                  ✕
                </button>
              </div>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full text-xs font-bold text-slate-400 py-1.5 border border-slate-100 rounded-xl bg-slate-50 hover:bg-slate-100 hover:text-slate-600 transition-all">
                Ganti Desain Brosur
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-200 rounded-2xl py-8 flex flex-col items-center gap-2 hover:bg-slate-50/80 transition-all bg-slate-50/30 group">
              <span className="text-3xl group-hover:scale-110 transition-transform">🖼️</span>
              <span className="text-xs font-black text-slate-600 uppercase tracking-wide">Klik & Unggah Pamflet Promo</span>
              <span className="text-[10px] text-slate-300 font-medium">Mendukung file JPG, PNG, WebP</span>
            </button>
          )}
        </div>

        {/* AUDIENCE RADAR INFO COMPONENT */}
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl px-4 py-3.5 flex gap-3 shadow-inner/50">
          <span className="text-xl mt-0.5">🎯</span>
          <p className="text-[11px] text-emerald-800 leading-relaxed font-semibold">
            <strong>Radius Geo-Radar Aktif:</strong> Penawaran spektakuler Anda akan otomatis dikunci dan dipancarkan ke radar lingkaran pembeli sejauh <strong>10 kilometer</strong> dari titik maps Anda!
          </p>
        </div>

        {/* SUBMIT */}
        <button onClick={handleSubmit} disabled={loading}
          className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 text-white rounded-2xl py-4 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-500/10 active:scale-98 disabled:opacity-50">
          {loading ? '🚀 Membuka Jalur Radar...' : `⚡ Tayangkan ${form.jenis === 'promo' ? 'Promo Menarik' : 'Event Seru'} Ini`}
        </button>

      </div>
    </div>
  )
}