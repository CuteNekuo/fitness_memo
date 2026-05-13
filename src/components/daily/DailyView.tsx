import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { today, toDateKey, fromDateKey, formatDisplay, addDays } from '../../lib/date'
import { useWorkoutDay } from '../../hooks/useWorkoutDay'
import { EntryRow } from './EntryRow'
import { EntryEditor } from './EntryEditor'
import type { ExerciseEntry } from '../../db/schema'

export function DailyView() {
  const { date } = useParams<{ date: string }>()
  const navigate = useNavigate()
  const dateKey = date ?? toDateKey(today())
  const displayDate = formatDisplay(fromDateKey(dateKey))

  const { entries, exercises, saveEntry, editEntry, removeEntry } = useWorkoutDay(dateKey)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ExerciseEntry | null>(null)

  const exerciseMap = new Map(exercises.map(e => [e.id, e]))

  function goDay(delta: number) {
    const next = addDays(fromDateKey(dateKey), delta)
    navigate(`/day/${toDateKey(next)}`)
  }

  function openAdd() {
    setEditTarget(null)
    setEditorOpen(true)
  }

  function openEdit(entry: ExerciseEntry) {
    setEditTarget(entry)
    setEditorOpen(true)
  }

  async function handleSave(data: Omit<ExerciseEntry, 'id' | 'workoutDayId' | 'order'>) {
    if (editTarget) {
      await editEntry(editTarget.id, data)
    } else {
      await saveEntry(data)
    }
    setEditorOpen(false)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <button
          onClick={() => goDay(-1)}
          className="text-neutral-400 hover:text-white transition-colors p-2 -ml-2"
          aria-label="前の日"
        >
          ‹
        </button>
        <span className="font-mono text-base tracking-widest">{displayDate}</span>
        <button
          onClick={() => goDay(1)}
          className="text-neutral-400 hover:text-white transition-colors p-2 -mr-2"
          aria-label="次の日"
        >
          ›
        </button>
      </div>

      {/* Entry list */}
      <div className="flex-1 px-4">
        {entries.length === 0 && (
          <p className="text-neutral-600 text-sm mt-8 text-center">記録がありません</p>
        )}
        {entries.map(entry => (
          <EntryRow
            key={entry.id}
            entry={entry}
            exercise={exerciseMap.get(entry.exerciseId)}
            onEdit={openEdit}
            onDelete={removeEntry}
          />
        ))}
      </div>

      {/* Bottom bar */}
      <div className="sticky bottom-0 bg-black border-t border-neutral-800 px-4 py-3 flex items-center justify-between">
        <Link
          to="/exercises"
          className="text-neutral-500 hover:text-white text-xs transition-colors"
        >
          種目一覧
        </Link>
        <button
          onClick={openAdd}
          className="bg-white text-black font-bold text-sm px-5 py-2 rounded-full active:opacity-70 transition-opacity"
        >
          ＋ 種目追加
        </button>
      </div>

      {/* Entry editor modal */}
      {editorOpen && (
        <EntryEditor
          exercises={exercises}
          initial={editTarget ?? undefined}
          onSave={handleSave}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  )
}
