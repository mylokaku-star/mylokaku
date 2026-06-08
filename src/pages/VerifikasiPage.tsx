import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

const DAFTAR_BANK = [
  'BCA', 'Mandiri', 'BRI', 'BNI', 'BSI (Bank Syariah Indonesia)',
  'CIMB Niaga', 'Danamon', 'Permata', 'BTN', 'Maybank',
  'OCBC NISP', 'Panin Bank', 'BNI Syariah', 'Bank Jago', 'SeaBank',
  'Jenius (BTPN)', 'Allo Bank', 'GoPay (Bank Jago)', 'OVO', 'Dana',
]

export default function VerifikasiPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [verifikasi, setVerifikasi] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingKtp, setUploadingKtp] = useState(false)
  const [uploadingSelfie, setUploadingSelfie] = useState(false)
  const [form, setForm] = useState({
    nik: '',
    nomor_kk: '',
    bank: '',
    nomor_rekening: '',
    nama_rekening: '',
    foto_ktp_url: '',
    foto_selfie_url: '',
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { navigate('/login'); return }
    setUser(userData.user)

    const { data: profileData } = await supabase
      .from('profiles').select('*').eq('id', userData.user.id).single()
    setProfile(profileData)

    const { data: verData } = await supabase
      .from('verifikasi').select('*').eq('user_id', userData.user.id).single()

    if (verData) {
      setVerifikasi(verData)
      setForm({
        nik: verData.nik || '',
        nomor_kk: verData.nomor_kk || '',
        bank: verData.bank || '',
        nomor_rekening: verData.nomor_rekening || '',
        nama_rekening: verData.nama_rekening || '',
        foto_ktp_url: verData.foto_ktp_url || '',
        foto_selfie_url: verData.foto_selfie_url || '',
      })
    }
    setLoading(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function uploadDokumen(file: File, tipe: 'ktp' | 'selfie') {
    if (file.size > 5 * 1024 * 1024) { toast.error('Ukuran file maksimal 5MB'); return }
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      toast.error('Format file harus JPG atau PNG'); return
    }

    tipe === 'ktp' ? setUploadingKtp(true) : setUploadingSelfie(true)

    const ext = file.name.split('.').pop()
    const fileName = `${user.id}/${tipe}-${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('kyc-dokumen').upload(fileName, file, { upsert: true })

    if (error) {
      toast.error('Gagal upload foto')
      tipe === 'ktp' ? setUploadingKtp(false) : setUploadingSelfie(false)
      return
    }

    const { data: urlData } = supabase.storage.from('kyc-dokumen').getPublicUrl(fileName)
    if (tipe === 'ktp') {
      setForm(f => ({ ...f, foto_ktp_url: urlData.publicUrl }))
      setUploadingKtp(false)
      toast.success('Foto KTP berhasil diupload!')
    } else {
      setForm(f => ({ ...f, foto_selfie_url: urlData.publicUrl }))
      setUploadingSelfie(false)
      toast.success('Foto selfie berhasil diupload!')
    }
  }

  async function handleSubmit() {
    // Validasi
    if (!form.nik || form.nik.length !== 16 || !/^\d+$/.test(form.nik)) {
      toast.error('NIK harus 16 digit angka'); return
    }
    if (!form.foto_ktp_url) { toast.error('Foto KTP wajib diupload'); return }
    if (!form.foto_selfie_url) { toast.error('Foto selfie dengan KTP wajib diupload'); return }
    if (!form.bank || !form.nomor_rekening || !form.nama_rekening) {
      toast.error('Data rekening bank wajib diisi'); return
    }
    if (!profile?.nama_lengkap) {
      toast.error('Isi nama lengkap di halaman profil dulu sebelum verifikasi')
      navigate('/profil'); return
    }

    setSaving(true)
    const upsertData = {
      user_id: user.id,
      nik: form.nik,
      nomor_kk: form.nomor_kk || null,
      bank: form.bank,
      nomor_rekening: form.nomor_rekening,
      nama_rekening: form.nama_rekening,
      foto_ktp_url: form.foto_ktp_url,
      foto_selfie_url: form.foto_selfie_url,
      status: 'proses',
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('verifikasi').upsert(upsertData)
    setSaving(false)

    if (error) {
      toast.error('Gagal submit: ' + error.message)
    } else {
      toast.success('Data verifikasi berhasil dikirim! Sedang diproses tim Lokaku.')
      await loadData()
    }
  }

  function getStatusBadge() {
    const status = verifikasi?.status || 'belum'
    const map: Record<string, { label: string; color: string; bg: string; icon: string }> = {
      belum: { label: 'Belum Terverifikasi', color: '#6b7280', bg: '#f3f4f6', icon: '○' },
      proses: { label: 'Sedang Diproses', color: '#d97706', bg: '#fef3c7', icon: '⏳' },
      terverifikasi: { label: 'Terverifikasi', color: '#059669', bg: '#d1fae5', icon: '✓' },
      ditolak: { label: 'Ditolak', color: '#dc2626', bg: '#fee2e2', icon: '✕' },
    }
    return map[status] || map.belum
  }

  const sudahVerifikasi = verifikasi?.status === 'terverifikasi'
  const sedangProses = verifikasi?.status === 'proses'
  const ditolak = verifikasi?.status === 'ditolak'
  const badge = getStatusBadge()

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Memuat...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate('/profil')} className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">←</button>
        <div>
          <h1 className="font-extrabold text-gray-900 text-base">Verifikasi Akun</h1>
          <p className="text-xs text-gray-400">Dapatkan centang biru Lokaku</p>
        </div>
        {sudahVerifikasi && <span className="ml-auto text-blue-500 text-xl">✓</span>}
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">

        {/* Status Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: badge.bg }}>
              {badge.icon}
            </div>
            <div>
              <p className="font-bold text-gray-900">Status Verifikasi</p>
              <span className="text-xs font-bold px-2 py-1 rounded-full"
                style={{ background: badge.bg, color: badge.color }}>
                {badge.label}
              </span>
            </div>
            {sudahVerifikasi && (
              <div className="ml-auto text-center">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">✓</div>
                <p className="text-xs text-blue-600 font-bold mt-1">Centang Biru</p>
              </div>
            )}
          </div>

          {ditolak && verifikasi?.catatan_admin && (
            <div className="mt-3 bg-red-50 rounded-xl p-3">
              <p className="text-xs text-red-600 font-semibold">Alasan penolakan:</p>
              <p className="text-xs text-red-500 mt-1">{verifikasi.catatan_admin}</p>
            </div>
          )}
        </div>

        {/* Info */}
        {!sudahVerifikasi && (
          <div className="bg-blue-50 rounded-2xl p-4 flex gap-3">
            <span className="text-xl flex-shrink-0">ℹ️</span>
            <div>
              <p className="text-xs font-bold text-blue-800 mb-1">Kenapa harus verifikasi?</p>
              <p className="text-xs text-blue-700 leading-relaxed">
                Akun terverifikasi mendapat centang biru ✓ yang ditampilkan di profil, toko, dan chat.
                Ini meningkatkan kepercayaan pembeli dan prioritas tampil di pencarian.
              </p>
            </div>
          </div>
        )}

        {/* Form — hanya tampil kalau belum verifikasi atau ditolak */}
        {!sudahVerifikasi && !sedangProses && (
          <>
            {/* Data KTP */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Data KTP</p>

              <div className="bg-yellow-50 rounded-xl p-3 flex gap-2">
                <span>⚠️</span>
                <p className="text-xs text-yellow-700 leading-relaxed">
                  Data NIK dan KK bersifat rahasia dan hanya digunakan untuk verifikasi identitas sesuai UU PDP.
                  Tidak akan disebarluaskan ke pihak ketiga.
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  NIK (Nomor Induk Kependudukan) <span className="text-red-500">*</span>
                </label>
                <input
                  name="nik"
                  value={form.nik}
                  onChange={handleChange}
                  placeholder="16 digit angka sesuai KTP"
                  maxLength={16}
                  inputMode="numeric"
                  disabled={!!verifikasi?.nik}
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 bg-gray-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">{form.nik.length}/16 digit {verifikasi?.nik && '(tidak bisa diubah)'}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  Nomor KK (Kartu Keluarga) <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <input
                  name="nomor_kk"
                  value={form.nomor_kk}
                  onChange={handleChange}
                  placeholder="16 digit angka"
                  maxLength={16}
                  inputMode="numeric"
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 bg-gray-50 transition"
                />
              </div>
            </div>

            {/* Upload Dokumen */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Foto Dokumen</p>

              {/* Upload KTP */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  Foto KTP <span className="text-red-500">*</span>
                </label>
                {form.foto_ktp_url ? (
                  <div className="relative">
                    <img src={form.foto_ktp_url} alt="KTP" className="w-full h-36 object-cover rounded-xl border-2 border-green-200" />
                    <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">✓ Terupload</span>
                  </div>
                ) : (
                  <label className={`w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl py-6 cursor-pointer hover:bg-gray-50 transition ${uploadingKtp ? 'opacity-50' : ''}`}>
                    <input type="file" accept="image/*" className="hidden"
                      disabled={uploadingKtp}
                      onChange={e => e.target.files?.[0] && uploadDokumen(e.target.files[0], 'ktp')} />
                    <span className="text-3xl mb-2">🪪</span>
                    <p className="text-sm font-semibold text-gray-500">{uploadingKtp ? 'Mengupload...' : 'Upload Foto KTP'}</p>
                    <p className="text-xs text-gray-400 mt-1">JPG/PNG, maks 5MB</p>
                  </label>
                )}
              </div>

              {/* Upload Selfie */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  Selfie dengan KTP <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-400 mb-2">Foto kamu sambil memegang KTP di depan wajah</p>
                {form.foto_selfie_url ? (
                  <div className="relative">
                    <img src={form.foto_selfie_url} alt="Selfie KTP" className="w-full h-36 object-cover rounded-xl border-2 border-green-200" />
                    <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">✓ Terupload</span>
                  </div>
                ) : (
                  <label className={`w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl py-6 cursor-pointer hover:bg-gray-50 transition ${uploadingSelfie ? 'opacity-50' : ''}`}>
                    <input type="file" accept="image/*" className="hidden"
                      disabled={uploadingSelfie}
                      onChange={e => e.target.files?.[0] && uploadDokumen(e.target.files[0], 'selfie')} />
                    <span className="text-3xl mb-2">🤳</span>
                    <p className="text-sm font-semibold text-gray-500">{uploadingSelfie ? 'Mengupload...' : 'Upload Selfie + KTP'}</p>
                    <p className="text-xs text-gray-400 mt-1">JPG/PNG, maks 5MB</p>
                  </label>
                )}
              </div>
            </div>

            {/* Data Rekening */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Rekening Bank</p>
              <p className="text-xs text-gray-500">Nama pemilik rekening harus sama dengan nama lengkap di KTP</p>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Bank <span className="text-red-500">*</span></label>
                <select name="bank" value={form.bank} onChange={handleChange}
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 bg-gray-50 transition">
                  <option value="">Pilih bank</option>
                  {DAFTAR_BANK.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nomor Rekening <span className="text-red-500">*</span></label>
                <input name="nomor_rekening" value={form.nomor_rekening} onChange={handleChange}
                  placeholder="Nomor rekening aktif"
                  inputMode="numeric"
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 bg-gray-50 transition" />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nama Pemilik Rekening <span className="text-red-500">*</span></label>
                <input name="nama_rekening" value={form.nama_rekening} onChange={handleChange}
                  placeholder="Harus sama dengan nama di KTP"
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 bg-gray-50 transition" />
                {profile?.nama_lengkap && (
                  <button
                    onClick={() => setForm(f => ({ ...f, nama_rekening: profile.nama_lengkap }))}
                    className="text-xs text-blue-600 mt-1 font-semibold hover:underline"
                  >
                    Pakai nama: {profile.nama_lengkap}
                  </button>
                )}
              </div>
            </div>

            {/* Persetujuan */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-xs text-gray-500 leading-relaxed text-center">
                Dengan mengirim data ini, kamu menyetujui{' '}
                <span className="text-blue-600 font-semibold">Kebijakan Privasi</span> Lokaku dan
                memberikan izin untuk memproses data identitasmu sesuai UU PDP No. 27 Tahun 2022.
              </p>
            </div>

            {/* Submit */}
            <button onClick={handleSubmit} disabled={saving}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl py-4 text-sm font-extrabold transition shadow-lg disabled:opacity-50">
              {saving ? 'Mengirim...' : '🔵 Ajukan Verifikasi Sekarang'}
            </button>
          </>
        )}

        {/* Status sedang diproses */}
        {sedangProses && (
          <div className="bg-white rounded-3xl border border-yellow-100 shadow-sm p-8 text-center">
            <div className="text-5xl mb-4">⏳</div>
            <h3 className="font-extrabold text-gray-900 text-lg mb-2">Sedang Diproses</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              Tim Lokaku sedang memverifikasi data kamu. Proses ini membutuhkan waktu 1-3 hari kerja.
            </p>
            <div className="bg-yellow-50 rounded-2xl p-4 text-left space-y-2">
              <p className="text-xs font-bold text-yellow-800">Data yang sudah dikirim:</p>
              <p className="text-xs text-yellow-700">✓ NIK: {form.nik.slice(0,4)}••••••••{form.nik.slice(-4)}</p>
              <p className="text-xs text-yellow-700">✓ Foto KTP: Terupload</p>
              <p className="text-xs text-yellow-700">✓ Selfie KTP: Terupload</p>
              <p className="text-xs text-yellow-700">✓ Rekening: {form.bank} - {form.nomor_rekening}</p>
            </div>
          </div>
        )}

        {/* Sudah terverifikasi */}
        {sudahVerifikasi && (
          <div className="bg-white rounded-3xl border border-blue-100 shadow-sm p-8 text-center">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4 shadow-lg">✓</div>
            <h3 className="font-extrabold text-gray-900 text-lg mb-2">Akun Terverifikasi! 🎉</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Centang biru kamu sudah aktif dan tampil di profil, toko, dan chat.
              Terverifikasi sejak {verifikasi?.updated_at ? new Date(verifikasi.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
