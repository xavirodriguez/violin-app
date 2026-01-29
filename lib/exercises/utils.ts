/**
 * Utility functions for handling exercise data.
 */
import type { NoteDuration, Pitch, PitchName } from './types'
import { normalizeAccidental } from '../domain/musical-domain'

const DURATION_BEATS: Record<NoteDuration, number> = {
  1: 4,
  2: 2,
  4: 1,
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
