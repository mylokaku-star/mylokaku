import { useEffect, useRef, useState } from 'react'
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

  useEffect(() => {
    loadData()
  }, [tokoId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [pesan])

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
        .select('pembeli_id, pengirim_email')
        .eq('toko_id', tokoId)
        .not('pembeli_id', 'is', null)

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
        await loadPesan(unique[0].pembeli_id, true)
      }
    } else {
      setSelectedPembeli(userData.user.id)
      await loadPesan(userData.user.id, false)
    }

    setLoading(false)

    // Realtime
    const channel = supabase
      .channel(`chat-${tokoId}-${userData.user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'pesan',
        filter: `toko_id=eq.${tokoId}`,
      }, async payload => {
        const msg = payload.new as any
        const currentPembeli = penjual ? selectedPembeli : userData.user.id
        if (msg.pembeli_id === currentPembeli) {
          setPesan(prev => [...prev, msg])
          if (penjual && !msg.is_penjual) {
            await supabase.from('pesan').update({ is_read: true }).eq('id', msg.id)
          }
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }

  async function loadPesan(pembeliId: string, markRead: boolean) {
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
  }

  async function pilihPembeli(pembeliId: string) {
    setSelectedPembeli(pembeliId)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Memuat chat...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => navigate(isPenjual ? '/dashboard' : `/toko/${tokoId}`)}
          className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-200 transition"
        >←</button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center text-white font-black text-sm">
            {toko?.nama?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-extrabold text-gray-900 text-sm">{toko?.nama}</p>
            <p className="text-xs text-gray-400">
              {isPenjual ? `${pembeliList.length} percakapan` : 'Chat dengan penjual'}
            </p>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-xl font-bold ${toko?.is_buka ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {toko?.is_buka ? '🟢 Buka' : '🔴 Tutup'}
        </span>
      </div>

      {isPenjual && pembeliList.length > 0 && (
        <div className="bg-white border-b border-gray-100 px-4 py-2 flex gap-2 overflow-x-auto">
          {pembeliList.map(p => (
            <button
              key={p.pembeli_id}
              onClick={() => pilihPembeli(p.pembeli_id)}
              className={`text-xs px-3 py-1.5 rounded-xl whitespace-nowrap font-semibold border-2 transition ${selectedPembeli === p.pembeli_id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-100'}`}
            >
              👤 {p.pengirim_email?.split('@')[0]}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-24">
        {pesan.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl mb-3 block">💬</span>
            <p className="text-gray-500 font-semibold text-sm">Belum ada pesan</p>
            <p className="text-gray-400 text-xs mt-1">
              {isPenjual ? 'Belum ada pesan dari pembeli ini' : 'Tanya ketersediaan produk atau jam buka'}
            </p>
          </div>
        ) : (
          pesan.map(p => {
            const isDari = p.pengirim_id === user?.id
            return (
              <div key={p.id} className={`flex ${isDari ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs flex flex-col gap-1 ${isDari ? 'items-end' : 'items-start'}`}>
                  {!isDari && (
                    <span className="text-xs text-gray-400 px-1 font-semibold">
                      {p.is_penjual ? '🏪 Penjual' : '👤 Pembeli'}
                    </span>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isDari ? 'bg-gradient-to-br from-green-500 to-green-600 text-white rounded-br-md' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md shadow-sm'}`}>
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
        <div ref={bottomRef} />
      </div>

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