import Dexie, { type EntityTable } from 'dexie'

export interface Exercise {
  id: string
  abbreviation: string
  fullName: string
  bodyPart?: string
  order: number
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
    // version 2: bodyPart フィールド追加
    this.version(2).stores({
      exercises: 'id, &abbreviation, bodyPart',
      routines: 'id',
      workoutDays: 'id, &date',
      exerciseEntries: 'id, workoutDayId, exerciseId',
    })
    // version 3: order フィールド追加、既存種目にアルファベット順で order を付与
    this.version(3).stores({
      exercises: 'id, &abbreviation, bodyPart, order',
      routines: 'id',
      workoutDays: 'id, &date',
      exerciseEntries: 'id, workoutDayId, exerciseId',
    }).upgrade(async tx => {
      const all = await tx.table('exercises').orderBy('abbreviation').toArray()
      for (let i = 0; i < all.length; i++) {
        await tx.table('exercises').update(all[i].id, { order: i })
      }
    })
  }
}

export const db = new WorkoutDB()
