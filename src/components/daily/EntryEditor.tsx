import { useState, useRef, useEffect } from 'react'
import type { Exercise, ExerciseEntry } from '../../db/schema'
import { upsertExercise } from '../../db/repository'

interface Props {
  exercises: Exercise[]
  initial?: ExerciseEntry
  onSave: (data: Omit<ExerciseEntry, 'id' | 'workoutDayId' | 'order'>) => Promise<void>
  onClose: () => void
}

export function EntryEditor({ exercises, initial, onSave, onClose }: Props) {
  const [abbr, setAbbr] = useState(
    initial ? (exercises.find(e => e.id === initial.exerciseId)?.abbreviation ?? '') : ''
  )
  const [mainWeight, setMainWeight] = useState(String(initial?.mainWeight ?? ''))
  const [warmupWeight, setWarmupWeight] = useState(
    initial?.warmupWeight != null ? String(initial.warmupWeight) : ''
  )
  const [reps, setReps] = useState<string[]>(
    initial ? initial.reps.map(String) : ['']
  )
  const [suggestions, setSuggestions] = useState<Exercise[]>([])
  const [saving, setSaving] = useState(false)
  const abbrRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    abbrRef.current?.focus()
  }, [])

  function handleAbbrChange(value: string) {
    setAbbr(value)
    if (value.length === 0) {
      setSuggestions([])
      return
    }
    const upper = value.toUpperCase()
    setSuggestions(
      exercises.filter(e => e.abbreviation.startsWith(upper)).slice(0, 5)
    )
  }

  function selectSuggestion(ex: Exercise) {
    setAbbr(ex.abbreviation)
    if (!mainWeight && ex.defaultWeight != null) setMainWeight(String(ex.defaultWeight))
    if (!warmupWeight && ex.defaultWarmupWeight != null) setWarmupWeight(String(ex.defaultWarmupWeight))
    setSuggestions([])
  }

  function updateRep(index: number, value: string) {
    setReps(prev => prev.map((r, i) => i === index ? value : r))
  }

  function addRep() {
    setReps(prev => [...prev, ''])
  }

  function removeRep(index: number) {
    setReps(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const abbrUpper = abbr.trim().toUpperCase()
    if (!abbrUpper || !mainWeight) return

    setSaving(true)
    try {
      const exercise = await upsertExercise({
        abbreviation: abbrUpper,
        fullName: exercises.find(e => e.abbreviation === abbrUpper)?.fullName ?? '',
      })

      const parsedReps = reps
        .map(r => parseInt(r, 10))
        .filter(r => !isNaN(r) && r > 0)

      await onSave({
        exerciseId: exercise.id,
        mainWeight: parseFloat(mainWeight),
        warmupWeight: warmupWeight ? parseFloat(warmupWeight) : undefined,
        reps: parsedReps,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-neutral-950 border-t border-neutral-800 rounded-t-2xl px-4 pt-4 pb-8 safe-area-bottom">
        <div className="w-10 h-1 bg-neutral-700 rounded-full mx-auto mb-5" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Abbreviation */}
          <div className="relative">
            <label className="text-xs text-neutral-500 mb-1 block">略称</label>
            <input
              ref={abbrRef}
              value={abbr}
              onChange={e => handleAbbrChange(e.target.value)}
              className="w-full bg-neutral-900 text-white font-mono rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-white/30 uppercase"
              placeholder="WRPD"
              autoCapitalize="characters"
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-full mt-1 bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden z-10">
                {suggestions.map(ex => (
                  <li key={ex.id}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm font-mono hover:bg-neutral-800 active:bg-neutral-700"
                      onClick={() => selectSuggestion(ex)}
                    >
                      <span className="text-white">{ex.abbreviation}</span>
                      {ex.fullName && (
                        <span className="text-neutral-500 ml-2 text-xs">{ex.fullName}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Weights */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-neutral-500 mb-1 block">本セット (kg)</label>
              <input
                type="number"
                value={mainWeight}
                onChange={e => setMainWeight(e.target.value)}
                className="w-full bg-neutral-900 text-white font-mono rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-white/30"
                placeholder="60"
                inputMode="decimal"
                step="0.5"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-neutral-500 mb-1 block">ウォームアップ (kg)</label>
              <input
                type="number"
                value={warmupWeight}
                onChange={e => setWarmupWeight(e.target.value)}
                className="w-full bg-neutral-900 text-white font-mono rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-white/30"
                placeholder="省略可"
                inputMode="decimal"
                step="0.5"
              />
            </div>
          </div>

          {/* Reps */}
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">レップ数</label>
            <div className="flex flex-wrap gap-2">
              {reps.map((rep, i) => (
                <div key={i} className="flex items-center gap-1">
                  <input
                    type="number"
                    value={rep}
                    onChange={e => updateRep(i, e.target.value)}
                    className="w-14 bg-neutral-900 text-white font-mono rounded-lg px-2 py-2.5 text-sm text-center outline-none focus:ring-1 focus:ring-white/30"
                    placeholder="12"
                    inputMode="numeric"
                    min="1"
                  />
                  {reps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRep(i)}
                      className="text-neutral-600 hover:text-red-500 text-lg leading-none"
                      aria-label="セット削除"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addRep}
                className="w-14 py-2.5 rounded-lg border border-neutral-700 text-neutral-400 text-sm hover:border-neutral-500 transition-colors"
                aria-label="セット追加"
              >
                ＋
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-neutral-700 text-sm text-neutral-300"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving || !abbr.trim() || !mainWeight}
              className="flex-1 py-3 rounded-xl bg-white text-black font-bold text-sm disabled:opacity-40 transition-opacity"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
