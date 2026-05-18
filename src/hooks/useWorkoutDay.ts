import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import type { ExerciseEntry, Exercise } from '../db/schema'
import {
  upsertWorkoutDay,
  getEntriesForDay,
  addEntry,
  updateEntry,
  deleteEntry,
  nextEntryOrder,
} from '../db/repository'

export function useWorkoutDay(dateKey: string) {
  // Reactively watch workoutDayId so applyRoutine の作成も即反映される
  const workoutDayId = useLiveQuery<string | null, null>(
    () => db.workoutDays.where('date').equals(dateKey).first().then(d => d?.id ?? null),
    [dateKey],
    null
  )

  const entries = useLiveQuery<ExerciseEntry[], ExerciseEntry[]>(
    () => workoutDayId ? getEntriesForDay(workoutDayId) : Promise.resolve([]),
    [workoutDayId],
    []
  )

  const exercises = useLiveQuery<Exercise[], Exercise[]>(
    () => db.exercises.toArray(),
    [],
    []
  )

  const saveEntry = useCallback(async (data: Omit<ExerciseEntry, 'id' | 'workoutDayId' | 'order'>) => {
    const day = await upsertWorkoutDay(dateKey)
    const order = await nextEntryOrder(day.id)
    await addEntry({ ...data, workoutDayId: day.id, order })
  }, [dateKey])

  const editEntry = useCallback(async (id: string, data: Partial<Omit<ExerciseEntry, 'id'>>) => {
    await updateEntry(id, data)
  }, [])

  const removeEntry = useCallback(async (id: string) => {
    await deleteEntry(id)
  }, [])

  return { entries, exercises, saveEntry, editEntry, removeEntry }
}
