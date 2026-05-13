import { useState, useRef, useEffect } from 'react'
import type { Exercise, ExerciseEntry } from '../../db/schema'
import { upsertExercise } from '../../db/repository'
import { parseEntry } from '../../lib/parser'

type Mode = 'form' | 'text'

interface Props {
  exercises: Exercise[]
  initial?: ExerciseEntry
  defaultMode?: Mode
  onSave: (data: Omit<ExerciseEntry, 'id' | 'workoutDayId' | 'order'>) => Promise<void>
  onClose: () => void
}

export function EntryEditor({ exercises, initial, defaultMode = 'form', onSave, onClose }: Props) {
  const [mode, setMode] = useState<Mode>(defaultMode)

  // Form mode state
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

  // Text mode state
  const initialText = initial
    ? buildText(exercises.find(e => e.id === initial.exerciseId)?.abbreviation ?? '???', initial)
    : ''
  const [textValue, setTextValue] = useState(initialText)
  const [textError, setTextError] = useState('')

  const [saving, setSaving] = useState(false)
  const abbrRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (mode === 'form') abbrRef.current?.focus()
    else textRef.current?.focus()
  }, [mode])

  function handleAbbrChange(value: string) {
    setAbbr(value)
    if (!value) { setSuggestions([]); return }
    const upper = value.toUpperCase()
    setSuggestions(exercises.filter(e => e.abbreviation.startsWith(upper)).slice(0, 5))
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

  async function submitForm(e: React.FormEvent) {
    e.preventDefault()
    const abbrUpper = abbr.trim().toUpperCase()
    if (!abbrUpper || !mainWeight) return
    setSaving(true)
    try {
      const exercise = await upsertExercise({
        abbreviation: abbrUpper,
        fullName: exercises.find(e => e.abbreviation === abbrUpper)?.fullName ?? '',
      })
      const parsedReps = reps.map(r => parseInt(r, 10)).filter(r => !isNaN(r) && r > 0)
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

  async function submitText(e: React.FormEvent) {
    e.preventDefault()
    setTextError('')
    const result = parseEntry(textValue)
    if (!result.ok) { setTextError(result.error); return }
    setSaving(true)
    try {
      const { abbreviation, mainWeight: mw, warmupWeight: ww, reps: r, weightDelta } = result.entry
      const exercise = await upsertExercise({
        abbreviation,
        fullName: exercises.find(e => e.abbreviation === abbreviation)?.fullName ?? '',
      })
      await onSave({ exerciseId: exercise.id, mainWeight: mw, warmupWeight: ww, reps: r, weightDelta })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-neutral-950 border-t border-neutral-800 rounded-t-2xl px-4 pt-4 pb-8">
        <div className="w-10 h-1 bg-neutral-700 rounded-full mx-auto mb-4" />

        {/* Mode toggle */}
        <div className="flex justify-center mb-5">
          <div className="flex bg-neutral-900 rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setMode('form')}
              className={`px-4 py-1.5 rounded-md transition-colors ${mode === 'form' ? 'bg-white text-black font-bold' : 'text-neutral-400'}`}
            >
              フォーム
            </button>
            <button
              type="button"
              onClick={() => setMode('text')}
              className={`px-4 py-1.5 rounded-md transition-colors ${mode === 'text' ? 'bg-white text-black font-bold' : 'text-neutral-400'}`}
            >
              テキスト
            </button>
          </div>
        </div>

        {mode === 'form' ? (
          <form onSubmit={submitForm} className="flex flex-col gap-4">
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
                        className="w-full text-left px-3 py-2 text-sm font-mono hover:bg-neutral-800"
                        onClick={() => selectSuggestion(ex)}
                      >
                        <span className="text-white">{ex.abbreviation}</span>
                        {ex.fullName && <span className="text-neutral-500 ml-2 text-xs">{ex.fullName}</span>}
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
                        onClick={() => setReps(prev => prev.filter((_, j) => j !== i))}
                        className="text-neutral-600 hover:text-red-500 text-lg leading-none"
                        aria-label="セット削除"
                      >×</button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setReps(prev => [...prev, ''])}
                  className="w-14 py-2.5 rounded-lg border border-neutral-700 text-neutral-400 text-sm hover:border-neutral-500 transition-colors"
                  aria-label="セット追加"
                >＋</button>
              </div>
            </div>

            <ActionButtons saving={saving} disabled={!abbr.trim() || !mainWeight} onClose={onClose} />
          </form>
        ) : (
          <form onSubmit={submitText} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">
                テキスト入力（例: WRPD 60k / 30k /14/12）
              </label>
              <textarea
                ref={textRef}
                value={textValue}
                onChange={e => { setTextValue(e.target.value); setTextError('') }}
                rows={3}
                className="w-full bg-neutral-900 text-white font-mono rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-white/30 resize-none"
                placeholder={'WRPD 60k\n30k /14/12'}
                spellCheck={false}
              />
              {textError && <p className="text-red-400 text-xs mt-1">{textError}</p>}
            </div>
            <ActionButtons saving={saving} disabled={!textValue.trim()} onClose={onClose} />
          </form>
        )}
      </div>
    </div>
  )
}

function ActionButtons({ saving, disabled, onClose }: { saving: boolean; disabled: boolean; onClose: () => void }) {
  return (
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
        disabled={saving || disabled}
        className="flex-1 py-3 rounded-xl bg-white text-black font-bold text-sm disabled:opacity-40 transition-opacity"
      >
        {saving ? '保存中...' : '保存'}
      </button>
    </div>
  )
}

function buildText(abbr: string, entry: ExerciseEntry): string {
  const line1 = `${abbr} ${entry.mainWeight}k`
  if (entry.reps.length === 0) return line1
  const warmup = entry.warmupWeight != null ? `${entry.warmupWeight}k` : '-'
  const repsStr = entry.reps.map(r => `/${r}`).join('')
  return `${line1}\n${warmup} ${repsStr}`
}
