import { supabase } from './supabase'

// Cache nama supaya tidak query berulang
const namaCache: Record<string, string> = {}

export async function getNamaPengguna(userId: string): Promise<string> {
  if (namaCache[userId]) return namaCache[userId]

  const { data } = await supabase
    .from('profiles')
    .select('nama')
    .eq('id', userId)
    .single()

  const nama = data?.nama || 'Pengguna'
  namaCache[userId] = nama
  return nama
}

export function clearNamaCache() {
  Object.keys(namaCache).forEach(k => delete namaCache[k])
}
