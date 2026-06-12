// src/lib/imageHelper.ts
// Utility kompresi gambar sebelum upload ke Supabase
// Mendukung: JPEG, PNG, WebP
// Target: maks 800px wide, kualitas 75%, maks 500KB

export interface KompresiOptions {
  maxWidth?: number      // default 800px
  maxHeight?: number     // default 800px
  kualitas?: number      // 0-1, default 0.75
  maxSizeKB?: number     // default 500KB
  format?: 'image/jpeg' | 'image/webp' // default jpeg
}

export async function kompresGambar(
  file: File,
  options: KompresiOptions = {}
): Promise<File> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    kualitas = 0.75,
    maxSizeKB = 500,
    format = 'image/jpeg',
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // Hitung dimensi baru dengan mempertahankan aspek rasio
      let { width, height } = img
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      // Buat canvas untuk resize
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas tidak tersedia')); return }

      // Gambar ke canvas dengan smoothing
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      // Coba kompresi dengan kualitas awal, turunkan jika masih terlalu besar
      const coba = (q: number) => {
        canvas.toBlob(blob => {
          if (!blob) { reject(new Error('Gagal kompresi')); return }

          const sizeKB = blob.size / 1024

          if (sizeKB > maxSizeKB && q > 0.3) {
            coba(Math.round((q - 0.1) * 10) / 10)
            return
          }

          const namaFile = file.name.replace(/\.[^.]+$/, '') + '.jpg'
          const fileKompres = new File([blob], namaFile, {
            type: format,
            lastModified: Date.now(),
          })

          resolve(fileKompres)
        }, format, q)
      }

      coba(kualitas)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gagal memuat gambar'))
    }

    img.src = url
  })
}

// Info ukuran file yang mudah dibaca
export function formatUkuran(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Validasi file gambar sebelum diproses
export function validasiGambar(file: File, maxMB = 10): string | null {
  const tipeValid = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
  if (!tipeValid.includes(file.type)) {
    return 'Format file harus JPG, PNG, atau WebP'
  }
  if (file.size > maxMB * 1024 * 1024) {
    return `Ukuran file maksimal ${maxMB}MB`
  }
  return null
}
