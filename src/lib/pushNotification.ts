// src/lib/pushNotification.ts
import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = 'BO1gAoxjRMpwHkMHCaoNNQZBZ5RXX_nySlV44VO_kRrJnok6yo4o1ZnnaSzGrYo1tnZAFd4FFYnCLuBQkUgc1Go'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function daftarkanPushNotification(): Promise<boolean> {
  try {
    // 1. Cek dukungan browser
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notification tidak didukung browser ini')
      return false
    }

    // 2. Minta izin
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('Izin notifikasi ditolak')
      return false
    }

    // 3. Ambil service worker registration
    const registration = await navigator.serviceWorker.ready

    // 4. Subscribe ke push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })

    // 5. Simpan subscription ke Supabase
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return false

    const subJson = subscription.toJSON()

    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: userData.user.id,
      endpoint: subJson.endpoint,
      p256dh: subJson.keys?.p256dh,
      auth: subJson.keys?.auth,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    if (error) {
      console.error('Gagal simpan push subscription:', error)
      return false
    }

    console.log('Push notification berhasil didaftarkan')
    return true
  } catch (err) {
    console.error('Error daftarkan push:', err)
    return false
  }
}

export async function hapusPushNotification(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) await subscription.unsubscribe()

    const { data: userData } = await supabase.auth.getUser()
    if (userData.user) {
      await supabase.from('push_subscriptions').delete().eq('user_id', userData.user.id)
    }
  } catch (err) {
    console.error('Error hapus push:', err)
  }
}

export async function cekStatusPush(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    return !!subscription && Notification.permission === 'granted'
  } catch {
    return false
  }
}
