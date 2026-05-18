import type { ExerciseEntry, Exercise } from '../../db/schema'

interface Props {
  entry: ExerciseEntry
  exercise: Exercise | undefined
  selectMode: boolean
  checked: boolean
  onEdit: (entry: ExerciseEntry) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
}

export function EntryRow({ entry, exercise, selectMode, checked, onEdit, onDelete, onToggle }: Props) {
  const abbr = exercise?.abbreviation ?? '???'

  const weightStr = entry.weightDelta
    ? entry.weightDelta
    : `${entry.mainWeight}k`

  const warmupStr = entry.warmupWeight != null
    ? `${entry.warmupWeight}k`
    : '-'

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
        <div className="flex-1 flex items-baseline justify-between">
          <div>
            <p className="font-mono text-sm leading-snug">
              {abbr} {weightStr}
            </p>
            <p className="font-mono text-sm leading-snug text-neutral-400">
              {warmupStr} {repsStr}
            </p>
          </div>
          {!selectMode && (
            <button
              className="text-neutral-600 hover:text-red-500 transition-colors px-2 py-1 text-xs"
              onClick={(e) => { e.stopPropagation(); onDelete(entry.id) }}
              aria-label="削除"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
