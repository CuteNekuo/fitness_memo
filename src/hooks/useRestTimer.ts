import { useState, useEffect, useCallback, useRef } from 'react'
import { REST_STALE_MS } from '../lib/constants'
import { schedulePush, cancelPush } from '../lib/restPush'

// 終了時刻を保存しておくと、画面遷移やアプリのバックグラウンド化から戻っても残り時間が正しく出る
const STORAGE_KEY = 'rest_timer_end'
const PUSH_ID_KEY = 'rest_timer_push_id'

function loadPushId(): string | null {
  try {
    return localStorage.getItem(PUSH_ID_KEY)
  } catch {
    return null
  }
}

function savePushId(v: string | null) {
  try {
    if (v == null) localStorage.removeItem(PUSH_ID_KEY)
    else localStorage.setItem(PUSH_ID_KEY, v)
  } catch {}
}

function loadEndAt(): number | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v ? Number(v) : null
  } catch {
    return null
  }
}

function saveEndAt(v: number | null) {
  try {
    if (v == null) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, String(v))
  } catch {}
}

// iOS Safari は振動 API 非対応なので音で代替する。AudioContext はユーザー操作中に起こしておかないと鳴らない
let audioCtx: AudioContext | null = null

function unlockAudio() {
  try {
    const Ctx = window.AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    if (!audioCtx) audioCtx = new Ctx()
    if (audioCtx.state === 'suspended') void audioCtx.resume()
  } catch {}
}

function beep() {
  if (!audioCtx) return
  const t = audioCtx.currentTime
  for (let i = 0; i < 3; i++) {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    const at = t + i * 0.3
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.3, at)
    gain.gain.exponentialRampToValueAtTime(0.001, at + 0.2)
    osc.connect(gain).connect(audioCtx.destination)
    osc.start(at)
    osc.stop(at + 0.2)
  }
}

function notify() {
  if ('vibrate' in navigator) navigator.vibrate([300, 150, 300, 150, 300])
  beep()
}

export function useRestTimer() {
  const [endAt, setEndAt] = useState<number | null>(loadEndAt)
  const [now, setNow] = useState(() => Date.now())
  const [finished, setFinished] = useState(false)
  // 予約リクエストの応答順が入れ替わっても、最新の予約だけを残すための世代番号
  const pushGen = useRef(0)

  const reschedulePush = useCallback((delaySeconds: number | null) => {
    const gen = ++pushGen.current
    const old = loadPushId()
    savePushId(null)
    if (old) void cancelPush(old)
    if (delaySeconds == null) return
    void schedulePush(delaySeconds).then(id => {
      if (!id) return
      if (gen !== pushGen.current) void cancelPush(id)
      else savePushId(id)
    })
  }, [])

  useEffect(() => {
    if (endAt == null) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [endAt])

  useEffect(() => {
    if (endAt == null || now < endAt) return
    setEndAt(null)
    saveEndAt(null)
    savePushId(null)
    if (now - endAt < REST_STALE_MS) {
      setFinished(true)
      notify()
    }
  }, [endAt, now])

  const start = useCallback((seconds: number) => {
    unlockAudio()
    const t = Date.now()
    const e = t + seconds * 1000
    setNow(t)
    setEndAt(e)
    saveEndAt(e)
    setFinished(false)
    reschedulePush(seconds)
  }, [reschedulePush])

  const adjust = useCallback((deltaSeconds: number) => {
    if (endAt == null) return
    const t = Date.now()
    const e = Math.max(t, endAt + deltaSeconds * 1000)
    setEndAt(e)
    saveEndAt(e)
    reschedulePush((e - t) / 1000)
  }, [endAt, reschedulePush])

  const stop = useCallback(() => {
    setEndAt(null)
    saveEndAt(null)
    setFinished(false)
    reschedulePush(null)
  }, [reschedulePush])

  const dismiss = useCallback(() => setFinished(false), [])

  return {
    running: endAt != null,
    remainingMs: endAt == null ? 0 : Math.max(0, endAt - now),
    finished,
    start,
    adjust,
    stop,
    dismiss,
  }
}
