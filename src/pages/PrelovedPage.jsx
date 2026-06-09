import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function PrelovedPage() {
  const navigate = useNavigate()
  const [pencarian, setPencarian] = useState('')

  // Data contoh/dummy barang preloved terdekat
  const contohBarang = [
    { id: 1, nama: "Sepeda Anak Ol strangers", harga: "Rp 350.000", jarak: "400m", foto: "🚲", kondisi: "Bekas (Bagus)" },
    { id: 2, nama: "Meja Belajar Kayu Jati", harga: "Rp 200.000", jarak: "1.2km", foto: "🪑", kondisi: "Sangat Layak" },
    { id: 3, nama: "Blender Philips HR2115", harga: "Rp 150.000", jarak: "800m", foto: "🍹", kondisi: "Minus Dus" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => navigate('/')} className="text-xl text-gray-600">
          ←
        </button>
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Cari barang bekas di sekitarmu..."
            value={pencarian}
            onChange={(e) => setPencarian(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:border-amber-400 transition"
          />
        </div>
      </div>

      {/* Konten Utama */}
      <div className="p-6 max-w-md mx-auto w-full flex-1">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-gray-900">Barang Preloved Sekitar</h1>
          <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">Hyperlocal</span>
        </div>

        {/* List Barang */}
        <div className="grid grid-cols-1 gap-3">
          {contohBarang.map((barang) => (
            <div key={barang.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex gap-4 items-center">
              <div className="w-16 h-16 bg-amber-50 rounded-xl flex items-center justify-center text-3xl">
                {barang.foto}
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                  {barang.kondisi}
                </span>
                <h3 className="font-bold text-gray-800 text-sm mt-1">{barang.nama}</h3>
                <p className="text-sm font-black text-gray-900 mt-0.5">{barang.harga}</p>
                <p className="text-[11px] text-gray-400 mt-1">📍 {barang.jarak} dari lokasi Anda</p>
              </div>
              <button 
                onClick={() => alert('Fitur chat penjual segera hadir!')}
                className="bg-gray-50 hover:bg-amber-50 border border-gray-100 hover:border-amber-200 p-2 rounded-xl transition text-sm"
              >
                💬
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}