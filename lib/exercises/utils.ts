/**
 * Utility functions for handling exercise data.
 */
import type { Accidental, Pitch, PitchName } from './types'

/**
 * Parses a pitch string (e.g., "G#4", "Bb3") into a Pitch object.
 * Throws an error if the format is invalid.
 * @param pitchString - The string to parse.
 * @returns A Pitch object.
 */
export const parsePitch = (pitchString: string): Pitch => {
  const match = pitchString.match(/^([A-G])([#b]?)(\d)$/)
  if (!match) {
    throw new Error(`Invalid pitch format: "${pitchString}". Expected format like "G#4" or "C5".`)
  }

  const [, step, alter, octave] = match

  return {
    step: step as PitchName,
    alter: (alter as Accidental) || null,
    octave: parseInt(octave, 10),
  }
}
