// ============================================================
// LOKAKU — Master Kategori Toko, Jasa & Preloved
// ============================================================

export const KATEGORI_TOKO: { grup: string; items: string[] }[] = [
  {
    grup: 'Kuliner & Makanan',
    items: [
      'Makanan Siap Saji / Warung Nasi',
      'Camilan & Jajanan Pasar',
      'Katering & Frozen Food',
      'Bahan Kue & Kemasan',
    ],
  },
  {
    grup: 'Sembako & Kebutuhan Rumah',
    items: [
      'Warung Kelontong / Agen Sembako',
      'Agen Gas LPG & Air Galon',
      'Alat Listrik & Lampu',
      'Perabotan Rumah Tangga',
      'Toko Bahan Bangunan',
    ],
  },
  {
    grup: 'Fresh Market & Produsen Lokal',
    items: [
      'Petani Sayur & Buah Segar',
      'Peternak Lokal (Telur, Ayam Potong)',
      'Budidaya Ikan Tawar',
    ],
  },
  {
    grup: 'Fashion & Kecantikan',
    items: [
      'Pakaian Pria, Wanita & Anak',
      'Hijab & Busana Muslim',
      'Sepatu, Tas & Aksesori',
      'Kosmetik, Skincare & Parfum',
      'Pakaian Bekas (Thrift Shop)',
    ],
  },
  {
    grup: 'Otomotif & Kendaraan',
    items: [
      'Showroom Mobil/Motor Bekas',
      'Suku Cadang, Ban, Oli & Helm',
    ],
  },
  {
    grup: 'Elektronik & Gadget',
    items: [
      'Handphone & Aksesori Gadget',
      'Konter Pulsa, Kuota & Voucher Game',
      'Elektronik Rumah Tangga',
    ],
  },
  {
    grup: 'Hobi, Edukasi & Perlengkapan',
    items: [
      'Alat Tulis & Perlengkapan Sekolah',
      'Perlengkapan Ibadah & Adat',
      'Toko Buku & Mainan Anak',
      'Pet Shop (Pakan & Obat Hewan)',
      'Alat Olahraga & Pancing',
    ],
  },
]

export const KATEGORI_JASA: { grup: string; items: string[] }[] = [
  {
    grup: 'Jasa Sosial & Gaya Hidup',
    items: [
      'Pendamping Acara (Personal Assistant)',
      'Wisata & Trip Lokal',
      'MC, DJ & Hiburan Acara',
      'Dekorasi Tenda & Panggung',
      'Fotografer & Videografer',
    ],
  },
  {
    grup: 'Jasa Kesehatan & Perawatan',
    items: [
      'Pendamping Pasien & Lansia',
      'Home Care Perawat',
      'Pijat Tradisional, Refleksi & Bekam',
      'Salon & MUA Panggilan',
    ],
  },
  {
    grup: 'Jasa Harian & Logistik',
    items: [
      'Laundry (Kiloan, Satuan, Sepatu, Tas)',
      'Supir Harian & Antar-Jemput',
      'Kurir Barang & Logistik Lokal',
      'Cleaning Service / Cuci Sofa & Kasur',
    ],
  },
  {
    grup: 'Jasa Teknis, Perbaikan & Sanitasi',
    items: [
      'Servis Elektronik (AC, HP, Laptop, TV)',
      'Bengkel & Tambal Ban Panggilan',
      'Cuci Kendaraan (Motor/Mobil)',
      'Tukang Bangunan & Renovasi',
      'Sedot WC & Saluran Mampet',
      'Tebang Pohon & Tebas Rumput',
    ],
  },
  {
    grup: 'Jasa Edukasi & Profesional',
    items: [
      'Privat & Les (Pelajaran, Mengaji, Musik)',
      'Pelatih Olahraga',
      'Biro Jasa Dokumen (STNK, SIM, Paspor)',
      'Jasa Kreatif & Admin',
      'Mantri Hewan & Inseminasi Buatan',
    ],
  },
]

export const KATEGORI_PRELOVED: { grup: string; items: string[] }[] = [
  {
    grup: 'Kendaraan & Otomotif Bekas',
    items: [
      'Mobil Bekas Pribadi',
      'Motor Bekas Pribadi',
      'Sepeda Anak & Dewasa',
      'Aksesori & Suku Cadang Bekas',
    ],
  },
  {
    grup: 'Gadget & Elektronik Bekas',
    items: [
      'HP, Tablet & Laptop Bekas',
      'TV, Kulkas & Mesin Cuci Bekas',
      'Kipas, Rice Cooker & Elektronik Kecil',
    ],
  },
  {
    grup: 'Perabotan & Alat Rumah Tangga',
    items: [
      'Kasur, Lemari & Sofa Bekas',
      'Meja, Kursi & Rak Buku',
      'Alat Dapur Layak Pakai',
    ],
  },
  {
    grup: 'Fashion & Keperluan Anak (Thrift)',
    items: [
      'Pakaian & Jaket Preloved',
      'Stroller & Mainan Anak Bekas',
      'Tas & Sepatu Bekas Layak Pakai',
    ],
  },
]

// Flat list
export const KATEGORI_TOKO_FLAT: string[] = KATEGORI_TOKO.flatMap(g => g.items)
export const KATEGORI_JASA_FLAT: string[] = KATEGORI_JASA.flatMap(g => g.items)
export const KATEGORI_PRELOVED_FLAT: string[] = KATEGORI_PRELOVED.flatMap(g => g.items)
export const SEMUA_KATEGORI_FLAT: string[] = [
  ...KATEGORI_TOKO_FLAT,
  ...KATEGORI_JASA_FLAT,
  ...KATEGORI_PRELOVED_FLAT,
]
