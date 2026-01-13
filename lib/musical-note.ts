/**
 * @fileoverview Value Object representing a musical note with pitch deviation.
 * Part of the Music domain - understands musical theory and notation.
 */

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
const A4_FREQUENCY = 440
const A4_MIDI = 69

/**
 * Immutable Value Object representing a musical note with its properties.
 */
export class MusicalNote {
  private constructor(
    public readonly frequency: number,
    public readonly midiNumber: number,
    public readonly noteName: string,
    public readonly octave: number,
    public readonly centsDeviation: number,
  ) {
    this.validate()
  }

  /**
   * Factory method to create a MusicalNote from a frequency.
   */
  static fromFrequency(frequency: number): MusicalNote {
    if (frequency <= 0) {
      throw new Error(`Invalid frequency: ${frequency}. Must be > 0`)
    }

    // Calculate MIDI number with fractional part
    const midiNumber = A4_MIDI + 12 * Math.log2(frequency / A4_FREQUENCY)
    const roundedMidi = Math.round(midiNumber)

    // Calculate cents deviation from the nearest note
    const centsDeviation = (midiNumber - roundedMidi) * 100

    // Get note name and octave
    const noteIndex = roundedMidi % 12
    const octave = Math.floor(roundedMidi / 12) - 1
    const noteName = NOTE_NAMES[noteIndex]

    return new MusicalNote(frequency, roundedMidi, noteName, octave, centsDeviation)
  }

  /**
   * Factory method to create a MusicalNote from MIDI number.
   */
  static fromMidi(midiNumber: number): MusicalNote {
    const frequency = A4_FREQUENCY * Math.pow(2, (midiNumber - A4_MIDI) / 12)
    return MusicalNote.fromFrequency(frequency)
  }

  /**
   * Factory method to create a MusicalNote from note name and octave.
   */
  static fromNoteName(noteName: string, octave: number): MusicalNote {
    const noteIndex = NOTE_NAMES.indexOf(noteName as (typeof NOTE_NAMES)[number])
    if (noteIndex === -1) {
      throw new Error(`Invalid note name: ${noteName}`)
    }

    const midiNumber = (octave + 1) * 12 + noteIndex
    return MusicalNote.fromMidi(midiNumber)
  }

  private validate(): void {
    if (this.frequency <= 0) {
      throw new Error(`Invalid frequency: ${this.frequency}`)
    }

    if (this.midiNumber < 0 || this.midiNumber > 127) {
      throw new Error(`Invalid MIDI number: ${this.midiNumber}. Must be 0-127`)
    }

    if (Math.abs(this.centsDeviation) > 50) {
      throw new Error(`Invalid cents deviation: ${this.centsDeviation}. Must be within ±50`)
    }
  }

  /**
   * Returns the full note name with octave (e.g., "A4", "C#5").
   */
  getFullName(): string {
    return `${this.noteName}${this.octave}`
  }

  /**
   * Checks if the note is in tune within a given tolerance.
   */
  isInTune(toleranceCents = 10): boolean {
    return Math.abs(this.centsDeviation) <= toleranceCents
  }

  /**
   * Returns whether the note is sharp (positive deviation).
   */
  isSharp(): boolean {
    return this.centsDeviation > 0
  }

  /**
   * Returns whether the note is flat (negative deviation).
   */
  isFlat(): boolean {
    return this.centsDeviation < 0
  }

  /**
   * Returns the tuning status as a string.
   */
  getTuningStatus(toleranceCents = 10): 'in-tune' | 'sharp' | 'flat' {
    if (this.isInTune(toleranceCents)) return 'in-tune'
    return this.isSharp() ? 'sharp' : 'flat'
  }

  /**
   * Calculates the interval in semitones to another note.
   */
  intervalTo(other: MusicalNote): number {
    return other.midiNumber - this.midiNumber
  }

  /**
   * Checks if this note matches a target note (ignoring cents deviation).
   */
  matchesTarget(target: MusicalNote): boolean {
    return this.midiNumber === target.midiNumber
  }

  /**
   * Compares two notes for equality.
   */
  equals(other: MusicalNote): boolean {
    return (
      this.midiNumber === other.midiNumber &&
      Math.abs(this.centsDeviation - other.centsDeviation) < 0.01
    )
  }

  /**
   * String representation for debugging.
   */
  toString(): string {
    const sign = this.centsDeviation >= 0 ? '+' : ''
    return `${this.getFullName()} (${sign}${this.centsDeviation.toFixed(1)}¢)`
  }
}
