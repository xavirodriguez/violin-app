import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { type Pitch } from '@/lib/exercises/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function pitchToString(pitch: Pitch): string {
  if (typeof pitch === 'string') {
    return pitch
  }
  return `${pitch.step}${pitch.alter || ''}${pitch.octave}`
}
