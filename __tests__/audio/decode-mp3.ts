import { readFileSync } from 'fs'
import { join } from 'path'
import { MPEGDecoder } from 'mpg123-decoder'

/**
 * MP3 decoder for tests using mpg123-decoder.
 */
export async function loadMp3AsFloat32(
  filename: string,
): Promise<{ samples: Float32Array; sampleRate: number }> {
  const filePath = join(process.cwd(), '__tests__/audio', filename)
  const buffer = readFileSync(filePath)
  const uint8Array = new Uint8Array(buffer)

  const decoder = new MPEGDecoder()
  await decoder.ready

  const { channelData, sampleRate } = decoder.decode(uint8Array)

  const samples = channelData[0]
  decoder.free()

  return { samples, sampleRate }
}
