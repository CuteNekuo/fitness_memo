import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { today, toDateKey, fromDateKey, formatDisplay, addDays } from '../../lib/date'
import { useWorkoutDay } from '../../hooks/useWorkoutDay'
import { applyRoutine, getRoutines } from '../../db/repository'
import { EntryRow } from './EntryRow'
import { EntryEditor } from './EntryEditor'
import { BottomNav } from '../shared/BottomNav'
import { BODY_PARTS } from '../../lib/constants'
import type { ExerciseEntry, Routine } from '../../db/schema'

export function DailyView() {
  const { date } = useParams<{ date: string }>()
  const navigate = useNavigate()
  const dateKey = date ?? toDateKey(today())
  const displayDate = formatDisplay(fromDateKey(dateKey))

  const { entries, exercises, saveEntry, editEntry, removeEntry } = useWorkoutDay(dateKey)
  const routines = useLiveQuery<Routine[], Routine[]>(() => getRoutines(), [], [])

  const [editorOpen, setEditorOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ExerciseEntry | null>(null)
  const [routinePickerOpen, setRoutinePickerOpen] = useState(false)
  const [applying, setApplying] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [groupMode, setGroupMode] = useState(false)

  const exerciseMap = new Map(exercises.map(e => [e.id, e]))

  function enterSelectMode() { setSelectMode(true); setSelectedIds(new Set()) }
  function exitSelectMode() { setSelectMode(false); setSelectedIds(new Set()) }
  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  async function handleBulkDelete() {
    if (selectedIds.size === 0) return
    if (!confirm(`${selectedIds.size}件の記録を削除しますか？`)) return
    await Promise.all([...selectedIds].map(id => removeEntry(id)))
    exitSelectMode()
  }

  async function moveEntry(id: string, delta: number) {
    const idx = entries.findIndex(e => e.id === id)
    if (idx < 0) return
    const target = idx + delta
    if (target < 0 || target >= entries.length) return
    const a = entries[idx]
    const b = entries[target]
    await editEntry(a.id, { order: b.order })
    await editEntry(b.id, { order: a.order })
  }

  function goDay(delta: number) {
    navigate(`/day/${toDateKey(addDays(fromDateKey(dateKey), delta))}`)
  }
  function openAdd() { setEditTarget(null); setEditorOpen(true) }
  function openEdit(entry: ExerciseEntry) { setEditTarget(entry); setEditorOpen(true) }

  async function handleSave(data: Omit<ExerciseEntry, 'id' | 'workoutDayId' | 'order'>) {
    if (editTarget) {
      await editEntry(editTarget.id, data)
    } else {
      await saveEntry(data)
    }
    setEditorOpen(false)
  }

  async function handleApplyRoutine(routineId: string) {
    setApplying(true)
    setRoutinePickerOpen(false)
    try {
      await applyRoutine(routineId, dateKey)
    } finally {
      setApplying(false)
    }
  }

  // 部位グループ表示用: BODY_PARTS 順にグループ化、未分類は末尾
  const groupedSections = (() => {
    if (!groupMode) return null
    const map = new Map<string, ExerciseEntry[]>()
    const uncategorized: ExerciseEntry[] = []
    for (const entry of entries) {
      const bp = exerciseMap.get(entry.exerciseId)?.bodyPart
      if (bp) {
        const arr = map.get(bp) ?? []
        arr.push(entry)
        map.set(bp, arr)
      } else {
        uncategorized.push(entry)
      }
    }
    const knownSections = BODY_PARTS
      .filter(bp => map.has(bp))
      .map(bp => ({ label: bp, items: map.get(bp)! }))
    const unknownSections = [...map.keys()]
      .filter(bp => !(BODY_PARTS as readonly string[]).includes(bp))
      .map(bp => ({ label: bp, items: map.get(bp)! }))
    const sections = [...knownSections, ...unknownSections]
    if (uncategorized.length > 0) sections.push({ label: '未分類', items: uncategorized })
    return sections
  })()

  const hasBodyParts = entries.some(e => exerciseMap.get(e.exerciseId)?.bodyPart)

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 safe-top pb-4">
        <button onClick={() => goDay(-1)} className="text-neutral-400 hover:text-white p-2 -ml-2" aria-label="前の日">‹</button>
        <span className="font-mono text-base tracking-widest">{displayDate}</span>
        <button onClick={() => goDay(1)} className="text-neutral-400 hover:text-white p-2 -mr-2" aria-label="次の日">›</button>
      </div>

      {/* Entry list */}
      <div className="flex-1 px-4">
        {applying && <p className="text-neutral-500 text-xs text-center mt-4">適用中...</p>}
        {entries.length === 0 && !applying && (
          <p className="text-neutral-600 text-sm mt-8 text-center">記録がありません</p>
        )}

        {/* 部位グループ表示 */}
        {groupMode && groupedSections && groupedSections.map(section => (
          <div key={section.label}>
            <p className="text-xs text-neutral-500 tracking-widest mt-4 mb-1">{section.label}</p>
            {section.items.map(entry => (
              <EntryRow
                key={entry.id}
                entry={entry}
                exercise={exerciseMap.get(entry.exerciseId)}
                selectMode={selectMode}
                checked={selectedIds.has(entry.id)}
                isFirst={false}
                isLast={false}
                onEdit={openEdit}
                onToggle={toggleSelect}
                onMoveUp={() => {}}
                onMoveDown={() => {}}
                onDelete={async (id) => {
                  const abbr = exerciseMap.get(entry.exerciseId)?.abbreviation ?? '種目'
                  if (!confirm(`「${abbr}」の記録を削除しますか？`)) return
                  await removeEntry(id)
                }}
              />
            ))}
          </div>
        ))}

        {/* フラット表示 */}
        {!groupMode && entries.map((entry, i) => (
          <EntryRow
            key={entry.id}
            entry={entry}
            exercise={exerciseMap.get(entry.exerciseId)}
            selectMode={selectMode}
            checked={selectedIds.has(entry.id)}
            isFirst={i === 0}
            isLast={i === entries.length - 1}
            onEdit={openEdit}
            onToggle={toggleSelect}
            onMoveUp={(id) => moveEntry(id, -1)}
            onMoveDown={(id) => moveEntry(id, 1)}
            onDelete={async (id) => {
              const abbr = exerciseMap.get(entries.find(e => e.id === id)?.exerciseId ?? '')?.abbreviation ?? '種目'
              if (!confirm(`「${abbr}」の記録を削除しますか？`)) return
              await removeEntry(id)
            }}
          />
        ))}
      </div>

      {/* Action bar */}
      <div className="bg-black border-t border-neutral-800 px-4 py-2 flex items-center justify-between gap-2">
        {selectMode ? (
          <>
            <button onClick={exitSelectMode} className="text-neutral-400 hover:text-white text-sm">キャンセル</button>
            <button onClick={handleBulkDelete} disabled={selectedIds.size === 0}
              className="bg-red-600 text-white font-bold text-sm px-5 py-2 rounded-full active:opacity-70 disabled:opacity-30">
              削除 ({selectedIds.size}件)
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 text-xs text-neutral-500">
              <Link to="/exercises" className="hover:text-white transition-colors">種目</Link>
              <Link to="/routines" className="hover:text-white transition-colors">ルーティン</Link>
              {routines.length > 0 && (
                <button onClick={() => setRoutinePickerOpen(true)} className="hover:text-white transition-colors">適用</button>
              )}
              {entries.length > 0 && (
                <>
                  {hasBodyParts && (
                    <button
                      onClick={() => setGroupMode(v => !v)}
                      className={`transition-colors ${groupMode ? 'text-white font-bold' : 'hover:text-white'}`}
                    >
                      部位別
                    </button>
                  )}
                  <button onClick={enterSelectMode} className="hover:text-white transition-colors">選択</button>
                </>
              )}
            </div>
            <button onClick={openAdd} className="bg-white text-black font-bold text-sm px-5 py-2 rounded-full active:opacity-70 transition-opacity">
              ＋ 種目追加
            </button>
          </>
        )}
      </div>
      <BottomNav />

      {editorOpen && (
        <EntryEditor
          exercises={exercises}
          initial={editTarget ?? undefined}
          onSave={handleSave}
          onClose={() => setEditorOpen(false)}
        />
      )}

      {routinePickerOpen && (
        <RoutinePicker
          routines={routines}
          onSelect={handleApplyRoutine}
          onClose={() => setRoutinePickerOpen(false)}
        />
      )}
    </div>
  )
}

interface RoutinePickerProps {
  routines: Routine[]
  onSelect: (id: string) => void
  onClose: () => void
}

function RoutinePicker({ routines, onSelect, onClose }: RoutinePickerProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-neutral-950 border-t border-neutral-800 rounded-t-2xl px-4 pt-4 pb-safe">
        <div className="w-10 h-1 bg-neutral-700 rounded-full mx-auto mb-4" />
        <h2 className="text-sm font-bold mb-3">ルーティンを適用</h2>
        <div className="flex flex-col gap-1">
          {routines.map(r => (
            <button key={r.id} onClick={() => onSelect(r.id)}
              className="text-left px-3 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-700 transition-colors">
              <span className="text-sm font-bold">{r.name}</span>
              <span className="text-neutral-500 text-xs ml-2">{r.exerciseIds.length}種目</span>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-3 py-3 rounded-xl border border-neutral-700 text-sm text-neutral-300">
          キャンセル
        </button>
      </div>
    </div>
  )
}
