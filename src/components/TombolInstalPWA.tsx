import { useEffect, useState } from 'react'
import { Download, Share2 } from 'lucide-react'
import { toast } from 'sonner'

export default function TombolInstalPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isReady, setIsReady] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Deteksi jika pengguna menggunakan iPhone/iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setIsIOS(true)
      setIsReady(true)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsReady(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const aksiInstalasi = async () => {
    if (isIOS) {
      toast.info('Di iPhone: Klik tombol "Share" (kotak panah ke atas) di bawah Safari, lalu pilih "Add to Home Screen" 📲', {
        duration: 6000
      })
      return
    }

    if (!deferredPrompt) {
      toast.error('Aplikasi sudah terinstal atau browser kamu belum mendukung fitur ini.')
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsReady(false)
      setDeferredPrompt(null)
    }
  }

  const aksiBagikanLink = async () => {
    const shareData = {
      title: 'Lokaku - Radar Kebutuhan Sekitarmu',
      text: 'Yuk pakai Lokaku! Cari toko, UMKM, dan penyedia jasa terdekat yang benar-benar aktif secara realtime.',
      url: window.location.origin
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log('Batal membagikan')
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.origin)
        toast.success('Link Lokaku berhasil disalin! Tinggal paste dan share ke WA Teman.')
      } catch (err) {
        toast.error('Gagal menyalin link')
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-sm px-4 mx-auto my-6">
      {/* Tombol Utama: Shortcut Instal Langsung */}
      {isReady && (
        <button
          onClick={aksiInstalasi}
          className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95 animate-bounce"
        >
          <Download size={20} />
          <span>Instal Aplikasi Lokaku</span>
        </button>
      )}

      {/* Tombol Kedua: Untuk Memudahkan Sebar/Share Link ke WA */}
      <button
        onClick={aksiBagikanLink}
        className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-2xl shadow-md transition-all active:scale-95"
      >
        <Share2 size={18} />
        <span>Bagikan Link Aplikasi</span>
      </button>
    </div>
  )
}