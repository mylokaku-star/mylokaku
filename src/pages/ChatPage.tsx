import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

export default function ChatPage() {
  const { tokoId } = useParams()
  const navigate = useNavigate()
  const [toko, setToko] = useState<any>(null)
  const [pesan, setPesan] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [user, setUser] = useState<any>(null)
  const [isPenjual, setIsPenjual] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pembeliList, setPembeliList] = useState<any[]>([])
  const [selectedPembeli, setSelectedPembeli] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const selectedPembeliRef = useRef<string | null>(null)
  const channelRef = useRef<any>(null)

  // FIX 3: Auto-scroll setiap pesan baru masuk
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [pesan])

  // Simpan selectedPembeli ke ref supaya bisa diakses di realtime callback
  useEffect(() => {
    selectedPembeliRef.current = selectedPembeli
  }, [selectedPembeli])

  const loadPesan = useCallback(async (pembeliId: string, markRead: boolean) => {
    const { data } = await supabase
      .from('pesan')
      .select('*')
      .eq('toko_id', tokoId)
      .eq('pembeli_id', pembeliId)
      .order('created_at', { ascending: true })
    setPesan(data || [])

    if (markRead) {
      await supabase
        .from('pesan')
        .update({ is_read: true })
        .eq('toko_id', tokoId)
        .eq('pembeli_id', pembeliId)
        .eq('is_penjual', false)
        .eq('is_read', false)
    }
  }, [tokoId])

  const setupRealtime = useCallback((userId: string, penjual: boolean) => {
    // Hapus channel lama kalau ada
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    // FIX 1: Realtime — channel unik per toko, subscribe ulang yang benar
    const channel = supabase
      .channel(`chat-${tokoId}-${Date.now()}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'pesan',
        filter: `toko_id=eq.${tokoId}`,
      }, async (payload) => {
        const msg = payload.new as any
        // Gunakan ref supaya selalu dapat nilai terbaru
        const currentPembeli = penjual ? selectedPembeliRef.current : userId
        if (msg.pembeli_id === currentPembeli) {
          setPesan(prev => [...prev, msg])
          // Update inbox list kalau ada pembeli baru
          if (penjual && !msg.is_penjual) {
            setPembeliList(prev => {
              const exists = prev.find(p => p.pembeli_id === msg.pembeli_id)
              if (!exists) {
                return [{ pembeli_id: msg.pembeli_id, pengirim_email: msg.pengirim_email }, ...prev]
              }
              // FIX 2: Geser pembeli yang aktif ke paling atas
              return [
                { pembeli_id: msg.pembeli_id, pengirim_email: msg.pengirim_email },
                ...prev.filter(p => p.pembeli_id !== msg.pembeli_id)
              ]
            })
            await supabase.from('pesan').update({ is_read: true }).eq('id', msg.id)
          }
        }
      })
      .subscribe()

    channelRef.current = channel
  }, [tokoId])

  useEffect(() => {
    async function loadData() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { navigate('/login'); return }
      setUser(userData.user)

      const { data: tokoData } = await supabase
        .from('toko').select('*').eq('id', tokoId).single()
      setToko(tokoData)

      const penjual = tokoData?.user_id === userData.user.id
      setIsPenjual(penjual)

      if (penjual) {
        const { data: pesanData } = await supabase
          .from('pesan')
          .select('pembeli_id, pengirim_email, created_at')
          .eq('toko_id', tokoId)
          .not('pembeli_id', 'is', null)
          .order('created_at', { ascending: false }) // FIX 2: terbaru duluan

        const unique: any[] = []
        const seen = new Set()
        pesanData?.forEach(p => {
          if (!seen.has(p.pembeli_id)) {
            seen.add(p.pembeli_id)
            unique.push(p)
          }
        })
        setPembeliList(unique)
        if (unique.length > 0) {
          setSelectedPembeli(unique[0].pembeli_id)
          selectedPembeliRef.current = unique[0].pembeli_id
          await loadPesan(unique[0].pembeli_id, true)
        }
      } else {
        setSelectedPembeli(userData.user.id)
        selectedPembeliRef.current = userData.user.id
        await loadPesan(userData.user.id, false)
      }

      setLoading(false)
      setupRealtime(userData.user.id, penjual)
    }

    loadData()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [tokoId, navigate, loadPesan, setupRealtime])

  async function pilihPembeli(pembeliId: string) {
    setSelectedPembeli(pembeliId)
    selectedPembeliRef.current = pembeliId
    await loadPesan(pembeliId, true)
  }

  async function kirimPesan() {
    if (!input.trim()) return
    const pembeliId = isPenjual ? selectedPembeli : user.id
    const { error } = await supabase.from('pesan').insert({
      toko_id: tokoId,
      pengirim_id: user.id,
      pengirim_email: user.email,
      pembeli_id: pembeliId,
      isi: input.trim(),
      is_penjual: isPenjual,
      is_read: isPenjual,
    })
    if (error) { toast.error('Gagal kirim pesan') }
    else { setInput('') }
  }

  function formatWaktu(timestamp: string) {
    return new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  function getInisial(email: string) {
    return email?.charAt(0).toUpperCase() || '?'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Memuat chat...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => navigate(isPenjual ? '/dashboard' : `/toko/${tokoId}`)}
          className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-200 transition"
        >
          ←
        </button>
        <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center text-green-700 font-bold text-sm">
          {getInisial(toko?.nama || '')}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-gray-800 text-sm truncate">{toko?.nama}</h1>
          <p className="text-xs text-gray-400">{isPenjual ? 'Dashboard Penjual' : 'Chat dengan Penjual'}</p>
        </div>
        <div className={`w-2 h-2 rounded-full ${toko?.is_buka ? 'bg-green-400' : 'bg-gray-300'}`} />
      </div>

      {/* FIX 2: Inbox pembeli — vertikal, terbaru di atas */}
      {isPenjual && pembeliList.length > 0 && (
        <div className="bg-white border-b border-gray-100 px-4 py-2">
          <p className="text-xs text-gray-400 mb-2">Percakapan ({pembeliList.length})</p>
          <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
            {pembeliList.map(p => (
              <button
                key={p.pembeli_id}
                onClick={() => pilihPembeli(p.pembeli_id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition ${
                  selectedPembeli === p.pembeli_id
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  selectedPembeli === p.pembeli_id ? 'bg-green-400 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {getInisial(p.pengirim_email || '')}
                </div>
                <span className="text-xs truncate">
                  {p.pengirim_email || p.pembeli_id?.slice(0, 8) + '...'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Area Pesan */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-3">
        {pesan.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-gray-400 text-sm">Belum ada pesan</p>
            <p className="text-gray-300 text-xs mt-1">Mulai percakapan sekarang</p>
          </div>
        ) : (
          pesan.map(p => {
            const isDari = isPenjual ? p.is_penjual : !p.is_penjual
            return (
              <div key={p.id} className={`flex ${isDari ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex flex-col gap-1 max-w-xs ${isDari ? 'items-end' : 'items-start'}`}>
                  {!isDari && (
                    <span className="text-xs text-gray-400 px-1">
                      {isPenjual ? '👤 Pembeli' : '🏪 Penjual'}
                    </span>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isDari
                      ? 'bg-gradient-to-br from-green-500 to-green-600 text-white rounded-br-md'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md shadow-sm'
                  }`}>
                    {p.isi}
                  </div>
                  <div className="flex items-center gap-1 px-1">
                    <span className="text-xs text-gray-300">{formatWaktu(p.created_at)}</span>
                    {isDari && (
                      <span className="text-xs text-gray-300">{p.is_read ? '✓✓' : '✓'}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        {/* FIX 3: Target auto-scroll */}
        <div ref={bottomRef} />
      </div>

      {/* Input Pesan */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 shadow-lg">
        <div className="flex gap-2 max-w-lg mx-auto">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && kirimPesan()}
            placeholder={isPenjual ? 'Balas pesan pembeli...' : 'Ketik pesan...'}
            className="flex-1 border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm outline-none focus:border-green-400 bg-gray-50 transition"
          />
          <button
            onClick={kirimPesan}
            disabled={!input.trim()}
            className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-sm hover:from-green-600 hover:to-green-700 transition disabled:opacity-40"
          >
            ➤
          </button>
        </div>
      </div>

    </div>
  )
}
