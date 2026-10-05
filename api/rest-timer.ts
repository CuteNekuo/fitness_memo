// レストタイマー終了時のプッシュ通知を予約・取消する。
// iOS は画面オフ中に Web アプリの JS を止めるため、指定秒後に QStash から /api/rest-push を呼ばせて通知を送る。

const QSTASH_URL = process.env.QSTASH_URL ?? 'https://qstash.upstash.io'
const MAX_DELAY_SECONDS = 60 * 30

interface RequestBody {
  action?: string
  subscription?: unknown
  delaySeconds?: number
  messageId?: string
}

export function GET(): Response {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  if (!publicKey) return Response.json({ error: 'VAPID_PUBLIC_KEY is not set' }, { status: 500 })
  return Response.json({ publicKey })
}

export async function POST(request: Request): Promise<Response> {
  const token = process.env.QSTASH_TOKEN
  if (!token) return Response.json({ error: 'QSTASH_TOKEN is not set' }, { status: 500 })

  const body = (await request.json()) as RequestBody

  if (body.action === 'cancel' && typeof body.messageId === 'string') {
    await fetch(`${QSTASH_URL}/v2/messages/${encodeURIComponent(body.messageId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    return Response.json({ ok: true })
  }

  if (body.action === 'schedule' && body.subscription && typeof body.delaySeconds === 'number') {
    const delay = Math.min(MAX_DELAY_SECONDS, Math.max(1, Math.round(body.delaySeconds)))
    const destination = `${new URL(request.url).origin}/api/rest-push`
    const res = await fetch(`${QSTASH_URL}/v2/publish/${destination}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Upstash-Delay': `${delay}s`,
        // 遅れて届くアラームは意味がないので再送しない
        'Upstash-Retries': '0',
      },
      body: JSON.stringify({ subscription: body.subscription }),
    })
    if (!res.ok) return Response.json({ error: await res.text() }, { status: 502 })
    const { messageId } = (await res.json()) as { messageId: string }
    return Response.json({ messageId })
  }

  return Response.json({ error: 'bad request' }, { status: 400 })
}
