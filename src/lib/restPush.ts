// 画面オフ中でもレスト終了を知らせるためのプッシュ通知（iOS はホーム画面に追加した場合のみ対応）

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function isPushEnabled(): boolean {
  return isPushSupported() && Notification.permission === 'granted'
}

function base64UrlToBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const base64 = (base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const raw = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

export async function enablePush(): Promise<boolean> {
  if (!isPushSupported()) return false
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false
  const reg = await navigator.serviceWorker.ready
  if (await reg.pushManager.getSubscription()) return true
  const res = await fetch('/api/rest-timer')
  if (!res.ok) return false
  const { publicKey } = (await res.json()) as { publicKey: string }
  await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64UrlToBytes(publicKey),
  })
  return true
}

export async function schedulePush(delaySeconds: number): Promise<string | null> {
  if (!isPushEnabled()) return null
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return null
    const res = await fetch('/api/rest-timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'schedule', subscription: sub.toJSON(), delaySeconds }),
    })
    if (!res.ok) return null
    const { messageId } = (await res.json()) as { messageId?: string }
    return messageId ?? null
  } catch {
    return null
  }
}

export async function cancelPush(messageId: string): Promise<void> {
  try {
    await fetch('/api/rest-timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', messageId }),
    })
  } catch {}
}
