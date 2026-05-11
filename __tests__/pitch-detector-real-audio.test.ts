import { describe, it, expect } from 'vitest'
import { PitchDetector } from '../lib/pitch-detector'
import { loadWavAsFloat32 } from './audio/decode-wav'
import { loadMp3AsFloat32 } from './audio/decode-mp3'

describe('PitchDetector with Real Audio', () => {
  it('should correctly detect A4 from a WAV file', async () => {
    const { samples, sampleRate } = loadWavAsFloat32('a4.wav')
    const detector = new PitchDetector(sampleRate)
    const windowSize = 2048
    const start = Math.floor(samples.length / 2)
    const buffer = samples.slice(start, start + windowSize)
    const result = detector.detectPitch(buffer)
    expect(result.pitchHz).toBeGreaterThan(435)
    expect(result.pitchHz).toBeLessThan(445)
    expect(result.confidence).toBeGreaterThan(0.7)
  })

  it('should correctly detect G3 from an MP3 file', async () => {
    const { samples, sampleRate } = await loadMp3AsFloat32('g3.mp3')
    const detector = new PitchDetector(sampleRate)
    const windowSize = 4096
    const start = Math.floor(samples.length / 2)
    const buffer = samples.slice(start, start + windowSize)
    const result = detector.detectPitch(buffer)
    expect(result.pitchHz).toBeGreaterThan(190)
    expect(result.pitchHz).toBeLessThan(200)
    expect(result.confidence).toBeGreaterThan(0.7)
  })
})
