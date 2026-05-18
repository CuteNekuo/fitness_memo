import { db } from './schema'
import type { Exercise, ExerciseEntry, WorkoutDay, Routine } from './schema'
import { crypto } from '../lib/crypto'

// WorkoutDay

export async function getWorkoutDay(date: string): Promise<WorkoutDay | undefined> {
  return db.workoutDays.where('date').equals(date).first()
}

export async function upsertWorkoutDay(date: string): Promise<WorkoutDay> {
  const existing = await getWorkoutDay(date)
  if (existing) return existing
  const day: WorkoutDay = { id: crypto.randomUUID(), date }
  await db.workoutDays.add(day)
  return day
}

// ExerciseEntry

export async function getEntriesForDay(workoutDayId: string): Promise<ExerciseEntry[]> {
  const entries = await db.exerciseEntries.where('workoutDayId').equals(workoutDayId).toArray()
  return entries.sort((a, b) => a.order - b.order)
}

export async function addEntry(entry: Omit<ExerciseEntry, 'id'>): Promise<ExerciseEntry> {
  const newEntry: ExerciseEntry = { ...entry, id: crypto.randomUUID() }
  await db.exerciseEntries.add(newEntry)
  return newEntry
}

export async function updateEntry(id: string, changes: Partial<Omit<ExerciseEntry, 'id'>>): Promise<void> {
  await db.exerciseEntries.update(id, changes)
}

export async function deleteEntry(id: string): Promise<void> {
  await db.exerciseEntries.delete(id)
}

// Exercise (master)

export async function getExercises(): Promise<Exercise[]> {
  const all = await db.exercises.toArray()
  return all.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

export async function getExerciseByAbbr(abbreviation: string): Promise<Exercise | undefined> {
  return db.exercises.where('abbreviation').equals(abbreviation).first()
}

export async function upsertExercise(
  data: Omit<Exercise, 'id' | 'order' | 'createdAt' | 'updatedAt'>,
  existingId?: string
): Promise<Exercise> {
  const now = Date.now()
  if (existingId) {
    await db.exercises.update(existingId, { ...data, updatedAt: now })
    const updated = await db.exercises.get(existingId)
    return updated!
  }
  const existing = await getExerciseByAbbr(data.abbreviation)
  if (existing) {
    await db.exercises.update(existing.id, { ...data, updatedAt: now })
    return { ...existing, ...data, updatedAt: now }
  }
  const all = await db.exercises.toArray()
  const maxOrder = all.length > 0 ? Math.max(...all.map(e => e.order ?? 0)) + 1 : 0
  const exercise: Exercise = { ...data, order: maxOrder, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
  await db.exercises.add(exercise)
  return exercise
}

export async function deleteExercise(id: string): Promise<void> {
  await db.exercises.delete(id)
}

export async function updateExerciseOrders(ids: string[]): Promise<void> {
  await db.transaction('rw', db.exercises, async () => {
    for (let i = 0; i < ids.length; i++) {
      await db.exercises.update(ids[i], { order: i })
    }
  })
}

// Next order index for entries in a day
export async function nextEntryOrder(workoutDayId: string): Promise<number> {
  const entries = await getEntriesForDay(workoutDayId)
  return entries.length === 0 ? 0 : Math.max(...entries.map(e => e.order)) + 1
}

// Routine

export async function getRoutines(): Promise<Routine[]> {
  const routines = await db.routines.toArray()
  return routines.sort((a, b) => a.order - b.order)
}

export async function saveRoutine(data: Omit<Routine, 'id'>): Promise<Routine> {
  const routine: Routine = { ...data, id: crypto.randomUUID() }
  await db.routines.add(routine)
  return routine
}

export async function updateRoutine(id: string, changes: Partial<Omit<Routine, 'id'>>): Promise<void> {
  await db.routines.update(id, changes)
}

export async function deleteRoutine(id: string): Promise<void> {
  await db.routines.delete(id)
}

// Apply a routine to a day: bulk-add entries with default weights
export async function applyRoutine(routineId: string, dateKey: string): Promise<void> {
  const routine = await db.routines.get(routineId)
  if (!routine) return

  const day = await upsertWorkoutDay(dateKey)
  let order = await nextEntryOrder(day.id)

  for (const exerciseId of routine.exerciseIds) {
    const exercise = await db.exercises.get(exerciseId)
    if (!exercise) continue
    await addEntry({
      workoutDayId: day.id,
      exerciseId,
      order: order++,
      mainWeight: exercise.defaultWeight ?? 0,
      warmupWeight: exercise.defaultWarmupWeight,
      reps: [],
    })
  }
}
