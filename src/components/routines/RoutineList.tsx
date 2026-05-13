import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import type { Exercise, Routine } from '../../db/schema'
import { saveRoutine, updateRoutine, deleteRoutine, getRoutines } from '../../db/repository'

export function RoutineList() {
  const navigate = useNavigate()

  const routines = useLiveQuery<Routine[], Routine[]>(
    () => getRoutines(),
    [],
    []
  )
  const exercises = useLiveQuery<Exercise[], Exercise[]>(
    () => db.exercises.orderBy('abbreviation').toArray(),
    [],
    []
  )

  const [editTarget, setEditTarget] = useState<Routine | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  function openAdd() {
    setEditTarget(null)
    setFormOpen(true)
  }

  function openEdit(r: Routine) {
    setEditTarget(r)
    setFormOpen(true)
  }

  async function handleDelete(r: Routine) {
    if (!confirm(`「${r.name}」を削除しますか？`)) return
    await deleteRoutine(r.id)
  }

  const exerciseMap = new Map(exercises.map(e => [e.id, e]))

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-neutral-800">
        <button onClick={() => navigate(-1)} className="text-neutral-400 hover:text-white p-1" aria-label="戻る">
          ‹
        </button>
        <h1 className="text-base font-bold">ルーティン</h1>
      </div>

      <div className="flex-1 px-4 py-2">
        {routines.length === 0 && (
          <p className="text-neutral-600 text-sm mt-8 text-center">ルーティンが登録されていません</p>
        )}
        {routines.map(r => (
          <div key={r.id} className="py-3 border-b border-neutral-800">
            <div className="flex items-center justify-between">
              <button className="flex-1 text-left" onClick={() => openEdit(r)}>
                <p className="text-sm font-bold">{r.name}</p>
                <p className="text-xs text-neutral-500 mt-0.5 font-mono">
                  {r.exerciseIds
                    .map(id => exerciseMap.get(id)?.abbreviation ?? '?')
                    .join(' · ')}
                </p>
              </button>
              <button
                onClick={() => handleDelete(r)}
                className="text-neutral-600 hover:text-red-500 transition-colors px-2 py-1 text-xs"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 bg-black border-t border-neutral-800 px-4 py-3 flex justify-end">
        <button
          onClick={openAdd}
          className="bg-white text-black font-bold text-sm px-5 py-2 rounded-full active:opacity-70 transition-opacity"
        >
          ＋ ルーティン追加
        </button>
      </div>

      {formOpen && (
        <RoutineFormSheet
          exercises={exercises}
          initial={editTarget ?? undefined}
          onClose={() => setFormOpen(false)}
        />
      )}
    </div>
  )
}

interface SheetProps {
  exercises: Exercise[]
  initial?: Routine
  onClose: () => void
}

function RoutineFormSheet({ exercises, initial, onClose }: SheetProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [selectedIds, setSelectedIds] = useState<string[]>(initial?.exerciseIds ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const routines = useLiveQuery<Routine[], Routine[]>(() => getRoutines(), [], [])

  function toggleExercise(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function moveUp(index: number) {
    if (index === 0) return
    setSelectedIds(prev => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }

  function moveDown(index: number) {
    setSelectedIds(prev => {
      if (index === prev.length - 1) return prev
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('名前は必須です'); return }
    setSaving(true)
    try {
      if (initial) {
        await updateRoutine(initial.id, { name: name.trim(), exerciseIds: selectedIds })
      } else {
        const maxOrder = routines.length > 0 ? Math.max(...routines.map(r => r.order)) + 1 : 0
        await saveRoutine({ name: name.trim(), exerciseIds: selectedIds, order: maxOrder })
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const exerciseMap = new Map(exercises.map(e => [e.id, e]))

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-neutral-950 border-t border-neutral-800 rounded-t-2xl px-4 pt-4 pb-8 max-h-[90vh] flex flex-col">
        <div className="w-10 h-1 bg-neutral-700 rounded-full mx-auto mb-4 shrink-0" />
        <h2 className="text-sm font-bold mb-4 shrink-0">{initial ? 'ルーティンを編集' : 'ルーティンを追加'}</h2>

        <form onSubmit={handleSave} className="flex flex-col gap-4 overflow-y-auto">
          {/* Name */}
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">名前 *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-neutral-900 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-white/30"
              placeholder="背中の日"
              autoFocus
            />
          </div>

          {/* Selected exercises (order) */}
          {selectedIds.length > 0 && (
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">順番</label>
              <div className="flex flex-col gap-1">
                {selectedIds.map((id, i) => {
                  const ex = exerciseMap.get(id)
                  return (
                    <div key={id} className="flex items-center gap-2 bg-neutral-900 rounded-lg px-3 py-2">
                      <span className="font-mono text-sm flex-1">{ex?.abbreviation ?? '?'}</span>
                      <button type="button" onClick={() => moveUp(i)} disabled={i === 0}
                        className="text-neutral-500 hover:text-white disabled:opacity-20 text-base px-1">↑</button>
                      <button type="button" onClick={() => moveDown(i)} disabled={i === selectedIds.length - 1}
                        className="text-neutral-500 hover:text-white disabled:opacity-20 text-base px-1">↓</button>
                      <button type="button" onClick={() => toggleExercise(id)}
                        className="text-neutral-600 hover:text-red-500 text-sm px-1">×</button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Exercise picker */}
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">種目を選択</label>
            {exercises.length === 0 && (
              <p className="text-xs text-neutral-600">種目マスターに種目を登録してください</p>
            )}
            <div className="flex flex-wrap gap-2">
              {exercises.map(ex => {
                const selected = selectedIds.includes(ex.id)
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => toggleExercise(ex.id)}
                    className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      selected
                        ? 'border-white text-white bg-white/10'
                        : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
                    }`}
                  >
                    {ex.abbreviation}
                  </button>
                )
              })}
            </div>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-3 mt-1 shrink-0">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-neutral-700 text-sm text-neutral-300">
              キャンセル
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 rounded-xl bg-white text-black font-bold text-sm disabled:opacity-40">
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
