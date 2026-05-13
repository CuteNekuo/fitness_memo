import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import type { Exercise } from '../../db/schema'
import { upsertExercise, deleteExercise } from '../../db/repository'

interface FormState {
  abbreviation: string
  fullName: string
  defaultWeight: string
  defaultWarmupWeight: string
  memo: string
}

const emptyForm: FormState = {
  abbreviation: '',
  fullName: '',
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
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function openAdd() {
    setEditTarget(null)
    setForm(emptyForm)
    setError('')
  }

  function openEdit(ex: Exercise) {
    setEditTarget(ex)
    setForm({
      abbreviation: ex.abbreviation,
      fullName: ex.fullName,
      defaultWeight: ex.defaultWeight != null ? String(ex.defaultWeight) : '',
      defaultWarmupWeight: ex.defaultWarmupWeight != null ? String(ex.defaultWarmupWeight) : '',
      memo: ex.memo ?? '',
    })
    setError('')
  }

  function closeForm() {
    setEditTarget(null)
    setForm(emptyForm)
    setError('')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const abbrUpper = form.abbreviation.trim().toUpperCase()
    if (!abbrUpper) { setError('略称は必須です'); return }

    // Duplicate check (excluding self when editing)
    const dup = exercises.find(
      ex => ex.abbreviation === abbrUpper && ex.id !== editTarget?.id
    )
    if (dup) { setError(`略称「${abbrUpper}」はすでに登録されています`); return }

    setSaving(true)
    try {
      await upsertExercise({
        abbreviation: abbrUpper,
        fullName: form.fullName.trim(),
        defaultWeight: form.defaultWeight ? parseFloat(form.defaultWeight) : undefined,
        defaultWarmupWeight: form.defaultWarmupWeight ? parseFloat(form.defaultWarmupWeight) : undefined,
        memo: form.memo.trim() || undefined,
      })
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

  const isFormOpen = editTarget !== null || (form.abbreviation !== '' || form.fullName !== '')

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-neutral-800">
        <button onClick={() => navigate(-1)} className="text-neutral-400 hover:text-white p-1" aria-label="戻る">
          ‹
        </button>
        <h1 className="text-base font-bold">種目マスター</h1>
      </div>

      {/* List */}
      <div className="flex-1 px-4 py-2">
        {exercises.length === 0 && (
          <p className="text-neutral-600 text-sm mt-8 text-center">登録された種目がありません</p>
        )}
        {exercises.map(ex => (
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

      {/* Add button */}
      <div className="sticky bottom-0 bg-black border-t border-neutral-800 px-4 py-3 flex justify-end">
        <button
          onClick={openAdd}
          className="bg-white text-black font-bold text-sm px-5 py-2 rounded-full active:opacity-70 transition-opacity"
        >
          ＋ 種目追加
        </button>
      </div>

      {/* Form sheet */}
      {(editTarget !== null || isFormOpen) && (
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
      <div className="relative bg-neutral-950 border-t border-neutral-800 rounded-t-2xl px-4 pt-4 pb-8">
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
