import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

const NOMOR_ADMIN = '6285188357721' // Ganti dengan nomor WA admin Lokaku

function generateKode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export default function VerifikasiWA() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [kode, setKode] = useState('')
  const [sudahKirim, setSudahKirim] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { navigate('/login'); return }
    setUser(userData.user)

    const { data: profileData } = await supabase
      .from('profiles').select('*').eq('id', userData.user.id).single()
    setProfile(profileData)

    // Cek apakah sudah ada request pending
    const { data: existing } = await supabase
      .from('verifikasi_wa')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('status', 'pending')
      .single()

    if (existing) {
      setKode(existing.kode)
      setSudahKirim(true)
    }

    setLoading(false)
  }

  async function handleKirimVerifikasi() {
    if (!profile?.nomor_wa) {
      toast.error('Nomor WA tidak ditemukan di profil')
      return
    }

    setProcessing(true)
    const kodeBaru = generateKode()

    // Hapus request lama kalau ada
    await supabase.from('verifikasi_wa')
      .delete()
      .eq('user_id', user.id)
      .eq('status', 'pending')

    // Simpan kode baru ke database
    const { error } = await supabase.from('verifikasi_wa').insert({
      user_id: user.id,
      nomor_wa: profile.nomor_wa,
      kode: kodeBaru,
      status: 'pending',
    })

    if (error) {
      toast.error('Gagal membuat kode verifikasi')
      setProcessing(false)
      return
    }

    // Update profiles dengan waktu request
    await supabase.from('profiles')
      .update({ verification_requested_at: new Date().toISOString() })
      .eq('id', user.id)

    setKode(kodeBaru)
    setSudahKirim(true)
    setProcessing(false)

    // Buka WhatsApp ke admin dengan kode
    const pesan = encodeURIComponent(
      `Halo Admin Lokaku, saya ingin verifikasi nomor WhatsApp saya.\n\n` +
      `Nama: ${profile.nama || 'Belum diisi'}\n` +
      `Nomor WA: +${profile.nomor_wa}\n` +
      `Kode Verifikasi: *${kodeBaru}*\n\n` +
      `Mohon konfirmasi verifikasi saya. Terima kasih!`
    )
    window.open(`https://wa.me/${NOMOR_ADMIN}?text=${pesan}`, '_blank')
  }

  async function handleBatalkan() {
    setProcessing(true)
    await supabase.from('verifikasi_wa')
      .delete().eq('user_id', user.id).eq('status', 'pending')
    await supabase.from('profiles')
      .update({ verification_requested_at: null }).eq('id', user.id)
    setSudahKirim(false)
    setKode('')
    setProcessing(false)
    toast.success('Request verifikasi dibatalkan')
  }

  function bukaPesanWA() {
    const pesan = encodeURIComponent(
      `Halo Admin Lokaku, saya ingin verifikasi nomor WhatsApp saya.\n\n` +
      `Nama: ${profile?.nama || 'Belum diisi'}\n` +
      `Nomor WA: +${profile?.nomor_wa}\n` +
      `Kode Verifikasi: *${kode}*\n\n` +
      `Mohon konfirmasi verifikasi saya. Terima kasih!`
    )
    window.open(`https://wa.me/${NOMOR_ADMIN}?text=${pesan}`, '_blank')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Memuat...</p>
    </div>
  )

  // ✅ Cek is_wa_verified (bukan is_verified yang khusus KYC)
  if (profile?.is_wa_verified) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center border border-green-100 shadow-sm">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">&#10003;</div>
        <h2 className="font-extrabold text-gray-900 text-lg mb-2">Nomor WA Terverifikasi!</h2>
        <p className="text-gray-400 text-sm mb-2">+{profile?.nomor_wa}</p>
        <p className="text-gray-400 text-xs mb-6">Nomor WhatsApp kamu sudah terverifikasi oleh admin Lokaku.</p>
        <button onClick={() => navigate('/profil')}
          className="w-full bg-green-600 text-white font-bold py-3 rounded-2xl text-sm hover:bg-green-700 transition">
          Kembali ke Profil
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate('/profil')}
          className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">
          &larr;
        </button>
        <div>
          <h1 className="font-extrabold text-gray-900 text-base">Verifikasi Nomor WA</h1>
          <p className="text-xs text-gray-400">Konfirmasi kepemilikan nomor WhatsApp</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">

        {/* Info */}
        <div className="bg-green-50 rounded-2xl p-4 flex gap-3">
          <span className="text-2xl flex-shrink-0">&#128241;</span>
          <div>
            <p className="text-sm font-bold text-green-800 mb-1">Cara Kerja Verifikasi</p>
            <ol className="text-xs text-green-700 space-y-1 leading-relaxed list-decimal list-inside">
              <li>Klik tombol "Kirim ke Admin" di bawah</li>
              <li>WhatsApp akan terbuka dengan pesan otomatis</li>
              <li>Kirim pesan tersebut ke admin Lokaku</li>
              <li>Admin akan memverifikasi dalam 1x24 jam</li>
              <li>Nomor WA kamu akan terverifikasi</li>
            </ol>
          </div>
        </div>

        {/* Nomor WA */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Nomor yang akan diverifikasi</p>
          <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
            <span className="text-2xl">&#128241;</span>
            <div>
              <p className="font-bold text-gray-900">+{profile?.nomor_wa}</p>
              <p className="text-xs text-gray-400">Nomor yang terdaftar di akun Lokaku</p>
            </div>
          </div>
        </div>

        {/* Status & Kode */}
        {sudahKirim ? (
          <div className="bg-white rounded-3xl border border-yellow-100 shadow-sm p-5 space-y-4">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Status Verifikasi</p>

            <div className="bg-yellow-50 rounded-2xl p-4 text-center">
              <p className="text-xs text-yellow-700 font-semibold mb-2">Kode Verifikasi Kamu</p>
              <p className="text-4xl font-black text-yellow-800 tracking-widest">{kode}</p>
              <p className="text-xs text-yellow-600 mt-2">Kode ini sudah dikirim ke admin dalam pesan WA</p>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 flex gap-2">
              <span>&#9203;</span>
              <p className="text-xs text-amber-700 leading-relaxed">
                Menunggu konfirmasi admin Lokaku. Proses verifikasi 1x24 jam hari kerja.
                Refresh halaman ini untuk cek status terbaru.
              </p>
            </div>

            <div className="space-y-2">
              <button onClick={bukaPesanWA}
                className="w-full bg-green-600 text-white text-sm py-3 rounded-2xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2">
                Kirim Ulang ke WhatsApp Admin
              </button>
              <button onClick={handleBatalkan} disabled={processing}
                className="w-full border-2 border-red-100 text-red-500 text-sm py-2.5 rounded-2xl font-semibold hover:bg-red-50 transition disabled:opacity-50">
                Batalkan Request
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Dengan memverifikasi nomor WA, kamu membuktikan bahwa nomor <strong>+{profile?.nomor_wa}</strong> benar-benar milikmu.
            </p>
            <button onClick={handleKirimVerifikasi} disabled={processing}
              className="w-full bg-green-600 hover:bg-green-700 text-white text-sm py-4 rounded-2xl font-extrabold transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {processing ? 'Memproses...' : 'Kirim Verifikasi ke Admin WA'}
            </button>
          </div>
        )}

        {/* Catatan */}
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 leading-relaxed text-center">
            Verifikasi nomor WA gratis dan tidak dipungut biaya apapun.
            Data kamu aman sesuai kebijakan privasi Lokaku.
          </p>
        </div>

      </div>
    </div>
  )
}
