import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Robust WAV decoder for tests.
 * Supports 16-bit and 24-bit PCM mono files.
 */
export function loadWavAsFloat32(filename: string): { samples: Float32Array; sampleRate: number } {
  const filePath = join(process.cwd(), '__tests__/audio', filename)
  const buffer = readFileSync(filePath)

  // Basic RIFF/WAVE validation
  if (buffer.toString('utf8', 0, 4) !== 'RIFF' || buffer.toString('utf8', 8, 12) !== 'WAVE') {
    throw new Error(`${filename} is not a valid RIFF/WAVE file`)
  }

  let sampleRate = 0
  let bitsPerSample = 0
  let numChannels = 0
  let dataOffset = 0
  let dataSize = 0

  let offset = 12
  while (offset < buffer.length) {
    const chunkId = buffer.toString('utf8', offset, offset + 4)
    const chunkSize = buffer.readUInt32LE(offset + 4)

    if (chunkId === 'fmt ') {
      const format = buffer.readUInt16LE(offset + 8)
      if (format !== 1) throw new Error('Only PCM format is supported')
      numChannels = buffer.readUInt16LE(offset + 10)
      sampleRate = buffer.readUInt32LE(offset + 12)
      bitsPerSample = buffer.readUInt16LE(offset + 22)
    } else if (chunkId === 'data') {
      dataOffset = offset + 8
      dataSize = chunkSize
      break
    }

    offset += 8 + chunkSize
    if (chunkSize % 2 !== 0) offset++
  }

  if (dataOffset === 0) throw new Error('Data chunk not found')
  if (numChannels !== 1) throw new Error('Only mono files are supported')

  const bytesPerSample = bitsPerSample / 8
  const numSamples = Math.floor(dataSize / bytesPerSample)
  const samples = new Float32Array(numSamples)

  for (let i = 0; i < numSamples; i++) {
    const sOffset = dataOffset + i * bytesPerSample
    if (bitsPerSample === 16) {
      samples[i] = buffer.readInt16LE(sOffset) / 32768
    } else if (bitsPerSample === 24) {
      // Read 3 bytes and handle sign (24-bit signed integer)
      let val = buffer[sOffset] | (buffer[sOffset + 1] << 8) | (buffer[sOffset + 2] << 16)
      if (val & 0x800000) val |= 0xff000000 // Sign extend
      samples[i] = val / 8388608
    } else {
      throw new Error(`Unsupported bits per sample: ${bitsPerSample}`)
    }
  }

  return { samples, sampleRate }
}
