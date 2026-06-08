import { supabase } from './supabase'

// Cache status verifikasi
const verifikasiCache: Record<string, boolean> = {}

export async function cekVerifikasi(userId: string): Promise<boolean> {
  if (verifikasiCache[userId] !== undefined) return verifikasiCache[userId]

  const { data } = await supabase
    .from('profiles')
    .select('is_verified')
    .eq('id', userId)
    .single()

  const isVerified = data?.is_verified || false
  verifikasiCache[userId] = isVerified
  return isVerified
}

export function clearVerifikasiCache(userId?: string) {
  if (userId) delete verifikasiCache[userId]
  else Object.keys(verifikasiCache).forEach(k => delete verifikasiCache[k])
}
