import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { KATEGORI_TOKO, KATEGORI_JASA, KATEGORI_PRELOVED } from '../lib/kategori'

type JenisDaftar = 'toko' | 'jasa' | 'preloved'

type HariKey = 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu'

interface JamHari {
  buka: boolean
  jamBuka: string
  jamTutup: string
}

type JamOperasional = Record<HariKey, JamHari>

const HARI_LIST: { key: HariKey; label: string }[] = [
  { key: 'senin', label: 'Sen' },
  { key: 'selasa', label: 'Sel' },
  { key: 'rabu', label: 'Rab' },
  { key: 'kamis', label: 'Kam' },
  { key: 'jumat', label: 'Jum' },
  { key: 'sabtu', label: 'Sab' },
  { key: 'minggu', label: 'Min' },
]

const JAM_DEFAULT: JamHari = { buka: true, jamBuka: '08:00', jamTutup: '17:00' }

function buatJamDefault(): JamOperasional {
  return {
    senin: { ...JAM_DEFAULT },
    selasa: { ...JAM_DEFAULT },
    rabu: { ...JAM_DEFAULT },
    kamis: { ...JAM_DEFAULT },
    jumat: { ...JAM_DEFAULT },
    sabtu: { ...JAM_DEFAULT },
    minggu: { buka: false, jamBuka: '08:00', jamTutup: '17:00' },
  }
}

interface SertifikatItem {
  id: string
  judul: string
  institusi: string
  tahun: string
}

async function daftarkanNotifikasiJam(
  tokoId: string,
  namaT: string,
  jamOps: JamOperasional
) {
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') {
    await Notification.requestPermission()
  }
  if (Notification.permission !== 'granted') return

  // Simpan jadwal notifikasi ke localStorage agar bisa di-restore
  const jadwal = { tokoId, nama: namaT, jamOps, terdaftar: Date.now() }
  const existing = JSON.parse(localStorage.getItem('lokaku_notif_jadwal') || '[]')
  existing.push(jadwal)
  localStorage.setItem('lokaku_notif_jadwal', JSON.stringify(existing))

  // Jadwalkan untuk hari ini jika jam belum lewat
  const sekarang = new Date()
  const hariIdx = sekarang.getDay() // 0=minggu
  const hariMap: HariKey[] = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']
  const hariHariIni = hariMap[hariIdx]
  const jamHariIni = jamOps[hariHariIni]

  if (!jamHariIni.buka) return

  function jadwalkanNotif(jamStr: string, pesan: string) {
    const [h, m] = jamStr.split(':').map(Number)
    const waktu = new Date()
    waktu.setHours(h, m, 0, 0)
    const selisih = waktu.getTime() - Date.now()
    if (selisih > 0) {
      setTimeout(() => {
        new Notification(`🏪 ${namaT}`, {
          body: pesan,
          icon: '/icon-192.png',
          tag: `lokaku-${tokoId}-${jamStr}`,
        })
      }, selisih)
    }
  }

  jadwalkanNotif(jamHariIni.jamBuka, `Sekarang waktunya BUKA toko! (${jamHariIni.jamBuka})`)
  jadwalkanNotif(jamHariIni.jamTutup, `Waktunya TUTUP toko. (${jamHariIni.jamTutup})`)
}

