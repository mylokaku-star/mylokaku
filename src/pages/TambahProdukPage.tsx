import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

export default function TambahProdukPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [form, setForm] = useState({
    nama: '',
    harga: '',
    deskripsi: '',
    foto_url: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleUploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 2MB')
      return
    }
    setUploadingFoto(true)
    const ext = file.name.split('.').pop()
    const fileName = `produk-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('produk-foto')
      .upload(fileName, file, { upsert: true })
    if (uploadError) {
      toast.error('Gagal upload foto')
      setUploadingFoto(false)
      return
    }
    const { data: urlData } = supabase.storage
      .from('produk-foto')
      .getPublicUrl(fileName)
    setForm(f => ({ ...f, foto_url: urlData.publicUrl }))
    setUploadingFoto(false)
    toast.success('Foto berhasil diupload!')
  }

  async function handleSubmit() {
    if (!form.nama || !form.harga) {
      toast.error('Nama dan harga wajib diisi')
      return
    }
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    const { data: tokoData } = await supabase
      .from('toko')
      .select('id')
      .eq('user_id', userData.user?.id)
      .single()
    if (!tokoData) {
      toast.error('Toko tidak ditemukan')
      setLoading(false)
      return
    }
    const { error } = await supabase.from('produk').insert({
      toko_id: tokoData.id,
      nama: form.nama,
      harga: parseInt(form.harga),
      deskripsi: form.deskripsi,
      foto_url: form.foto_url,
    })
    setLoading(false)
    if (error) {
      toast.error('Gagal tambah produk: ' + error.message)
    } else {
      toast.success('Produk berhasil ditambahkan!')
      navigate('/produk')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/produk')} className="text-gray-500 hover:text-gray-800">
          &larr; Kembali
        </button>
        <span className="font-semibold text-gray-800">Tambah Produk</span>
      </div>

      <div className="max-w-lg mx-auto p-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">

          <div>
            <label className="text-sm text-gray-600 block mb-2">Foto Produk</label>
            {form.foto_url && (
              <img src={form.foto_url} alt="foto produk" className="w-full h-40 object-cover rounded-lg mb-2" />
            )}
            <label className={`w-full flex items-center justify-center border border-dashed border-gray-300 rounded-lg py-3 text-sm cursor-pointer hover:bg-gray-50 transition ${uploadingFoto ? 'opacity-50' : ''}`}>
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadFoto}
                disabled={uploadingFoto}
                className="hidden"
              />
              {uploadingFoto ? 'Mengupload...' : 'Pilih Foto Produk (maks 2MB)'}
            </label>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">Nama Produk *</label>
            <input
              name="nama"
              value={form.nama}
              onChange={handleChange}
              placeholder="contoh: Nasi Goreng Spesial"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">Harga (Rp) *</label>
            <input
              name="harga"
              type="number"
              value={form.harga}
              onChange={handleChange}
              placeholder="contoh: 15000"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">Deskripsi Produk</label>
            <textarea
              name="deskripsi"
              value={form.deskripsi}
              onChange={handleChange}
              placeholder="Deskripsi singkat produk..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Tambah Produk'}
          </button>

        </div>
      </div>
    </div>
  )
}
