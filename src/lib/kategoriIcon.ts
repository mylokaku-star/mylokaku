// ============================================================
// LOKAKU — Icon Kategori untuk Peta & UI
// ============================================================

export const ICON_KATEGORI: Record<string, string> = {
  // ── TOKO / PRODUK ──
  // Kuliner & Makanan
  'Makanan Siap Saji / Warung Nasi': '🍜',
  'Camilan & Jajanan Pasar': '🍡',
  'Katering & Frozen Food': '🍱',
  'Bahan Kue & Kemasan': '🧁',

  // Sembako & Kebutuhan Rumah
  'Warung Kelontong / Agen Sembako': '🛒',
  'Agen Gas LPG & Air Galon': '🪣',
  'Alat Listrik & Lampu': '💡',
  'Perabotan Rumah Tangga': '🪑',
  'Toko Bahan Bangunan': '🧱',

  // Fresh Market & Produsen Lokal
  'Petani Sayur & Buah Segar': '🥬',
  'Peternak Lokal (Telur, Ayam Potong)': '🥚',
  'Budidaya Ikan Tawar': '🐟',

  // Fashion & Kecantikan
  'Pakaian Pria, Wanita & Anak': '👕',
  'Hijab & Busana Muslim': '🧕',
  'Sepatu, Tas & Aksesori': '👟',
  'Kosmetik, Skincare & Parfum': '💄',
  'Pakaian Bekas (Thrift Shop)': '🧥',

  // Otomotif & Kendaraan
  'Showroom Mobil/Motor Bekas': '🚗',
  'Suku Cadang, Ban, Oli & Helm': '⚙️',

  // Elektronik & Gadget
  'Handphone & Aksesori Gadget': '📱',
  'Konter Pulsa, Kuota & Voucher Game': '📶',
  'Elektronik Rumah Tangga': '📺',

  // Hobi, Edukasi & Perlengkapan
  'Alat Tulis & Perlengkapan Sekolah': '📚',
  'Perlengkapan Ibadah & Adat': '🕌',
  'Toko Buku & Mainan Anak': '🎠',
  'Pet Shop (Pakan & Obat Hewan)': '🐾',
  'Alat Olahraga & Pancing': '🎣',

  // ── JASA / PELAYANAN ──
  // Jasa Sosial & Gaya Hidup
  'Pendamping Acara (Personal Assistant)': '🤝',
  'Wisata & Trip Lokal': '🧭',
  'MC, DJ & Hiburan Acara': '🎤',
  'Dekorasi Tenda & Panggung': '🎪',
  'Fotografer & Videografer': '📸',

  // Jasa Kesehatan & Perawatan
  'Pendamping Pasien & Lansia': '🏥',
  'Home Care Perawat': '💉',
  'Pijat Tradisional, Refleksi & Bekam': '💆',
  'Salon & MUA Panggilan': '💅',

  // Jasa Harian & Logistik
  'Laundry (Kiloan, Satuan, Sepatu, Tas)': '👕',
  'Supir Harian & Antar-Jemput': '🚗',
  'Kurir Barang & Logistik Lokal': '📦',
  'Cleaning Service / Cuci Sofa & Kasur': '🧹',

  // Jasa Teknis, Perbaikan & Sanitasi
  'Servis Elektronik (AC, HP, Laptop, TV)': '🔧',
  'Bengkel & Tambal Ban Panggilan': '🔩',
  'Cuci Kendaraan (Motor/Mobil)': '🚿',
  'Tukang Bangunan & Renovasi': '🏗️',
  'Sedot WC & Saluran Mampet': '🚽',
  'Tebang Pohon & Tebas Rumput': '🌿',

  // Jasa Edukasi & Profesional
  'Privat & Les (Pelajaran, Mengaji, Musik)': '📖',
  'Pelatih Olahraga': '🏋️',
  'Biro Jasa Dokumen (STNK, SIM, Paspor)': '📋',
  'Jasa Kreatif & Admin': '🎨',
  'Mantri Hewan & Inseminasi Buatan': '🐄',
}

// Icon grup/kategori utama (untuk filter & peta)
export const ICON_GRUP: Record<string, string> = {
  // Toko
  'Kuliner & Makanan': '🍜',
  'Sembako & Kebutuhan Rumah': '🛒',
  'Fresh Market & Produsen Lokal': '🥬',
  'Fashion & Kecantikan': '👕',
  'Otomotif & Kendaraan': '🚗',
  'Elektronik & Gadget': '📱',
  'Hobi, Edukasi & Perlengkapan': '📚',
  // Jasa
  'Jasa Sosial & Gaya Hidup': '🤝',
  'Jasa Kesehatan & Perawatan': '🏥',
  'Jasa Harian & Logistik': '📦',
  'Jasa Teknis, Perbaikan & Sanitasi': '🔧',
  'Jasa Edukasi & Profesional': '📖',
}

// Fungsi helper — ambil icon berdasarkan kategori
export function getIconKategori(kategori: string, jenis?: string): string {
  if (ICON_KATEGORI[kategori]) return ICON_KATEGORI[kategori]
  if (ICON_GRUP[kategori]) return ICON_GRUP[kategori]
  return jenis === 'jasa' ? '🛠️' : '🏪'
}

// Warna marker peta berdasarkan jenis
export function getWarnaMarker(jenis?: string): string {
  return jenis === 'jasa' ? '#2563eb' : '#16a34a'
}

// Buat HTML marker untuk Leaflet
export function buatMarkerHTML(kategori: string, jenis?: string): string {
  const icon = getIconKategori(kategori, jenis)
  const warna = getWarnaMarker(jenis)
  return `
    <div style="
      background: ${warna};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      border: 2px solid white;
    ">
      <span style="transform: rotate(45deg); font-size: 16px; line-height: 1;">${icon}</span>
    </div>
  `
}
