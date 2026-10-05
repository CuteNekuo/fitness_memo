// QStash から予約時刻に呼ばれ、端末へプッシュ通知を送る。
import webpush from 'web-push'
import type { PushSubscription } from 'web-push'

export async function POST(request: Request): Promise<Response> {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) {
    return Response.json({ error: 'VAPID keys are not set' }, { status: 500 })
  }

  const { subscription } = (await request.json()) as { subscription?: PushSubscription }
  if (!subscription?.endpoint) return Response.json({ error: 'bad request' }, { status: 400 })

  webpush.setVapidDetails(new URL(request.url).origin, publicKey, privateKey)
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title: 'レスト終了', body: '次のセットへ' }),
      { TTL: 60, urgency: 'high' },
    )
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 })
  }
  return Response.json({ ok: true })
}
