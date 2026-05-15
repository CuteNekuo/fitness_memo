import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { db } from '../../db/schema'
import type { Exercise, ExerciseEntry, WorkoutDay } from '../../db/schema'
import { toDateKey, today, addDays, fromDateKey, formatDisplay } from '../../lib/date'
import { BottomNav } from '../shared/BottomNav'
import { BODY_PARTS } from '../../lib/constants'

type Period = '1m' | '3m' | '6m' | '1y'

const PERIODS: { label: string; value: Period; days: number }[] = [
  { label: '1ヶ月', value: '1m', days: 30 },
  { label: '3ヶ月', value: '3m', days: 90 },
  { label: '6ヶ月', value: '6m', days: 180 },
  { label: '1年', value: '1y', days: 365 },
]

export function ExerciseChart() {
  const [selectedId, setSelectedId] = useState<string>('')
  const [period, setPeriod] = useState<Period>('3m')
  const [filterPart, setFilterPart] = useState<string>('すべて')

  const exercises = useLiveQuery<Exercise[], Exercise[]>(() => db.exercises.orderBy('abbreviation').toArray(), [], [])

  const periodDays = PERIODS.find(p => p.value === period)!.days
  const fromDate = addDays(today(), -periodDays)
  const fromKey = toDateKey(fromDate)

  const chartData = useLiveQuery(
    async () => {
      if (!selectedId) return []

      const days = await db.workoutDays
        .where('date').aboveOrEqual(fromKey)
        .toArray() as WorkoutDay[]

      if (days.length === 0) return []

      const dayIdToDate = new Map(days.map(d => [d.id, d.date]))
      const dayIds = days.map(d => d.id)

      const entries = await db.exerciseEntries
        .where('workoutDayId').anyOf(dayIds)
        .and(e => e.exerciseId === selectedId)
        .toArray() as ExerciseEntry[]

      // One data point per day (max mainWeight if multiple entries)
      const byDate = new Map<string, number>()
      for (const entry of entries) {
        const date = dayIdToDate.get(entry.workoutDayId)
        if (!date) continue
        const existing = byDate.get(date) ?? 0
        if (entry.mainWeight > existing) byDate.set(date, entry.mainWeight)
      }

      return Array.from(byDate.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, weight]) => ({
          date,
          label: formatDisplay(fromDateKey(date)).slice(5), // MM/DD
          weight,
        }))
    },
    [selectedId, fromKey],
    []
  )

  const selected = exercises.find(e => e.id === selectedId)

  const usedBodyParts = ['すべて', ...BODY_PARTS.filter(bp => exercises.some(e => e.bodyPart === bp))]
  if (exercises.some(e => !e.bodyPart)) usedBodyParts.push('未分類')

  const filteredExercises = filterPart === 'すべて'
    ? exercises
    : filterPart === '未分類'
    ? exercises.filter(e => !e.bodyPart)
    : exercises.filter(e => e.bodyPart === filterPart)

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="px-4 safe-top pb-3 border-b border-neutral-800">
        <h1 className="text-base font-bold mb-3">グラフ</h1>

        {/* Body part filter */}
        {usedBodyParts.length > 1 && (
          <div className="flex gap-1.5 flex-wrap mb-3">
            {usedBodyParts.map(bp => (
              <button
                key={bp}
                onClick={() => { setFilterPart(bp); setSelectedId('') }}
                className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                  filterPart === bp
                    ? 'bg-white text-black font-bold'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                {bp}
              </button>
            ))}
          </div>
        )}

        {/* Exercise buttons */}
        <div className="flex flex-wrap gap-2">
          {filteredExercises.map(ex => (
            <button
              key={ex.id}
              onClick={() => setSelectedId(ex.id)}
              className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                selectedId === ex.id
                  ? 'border-white text-white bg-white/10'
                  : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
              }`}
            >
              {ex.abbreviation}
            </button>
          ))}
          {filteredExercises.length === 0 && (
            <p className="text-neutral-600 text-xs">種目がありません</p>
          )}
        </div>
      </div>

      {/* Period toggle */}
      <div className="flex gap-1 px-4 py-3 border-b border-neutral-800">
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`flex-1 py-1.5 rounded-lg text-xs transition-colors ${
              period === p.value
                ? 'bg-white text-black font-bold'
                : 'text-neutral-500 hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="flex-1 px-2 py-4">
        {!selectedId && (
          <p className="text-neutral-600 text-sm text-center mt-12">種目を選択してください</p>
        )}
        {selectedId && (chartData ?? []).length === 0 && (
          <p className="text-neutral-600 text-sm text-center mt-12">
            この期間にデータがありません
          </p>
        )}
        {selectedId && (chartData ?? []).length > 0 && (
          <>
            <p className="text-xs text-neutral-500 text-center mb-2">
              {selected?.abbreviation} — 本セット重量 (kg)
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData ?? []} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#737373', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: '#737373', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{ background: '#171717', border: '1px solid #404040', borderRadius: 8 }}
                  labelStyle={{ color: '#a3a3a3', fontSize: 11 }}
                  itemStyle={{ color: '#fff', fontSize: 12 }}
                  formatter={(v: unknown) => [`${v} kg`, '重量']}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#fff"
                  strokeWidth={1.5}
                  dot={{ fill: '#fff', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
