import { useState, useEffect, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import type { ExerciseEntry, Exercise } from '../db/schema'
import {
  getWorkoutDay,
  upsertWorkoutDay,
  getEntriesForDay,
  addEntry,
  updateEntry,
  deleteEntry,
  nextEntryOrder,
} from '../db/repository'

export function useWorkoutDay(dateKey: string) {
  const [workoutDayId, setWorkoutDayId] = useState<string | null>(null)

  useEffect(() => {
    getWorkoutDay(dateKey).then(day => {
      setWorkoutDayId(day?.id ?? null)
    })
  }, [dateKey])

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
    setWorkoutDayId(day.id)
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
