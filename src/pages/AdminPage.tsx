import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

type TabAdmin = 'verifikasi' | 'verifikasi_wa' | 'pengguna' | 'toko' | 'promo'

export default function AdminPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [tab, setTab] = useState<TabAdmin>('verifikasi_wa')
  const [verifikasiList, setVerifikasiList] = useState<any[]>([])
  const [verifikasiWAList, setVerifikasiWAList] = useState<any[]>([])
  const [penggunaList, setPenggunaList] = useState<any[]>([])
  const [tokoList, setTokoList] = useState<any[]>([])
  const [promoList, setPromoList] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [catatan, setCatatan] = useState('')
  const [catatanPromo, setCatatanPromo] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => { cekAdmin() }, [])

  async function cekAdmin() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { navigate('/login'); return }
    const { data: profile } = await supabase
      .from('profiles').select('is_admin').eq('id', userData.user.id).single()
    if (!profile?.is_admin) { toast.error('Akses ditolak'); navigate('/dashboard'); return }
    setIsAdmin(true)
    await Promise.all([loadVerifikasi(), loadVerifikasiWA(), loadPengguna(), loadToko(), loadPromo()])
    setLoading(false)
  }

  async function loadVerifikasi() {
    const { data } = await supabase
      .from('verifikasi')
      .select('*, profiles:user_id(nama, nomor_wa, nama_lengkap)')
      .order('created_at', { ascending: false })
    setVerifikasiList(data || [])
  }

  async function loadVerifikasiWA() {
    const { data } = await supabase
      .from('verifikasi_wa')
      .select('*, profiles:user_id(nama, nomor_wa, nama_lengkap)')
      .order('created_at', { ascending: false })
    setVerifikasiWAList(data || [])
  }

  async function loadPengguna() {
    const { data } = await supabase
      .from('profiles').select('*').order('created_at', { ascending: false })
    setPenggunaList(data || [])
  }

  async function loadToko() {
    const { data } = await supabase
      .from('toko').select('*').order('created_at', { ascending: false })
    setTokoList(data || [])
  }

  // ── PROMO: join manual karena RLS foreign key join tidak support cross-user ──
  async function loadPromo() {
    const { data, error } = await supabase
      .from('promos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) { console.error('loadPromo error:', error); return }
    if (!data || data.length === 0) { setPromoList([]); return }

    const tokoIds = [...new Set(data.map((p: any) => p.toko_id).filter(Boolean))]
    const userIds = [...new Set(data.map((p: any) => p.user_id).filter(Boolean))]

    const [{ data: tokoData }, { data: profileData }] = await Promise.all([
      supabase.from('toko').select('id, nama, alamat').in('id', tokoIds),
      supabase.from('profiles').select('id, nama, nomor_wa').in('id', userIds),
    ])

    const tokoMap = Object.fromEntries((tokoData || []).map((t: any) => [t.id, t]))
    const profileMap = Object.fromEntries((profileData || []).map((p: any) => [p.id, p]))

    setPromoList(data.map((p: any) => ({
      ...p,
      toko: tokoMap[p.toko_id] || null,
      profiles: profileMap[p.user_id] || null,
    })))
  }

  // ── KYC ──
  async function approveVerifikasi(v: any) {
    setProcessing(true)
    const { error: err1 } = await supabase.from('verifikasi')
      .update({ status: 'terverifikasi', catatan_admin: catatan || 'Disetujui', updated_at: new Date().toISOString() })
      .eq('id', v.id)
    const { error: err2 } = await supabase.from('profiles')
      .update({ is_verified: true, verified_at: new Date().toISOString() })
      .eq('id', v.user_id)
    setProcessing(false)
    if (err1 || err2) { toast.error('Gagal approve'); return }
    toast.success('Verifikasi KYC disetujui!')
    setSelected(null); setCatatan('')
    await loadVerifikasi(); await loadPengguna()
  }

  async function rejectVerifikasi(v: any) {
    if (!catatan.trim()) { toast.error('Isi alasan penolakan dulu'); return }
    setProcessing(true)
    await supabase.from('verifikasi')
      .update({ status: 'ditolak', catatan_admin: catatan, updated_at: new Date().toISOString() })
      .eq('id', v.id)
    setProcessing(false)
    toast.success('Verifikasi ditolak.')
    setSelected(null); setCatatan('')
    await loadVerifikasi()
  }

  async function revokeVerifikasi(userId: string) {
    setProcessing(true)
    await supabase.from('profiles').update({ is_verified: false, verified_at: null }).eq('id', userId)
    await supabase.from('verifikasi').update({ status: 'ditolak', catatan_admin: 'Dicabut admin' }).eq('user_id', userId)
    setProcessing(false)
    toast.success('Verifikasi KYC dicabut')
    await loadVerifikasi(); await loadPengguna()
  }

  // ── WA ──
  async function approveWA(v: any) {
    setProcessing(true)
    const { error: err1 } = await supabase.from('verifikasi_wa')
      .update({ status: 'verified' }).eq('id', v.id)
    const { error: err2 } = await supabase.from('profiles')
      .update({ is_wa_verified: true })
      .eq('id', v.user_id)
    setProcessing(false)
    if (err1 || err2) { toast.error('Gagal approve WA'); return }
    toast.success('Nomor WA +' + v.nomor_wa + ' berhasil diverifikasi!')
    await loadVerifikasiWA(); await loadPengguna()
  }

  async function tolakWA(v: any) {
    setProcessing(true)
    await supabase.from('verifikasi_wa').update({ status: 'expired' }).eq('id', v.id)
    await supabase.from('profiles').update({ verification_requested_at: null }).eq('id', v.user_id)
    setProcessing(false)
    toast.success('Request verifikasi WA ditolak.')
    await loadVerifikasiWA()
  }

  // ── PROMO ──
  async function approvePromo(promo: any) {
    setProcessing(true)
    const { error } = await supabase.from('promos')
      .update({ status: 'aktif', catatan_admin: catatanPromo || 'Disetujui' })
      .eq('id', promo.id)
    setProcessing(false)
    if (error) { toast.error('Gagal approve promo'); return }
    toast.success(`Promo "${promo.judul}" diaktifkan! 🎉`)
    setCatatanPromo('')
    await loadPromo()
  }

  async function tolakPromo(promo: any) {
    if (!catatanPromo.trim()) { toast.error('Isi alasan penolakan dulu'); return }
    setProcessing(true)
    const { error } = await supabase.from('promos')
      .update({ status: 'ditolak', catatan_admin: catatanPromo })
      .eq('id', promo.id)
    setProcessing(false)
    if (error) { toast.error('Gagal tolak promo'); return }
    toast.success('Promo ditolak.')
    setCatatanPromo('')
    await loadPromo()
  }

  async function nonaktifkanPromo(promo: any) {
    if (!confirm('Nonaktifkan promo ini?')) return
    setProcessing(true)
    await supabase.from('promos').update({ status: 'berakhir' }).eq('id', promo.id)
    setProcessing(false)
    toast.success('Promo dinonaktifkan')
    await loadPromo()
  }

  async function hapusToko(tokoId: string) {
    if (!confirm('Yakin hapus toko ini?')) return
    await supabase.from('toko').delete().eq('id', tokoId)
    toast.success('Toko dihapus')
    await loadToko()
  }

  function getStatusBadge(status: string) {
    const map: Record<string, string> = {
      belum: 'bg-gray-100 text-gray-500',
      proses: 'bg-yellow-100 text-yellow-700',
      terverifikasi: 'bg-green-100 text-green-700',
      ditolak: 'bg-red-100 text-red-600',
      pending: 'bg-amber-100 text-amber-700',
      verified: 'bg-green-100 text-green-700',
      expired: 'bg-red-100 text-red-600',
      menunggu: 'bg-amber-100 text-amber-700',
      aktif: 'bg-green-100 text-green-700',
      berakhir: 'bg-gray-100 text-gray-400',
    }
    return map[status] || map.belum
  }

  function getStatusLabel(status: string) {
    const map: Record<string, string> = {
      menunggu: 'Menunggu', aktif: 'Aktif', ditolak: 'Ditolak', berakhir: 'Berakhir',
      proses: 'Pending', terverifikasi: 'Disetujui', pending: 'Pending',
      verified: 'Verified', expired: 'Expired',
    }
    return map[status] || status
  }

  function formatTanggal(iso: string) {
    if (!iso) return '-'
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const pendingKYC = verifikasiList.filter(v => v.status === 'proses').length
  const pendingWA = verifikasiWAList.filter(v => v.status === 'pending').length
  const pendingPromo = promoList.filter(p => p.status === 'menunggu').length

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Memuat dashboard admin...</p>
    </div>
  )

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-gray-100 pb-10">

      {/* Header */}
      <div className="bg-gray-900 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')}
          className="w-8 h-8 bg-gray-700 rounded-xl flex items-center justify-center text-white hover:bg-gray-600 transition">←</button>
        <div className="flex-1">
          <h1 className="font-extrabold text-white text-base">Admin Lokaku</h1>
          <p className="text-xs text-gray-400">Dashboard pengelolaan</p>
        </div>
        {(pendingKYC + pendingWA + pendingPromo) > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-bounce">
            {pendingKYC + pendingWA + pendingPromo} pending
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-2 px-4 py-4 max-w-lg mx-auto">
        {[
          { label: 'Pengguna', value: penggunaList.length, color: 'text-blue-600' },
          { label: 'Toko/Jasa', value: tokoList.length, color: 'text-green-600' },
          { label: 'KYC',   value: verifikasiList.length,   color: 'text-yellow-600' },
          { label: 'WA',    value: verifikasiWAList.length,  color: 'text-orange-500' },
          { label: 'Promo', value: promoList.length,          color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-2 text-center border border-gray-100 shadow-sm">
            <p className={`text-lg font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tab */}
      <div className="flex gap-2 px-4 mb-4 max-w-lg mx-auto overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {([
          { val: 'verifikasi_wa', label: `WA${pendingWA > 0 ? ` (${pendingWA})` : ''}` },
          { val: 'verifikasi',    label: `KYC${pendingKYC > 0 ? ` (${pendingKYC})` : ''}` },
          { val: 'promo',         label: `Promo${pendingPromo > 0 ? ` (${pendingPromo})` : ''}` },
          { val: 'pengguna',      label: 'Pengguna' },
          { val: 'toko',          label: 'Toko' },
        ] as const).map(t => (
          <button key={t.val} onClick={() => setTab(t.val)}
            className={`text-xs px-3 py-2 rounded-xl border-2 font-bold transition whitespace-nowrap flex-shrink-0
              ${tab === t.val ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-100'}
              ${(t.val === 'promo' && pendingPromo > 0) || (t.val === 'verifikasi_wa' && pendingWA > 0) || (t.val === 'verifikasi' && pendingKYC > 0)
                ? 'ring-2 ring-red-300' : ''}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-3">

        {/* ── TAB PROMO ── */}
        {tab === 'promo' && (
          <>
            <p className="text-xs text-gray-400 font-medium">{promoList.length} promo/event · {pendingPromo} menunggu</p>
            {promoList.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-gray-100">
                <p className="text-3xl mb-2">🏷️</p>
                <p className="text-gray-400 text-sm">Belum ada promo/event</p>
              </div>
            ) : promoList.map(promo => (
              <div key={promo.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${promo.status === 'menunggu' ? 'border-amber-200' : 'border-gray-100'}`}>
                <div className="relative aspect-[2/1]">
                  <img src={promo.gambar_url} alt={promo.judul} className="w-full h-full object-cover" />
                  <div className={`absolute top-2 left-2 px-2.5 py-1 rounded-xl text-xs font-bold
                    ${promo.jenis === 'promo' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'}`}>
                    {promo.jenis === 'promo' ? '🏷️ Promo' : '🎪 Event'}
                  </div>
                  <span className={`absolute top-2 right-2 text-xs px-2.5 py-1 rounded-xl font-bold ${getStatusBadge(promo.status)}`}>
                    {getStatusLabel(promo.status)}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-sm">{promo.judul}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">🏪 {promo.toko?.nama || '-'}</p>
                    <p className="text-xs text-gray-400">👤 {promo.profiles?.nama || '-'} · +{promo.profiles?.nomor_wa || '-'}</p>
                    <p className="text-xs text-gray-400 mt-1">📅 {formatTanggal(promo.tanggal_mulai)} – {formatTanggal(promo.tanggal_berakhir)}</p>
                  </div>
                  {promo.deskripsi && (
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-xl px-3 py-2 leading-relaxed">{promo.deskripsi}</p>
                  )}
                  {promo.catatan_admin && (
                    <p className="text-xs text-blue-700 bg-blue-50 rounded-xl px-3 py-2">Catatan admin: {promo.catatan_admin}</p>
                  )}
                  {promo.status === 'menunggu' && (
                    <div className="space-y-2">
                      <textarea value={catatanPromo} onChange={e => setCatatanPromo(e.target.value)}
                        placeholder="Catatan admin (opsional approve, wajib tolak)" rows={2}
                        className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs outline-none focus:border-orange-400 bg-gray-50 resize-none" />
                      <div className="flex gap-2">
                        <button onClick={() => tolakPromo(promo)} disabled={processing}
                          className="flex-1 border-2 border-red-100 text-red-500 text-xs py-2.5 rounded-xl font-bold hover:bg-red-50 transition disabled:opacity-50">
                          Tolak
                        </button>
                        <button onClick={() => approvePromo(promo)} disabled={processing}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs py-2.5 rounded-xl font-bold transition disabled:opacity-50">
                          ✓ Aktifkan Promo
                        </button>
                      </div>
                    </div>
                  )}
                  {promo.status === 'aktif' && (
                    <button onClick={() => nonaktifkanPromo(promo)} disabled={processing}
                      className="w-full border-2 border-red-100 text-red-500 text-xs py-2.5 rounded-xl font-bold hover:bg-red-50 transition disabled:opacity-50">
                      Nonaktifkan Promo
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── TAB VERIFIKASI WA ── */}
        {tab === 'verifikasi_wa' && (
          <>
            <p className="text-xs text-gray-400 font-medium">{verifikasiWAList.length} request · {pendingWA} pending</p>
            {verifikasiWAList.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-gray-100">
                <p className="text-gray-400 text-sm">Belum ada request verifikasi WA</p>
              </div>
            ) : verifikasiWAList.map(v => (
              <div key={v.id} className={`bg-white rounded-2xl border shadow-sm p-4 ${v.status === 'pending' ? 'border-amber-200' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{v.profiles?.nama || v.profiles?.nama_lengkap || 'Pengguna'}</p>
                    <p className="text-sm font-bold text-green-700 mt-0.5">+{v.nomor_wa}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Kode: <span className="font-bold text-gray-700 tracking-widest">{v.kode}</span></p>
                    <p className="text-xs text-gray-400">{formatTanggal(v.created_at)}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold flex-shrink-0 ${getStatusBadge(v.status)}`}>
                    {getStatusLabel(v.status)}
                  </span>
                </div>
                {v.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => tolakWA(v)} disabled={processing}
                      className="flex-1 border-2 border-red-100 text-red-500 text-xs py-2.5 rounded-xl font-bold hover:bg-red-50 transition disabled:opacity-50">Tolak</button>
                    <button onClick={() => approveWA(v)} disabled={processing}
                      className="flex-1 bg-green-600 text-white text-xs py-2.5 rounded-xl font-bold hover:bg-green-700 transition disabled:opacity-50">Verifikasi WA</button>
                  </div>
                )}
                {v.status === 'verified' && (
                  <p className="text-xs text-green-600 bg-green-50 rounded-xl px-3 py-2 text-center font-semibold">Nomor WA berhasil diverifikasi</p>
                )}
              </div>
            ))}
          </>
        )}

        {/* ── TAB KYC ── */}
        {tab === 'verifikasi' && (
          <>
            {verifikasiList.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-gray-100">
                <p className="text-gray-400 text-sm">Tidak ada pengajuan KYC</p>
              </div>
            ) : verifikasiList.map(v => (
              <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{v.profiles?.nama || 'Pengguna'}</p>
                      <p className="text-xs text-gray-400">+{v.profiles?.nomor_wa}</p>
                      <p className="text-xs text-gray-400">{formatTanggal(v.created_at)}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${getStatusBadge(v.status)}`}>
                      {getStatusLabel(v.status)}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 space-y-1 mb-3 text-xs">
                    <p>NIK: <span className="font-semibold">{v.nik}</span></p>
                    {v.nomor_kk && <p>KK: <span className="font-semibold">{v.nomor_kk}</span></p>}
                    <p>Bank: <span className="font-semibold">{v.bank} - {v.nomor_rekening}</span></p>
                    <p>Nama Rekening: <span className="font-semibold">{v.nama_rekening}</span></p>
                  </div>
                  {(v.foto_ktp_url || v.foto_selfie_url) && (
                    <div className="flex gap-2 mb-3">
                      {v.foto_ktp_url && (
                        <div className="flex-1">
                          <p className="text-xs text-gray-400 mb-1">Foto KTP</p>
                          <a href={v.foto_ktp_url} target="_blank" rel="noreferrer">
                            <img src={v.foto_ktp_url} alt="KTP" className="w-full h-24 object-cover rounded-xl border border-gray-100" />
                          </a>
                        </div>
                      )}
                      {v.foto_selfie_url && (
                        <div className="flex-1">
                          <p className="text-xs text-gray-400 mb-1">Selfie + KTP</p>
                          <a href={v.foto_selfie_url} target="_blank" rel="noreferrer">
                            <img src={v.foto_selfie_url} alt="Selfie" className="w-full h-24 object-cover rounded-xl border border-gray-100" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                  {v.status === 'proses' && (
                    selected?.id === v.id ? (
                      <div className="space-y-2">
                        <textarea value={catatan} onChange={e => setCatatan(e.target.value)}
                          placeholder="Catatan (opsional approve, wajib tolak)" rows={2}
                          className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-400 bg-gray-50 resize-none" />
                        <div className="flex gap-2">
                          <button onClick={() => { setSelected(null); setCatatan('') }}
                            className="flex-1 border-2 border-gray-100 text-gray-500 text-xs py-2 rounded-xl font-semibold">Batal</button>
                          <button onClick={() => rejectVerifikasi(v)} disabled={processing}
                            className="flex-1 bg-red-500 text-white text-xs py-2 rounded-xl font-bold disabled:opacity-50">Tolak</button>
                          <button onClick={() => approveVerifikasi(v)} disabled={processing}
                            className="flex-1 bg-blue-600 text-white text-xs py-2 rounded-xl font-bold disabled:opacity-50">Setujui</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setSelected(v)}
                        className="w-full bg-gray-900 text-white text-xs py-2.5 rounded-xl font-bold hover:bg-gray-700 transition">
                        Review Pengajuan
                      </button>
                    )
                  )}
                  {v.status === 'terverifikasi' && (
                    <button onClick={() => revokeVerifikasi(v.user_id)} disabled={processing}
                      className="w-full border-2 border-red-100 text-red-500 text-xs py-2 rounded-xl font-semibold hover:bg-red-50 transition">
                      Cabut Verifikasi KYC
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── TAB PENGGUNA ── */}
        {tab === 'pengguna' && (
          <>
            <p className="text-xs text-gray-400 font-medium">{penggunaList.length} pengguna terdaftar</p>
            {penggunaList.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {(p.nama || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-gray-900 text-sm truncate">{p.nama || 'Belum isi nama'}</p>
                      {p.is_wa_verified && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">WA</span>}
                      {p.is_verified && (
                        <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:14, height:14, background:'#3b82f6', color:'white', borderRadius:'50%', fontSize:9, fontWeight:'bold' }}>✓</span>
                      )}
                      {p.is_admin && <span className="text-xs bg-gray-900 text-white px-1.5 py-0.5 rounded font-bold">ADMIN</span>}
                    </div>
                    <p className="text-xs text-gray-400">+{p.nomor_wa}</p>
                    {p.username && <p className="text-xs text-gray-400">@{p.username}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {p.is_verified && <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700">KYC</span>}
                    {p.is_wa_verified && <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-700">WA</span>}
                    {!p.is_verified && !p.is_wa_verified && <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-gray-100 text-gray-400">Belum</span>}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── TAB TOKO ── */}
        {tab === 'toko' && (
          <>
            <p className="text-xs text-gray-400 font-medium">{tokoList.length} toko/jasa/preloved</p>
            {tokoList.map(t => (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span>{t.jenis === 'jasa' ? '🛠️' : t.jenis === 'preloved' ? '♻️' : '🏪'}</span>
                      <p className="font-bold text-gray-900 text-sm truncate">{t.nama}</p>
                    </div>
                    <p className="text-xs text-gray-400">{t.kategori}</p>
                    {t.alamat && <p className="text-xs text-gray-400">📍 {t.alamat}</p>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold mt-1 inline-block ${t.is_buka ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {t.is_buka ? 'Buka' : 'Tutup'}
                    </span>
                  </div>
                  <button onClick={() => hapusToko(t.id)}
                    className="text-xs text-red-400 hover:text-red-600 transition ml-2 flex-shrink-0">Hapus</button>
                </div>
              </div>
            ))}
          </>
        )}

      </div>
    </div>
  )
}
