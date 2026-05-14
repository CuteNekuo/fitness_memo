import Dexie, { type EntityTable } from 'dexie'

export interface Exercise {
  id: string
  abbreviation: string
  fullName: string
  defaultWeight?: number
  defaultWarmupWeight?: number
  memo?: string
  createdAt: number
  updatedAt: number
}

export interface Routine {
  id: string
  name: string
  exerciseIds: string[]
  order: number
}

export interface WorkoutDay {
  id: string
  date: string // YYYY-MM-DD
  note?: string
}

export interface ExerciseEntry {
  id: string
  workoutDayId: string
  exerciseId: string
  order: number
  mainWeight: number
  weightDelta?: string
  warmupWeight?: number
  reps: number[]
  memo?: string
}

class WorkoutDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>
  routines!: EntityTable<Routine, 'id'>
  workoutDays!: EntityTable<WorkoutDay, 'id'>
  exerciseEntries!: EntityTable<ExerciseEntry, 'id'>

  constructor() {
    super('WorkoutNoteDB')
    this.version(1).stores({
      exercises: 'id, &abbreviation',
      routines: 'id',
      workoutDays: 'id, &date',
      exerciseEntries: 'id, workoutDayId, exerciseId',
    })
  }
}

export const db = new WorkoutDB()
