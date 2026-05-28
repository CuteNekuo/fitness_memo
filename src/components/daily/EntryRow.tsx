import type { ExerciseEntry, Exercise } from '../../db/schema'

interface Props {
  entry: ExerciseEntry
  exercise: Exercise | undefined
  selectMode: boolean
  checked: boolean
  isDragging?: boolean
  isDragTarget?: boolean
  dragIndex?: number
  onEdit: (entry: ExerciseEntry) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
  onDragStart?: (id: string) => void
  onDragMove?: (clientY: number) => void
  onDragEnd?: () => void
}

export function EntryRow({
  entry, exercise, selectMode, checked,
  isDragging, isDragTarget, dragIndex,
  onEdit, onDelete, onToggle,
  onDragStart, onDragMove, onDragEnd,
}: Props) {
  const abbr = exercise?.abbreviation ?? '???'
  const weightStr = entry.weightDelta ? entry.weightDelta : `${entry.mainWeight}k`
  const warmupStr = entry.warmupWeight != null ? `${entry.warmupWeight}k` : '-'
  const repsStr = entry.reps.map(r => `/${r}`).join('')

  return (
    <div
      data-di={dragIndex}
      className={`border-b border-neutral-800 cursor-pointer transition-opacity ${
        isDragging ? 'opacity-30' : 'active:opacity-60'
      } ${isDragTarget ? 'border-t-2 border-t-white' : ''}`}
      onClick={() => selectMode ? onToggle(entry.id) : onEdit(entry)}
    >
      <div className="flex items-center gap-3 py-3">
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
            {entry.memo && <p className="text-xs text-neutral-500 mt-0.5">{entry.memo}</p>}
          </div>
          {!selectMode && (
            <div className="flex items-center">
              <button
                onTouchStart={e => { e.stopPropagation(); onDragStart?.(entry.id) }}
                onTouchMove={e => { e.stopPropagation(); onDragMove?.(e.touches[0].clientY) }}
                onTouchEnd={e => { e.stopPropagation(); onDragEnd?.() }}
                style={{ touchAction: 'none' }}
                className={`px-3 py-3 text-xl leading-none select-none ${
                  onDragStart ? 'text-neutral-500 active:text-white' : 'text-neutral-800'
                }`}
                aria-label="並び替え"
              >⠿</button>
              <button
                onClick={e => { e.stopPropagation(); onDelete(entry.id) }}
                className="text-neutral-600 hover:text-red-500 transition-colors px-3 py-3 text-sm"
                aria-label="削除"
              >×</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
