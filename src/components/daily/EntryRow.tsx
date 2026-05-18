import type { ExerciseEntry, Exercise } from '../../db/schema'

interface Props {
  entry: ExerciseEntry
  exercise: Exercise | undefined
  selectMode: boolean
  checked: boolean
  isFirst: boolean
  isLast: boolean
  onEdit: (entry: ExerciseEntry) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
}

export function EntryRow({ entry, exercise, selectMode, checked, isFirst, isLast, onEdit, onDelete, onToggle, onMoveUp, onMoveDown }: Props) {
  const abbr = exercise?.abbreviation ?? '???'
  const weightStr = entry.weightDelta ? entry.weightDelta : `${entry.mainWeight}k`
  const warmupStr = entry.warmupWeight != null ? `${entry.warmupWeight}k` : '-'
  const repsStr = entry.reps.map(r => `/${r}`).join('')

  return (
    <div
      className="py-3 border-b border-neutral-800 cursor-pointer active:opacity-60 transition-opacity"
      onClick={() => selectMode ? onToggle(entry.id) : onEdit(entry)}
    >
      <div className="flex items-center gap-3">
        {selectMode && (
          <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
            checked ? 'bg-white border-white' : 'border-neutral-600'
          }`}>
            {checked && <span className="text-black text-xs font-bold">✓</span>}
          </span>
        )}
        <div className="flex-1 flex items-center justify-between">
          <div>
            <p className="font-mono text-sm leading-snug">{abbr} {weightStr}</p>
            <p className="font-mono text-sm leading-snug text-neutral-400">{warmupStr} {repsStr}</p>
          </div>
          {!selectMode && (
            <div className="flex items-center">
              <button onClick={e => { e.stopPropagation(); onMoveUp(entry.id) }} disabled={isFirst}
                className="text-neutral-600 hover:text-white disabled:opacity-20 px-1.5 py-1 text-sm leading-none">↑</button>
              <button onClick={e => { e.stopPropagation(); onMoveDown(entry.id) }} disabled={isLast}
                className="text-neutral-600 hover:text-white disabled:opacity-20 px-1.5 py-1 text-sm leading-none">↓</button>
              <button onClick={e => { e.stopPropagation(); onDelete(entry.id) }}
                className="text-neutral-600 hover:text-red-500 transition-colors px-2 py-1 text-xs ml-1" aria-label="削除">×</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
