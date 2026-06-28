import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { KATEGORI_TOKO, KATEGORI_JASA } from '../lib/kategori'

type JenisDaftar = 'toko' | 'jasa' | 'preloved'
type HariKey = 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu'

interface JamHari { buka: boolean; jamBuka: string; jamTutup: string }
type JamOperasional = Record<HariKey, JamHari>

const HARI_LIST: { key: HariKey; label: string }[] = [
  { key: 'senin', label: 'Sen' }, { key: 'selasa', label: 'Sel' },
  { key: 'rabu', label: 'Rab' }, { key: 'kamis', label: 'Kam' },
  { key: 'jumat', label: 'Jum' }, { key: 'sabtu', label: 'Sab' },
  { key: 'minggu', label: 'Min' },
]

const JAM_DEFAULT: JamHari = { buka: true, jamBuka: '08:00', jamTutup: '17:00' }

function buatJamDefault(): JamOperasional {
  return {
    senin: { ...JAM_DEFAULT }, selasa: { ...JAM_DEFAULT }, rabu: { ...JAM_DEFAULT },
    kamis: { ...JAM_DEFAULT }, jumat: { ...JAM_DEFAULT }, sabtu: { ...JAM_DEFAULT },
    minggu: { buka: false, jamBuka: '08:00', jamTutup: '17:00' },
  }
}

function standarisasiNomorWA(nomor: string) {
  let bersih = nomor.replace(/\D/g, '')
  if (bersih.startsWith('0')) {
    bersih = '62' + bersih.slice(1)
  } else if (bersih.startsWith('8')) {
    bersih = '62' + bersih
  }
  return bersih
}

interface SertifikatItem { id: string; judul: string; institusi: string; tahun: string }

const TAG_PRELOVED = ['Campuran', 'Pakaian', 'Elektronik', 'Otomotif', 'Furnitur', 'Mainan Anak', 'Buku', 'Gadget', 'Aksesori', 'Lainnya']

async function daftarkanNotifikasiJam(tokoId: string, namaT: string, jamOps: JamOperasional) {
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') await Notification.requestPermission()
  if (Notification.permission !== 'granted') return
  const jadwal = { tokoId, nama: namaT, jamOps, terdaftar: Date.now() }
  const existing = JSON.parse(localStorage.getItem('lokaku_notif_jadwal') || '[]')
  existing.push(jadwal)
  localStorage.setItem('lokaku_notif_jadwal', JSON.stringify(existing))
  const hariMap: HariKey[] = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']
  const hariHariIni = hariMap[new Date().getDay()]
  const jamHariIni = jamOps[hariHariIni]
  if (!jamHariIni.buka) return
  function jadwalkanNotif(jamStr: string, pesan: string) {
    const [h, m] = jamStr.split(':').map(Number)
    const waktu = new Date(); waktu.setHours(h, m, 0, 0)
    const selisih = waktu.getTime() - Date.now()
    if (selisih > 0) setTimeout(() => new Notification(`🏪 ${namaT}`, { body: pesan, icon: '/icon-192x192.png', tag: `lokaku-${tokoId}-${jamStr}` }), selisih)
  }
  jadwalkanNotif(jamHariIni.jamBuka, `Sekarang waktunya BUKA toko! (${jamHariIni.jamBuka})`)
  jadwalkanNotif(jamHariIni.jamTutup, `Waktunya TUTUP toko. (${jamHariIni.jamTutup})`)
}

