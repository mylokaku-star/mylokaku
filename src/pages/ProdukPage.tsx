import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

export default function ProdukPage() {
  const navigate = useNavigate()
  const [produk, setProduk] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tokoId, setTokoId] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ nama: '', harga: '', deskripsi: '', foto_url: '' })
  const [saving, setSaving] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)

  useEffect(() => { loadProduk() }, [])

  async function loadProduk() {
    const { data: userData } = await supabase.auth.getUser()
    const { data: tokoData } = await supabase.from('toko').select('id').eq('user_id', userData.user?.id).single()
    if (!tokoData) { setLoading(false); return }
    setTokoId(tokoData.id)
    const { data } = await supabase.from('produk').select('*').eq('toko_id', tokoData.id).order('created_at', { ascending: false })
    setProduk(data || [])
    setLoading(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleUploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Ukuran foto maksimal 2MB'); return }
    setUploadingFoto(true)
    const ext = file.name.split('.').pop()
    const fileName = `${tokoId}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('produk-foto').upload(fileName, file, { upsert: true })
    if (uploadError) { toast.error('Gagal upload foto'); setUploadingFoto(false); return }
    const { data: urlData } = supabase.storage.from('produk-foto').getPublicUrl(fileName)
    setForm(f => ({ ...f, foto_url: urlData.publicUrl }))
    setUploadingFoto(false)
    toast.success('Foto berhasil diupload!')
  }

  function startEdit(p: any) {
    setEditId(p.id)
    setForm({ nama: p.nama, harga: p.harga.toString(), deskripsi: p.deskripsi || '', foto_url: p.foto_url || '' })
  }

  function cancelEdit() {
    setEditId(null)
    setForm({ nama: '', harga: '', deskripsi: '', foto_url: '' })
  }

  async function handleSave(id: string) {
    if (!form.nama || !form.harga) { toast.error('Nama dan harga wajib diisi'); return }
    setSaving(true)
    const { error } = await supabase.from('produk').update({
      nama: form.nama, harga: parseInt(form.harga), deskripsi: form.deskripsi, foto_url: form.foto_url,
    }).eq('id', id)
    setSaving(false)
    if (error) { toast.error('Gagal menyimpan') }
    else { toast.success('Produk berhasil diupdate!'); setEditId(null); loadProduk() }
  }

  async function handleHapus(id: string) {
    if (!confirm('Yakin hapus produk ini?')) return
    const { error } = await supabase.from('produk').delete().eq('id', id)
    if (error) { toast.error('Gagal hapus produk') }
    else { toast.success('Produk dihapus!'); loadProduk() }
  }

  function formatHarga(harga: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(harga)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Memuat...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">←</button>
          <span className="font-extrabold text-gray-900">Kelola Produk</span>
        </div>
        <button
          onClick={() => navigate('/tambah-produk')}
          className="text-xs bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl font-bold shadow-sm hover:from-red-600 hover:to-red-700 transition"
        >
          + Tambah
        </button>
      </div>

      <div className="max-w-lg mx-auto p-4">
        {produk.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl mb-4 block">📦</span>
            <p className="text-gray-600 font-bold mb-2">Belum ada produk</p>
            <p className="text-gray-400 text-sm mb-6">Tambahkan produk pertamamu sekarang!</p>
            <button
              onClick={() => navigate('/tambah-produk')}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white text-sm px-6 py-3 rounded-2xl font-bold shadow-lg shadow-red-100 hover:from-red-600 hover:to-red-700 transition"
            >
              + Tambah Produk Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {produk.map(p => (
              <div key={p.id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                {editId === p.id ? (
                  <div className="p-5 space-y-3">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Edit Produk</p>
                    <div>
                      <label className="text-xs text-gray-500 font-semibold block mb-1">Foto Produk</label>
                      {form.foto_url && (
                        <img src={form.foto_url} alt="foto" className="w-full h-32 object-cover rounded-2xl mb-2" />
                      )}
                      <label className={`w-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl py-2.5 text-xs cursor-pointer hover:bg-gray-50 transition font-semibold text-gray-500 ${uploadingFoto ? 'opacity-50' : ''}`}>
                        <input type="file" accept="image/*" onChange={handleUploadFoto} disabled={uploadingFoto} className="hidden" />
                        {uploadingFoto ? '⏳ Mengupload...' : '📷 Ganti Foto'}
                      </label>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-semibold block mb-1">Nama Produk</label>
                      <input name="nama" value={form.nama} onChange={handleChange}
                        className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-semibold block mb-1">Harga (Rp)</label>
                      <input name="harga" type="number" value={form.harga} onChange={handleChange}
                        className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 bg-gray-50 transition" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-semibold block mb-1">Deskripsi</label>
                      <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange} rows={2}
                        className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 bg-gray-50 transition resize-none" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleSave(p.id)} disabled={saving}
                        className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm py-2.5 rounded-xl font-bold transition disabled:opacity-50">
                        {saving ? 'Menyimpan...' : 'Simpan'}
                      </button>
                      <button onClick={cancelEdit}
                        className="flex-1 border-2 border-gray-100 text-gray-600 text-sm py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition">
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {p.foto_url && (
                      <img src={p.foto_url} alt={p.nama} className="w-full h-40 object-cover" />
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-bold text-gray-900 text-sm">{p.nama}</h3>
                        <span className="text-sm font-extrabold text-red-600 ml-3">{formatHarga(p.harga)}</span>
                      </div>
                      {p.deskripsi && <p className="text-xs text-gray-400 mb-3">{p.deskripsi}</p>}
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => startEdit(p)}
                          className="flex-1 border-2 border-gray-100 text-gray-600 text-xs py-2 rounded-xl font-semibold hover:bg-gray-50 transition">
                          ✏️ Edit
                        </button>
                        <button onClick={() => handleHapus(p.id)}
                          className="flex-1 border-2 border-red-100 text-red-500 text-xs py-2 rounded-xl font-semibold hover:bg-red-50 transition">
                          🗑️ Hapus
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