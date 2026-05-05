export interface GlossaryEntry {
  term: string
  definition: string
  category: 'technique' | 'music-theory' | 'violin-anatomy'
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  'intonation': {
    term: 'Intonation',
    definition: 'The accuracy of pitch when playing an instrument. Good intonation means playing the notes in tune.',
    category: 'technique'
  },
  'vibrato': {
    term: 'Vibrato',
    definition: 'A slight fluctuation in pitch used to add expression and warmth to the sound, produced by oscillating the finger on the string.',
    category: 'technique'
  },
  'detache': {
    term: 'Détaché',
    definition: 'A basic bowing technique where each note is played with a separate bow stroke, resulting in a smooth but distinct sound.',
    category: 'technique'
  },
  'tetrachord': {
    term: 'Tetrachord',
    definition: 'A series of four notes spanning a perfect fourth. Major tetrachords follow the pattern: Whole-Whole-Half step.',
    category: 'music-theory'
  },
  'pitch': {
    term: 'Pitch',
    definition: 'How high or low a musical sound is. It is determined by the frequency of vibration of the string.',
    category: 'music-theory'
  },
  'bridge': {
    term: 'Bridge',
    definition: 'The wooden piece that supports the strings and transmits their vibrations to the body of the violin.',
    category: 'violin-anatomy'
  },
  'scroll': {
    term: 'Scroll',
    definition: 'The decorative carved end of the violin neck, where the tuning pegs are located.',
    category: 'violin-anatomy'
  },
  'sharp': {
    term: 'Sharp',
    definition: 'When a note is higher in pitch than it should be. Also a musical symbol (#) that raises a note by a half step.',
    category: 'music-theory'
  },
  'flat': {
    term: 'Flat',
    definition: 'When a note is lower in pitch than it should be. Also a musical symbol (b) that lowers a note by a half step.',
    category: 'music-theory'
  },
  'rhythm': {
    term: 'Rhythm',
    definition: 'The pattern of sounds and silences in time. It determines when and for how long notes are played.',
    category: 'music-theory'
  }
}
