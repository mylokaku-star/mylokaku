import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Cache status auth agar tidak re-fetch setiap navigasi kembali
let cachedStatus: 'ok' | 'no-auth' | 'no-wa' | null = null
let cacheTime = 0
const CACHE_TTL = 30_000 // 30 detik

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'no-auth' | 'no-wa'>(
    cachedStatus && Date.now() - cacheTime < CACHE_TTL ? cachedStatus : 'loading'
  )

  useEffect(() => {
    // Kalau cache masih fresh, skip fetch
    if (cachedStatus && Date.now() - cacheTime < CACHE_TTL) {
      setStatus(cachedStatus)
      return
    }

    async function cek() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        cachedStatus = 'no-auth'; cacheTime = Date.now()
        setStatus('no-auth'); return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_wa_verified')
        .eq('id', userData.user.id)
        .single()

      const result = profile?.is_wa_verified ? 'ok' : 'no-wa'
      cachedStatus = result; cacheTime = Date.now()
      setStatus(result)
    }

    cek()
  }, [])

  // Clear cache saat logout / login
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') {
        cachedStatus = null; cacheTime = 0
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (status === 'loading') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <img src="/icon-192x192.png" alt="Lokaku"
        className="w-10 h-10 rounded-2xl object-cover animate-pulse" />
    </div>
  )

  if (status === 'no-auth') return <Navigate to="/login" replace />
  if (status === 'no-wa') return <Navigate to="/verifikasi-wa" replace />

  return <>{children}</>
}
