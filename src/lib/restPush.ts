// 画面オフ中でもレスト終了を知らせるためのプッシュ通知（iOS はホーム画面に追加した場合のみ対応）

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function isPushEnabled(): boolean {
  return isPushSupported() && Notification.permission === 'granted'
}

// push-sw.js の終了通知と同じ tag にして、終了時に「レスト中」が「レスト終了」で置き換わるようにする
const NOTIFICATION_TAG = 'rest-timer'

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

// iOS の Web 通知は表示後に中身を更新できないので、残り秒数ではなく終了時刻を出す
export async function showRunningNotification(endAt: number, seconds: number): Promise<void> {
  if (!isPushEnabled()) return
  try {
    const end = new Date(endAt)
    const s = Math.round(seconds)
    const reg = await navigator.serviceWorker.ready
    await reg.showNotification('レスト中', {
      body: `${end.getHours()}:${pad2(end.getMinutes())}:${pad2(end.getSeconds())} に終了（${Math.floor(s / 60)}:${pad2(s % 60)}）`,
      tag: NOTIFICATION_TAG,
      silent: true,
      icon: '/icons/icon-192.png',
    })
  } catch {}
}

export async function closeRestNotifications(): Promise<void> {
  if (!isPushSupported()) return
  try {
    const reg = await navigator.serviceWorker.ready
    for (const n of await reg.getNotifications({ tag: NOTIFICATION_TAG })) n.close()
  } catch {}
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

export async function hasPushSubscription(): Promise<boolean> {
  if (!isPushEnabled()) return false
  try {
    const reg = await navigator.serviceWorker.ready
    return (await reg.pushManager.getSubscription()) != null
  } catch {
    return false
  }
}

async function errorText(res: Response): Promise<string> {
  const text = await res.text().catch(() => '')
  return `サーバー ${res.status}: ${text.slice(0, 150)}`
}

// 成功なら null、失敗なら画面に出す理由を返す
export async function enablePush(): Promise<string | null> {
  if (!isPushSupported()) return 'この環境は通知に対応していません。ホーム画面に追加したアプリから開いてください。'
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return '通知が許可されていません。iPhoneの設定 → 通知 → WorkoutNote を確認してください。'
  try {
    const reg = await navigator.serviceWorker.ready
    if (await reg.pushManager.getSubscription()) return null
    const res = await fetch('/api/rest-timer')
    if (!res.ok) return await errorText(res)
    const { publicKey } = (await res.json()) as { publicKey: string }
    await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToBytes(publicKey),
    })
    return null
  } catch (e) {
    return `登録エラー: ${String(e)}`
  }
}

export type ScheduleResult = { id: string } | { error: string }

// 通知がオフなら null（エラー扱いしない）
export async function schedulePush(delaySeconds: number): Promise<ScheduleResult | null> {
  if (!isPushEnabled()) return null
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return { error: '通知の登録がありません。「通知オン」を押し直してください。' }
    const res = await fetch('/api/rest-timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'schedule', subscription: sub.toJSON(), delaySeconds }),
    })
    if (!res.ok) return { error: await errorText(res) }
    const { messageId } = (await res.json()) as { messageId?: string }
    return messageId ? { id: messageId } : { error: '予約IDが返りませんでした' }
  } catch (e) {
    return { error: `通信エラー: ${String(e)}` }
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
