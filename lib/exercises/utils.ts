/**
 * Utility functions for handling exercise data.
 */
import type { NoteDuration, Pitch, PitchName, Exercise } from './types'
import { normalizeAccidental } from '../domain/musical-domain'

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
  return (beats * 60 * 1000) / bpm
}

/**
 * Parses a pitch string (e.g., "G#4", "Bb3") into a Pitch object.
 */
export const parsePitch = (pitchString: string): Pitch => {
  const match = pitchString.match(/^([A-G])([#b]?)(\d)$/)
  if (!match) {
    throw new Error(`Invalid pitch format: "${pitchString}". Expected format like "G#4" or "C5".`)
  }

  const [, step, alter, octave] = match

  return {
    step: step as PitchName,
    alter: normalizeAccidental(alter),
    octave: parseInt(octave, 10),
  }
}

/**
 * Filter criteria for exercise lists.
 */
export interface ExerciseFilter {
  activeTab: string
  difficulty?: string
}

/**
 * Pure function to filter exercises based on tab and difficulty.
 *
 * @param exercises - List of exercises to filter.
 * @param filter - Filter criteria including active tab and optional difficulty.
 * @param stats - User exercise statistics from the store.
 * @returns Filtered list of exercises.
 */
export function filterExercises(
  exercises: Exercise[],
  filter: ExerciseFilter,
  stats: Record<string, any>,
): Exercise[] {
  const { activeTab, difficulty } = filter

  return exercises.filter((ex) => {
    // 1. Filter by Difficulty if provided
    if (
      difficulty &&
      difficulty !== 'all' &&
      ex.difficulty.toLowerCase() !== difficulty.toLowerCase()
    ) {
      return false
    }

    // 2. Filter by Tab
    if (activeTab === 'all') return true
    if (activeTab === 'beginner') return ex.difficulty === 'Beginner'
    if (activeTab === 'intermediate') return ex.difficulty === 'Intermediate'
    if (activeTab === 'advanced') return ex.difficulty === 'Advanced'
    if (activeTab === 'inProgress') {
      const s = stats[ex.id]
      return s && s.timesCompleted > 0 && s.bestAccuracy < 100
    }

    return true
  })
}
