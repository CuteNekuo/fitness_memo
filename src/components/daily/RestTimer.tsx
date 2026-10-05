import { useState } from 'react'
import { useRestTimer } from '../../hooks/useRestTimer'
import { useSettings } from '../../hooks/useSettings'
import { REST_PRESETS, REST_ADJUST_SECONDS } from '../../lib/constants'
import { isPushSupported, isPushEnabled, enablePush } from '../../lib/restPush'

function formatTime(ms: number): string {
  const s = Math.ceil(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function RestTimer() {
  const { running, remainingMs, finished, start, adjust, stop, dismiss } = useRestTimer()
  const { settings, updateSettings } = useSettings()
  const [pushOn, setPushOn] = useState(isPushEnabled)

  async function handleEnablePush() {
    try {
      const ok = await enablePush()
      setPushOn(ok)
      if (!ok) alert('通知を有効にできませんでした。iPhoneの設定 → 通知 → WorkoutNote を確認してください。')
    } catch {
      alert('通知の登録に失敗しました。')
    }
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
      <div className="flex items-center justify-between px-4 py-2 border-t border-neutral-800">
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
    )
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t border-neutral-800">
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
      {isPushSupported() && !pushOn && (
        <button
          onClick={handleEnablePush}
          className="shrink-0 px-2 py-2 text-xs text-neutral-500 hover:text-white"
          aria-label="画面オフ中の通知をオンにする"
        >
          通知オン
        </button>
      )}
    </div>
  )
}
