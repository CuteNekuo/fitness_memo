import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import type { Exercise, WorkoutDay, ExerciseEntry } from '../../db/schema'
import {
  today, toDateKey, addDays,
  getWeekStart, getWeekDays, weekKey, fromWeekKey, dayLabel,
} from '../../lib/date'
import { BottomNav } from '../shared/BottomNav'

export function WeekView() {
  const { week } = useParams<{ week: string }>()
  const navigate = useNavigate()

  const weekStart = week ? fromWeekKey(week) : getWeekStart(today())
  const days = getWeekDays(weekStart)
  const dateKeys = days.map(toDateKey)

  const todayKey = toDateKey(today())

  function goWeek(delta: number) {
    const next = addDays(weekStart, delta * 7)
    navigate(`/week/${weekKey(getWeekStart(next))}`)
  }

  const workoutDays = useLiveQuery<WorkoutDay[], WorkoutDay[]>(
    () => db.workoutDays.where('date').anyOf(dateKeys).toArray(),
    [dateKeys.join(',')],
    []
  )

  const dayIdMap = new Map(workoutDays.map(d => [d.date, d.id]))

  const workoutDayIds = workoutDays.map(d => d.id)
  const entries = useLiveQuery<ExerciseEntry[], ExerciseEntry[]>(
    () => workoutDayIds.length > 0
      ? db.exerciseEntries.where('workoutDayId').anyOf(workoutDayIds).toArray()
      : Promise.resolve([]),
    [workoutDayIds.join(',')],
    []
  )

  const exercises = useLiveQuery<Exercise[], Exercise[]>(
    () => db.exercises.toArray(),
    [],
    []
  )

  const exerciseMap = new Map(exercises.map(e => [e.id, e]))

  // Group entries by workoutDayId, sorted by order
  const entriesByDay = new Map<string, ExerciseEntry[]>()
  for (const entry of entries) {
    const arr = entriesByDay.get(entry.workoutDayId) ?? []
    arr.push(entry)
    entriesByDay.set(entry.workoutDayId, arr)
  }

  // Month label for header
  const monthStart = days[0]
  const monthEnd = days[6]
  const monthLabel = monthStart.getMonth() === monthEnd.getMonth()
    ? `${monthStart.getFullYear()}/${String(monthStart.getMonth() + 1).padStart(2, '0')}`
    : `${monthStart.getFullYear()}/${String(monthStart.getMonth() + 1).padStart(2, '0')}–${String(monthEnd.getMonth() + 1).padStart(2, '0')}`

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 safe-top pb-3 border-b border-neutral-800">
        <button onClick={() => goWeek(-1)} className="text-neutral-400 hover:text-white p-2 -ml-2" aria-label="前の週">
          ‹
        </button>
        <span className="font-mono text-sm">{monthLabel}</span>
        <button onClick={() => goWeek(1)} className="text-neutral-400 hover:text-white p-2 -mr-2" aria-label="次の週">
          ›
        </button>
      </div>

      {/* Week grid */}
      <div className="flex-1 flex overflow-x-auto">
        {days.map((day, i) => {
          const dateKey = dateKeys[i]
          const isToday = dateKey === todayKey
          const dayId = dayIdMap.get(dateKey)
          const dayEntries = dayId ? (entriesByDay.get(dayId) ?? []).sort((a, b) => a.order - b.order) : []

          return (
            <button
              key={dateKey}
              className="flex-1 min-w-0 flex flex-col border-r border-neutral-800 last:border-r-0 pt-2 pb-4 px-1 text-left active:bg-neutral-900 transition-colors"
              onClick={() => navigate(`/day/${dateKey}`)}
            >
              {/* Day header */}
              <div className="text-center mb-2">
                <div className={`text-xs mb-0.5 ${isToday ? 'text-white font-bold' : 'text-neutral-500'}`}>
                  {dayLabel(day)}
                </div>
                <div className={`text-xs font-mono ${isToday ? 'text-white font-bold' : 'text-neutral-400'}`}>
                  {String(day.getDate()).padStart(2, '0')}
                </div>
              </div>

              {/* Entries */}
              <div className="flex flex-col gap-1 px-0.5">
                {dayEntries.map((entry: ExerciseEntry) => {
                  const abbr = (exerciseMap.get(entry.exerciseId) as Exercise | undefined)?.abbreviation ?? '?'
                  return (
                    <div key={entry.id} className="text-neutral-300 font-mono leading-tight" style={{ fontSize: '9px' }}>
                      {abbr}
                    </div>
                  )
                })}
              </div>
            </button>
          )
        })}
      </div>

      <BottomNav />
    </div>
  )
}