export default function BuatTokoPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingLokasi, setLoadingLokasi] = useState(false)
  const [jenis, setJenis] = useState<JenisDaftar>('toko')
  const [form, setForm] = useState({ nama: '', deskripsi: '', kategori: '', alamat: '', telepon: '', lat: '', lng: '' })
  const [tagPreloved, setTagPreloved] = useState<string[]>([])
  const [jamOps, setJamOps] = useState<JamOperasional>(buatJamDefault())
  const [hariDipilih, setHariDipilih] = useState<HariKey>('senin')
  const [notifJam, setNotifJam] = useState(true)
  const [sertifikatList, setSertifikatList] = useState<SertifikatItem[]>([])
  const [pengalaman, setPengalaman] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleJenisChange(j: JenisDaftar) {
    setJenis(j); setForm(f => ({ ...f, kategori: '' })); setTagPreloved([])
  }

  function toggleTag(tag: string) {
    setTagPreloved(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  function ambilLokasi() {
    setLoadingLokasi(true)
    navigator.geolocation.getCurrentPosition(
      pos => { 
        setForm(f => ({ ...f, lat: pos.coords.latitude.toString(), lng: pos.coords.longitude.toString() }))
        setLoadingLokasi(false)
        toast.success('Lokasi GPS berhasil dikunci!') 
      },
      () => { 
        setLoadingLokasi(false)
        toast.error('Gagal mengambil lokasi. Pastikan setelan GPS HP Anda sudah aktif.') 
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  function toggleHariBuka(hari: HariKey) {
    setJamOps(prev => ({ ...prev, [hari]: { ...prev[hari], buka: !prev[hari].buka } }))
  }

  function setJam(hari: HariKey, field: 'jamBuka' | 'jamTutup', val: string) {
    setJamOps(prev => ({ ...prev, [hari]: { ...prev[hari], [field]: val } }))
  }

  function aturBuka24Jam(hari: HariKey) {
    setJamOps(prev => ({ ...prev, [hari]: { ...prev[hari], buka: true, jamBuka: '00:00', jamTutup: '23:59' } }))
    toast.success('Disetel Buka 24 Jam untuk hari ini')
  }

  function salinKeSemua(hari: HariKey) {
    const src = jamOps[hari]
    const update: Partial<JamOperasional> = {}
    HARI_LIST.forEach(h => { if (h.key !== hari) update[h.key] = { ...src } })
    setJamOps(prev => ({ ...prev, ...update }))
    toast.success('Jadwal jam berhasil disalin ke semua hari!')
  }

  function tambahSertifikat() {
    setSertifikatList(prev => [...prev, { id: crypto.randomUUID(), judul: '', institusi: '', tahun: '' }])
  }

  function updateSertifikat(id: string, field: keyof Omit<SertifikatItem, 'id'>, val: string) {
    setSertifikatList(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s))
  }

  function hapusSertifikat(id: string) {
    setSertifikatList(prev => prev.filter(s => s.id !== id))
  }

  async function handleSubmit() {
    if (!form.nama || !form.alamat) { toast.error('Nama lapak/usaha dan alamat lengkap wajib diisi'); return }
    if (jenis !== 'preloved' && !form.kategori) { toast.error('Silakan pilih kategori usaha Anda'); return }
    if (!form.lat || !form.lng) { toast.error('Mohon klik tombol "Ambil Lokasi GPS" agar pelanggan bisa mencari Anda di peta'); return }

    setLoading(true)

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      toast.error('Sesi masuk habis, silakan login kembali')
      setLoading(false); navigate('/login'); return
    }

    const { count } = await supabase
      .from('toko')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userData.user.id)

    if ((count || 0) >= 3) {
      toast.error('Batas maksimal pembuatan lapak tercapai (Maksimal 3 usaha per akun).')
      setLoading(false)
      return
    }

    const nomorWaBersih = form.telepon ? standarisasiNomorWA(form.telepon) : null

    const payload: Record<string, unknown> = {
      nama: form.nama,
      deskripsi: form.deskripsi || null,
      kategori: jenis === 'preloved' ? (tagPreloved.length > 0 ? tagPreloved.join(', ') : 'Campuran') : form.kategori,
      jenis,
      alamat: form.alamat,
      telepon: nomorWaBersih,
      lat: parseFloat(form.lat),
      lng: parseFloat(form.lng),
      user_id: userData.user.id,
      is_buka: false,
    }

    if (jenis === 'toko') payload.jam_operasional = jamOps
    if (jenis === 'jasa') {
      const sertValid = sertifikatList.filter(s => s.judul.trim())
      payload.sertifikat = sertValid.length > 0 ? sertValid : null
      payload.pengalaman = pengalaman.trim() || null
    }
    if (jenis === 'preloved') {
      payload.tag_barang = tagPreloved.length > 0 ? tagPreloved : null
    }

    const { data: insertedData, error } = await supabase.from('toko').insert(payload).select('id').single()
    setLoading(false)

    if (error) {
      toast.error('Gagal menyimpan pendaftaran: ' + error.message)
    } else {
      const msg = jenis === 'toko' ? 'Toko berhasil ditambahkan ke peta!' : jenis === 'jasa' ? 'Profil Penyedia Jasa berhasil dibuat!' : 'Lapak Barang Bekas berhasil dibuka!'
      toast.success(msg)
      if (jenis === 'toko' && notifJam && insertedData?.id) {
        await daftarkanNotifikasiJam(insertedData.id, form.nama, jamOps)
      }
      navigate('/dashboard')
    }
  }

  const grupList = jenis === 'toko' ? KATEGORI_TOKO : KATEGORI_JASA
  const jenisConfig = {
    toko:     { icon: '🏪', label: 'Toko Fisik',    sub: 'Warung, outlet, kios',  border: 'border-emerald-500 focus:border-emerald-500',  bg: 'bg-emerald-50',  text: 'text-emerald-700',  btn: 'from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-100',  infoBg: 'bg-emerald-50',  infoText: 'text-emerald-800' },
    jasa:     { icon: '🛠️', label: 'Layanan Jasa',   sub: 'Solusi keahlian/jasa', border: 'border-blue-500 focus:border-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-700',   btn: 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-100',   infoBg: 'bg-blue-50',   infoText: 'text-blue-800' },
    preloved: { icon: '♻️', label: 'Barang Bekas', sub: 'Jual koleksi pribadi', border: 'border-purple-500 focus:border-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', btn: 'from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-purple-100', infoBg: 'bg-purple-50', infoText: 'text-purple-800' },
  }
  const cfg = jenisConfig[jenis]
  const hariDipilihData = jamOps[hariDipilih]
  const jumlahHariBuka = HARI_LIST.filter(h => jamOps[h.key].buka).length
  const namaHariMap: Record<HariKey, string> = { senin:'Senin', selasa:'Selasa', rabu:'Rabu', kamis:'Kamis', jumat:'Jumat', sabtu:'Sabtu', minggu:'Minggu' }

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-medium text-slate-800 antialiased">

      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-30 shadow-sm/50">
        <button onClick={() => navigate('/dashboard')} className="w-9 h-9 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition">←</button>
        <div>
          <h1 className="font-black text-slate-900 text-base tracking-tight">Daftarkan Lapak Baru</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Maksimal 3 Profil Usaha per Akun</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-5 space-y-4">

        {/* Pemilihan Tipe Utama */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-3 pl-1">Jenis Layanan / Usaha</p>
          <div className="grid grid-cols-3 gap-2">
            {(['toko', 'jasa', 'preloved'] as JenisDaftar[]).map(j => {
              const c = jenisConfig[j]
              return (
                <button key={j} type="button" onClick={() => handleJenisChange(j)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl border-2 transition-all font-black text-[11px] ${jenis === j ? `${c.border} ${c.bg} ${c.text}` : 'border-slate-100 bg-slate-50/50 text-slate-400'}`}>
                  <span className="text-xl mb-0.5">{c.icon}</span>
                  <span>{c.label}</span>
                  <span className="font-semibold opacity-60 text-[9px] text-center leading-tight">{c.sub}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Dynamic Context Hint Banner */}
        <div className={`rounded-2xl px-4 py-3 border flex items-start gap-3 ${cfg.infoBg} border-current/10`}>
          <span className="text-xl leading-none mt-0.5">{cfg.icon}</span>
          <p className={`text-xs leading-relaxed font-semibold ${cfg.infoText}`}>
            {jenis === 'toko' ? 'Sangat cocok untuk warung kelontong, kedai makan, counter HP, grosir, atau kios fisik yang melayani pembeli di lokasi.'
            : jenis === 'jasa' ? 'Cocok untuk montir panggil, sol sepatu, kurir lokal, pangkas rambut, laundry, pembantu harian, atau guru les.'
            : 'Saring barang lemari Anda! Jual baju bekas layak pakai, perabotan rumah tangga, buku, atau motor pribadi ke tetangga terdekat.'}
          </p>
        </div>

        {/* Form Input Isian */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider border-b border-slate-50 pb-2">Informasi Profil Usaha</p>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              {jenis === 'toko' ? 'Nama Toko / Lapak' : jenis === 'jasa' ? 'Nama Layanan / Keahlian' : 'Nama Lapak Preloved'} <span className="text-red-500">*</span>
            </label>
            <input name="nama" value={form.nama} onChange={handleChange}
              placeholder={jenis === 'toko' ? 'Contoh: Warung Berkah Sembako' : jenis === 'jasa' ? 'Contoh: Servis AC & Kulkas Panggilan' : 'Contoh: Preloved Branded Kak Siska'}
              className={`w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-${jenis === 'toko' ? 'emerald' : jenis === 'jasa' ? 'blue' : 'purple'}-500 bg-slate-50/50 transition-all`} />
          </div>

          {jenis !== 'preloved' && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Pilih Kategori Bidang Usaha <span className="text-red-500">*</span></label>
              <select name="kategori" value={form.kategori} onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-500 bg-slate-50/50 transition-all appearance-none cursor-pointer">
                <option value="">-- Ketuk untuk memilih kategori --</option>
                {grupList.map(grup => (
                  <optgroup key={grup.grup} label={`📁 Kategori: ${grup.grup}`}>
                    {grup.items.map(item => <option key={item} value={item}>{item}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
          )}

          {jenis === 'preloved' && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Kategori Jenis Barang Bekas <span className="text-slate-400 font-semibold">(Bisa pilih lebih dari satu)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TAG_PRELOVED.map(tag => {
                  const isSelected = tagPreloved.includes(tag)
                  return (
                    <button key={tag} type="button" onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${isSelected ? 'border-purple-500 bg-purple-50 text-purple-700 font-black' : 'border-slate-100 bg-slate-50/50 text-slate-500 hover:bg-slate-100'}`}>
                      {isSelected ? '✓ ' : ''}{tag}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              {jenis === 'toko' ? 'Alamat Lengkap Toko' : jenis === 'jasa' ? 'Pusat Operasional / Jangkauan Area' : 'Lokasi Rumah Penjual'} <span className="text-red-500">*</span>
            </label>
            <input name="alamat" value={form.alamat} onChange={handleChange}
              placeholder={jenis === 'toko' ? 'Contoh: Jl. Anggrek No. 12, RT 02/05' : jenis === 'jasa' ? 'Contoh: Menerima area Kecamatan Sukasari & sekitarnya' : 'Contoh: Kompleks Perumahan Citra Blok C-3'}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-500 bg-slate-50/50 transition-all" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Nomor WhatsApp Usaha <span className="text-slate-400 font-semibold">(Otomatis Terhubung)</span></label>
            <input name="telepon" value={form.telepon} onChange={handleChange} placeholder="Contoh: 08123456789"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-500 bg-slate-50/50 font-mono transition-all" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Deskripsi Tambahan / Pengumuman Lapak</label>
            <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange} rows={3}
              placeholder={
                jenis === 'preloved'
                  ? 'Contoh: "Baju koleksi pribadi, ukuran L, kondisi mulus 90%. Bisa COD di depan minimarket perumahan."'
                  : jenis === 'toko' ? 'Contoh: "Menyediakan aneka sembako murah, tabung gas LPG harian, galon, telur segar..."'
                  : 'Contoh: "Melayani cuci AC kilat, isi freon, bongkar pasang AC rumah. Jujur & bergaransi 1 bulan."'
              }
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-500 bg-slate-50/50 transition-all resize-none" />
          </div>
        </div>

        {/* PENYETINGAN JAM OPERASIONAL (KHUSUS TOKO) */}
        {jenis === 'toko' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Jadwal Buka Tutup</p>
                <p className="text-xs text-slate-500 font-bold mt-0.5">Terpilih {jumlahHariBuka} Hari Kerja</p>
              </div>
              <span className="text-xl">🕐</span>
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {HARI_LIST.map(h => {
                const isBuka = jamOps[h.key].buka
                const isSelected = hariDipilih === h.key
                return (
                  <button key={h.key} type="button" onClick={() => setHariDipilih(h.key)}
                    className={`flex-1 min-w-[46px] py-2 rounded-xl text-xs font-black transition-all border ${isSelected ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : isBuka ? 'border-slate-200 bg-white text-slate-700' : 'border-slate-100 bg-slate-100/50 text-slate-300 line-through'}`}>
                    {h.label}
                  </button>
                )
              })}
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800">Hari {namaHariMap[hariDipilih]}</span>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => aturBuka24Jam(hariDipilih)}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:border-emerald-300 transition-all">
                    🏪 24 Jam
                  </button>
                  <button type="button" onClick={() => toggleHariBuka(hariDipilih)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all border ${hariDipilihData.buka ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-200 text-slate-400 border-slate-300'}`}>
                    {hariDipilihData.buka ? 'Buka' : 'Libur'}
                  </button>
                </div>
              </div>
              
              {hariDipilihData.buka && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-[9px] text-slate-400 font-bold block mb-0.5">Jam Buka</label>
                      <input type="time" value={hariDipilihData.jamBuka} onChange={e => setJam(hariDipilih, 'jamBuka', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs font-bold outline-none bg-white text-slate-800" />
                    </div>
                    <span className="text-slate-300 font-bold mt-3">→</span>
                    <div className="flex-1">
                      <label className="text-[9px] text-slate-400 font-bold block mb-0.5">Jam Tutup</label>
                      <input type="time" value={hariDipilihData.jamTutup} onChange={e => setJam(hariDipilih, 'jamTutup', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs font-bold outline-none bg-white text-slate-800" />
                    </div>
                  </div>
                  <button type="button" onClick={() => salinKeSemua(hariDipilih)}
                    className="w-full text-[10px] text-emerald-600 font-black py-1.5 rounded-xl border border-dashed border-emerald-300 hover:bg-emerald-100/50 transition-all">
                    📋 Samakan semua jam operasional hari lain
                  </button>
                </div>
              )}
            </div>

            <button type="button" onClick={() => setNotifJam(v => !v)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all text-left ${notifJam ? 'border-emerald-100 bg-emerald-50/50' : 'border-slate-100 bg-slate-50/50'}`}>
              <span className="text-xl">{notifJam ? '🔔' : '🔕'}</span>
              <div className="flex-1">
                <p className={`text-xs font-black ${notifJam ? 'text-emerald-800' : 'text-slate-400'}`}>Pengingat Otomatis Alarm Toko</p>
                <p className={`text-[10px] mt-0.5 ${notifJam ? 'text-emerald-600' : 'text-slate-300'}`}>Kirim notifikasi ke HP saat masuk waktu operasional toko Anda.</p>
              </div>
            </button>
          </div>
        )}

        {/* VERIFIKASI SERTIFIKAT (KHUSUS PENYEDIA JASA) */}
        {jenis === 'jasa' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Portofolio & Pengalaman</p>
                <p className="text-xs text-slate-500 font-bold mt-0.5">Opsional (Meningkatkan Kredibilitas)</p>
              </div>
              <span className="text-xl">🏅</span>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Riwayat Singkat Pengalaman Kerja</label>
              <textarea value={pengalaman} onChange={e => setPengalaman(e.target.value)} rows={2}
                placeholder="Contoh: Sudah berpengalaman lebih dari 5 tahun di bidang konstruksi kelistrikan perumahan..."
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-blue-400 bg-slate-50/50 transition-all resize-none" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700">Piagam / Sertifikasi Keahlian</label>
                <button type="button" onClick={tambahSertifikat}
                  className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-xl border border-blue-200 hover:bg-blue-100 transition-all">
                  + Tambah Data
                </button>
              </div>
              {sertifikatList.length === 0 && (
                <div className="border border-dashed border-slate-100 rounded-2xl py-6 text-center text-xs text-slate-300 font-semibold">
                  Belum melampirkan sertifikat keahlian resmi.
                </div>
              )}
              <div className="space-y-2">
                {sertifikatList.map((s, i) => (
                  <div key={s.id} className="bg-blue-50/40 border border-blue-100 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-blue-600 uppercase">Sertifikat #{i + 1}</span>
                      <button type="button" onClick={() => hapusSertifikat(s.id)} className="text-[10px] text-red-500 hover:text-red-700 font-bold">Hapus</button>
                    </div>
                    <input value={s.judul} onChange={e => updateSertifikat(s.id, 'judul', e.target.value)}
                      placeholder="Nama Sertifikasi (Contoh: Ahli K3 Listrik madya)"
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs font-bold outline-none bg-white" />
                    <div className="flex gap-2">
                      <input value={s.institusi} onChange={e => updateSertifikat(s.id, 'institusi', e.target.value)}
                        placeholder="Lembaga Penerbit (BNSP / LPK)"
                        className="flex-1 border border-slate-200 rounded-lg p-2 text-xs font-bold outline-none bg-white" />
                      <input value={s.tahun} onChange={e => updateSertifikat(s.id, 'tahun', e.target.value)}
                        placeholder="Tahun" maxLength={4}
                        className="w-16 border border-slate-200 rounded-lg p-2 text-xs font-bold outline-none bg-white text-center font-mono" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* KOORDINAT LOKASI PEMETAAN GPS */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-2.5">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider pl-1">Penanda Titik Lokasi Peta *</p>
          <button type="button" onClick={ambilLokasi} disabled={loadingLokasi}
            className={`w-full border-2 border-dashed text-sm py-3.5 rounded-2xl font-black transition-all flex items-center justify-center gap-2 ${form.lat && form.lng ? 'border-emerald-500 bg-emerald-50/20 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
            <span>{loadingLokasi ? '🔄 Menghubungkan Satelit...' : '📍 Ambil Titik Lokasi GPS Otomatis'}</span>
          </button>
          
          {form.lat && form.lng ? (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl px-3 py-2 flex items-center justify-between text-[11px] text-emerald-800 font-semibold font-mono animate-fade-in">
              <span>Akurasi Kunci GPS Terdeteksi:</span>
              <span>{parseFloat(form.lat).toFixed(4)}, {parseFloat(form.lng).toFixed(4)}</span>
            </div>
          ) : (
            <p className="text-[10px] text-slate-400 text-center leading-relaxed font-semibold px-2">
              Penting: Klik tombol di atas saat Anda sedang berada di dekat/lokasi tempat jualan agar peta koordinat pelanggan akurat.
            </p>
          )}
        </div>

        {/* TOMBOL SUBMIT PENDAFTARAN */}
        <button onClick={handleSubmit} disabled={loading}
          className={`w-full text-white rounded-2xl py-4 text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-[0.99] disabled:opacity-50 bg-gradient-to-r ${cfg.btn}`}>
          {loading ? 'Sedang Memproses Lapak...' : `${cfg.icon} Konfirmasi Pendaftaran Lapak`}
        </button>

      </div>
    </div>
  )
}