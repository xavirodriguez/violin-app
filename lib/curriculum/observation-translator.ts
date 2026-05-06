import { Observation } from '../technique-types'

/**
 * Pedagogical Translation Layer
 *
 * Maps technical metrics and internal observation codes to human-readable,
 * encouraging, and actionable advice for violin students.
 */

export interface TranslatedObservation extends Observation {
  friendlyTitle: string
  friendlyDescription: string
  remedyTip: string
  visualAidUrl?: string
}

export const OBSERVATION_TRANSLATIONS: Record<string, Partial<TranslatedObservation>> = {
  'intonation_high': {
    friendlyTitle: 'Pitch a bit sharp',
    friendlyDescription: 'Your finger is slightly too close to the bridge.',
    remedyTip: 'Slide your finger just a tiny bit towards the scroll (away from your body).',
    visualAidUrl: '/images/tips/intonation_high.gif'
  },
  'intonation_low': {
    friendlyTitle: 'Pitch a bit flat',
    friendlyDescription: 'Your finger is slightly too far from the bridge.',
    remedyTip: 'Slide your finger slightly towards the bridge (closer to your body).',
    visualAidUrl: '/images/tips/intonation_low.gif'
  },
  'rhythm_late': {
    friendlyTitle: 'A bit late',
    friendlyDescription: 'You started this note slightly after the beat.',
    remedyTip: 'Try to anticipate the start of the bow stroke a fraction of a second earlier.',
  },
  'rhythm_early': {
    friendlyTitle: 'A bit early',
    friendlyDescription: 'You jumped into this note before the beat.',
    remedyTip: 'Wait for the metronome click or follow the visual pulse before starting the stroke.',
  },
  'vibrato_too_fast': {
    friendlyTitle: 'Nervous vibrato',
    friendlyDescription: 'Your vibrato is very fast, which can sound a bit tense.',
    remedyTip: 'Relax your hand and try to make wider, slower oscillations from the wrist or arm.',
  },
  'vibrato_too_slow': {
    friendlyTitle: 'Wide vibrato',
    friendlyDescription: 'Your vibrato is quite slow and wide.',
    remedyTip: 'Try to slightly increase the speed of your finger oscillation while keeping the hand relaxed.',
  },
  'unstable_pitch': {
    friendlyTitle: 'Shaky pitch',
    friendlyDescription: 'The pitch is wavering while you hold the note.',
    remedyTip: 'Keep a constant pressure on your left-hand finger and ensure your bow is moving at a steady speed.',
  },
  'scratchy_sound': {
    friendlyTitle: 'Crunchy sound',
    friendlyDescription: 'We detected some "scratchiness" in the tone.',
    remedyTip: 'You might be pressing the bow too hard or moving it too slowly. Try "lightening" the bow or increasing its speed.',
  },
  'vibrato_inconsistent': {
    friendlyTitle: 'Irregular Vibrato',
    friendlyDescription: 'The vibration of the note is not very regular.',
    remedyTip: 'Focus on a constant and relaxed movement of your hand.',
  },
  'pitch_scoop': {
    friendlyTitle: 'Pitch Scoop',
    friendlyDescription: 'The pitch changed significantly right after you started the note.',
    remedyTip: 'Make sure your finger is firmly in place before you start the bow stroke.',
  },
  'slow_attack': {
    friendlyTitle: 'Soft Start',
    friendlyDescription: 'The note took a while to reach a clear volume.',
    remedyTip: 'Try to start the bow with a bit more deliberate contact and speed.',
  },
  'audible_glissando': {
    friendlyTitle: 'Audible Slide',
    friendlyDescription: 'We heard a slide between the notes.',
    remedyTip: 'Move your hand more quickly and cleanly between positions.',
  },
  'landing_error': {
    friendlyTitle: 'Landing Error',
    friendlyDescription: 'You landed slightly off-pitch on this note.',
    remedyTip: 'Aim for the center of the pitch immediately as you change notes.',
  },
  'tone_instability': {
    friendlyTitle: 'Tone Instability',
    friendlyDescription: 'The resonance of the note is unstable.',
    remedyTip: 'Check your bow pressure and contact point on the string.',
  }
}

/**
 * Translates a raw technical observation into a student-friendly version.
 */
export function translateObservation(obs: Observation): TranslatedObservation {
  // Use a heuristic to match the message to a key
  const message = obs.message.toLowerCase()
  let key = ''

  if (message.includes('sharp') || message.includes('high')) key = 'intonation_high'
  else if (message.includes('flat') || message.includes('low')) key = 'intonation_low'
  else if (message.includes('late')) key = 'rhythm_late'
  else if (message.includes('early')) key = 'rhythm_early'
  else if (message.includes('vibrato') && message.includes('fast')) key = 'vibrato_too_fast'
  else if (message.includes('vibrato') && (message.includes('slow') || message.includes('detected'))) key = 'vibrato_too_slow'
  else if (message.includes('vibrato') && message.includes('inconsistent')) key = 'vibrato_inconsistent'
  else if (message.includes('stability') || message.includes('waver') || message.includes('drifting')) key = 'unstable_pitch'
  else if (message.includes('scratch') || message.includes('crunch')) key = 'scratchy_sound'
  else if (message.includes('scoop') || message.includes('drops down')) key = 'pitch_scoop'
  else if (message.includes('attack')) key = 'slow_attack'
  else if (message.includes('glissando')) key = 'audible_glissando'
  else if (message.includes('landing')) key = 'landing_error'
  else if (message.includes('wolf') || message.includes('resonance')) key = 'tone_instability'

  const translation = OBSERVATION_TRANSLATIONS[key] || {}

  return {
    ...obs,
    friendlyTitle: translation.friendlyTitle || obs.type.charAt(0).toUpperCase() + obs.type.slice(1),
    friendlyDescription: translation.friendlyDescription || obs.message,
    remedyTip: translation.remedyTip || obs.tip,
    visualAidUrl: translation.visualAidUrl
  }
}
