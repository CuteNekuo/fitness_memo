import { useState, useEffect } from 'react'
import { useRestTimer } from '../../hooks/useRestTimer'
import { useSettings } from '../../hooks/useSettings'
import { REST_PRESETS, REST_ADJUST_SECONDS } from '../../lib/constants'
import { isPushSupported, hasPushSubscription, enablePush } from '../../lib/restPush'

function formatTime(ms: number): string {
  const s = Math.ceil(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function RestTimer() {
  const { running, remainingMs, finished, pushError, start, adjust, stop, dismiss } = useRestTimer()
  const { settings, updateSettings } = useSettings()
  const [pushOn, setPushOn] = useState(false)
  const [enableError, setEnableError] = useState<string | null>(null)

  useEffect(() => {
    void hasPushSubscription().then(setPushOn)
  }, [])

  async function handleEnablePush() {
    const err = await enablePush()
    setEnableError(err)
    setPushOn(await hasPushSubscription())
  }

  const error = pushError ?? enableError

  function statusLine() {
    if (error) return <p className="px-4 pb-1 text-[11px] text-red-400 break-all">通知エラー: {error}</p>
    if (!isPushSupported()) {
      return <p className="px-4 pb-1 text-[11px] text-neutral-600">画面オフ通知はホーム画面に追加したアプリで使えます</p>
    }
    if (!pushOn) {
      return (
        <button onClick={handleEnablePush} className="px-4 pb-1 text-[11px] text-neutral-400 underline">
          画面オフ通知をオンにする
        </button>
      )
    }
    return <p className="px-4 pb-1 text-[11px] text-neutral-600">画面オフ通知：オン</p>
  }

  if (finished) {
    return (
      <button
        onClick={dismiss}
        className="w-full bg-white text-black font-bold text-sm py-3 animate-pulse"
      >
        レスト終了 — タップで閉じる
      </button>
    )
  }

  if (running) {
    return (
      <div className="border-t border-neutral-800">
        <div className="flex items-center justify-between px-4 py-2">
          <button
            onClick={() => adjust(-REST_ADJUST_SECONDS)}
            className="px-4 py-2 rounded-full bg-neutral-900 text-neutral-300 text-sm font-mono"
          >
            -{REST_ADJUST_SECONDS}
          </button>
          <span className="font-mono text-3xl tabular-nums">{formatTime(remainingMs)}</span>
          <button
            onClick={() => adjust(REST_ADJUST_SECONDS)}
            className="px-4 py-2 rounded-full bg-neutral-900 text-neutral-300 text-sm font-mono"
          >
            +{REST_ADJUST_SECONDS}
          </button>
          <button onClick={stop} className="px-3 py-2 text-xs text-neutral-500 hover:text-white">
            停止
          </button>
        </div>
        {statusLine()}
      </div>
    )
  }

  return (
    <div className="border-t border-neutral-800">
      <div className="flex items-center gap-2 px-4 py-2">
        <span className="text-xs text-neutral-500 shrink-0">レスト</span>
        {REST_PRESETS.map(sec => (
          <button
            key={sec}
            onClick={() => { updateSettings({ restSeconds: sec }); start(sec) }}
            className={`flex-1 py-2 rounded-full text-xs font-mono transition-colors ${
              settings.restSeconds === sec ? 'bg-neutral-700 text-white' : 'bg-neutral-900 text-neutral-400'
            }`}
          >
            {formatTime(sec * 1000)}
          </button>
        ))}
      </div>
      {statusLine()}
    </div>
  )
}
