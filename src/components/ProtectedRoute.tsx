import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'no-auth' | 'no-wa'>('loading')

  useEffect(() => {
    async function cek() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { setStatus('no-auth'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_wa_verified')
        .eq('id', userData.user.id)
        .single()

      if (!profile?.is_wa_verified) { setStatus('no-wa'); return }

      setStatus('ok')
    }
    cek()
  }, [])

  if (status === 'loading') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center text-white font-black text-lg animate-pulse">L</div>
    </div>
  )

  if (status === 'no-auth') return <Navigate to="/login" replace />
  if (status === 'no-wa') return <Navigate to="/verifikasi-wa" replace />

  return <>{children}</>
}
