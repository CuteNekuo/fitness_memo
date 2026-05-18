import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import { today, toDateKey, monthKey, fromMonthKey, addMonths, getMonthGrid } from '../../lib/date'
import { BottomNav } from '../shared/BottomNav'
import { useSettings } from '../../hooks/useSettings'

const ALL_WEEK_LABELS = ['日', '月', '火', '水', '木', '金', '土']

export function MonthView() {
  const { month: monthParam } = useParams<{ month: string }>()
  const navigate = useNavigate()
  const todayDate = today()
  const { settings, updateSettings } = useSettings()
  const weekStartsOn = settings.calendarWeekStart

  const currentMonthKey = monthParam ?? monthKey(todayDate)
  const { year, month } = fromMonthKey(currentMonthKey)

  const firstDay = `${currentMonthKey}-01`
  const lastDay = toDateKey(new Date(year, month, 0))

  const trainedDates = useLiveQuery<Set<string>, Set<string>>(async () => {
    const days = await db.workoutDays
      .where('date').between(firstDay, lastDay, true, true)
      .toArray()
    if (days.length === 0) return new Set<string>()
    const dayIds = days.map(d => d.id)
    const entries = await db.exerciseEntries
      .where('workoutDayId').anyOf(dayIds)
      .toArray()
    const activeDayIds = new Set(entries.map(e => e.workoutDayId))
    return new Set(days.filter(d => activeDayIds.has(d.id)).map(d => d.date))
  }, [firstDay, lastDay], new Set<string>())

  const grid = getMonthGrid(year, month, weekStartsOn)
  const todayKey = toDateKey(todayDate)

  // Build week label row starting from weekStartsOn
  const weekLabels = Array.from({ length: 7 }, (_, i) => ALL_WEEK_LABELS[(weekStartsOn + i) % 7])

  function goMonth(delta: number) {
    const { year: ny, month: nm } = addMonths(year, month, delta)
    navigate(`/month/${ny}-${String(nm).padStart(2, '0')}`)
  }

  function labelColorClass(i: number) {
    const dow = (weekStartsOn + i) % 7
    return dow === 0 ? 'text-red-400' : dow === 6 ? 'text-blue-400' : 'text-neutral-500'
  }

  function cellColorClass(dow: number, isToday: boolean) {
    if (isToday) return 'bg-white text-black font-bold'
    if (dow === 0) return 'text-red-400'
    if (dow === 6) return 'text-blue-400'
    return 'text-neutral-200'
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 safe-top pb-4">
        <button onClick={() => goMonth(-1)} className="text-neutral-400 hover:text-white p-2 -ml-2" aria-label="前の月">
          ‹
        </button>
        <span className="font-mono text-base tracking-widest">
          {year}年{String(month).padStart(2, '0')}月
        </span>
        <button onClick={() => goMonth(1)} className="text-neutral-400 hover:text-white p-2 -mr-2" aria-label="次の月">
          ›
        </button>
      </div>

      {/* Calendar */}
      <div className="flex-1 px-3">
        {/* Week-start toggle + Day-of-week header */}
        <div className="grid grid-cols-7 mb-1 items-center">
          {weekLabels.map((label, i) => (
            <div
              key={i}
              className={`text-center text-xs py-1 ${labelColorClass(i)}`}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid cells */}
        <div className="grid grid-cols-7">
          {grid.map((date, i) => {
            if (!date) return <div key={`pad-${i}`} className="aspect-square" />
            const key = toDateKey(date)
            const isToday = key === todayKey
            const isTrained = trainedDates.has(key)
            const dow = date.getDay()

            return (
              <button
                key={key}
                onClick={() => navigate(`/day/${key}`)}
                className="aspect-square flex flex-col items-center justify-center gap-0.5 active:opacity-60 transition-opacity"
              >
                <span
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-mono leading-none ${cellColorClass(dow, isToday)}`}
                >
                  {date.getDate()}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    isTrained ? 'bg-neutral-400' : 'bg-transparent'
                  }`}
                />
              </button>
            )
          })}
        </div>

        {/* Week-start toggle */}
        <div className="flex justify-center mt-4">
          <div className="flex bg-neutral-900 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => updateSettings({ calendarWeekStart: 1 })}
              className={`px-3 py-1.5 rounded-md transition-colors ${weekStartsOn === 1 ? 'bg-white text-black font-bold' : 'text-neutral-400'}`}
            >
              月曜始まり
            </button>
            <button
              onClick={() => updateSettings({ calendarWeekStart: 0 })}
              className={`px-3 py-1.5 rounded-md transition-colors ${weekStartsOn === 0 ? 'bg-white text-black font-bold' : 'text-neutral-400'}`}
            >
              日曜始まり
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
