import { useRef, useState } from 'react'
import { db } from '../../db/schema'
import { BottomNav } from '../shared/BottomNav'

export function Settings() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  function notify(text: string, ok: boolean) {
    setMessage({ text, ok })
    setTimeout(() => setMessage(null), 3000)
  }

  async function handleExport() {
    const [exercises, routines, workoutDays, exerciseEntries] = await Promise.all([
      db.exercises.toArray(),
      db.routines.toArray(),
      db.workoutDays.toArray(),
      db.exerciseEntries.toArray(),
    ])
    const data = { exercises, routines, workoutDays, exerciseEntries, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workout-note-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    notify('エクスポートしました', true)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await db.transaction('rw', db.exercises, db.routines, db.workoutDays, db.exerciseEntries, async () => {
        if (Array.isArray(data.exercises)) await db.exercises.bulkPut(data.exercises)
        if (Array.isArray(data.routines)) await db.routines.bulkPut(data.routines)
        if (Array.isArray(data.workoutDays)) await db.workoutDays.bulkPut(data.workoutDays)
        if (Array.isArray(data.exerciseEntries)) await db.exerciseEntries.bulkPut(data.exerciseEntries)
      })
      notify('インポートしました', true)
    } catch {
      notify('インポートに失敗しました（ファイル形式が正しくない可能性があります）', false)
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleClear() {
    if (!confirm('すべてのデータを削除しますか？\nこの操作は元に戻せません。')) return
    if (!confirm('本当に削除しますか？')) return
    await db.transaction('rw', db.exercises, db.routines, db.workoutDays, db.exerciseEntries, async () => {
      await db.exercises.clear()
      await db.routines.clear()
      await db.workoutDays.clear()
      await db.exerciseEntries.clear()
    })
    notify('すべてのデータを削除しました', true)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="px-4 pt-12 pb-4 border-b border-neutral-800">
        <h1 className="text-base font-bold">設定</h1>
      </div>

      <div className="flex-1 px-4 py-4 flex flex-col gap-6">
        {/* Data section */}
        <section>
          <h2 className="text-xs text-neutral-500 uppercase tracking-widest mb-3">データ</h2>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleExport}
              className="w-full text-left px-4 py-3 rounded-xl bg-neutral-900 text-sm hover:bg-neutral-800 transition-colors"
            >
              JSONエクスポート
              <span className="text-neutral-500 text-xs ml-2">全データをファイルに保存</span>
            </button>

            <label className="w-full text-left px-4 py-3 rounded-xl bg-neutral-900 text-sm hover:bg-neutral-800 transition-colors cursor-pointer">
              JSONインポート
              <span className="text-neutral-500 text-xs ml-2">バックアップから復元</span>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleImport}
              />
            </label>
          </div>
        </section>

        {/* Danger zone */}
        <section>
          <h2 className="text-xs text-neutral-500 uppercase tracking-widest mb-3">危険な操作</h2>
          <button
            onClick={handleClear}
            className="w-full text-left px-4 py-3 rounded-xl bg-neutral-900 text-red-500 text-sm hover:bg-neutral-800 transition-colors"
          >
            データを全消去
            <span className="text-neutral-600 text-xs ml-2">元に戻せません</span>
          </button>
        </section>

        {/* App info */}
        <section className="mt-auto">
          <p className="text-neutral-700 text-xs text-center">WorkoutNote</p>
        </section>
      </div>

      {/* Toast */}
      {message && (
        <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium shadow-lg ${
          message.ok ? 'bg-white text-black' : 'bg-red-500 text-white'
        }`}>
          {message.text}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
