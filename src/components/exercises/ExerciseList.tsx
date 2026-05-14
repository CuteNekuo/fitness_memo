import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import type { Exercise } from '../../db/schema'
import { upsertExercise, deleteExercise } from '../../db/repository'
import { BODY_PARTS } from '../../lib/constants'

interface FormState {
  abbreviation: string
  fullName: string
  bodyPart: string
  defaultWeight: string
  defaultWarmupWeight: string
  memo: string
}

const emptyForm: FormState = {
  abbreviation: '',
  fullName: '',
  bodyPart: '',
  defaultWeight: '',
  defaultWarmupWeight: '',
  memo: '',
}

export function ExerciseList() {
  const navigate = useNavigate()
  const exercises = useLiveQuery<Exercise[], Exercise[]>(
    () => db.exercises.orderBy('abbreviation').toArray(),
    [],
    []
  )

  const [editTarget, setEditTarget] = useState<Exercise | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function openAdd() {
    setEditTarget(null)
    setForm(emptyForm)
    setError('')
    setFormOpen(true)
  }

  function openEdit(ex: Exercise) {
    setEditTarget(ex)
    setForm({
      abbreviation: ex.abbreviation,
      fullName: ex.fullName,
      bodyPart: ex.bodyPart ?? '',
      defaultWeight: ex.defaultWeight != null ? String(ex.defaultWeight) : '',
      defaultWarmupWeight: ex.defaultWarmupWeight != null ? String(ex.defaultWarmupWeight) : '',
      memo: ex.memo ?? '',
    })
    setError('')
    setFormOpen(true)
  }

  function closeForm() {
    setEditTarget(null)
    setForm(emptyForm)
    setError('')
    setFormOpen(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const abbrUpper = form.abbreviation.trim().toUpperCase()
    if (!abbrUpper) { setError('略称は必須です'); return }

    const dup = exercises.find(
      ex => ex.abbreviation === abbrUpper && ex.id !== editTarget?.id
    )
    if (dup) { setError(`略称「${abbrUpper}」はすでに登録されています`); return }

    setSaving(true)
    try {
      await upsertExercise({
        abbreviation: abbrUpper,
        fullName: form.fullName.trim(),
        bodyPart: form.bodyPart || undefined,
        defaultWeight: form.defaultWeight ? parseFloat(form.defaultWeight) : undefined,
        defaultWarmupWeight: form.defaultWarmupWeight ? parseFloat(form.defaultWarmupWeight) : undefined,
        memo: form.memo.trim() || undefined,
      }, editTarget?.id)
      closeForm()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(ex: Exercise) {
    if (!confirm(`「${ex.abbreviation}」を削除しますか？\n過去の記録には影響しません。`)) return
    await deleteExercise(ex.id)
    if (editTarget?.id === ex.id) closeForm()
  }

  // Group by bodyPart (BODY_PARTS order, then uncategorized)
  const grouped = new Map<string, Exercise[]>()
  const uncategorized: Exercise[] = []
  for (const ex of exercises) {
    if (ex.bodyPart) {
      const arr = grouped.get(ex.bodyPart) ?? []
      arr.push(ex)
      grouped.set(ex.bodyPart, arr)
    } else {
      uncategorized.push(ex)
    }
  }
  // Build display sections in BODY_PARTS order
  const sections: { label: string; items: Exercise[] }[] = BODY_PARTS
    .filter(bp => grouped.has(bp))
    .map(bp => ({ label: bp, items: grouped.get(bp)! }))
  if (uncategorized.length > 0) {
    sections.push({ label: '未分類', items: uncategorized })
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 safe-top pb-4 border-b border-neutral-800">
        <button onClick={() => navigate(-1)} className="text-neutral-400 hover:text-white p-1" aria-label="戻る">
          ‹
        </button>
        <h1 className="text-base font-bold">種目マスター</h1>
      </div>

      {/* List */}
      <div className="flex-1 px-4 py-2 overflow-y-auto">
        {exercises.length === 0 && (
          <p className="text-neutral-600 text-sm mt-8 text-center">登録された種目がありません</p>
        )}
        {sections.map(section => (
          <div key={section.label}>
            <p className="text-xs text-neutral-500 uppercase tracking-widest mt-4 mb-1 px-1">
              {section.label}
            </p>
            {section.items.map(ex => (
              <div
                key={ex.id}
                className="flex items-center justify-between py-3 border-b border-neutral-800"
              >
                <button className="flex-1 text-left" onClick={() => openEdit(ex)}>
                  <span className="font-mono text-sm">{ex.abbreviation}</span>
                  {ex.fullName && (
                    <span className="text-neutral-500 text-xs ml-2">{ex.fullName}</span>
                  )}
                  <div className="text-neutral-600 text-xs mt-0.5">
                    {ex.defaultWeight != null && `本 ${ex.defaultWeight}kg`}
                    {ex.defaultWarmupWeight != null && `  W ${ex.defaultWarmupWeight}kg`}
                  </div>
                </button>
                <button
                  onClick={() => handleDelete(ex)}
                  className="text-neutral-600 hover:text-red-500 transition-colors px-2 py-1 text-xs"
                  aria-label="削除"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Add button */}
      <div className="sticky bottom-0 bg-black border-t border-neutral-800 px-4 pt-3 pb-safe flex justify-end">
        <button
          onClick={openAdd}
          className="bg-white text-black font-bold text-sm px-5 py-2 rounded-full active:opacity-70 transition-opacity"
        >
          ＋ 種目追加
        </button>
      </div>

      {/* Form sheet */}
      {formOpen && (
        <ExerciseFormSheet
          form={form}
          isEdit={editTarget !== null}
          error={error}
          saving={saving}
          onChange={fields => setForm(prev => ({ ...prev, ...fields }))}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}
    </div>
  )
}

interface SheetProps {
  form: FormState
  isEdit: boolean
  error: string
  saving: boolean
  onChange: (fields: Partial<FormState>) => void
  onSave: (e: React.FormEvent) => void
  onClose: () => void
}

function ExerciseFormSheet({ form, isEdit, error, saving, onChange, onSave, onClose }: SheetProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-neutral-950 border-t border-neutral-800 rounded-t-2xl px-4 pt-4 pb-safe">
        <div className="w-10 h-1 bg-neutral-700 rounded-full mx-auto mb-5" />
        <h2 className="text-sm font-bold mb-4">{isEdit ? '種目を編集' : '種目を追加'}</h2>

        <form onSubmit={onSave} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="w-28">
              <label className="text-xs text-neutral-500 mb-1 block">略称 *</label>
              <input
                value={form.abbreviation}
                onChange={e => onChange({ abbreviation: e.target.value })}
                className="w-full bg-neutral-900 text-white font-mono rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-white/30 uppercase"
                placeholder="WRPD"
                autoCapitalize="characters"
                autoFocus
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-neutral-500 mb-1 block">正式名称</label>
              <input
                value={form.fullName}
                onChange={e => onChange({ fullName: e.target.value })}
                className="w-full bg-neutral-900 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-white/30"
                placeholder="ワイドグリップ・ラットプルダウン"
              />
            </div>
          </div>

          {/* Body part */}
          <div>
            <label className="text-xs text-neutral-500 mb-2 block">部位</label>
            <div className="flex flex-wrap gap-1.5">
              {BODY_PARTS.map(bp => (
                <button
                  key={bp}
                  type="button"
                  onClick={() => onChange({ bodyPart: form.bodyPart === bp ? '' : bp })}
                  className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                    form.bodyPart === bp
                      ? 'bg-white text-black font-bold'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  {bp}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-neutral-500 mb-1 block">デフォルト本セット (kg)</label>
              <input
                type="number"
                value={form.defaultWeight}
                onChange={e => onChange({ defaultWeight: e.target.value })}
                className="w-full bg-neutral-900 text-white font-mono rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-white/30"
                placeholder="60"
                inputMode="decimal"
                step="0.5"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-neutral-500 mb-1 block">デフォルトW重量 (kg)</label>
              <input
                type="number"
                value={form.defaultWarmupWeight}
                onChange={e => onChange({ defaultWarmupWeight: e.target.value })}
                className="w-full bg-neutral-900 text-white font-mono rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-white/30"
                placeholder="30"
                inputMode="decimal"
                step="0.5"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-neutral-500 mb-1 block">メモ</label>
            <input
              value={form.memo}
              onChange={e => onChange({ memo: e.target.value })}
              className="w-full bg-neutral-900 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-white/30"
              placeholder="任意メモ"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-neutral-700 text-sm text-neutral-300"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-white text-black font-bold text-sm disabled:opacity-40"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