export default function BuatTokoPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingLokasi, setLoadingLokasi] = useState(false)
  const [jenis, setJenis] = useState<JenisDaftar>('toko')

  const [form, setForm] = useState({
    nama: '', deskripsi: '', kategori: '', alamat: '', telepon: '', lat: '', lng: '',
  })

  // Jam Operasional (khusus toko)
  const [jamOps, setJamOps] = useState<JamOperasional>(buatJamDefault())
  const [hariDipilih, setHariDipilih] = useState<HariKey>('senin')
  const [notifJam, setNotifJam] = useState(true)

  // Sertifikat / Pengalaman (khusus jasa)
  const [sertifikatList, setSertifikatList] = useState<SertifikatItem[]>([])
  const [pengalaman, setPengalaman] = useState('')

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

  // --- Jam Operasional helpers ---
  function toggleHariBuka(hari: HariKey) {
    setJamOps(prev => ({
      ...prev,
      [hari]: { ...prev[hari], buka: !prev[hari].buka }
    }))
  }

  function setJam(hari: HariKey, field: 'jamBuka' | 'jamTutup', val: string) {
    setJamOps(prev => ({
      ...prev,
      [hari]: { ...prev[hari], [field]: val }
    }))
  }

  function salinKeSemua(hari: HariKey) {
    const src = jamOps[hari]
    const update: Partial<JamOperasional> = {}
    HARI_LIST.forEach(h => {
      if (h.key !== hari) update[h.key] = { ...src }
    })
    setJamOps(prev => ({ ...prev, ...update }))
    toast.success('Jam berhasil disalin ke semua hari!')
  }

  // --- Sertifikat helpers ---
  function tambahSertifikat() {
    setSertifikatList(prev => [
      ...prev,
      { id: crypto.randomUUID(), judul: '', institusi: '', tahun: '' }
    ])
  }

  function updateSertifikat(id: string, field: keyof Omit<SertifikatItem, 'id'>, val: string) {
    setSertifikatList(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s))
  }

  function hapusSertifikat(id: string) {
    setSertifikatList(prev => prev.filter(s => s.id !== id))
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

    const payload: Record<string, unknown> = {
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
    }

    // Tambah data jam operasional untuk toko
    if (jenis === 'toko') {
      payload.jam_operasional = jamOps
    }

    // Tambah sertifikat & pengalaman untuk jasa
    if (jenis === 'jasa') {
      const sertValid = sertifikatList.filter(s => s.judul.trim())
      payload.sertifikat = sertValid.length > 0 ? sertValid : null
      payload.pengalaman = pengalaman.trim() || null
    }

    const { data: insertedData, error } = await supabase
      .from('toko')
      .insert(payload)
      .select('id')
      .single()

    setLoading(false)

    if (error) {
      toast.error('Gagal mendaftar: ' + error.message)
    } else {
      const msg =
        jenis === 'toko' ? 'Toko berhasil dibuat! 🎉'
        : jenis === 'jasa' ? 'Jasa berhasil didaftarkan! 🎉'
        : 'Barang preloved berhasil didaftarkan! 🎉'
      toast.success(msg)

      // Daftarkan notifikasi jam jika toko dan user mau
      if (jenis === 'toko' && notifJam && insertedData?.id) {
        await daftarkanNotifikasiJam(insertedData.id, form.nama, jamOps)
      }

      navigate('/dashboard')
    }
  }

  const grupList = jenis === 'toko' ? KATEGORI_TOKO : jenis === 'jasa' ? KATEGORI_JASA : KATEGORI_PRELOVED

  const jenisConfig = {
    toko: {
      icon: '🏪', label: 'Pemilik Toko', sub: 'Jualan produk fisik',
      border: 'border-green-500', bg: 'bg-green-50', text: 'text-green-700',
      btn: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-100',
      infoBg: 'bg-green-50', infoText: 'text-green-700',
    },
    jasa: {
      icon: '🛠️', label: 'Penyedia Jasa', sub: 'Tawarkan layanan',
      border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700',
      btn: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-100',
      infoBg: 'bg-blue-50', infoText: 'text-blue-700',
    },
    preloved: {
      icon: '♻️', label: 'Jual Barang Bekas', sub: 'Preloved & secondhand',
      border: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-700',
      btn: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-purple-100',
      infoBg: 'bg-purple-50', infoText: 'text-purple-700',
    },
  }

  const cfg = jenisConfig[jenis]

  const infoText = {
    toko: 'Daftarkan tokomu dan mulai ditemukan pembeli di sekitarmu secara realtime.',
    jasa: 'Tawarkan jasamu ke warga sekitar. Tidak perlu punya toko fisik!',
    preloved: 'Jual barang bekas milikmu ke warga sekitar. Mudah, cepat, dan gratis!',
  }

  const hariDipilihData = jamOps[hariDipilih]
  const jumlahHariBuka = HARI_LIST.filter(h => jamOps[h.key].buka).length

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

        {/* Form Utama */}
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

        {/* ===== JAM OPERASIONAL (hanya toko) ===== */}
        {jenis === 'toko' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Jam Operasional</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Buka {jumlahHariBuka} hari/minggu
                </p>
              </div>
              <span className="text-xl">🕐</span>
            </div>

            {/* Pilih Hari */}
            <div className="flex gap-1.5">
              {HARI_LIST.map(h => {
                const aktif = jamOps[h.key].buka
                const dipilih = hariDipilih === h.key
                return (
                  <button
                    key={h.key}
                    type="button"
                    onClick={() => setHariDipilih(h.key)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition border-2
                      ${dipilih
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : aktif
                          ? 'border-gray-200 bg-white text-gray-700'
                          : 'border-gray-100 bg-gray-50 text-gray-300 line-through'
                      }`}
                  >
                    {h.label}
                  </button>
                )
              })}
            </div>

            {/* Detail hari dipilih */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 capitalize">
                  {HARI_LIST.find(h => h.key === hariDipilih)?.label === 'Sen' ? 'Senin'
                    : HARI_LIST.find(h => h.key === hariDipilih)?.label === 'Sel' ? 'Selasa'
                    : HARI_LIST.find(h => h.key === hariDipilih)?.label === 'Rab' ? 'Rabu'
                    : HARI_LIST.find(h => h.key === hariDipilih)?.label === 'Kam' ? 'Kamis'
                    : HARI_LIST.find(h => h.key === hariDipilih)?.label === 'Jum' ? 'Jumat'
                    : HARI_LIST.find(h => h.key === hariDipilih)?.label === 'Sab' ? 'Sabtu'
                    : 'Minggu'}
                </span>

                {/* Toggle buka/tutup */}
                <button
                  type="button"
                  onClick={() => toggleHariBuka(hariDipilih)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition
                    ${hariDipilihData.buka
                      ? 'bg-green-100 text-green-700 border-2 border-green-200'
                      : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                    }`}
                >
                  <span className={`w-3 h-3 rounded-full ${hariDipilihData.buka ? 'bg-green-500' : 'bg-gray-300'}`} />
                  {hariDipilihData.buka ? 'Buka' : 'Libur'}
                </button>
              </div>

              {hariDipilihData.buka && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-gray-400 font-semibold block mb-1">Jam Buka</label>
                      <input
                        type="time"
                        value={hariDipilihData.jamBuka}
                        onChange={e => setJam(hariDipilih, 'jamBuka', e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 bg-white transition font-semibold text-gray-800"
                      />
                    </div>
                    <span className="text-gray-300 font-bold mt-4">→</span>
                    <div className="flex-1">
                      <label className="text-xs text-gray-400 font-semibold block mb-1">Jam Tutup</label>
                      <input
                        type="time"
                        value={hariDipilihData.jamTutup}
                        onChange={e => setJam(hariDipilih, 'jamTutup', e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 bg-white transition font-semibold text-gray-800"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => salinKeSemua(hariDipilih)}
                    className="w-full text-xs text-green-600 font-semibold py-2 rounded-xl border-2 border-dashed border-green-200 hover:bg-green-50 transition"
                  >
                    📋 Salin jam ini ke semua hari
                  </button>
                </>
              )}
            </div>

            {/* Ringkasan jam */}
            <div className="space-y-1.5">
              {HARI_LIST.map(h => {
                const jam = jamOps[h.key]
                const namaHari = { senin: 'Senin', selasa: 'Selasa', rabu: 'Rabu', kamis: 'Kamis', jumat: 'Jumat', sabtu: 'Sabtu', minggu: 'Minggu' }[h.key]
                return (
                  <div key={h.key} className="flex items-center justify-between text-xs">
                    <span className={`font-semibold w-14 ${jam.buka ? 'text-gray-700' : 'text-gray-300'}`}>{namaHari}</span>
                    {jam.buka
                      ? <span className="text-gray-500">{jam.jamBuka} – {jam.jamTutup}</span>
                      : <span className="text-gray-300 italic">Libur</span>
                    }
                  </div>
                )
              })}
            </div>

            {/* Toggle notifikasi */}
            <button
              type="button"
              onClick={() => setNotifJam(v => !v)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition text-left
                ${notifJam
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-100 bg-gray-50'
                }`}
            >
              <span className="text-xl">{notifJam ? '🔔' : '🔕'}</span>
              <div className="flex-1">
                <p className={`text-xs font-bold ${notifJam ? 'text-green-700' : 'text-gray-400'}`}>
                  Notifikasi jam buka & tutup
                </p>
                <p className={`text-xs mt-0.5 ${notifJam ? 'text-green-600' : 'text-gray-300'}`}>
                  {notifJam
                    ? 'Lokaku akan mengingatkanmu setiap hari sesuai jadwal'
                    : 'Notifikasi dimatikan untuk toko ini'
                  }
                </p>
              </div>
              <div className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${notifJam ? 'bg-green-500' : 'bg-gray-200'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${notifJam ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>
        )}

        {/* ===== SERTIFIKAT & PENGALAMAN (hanya jasa) ===== */}
        {jenis === 'jasa' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Keahlian & Pengalaman</p>
                <p className="text-xs text-gray-400 mt-0.5">Opsional, tapi meningkatkan kepercayaan</p>
              </div>
              <span className="text-xl">🏅</span>
            </div>

            {/* Pengalaman */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                Ringkasan Pengalaman
              </label>
              <textarea
                value={pengalaman}
                onChange={e => setPengalaman(e.target.value)}
                rows={2}
                placeholder="contoh: 5 tahun pengalaman di bidang listrik rumah tangga, pernah menangani 200+ klien di Bandung..."
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 bg-gray-50 transition resize-none"
              />
            </div>

            {/* Sertifikat */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Sertifikat / Penghargaan</label>
                <button
                  type="button"
                  onClick={tambahSertifikat}
                  className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border-2 border-blue-100 hover:bg-blue-100 transition"
                >
                  + Tambah
                </button>
              </div>

              {sertifikatList.length === 0 && (
                <div className="border-2 border-dashed border-gray-100 rounded-2xl py-6 text-center text-xs text-gray-300">
                  <span className="text-2xl block mb-1">📜</span>
                  Belum ada sertifikat. Klik "+ Tambah" untuk menambahkan.
                </div>
              )}

              <div className="space-y-3">
                {sertifikatList.map((s, i) => (
                  <div key={s.id} className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-600">Sertifikat #{i + 1}</span>
                      <button
                        type="button"
                        onClick={() => hapusSertifikat(s.id)}
                        className="text-xs text-red-400 hover:text-red-600 font-semibold transition"
                      >
                        Hapus
                      </button>
                    </div>
                    <input
                      value={s.judul}
                      onChange={e => updateSertifikat(s.id, 'judul', e.target.value)}
                      placeholder="Nama sertifikat / penghargaan"
                      className="w-full border-2 border-blue-100 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white transition"
                    />
                    <div className="flex gap-2">
                      <input
                        value={s.institusi}
                        onChange={e => updateSertifikat(s.id, 'institusi', e.target.value)}
                        placeholder="Institusi / lembaga"
                        className="flex-1 border-2 border-blue-100 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white transition"
                      />
                      <input
                        value={s.tahun}
                        onChange={e => updateSertifikat(s.id, 'tahun', e.target.value)}
                        placeholder="Tahun"
                        maxLength={4}
                        className="w-20 border-2 border-blue-100 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white transition"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
