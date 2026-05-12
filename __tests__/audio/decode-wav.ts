import { readFileSync } from 'fs'
import { join } from 'path'

interface WavMetadata {
  sampleRate: number
  bitsPerSample: number
  numChannels: number
  dataOffset: number
  dataSize: number
}

/**
 * Robust WAV decoder for tests.
 * Supports 16-bit and 24-bit PCM mono files.
 */
export function loadWavAsFloat32(filename: string): { samples: Float32Array; sampleRate: number } {
  const filePath = join(process.cwd(), '__tests__/audio', filename)
  const buffer = readFileSync(filePath)

  validateRiffHeader(buffer, filename)

  const metadata = parseChunks(buffer)

  if (metadata.dataOffset === 0) throw new Error('Data chunk not found')
  if (metadata.numChannels !== 1) throw new Error('Only mono files are supported')

  const samples = convertToFloat32(buffer, metadata)

  return { samples, sampleRate: metadata.sampleRate }
}

function validateRiffHeader(buffer: Buffer, filename: string): void {
  if (buffer.toString('utf8', 0, 4) !== 'RIFF' || buffer.toString('utf8', 8, 12) !== 'WAVE') {
    throw new Error(`${filename} is not a valid RIFF/WAVE file`)
  }
}

function parseChunks(buffer: Buffer): WavMetadata {
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

  return { sampleRate, bitsPerSample, numChannels, dataOffset, dataSize }
}

function convertToFloat32(buffer: Buffer, metadata: WavMetadata): Float32Array {
  const { bitsPerSample, dataOffset, dataSize } = metadata
  const bytesPerSample = bitsPerSample / 8
  const numSamples = Math.floor(dataSize / bytesPerSample)
  const samples = new Float32Array(numSamples)

  for (let i = 0; i < numSamples; i++) {
    const sOffset = dataOffset + i * bytesPerSample
    if (bitsPerSample === 16) {
      samples[i] = buffer.readInt16LE(sOffset) / 32768
    } else if (bitsPerSample === 24) {
      samples[i] = read24BitSample(buffer, sOffset) / 8388608
    } else {
      throw new Error(`Unsupported bits per sample: ${bitsPerSample}`)
    }
  }
  return samples
}

function read24BitSample(buffer: Buffer, offset: number): number {
  let val = buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16)
  if (val & 0x800000) val |= 0xff000000 // Sign extend
  return val
}
