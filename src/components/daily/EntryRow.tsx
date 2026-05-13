import type { ExerciseEntry, Exercise } from '../../db/schema'

interface Props {
  entry: ExerciseEntry
  exercise: Exercise | undefined
  onEdit: (entry: ExerciseEntry) => void
  onDelete: (id: string) => void
}

export function EntryRow({ entry, exercise, onEdit, onDelete }: Props) {
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
      onClick={() => onEdit(entry)}
    >
      <div className="flex items-baseline justify-between">
        <div>
          <p className="font-mono text-sm leading-snug">
            {abbr} {weightStr}
          </p>
          <p className="font-mono text-sm leading-snug text-neutral-400">
            {warmupStr} {repsStr}
          </p>
        </div>
        <button
          className="text-neutral-600 hover:text-red-500 transition-colors px-2 py-1 text-xs"
          onClick={(e) => { e.stopPropagation(); onDelete(entry.id) }}
          aria-label="削除"
        >
          ×
        </button>
      </div>
    </div>
  )
}
