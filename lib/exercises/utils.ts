/**
 * Utility functions for handling exercise data.
 */
import type { NoteDuration, Pitch, PitchName, Exercise } from './types'
import { normalizeAccidental } from '../domain/musical-domain'
import { ExerciseStats } from '@/stores/progress.store'

const DURATION_BEATS: Record<NoteDuration, number> = {
  1: 4,
  2: 2,
  4: 1,
  6: 1.5,
  8: 0.5,
  16: 0.25,
  32: 0.125,
}

/**
 * Calculates the duration of a note in milliseconds based on BPM.
 */
export const getDurationMs = (duration: NoteDuration, bpm: number = 60): number => {
  const beats = DURATION_BEATS[duration]
  const msInMinute = 60 * 1000
  const totalMs = beats * msInMinute
  const result = totalMs / bpm

  return result
}

/**
 * Parses a pitch string (e.g., "G#4", "Bb3") into a Pitch object.
 */
export const parsePitch = (pitchString: string): Pitch => {
  const match = pitchString.match(/^([A-G])([#b]?)(\d)$/)
  if (!match) {
    const errorMsg = `Invalid pitch format: "${pitchString}". Expected format like "G#4" or "C5".`
    throw new Error(errorMsg)
  }

  const [, step, alter, octave] = match

  return {
    step: step as PitchName,
    alter: normalizeAccidental(alter),
    octave: parseInt(octave, 10),
  }
}

/**
 * Parameters for filtering exercises.
 */
export interface ExerciseFilterParams {
  exercises: Exercise[]
  filter: {
    activeTab: string
    difficulty?: string
  }
  stats: Record<string, ExerciseStats>
}

/**
 * Pure function to filter exercises based on tab and difficulty.
 */
export function filterExercises(params: ExerciseFilterParams): Exercise[] {
  const { exercises, filter, stats } = params

  const filtered = exercises.filter((ex) => {
    const matchesDiff = isDifficultyMatch(ex.difficulty, filter.difficulty)
    const matchesTab = isTabMatch(ex, filter.activeTab, stats)
    const result = matchesDiff && matchesTab

    return result
  })

  return filtered
}

function isDifficultyMatch(exDiff: string, filterDiff?: string): boolean {
  const isAll = !filterDiff || filterDiff === 'all'
  if (isAll) {
    return true
  }

  const exLower = exDiff.toLowerCase()
  const filterLower = filterDiff.toLowerCase()
  const isMatch = exLower === filterLower

  return isMatch
}

function isTabMatch(ex: Exercise, activeTab: string, stats: Record<string, ExerciseStats>): boolean {
  if (activeTab === 'all') return true
  if (activeTab === 'inProgress') return isExerciseInProgress(ex.id, stats)

  return isDifficultyCategoryMatch(ex.difficulty, activeTab)
}

function isExerciseInProgress(exerciseId: string, stats: Record<string, ExerciseStats>): boolean {
  const statsEntry = stats[exerciseId]
  const isStarted = statsEntry && statsEntry.timesCompleted > 0
  const isNotMastered = statsEntry && statsEntry.bestAccuracy < 100
  const result = isStarted && isNotMastered

  return result
}

function isDifficultyCategoryMatch(exDifficulty: string, activeTab: string): boolean {
  const mapping: Record<string, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  }
  const target = mapping[activeTab]
  const isMatch = target === undefined || exDifficulty === target

  return isMatch
}
