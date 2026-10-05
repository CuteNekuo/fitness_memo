import { useState, useEffect, useCallback } from 'react'
import { REST_STALE_MS } from '../lib/constants'

// 終了時刻を保存しておくと、画面遷移やアプリのバックグラウンド化から戻っても残り時間が正しく出る
const STORAGE_KEY = 'rest_timer_end'

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

  useEffect(() => {
    if (endAt == null) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [endAt])

  useEffect(() => {
    if (endAt == null || now < endAt) return
    setEndAt(null)
    saveEndAt(null)
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
  }, [])

  const adjust = useCallback((deltaSeconds: number) => {
    setEndAt(prev => {
      if (prev == null) return prev
      const e = Math.max(Date.now(), prev + deltaSeconds * 1000)
      saveEndAt(e)
      return e
    })
  }, [])

  const stop = useCallback(() => {
    setEndAt(null)
    saveEndAt(null)
    setFinished(false)
  }, [])

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
