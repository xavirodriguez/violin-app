/**
 * Exercise definitions for violin practice
 */

interface Note {
  pitch: string
  duration: string
  measure: number
}

export interface Exercise {
  id: string
  name: string
  notes: Note[]
}

export const G_MAJOR_SCALE_EXERCISE: Exercise = {
  id: "g-major-scale",
  name: "G Major Scale",
  notes: [
    { pitch: "G4", duration: "quarter", measure: 1 },
    { pitch: "A4", duration: "quarter", measure: 1 },
    { pitch: "B4", duration: "quarter", measure: 1 },
    { pitch: "C5", duration: "quarter", measure: 1 },
    { pitch: "D5", duration: "quarter", measure: 2 },
    { pitch: "E5", duration: "quarter", measure: 2 },
    { pitch: "F#5", duration: "quarter", measure: 2 },
    { pitch: "G5", duration: "quarter", measure: 2 },
  ],
}
