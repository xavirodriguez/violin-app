import { readFileSync } from 'fs'
import { join } from 'path'
import { MPEGDecoder } from 'mpg123-decoder'

/**
 * MP3 decoder for tests using mpg123-decoder.
 * Decodes MP3 to Float32Array PCM.
 */
export async function loadMp3AsFloat32(
  filename: string,
): Promise<{ samples: Float32Array; sampleRate: number }> {
  const filePath = join(process.cwd(), '__tests__/audio', filename)
  const buffer = readFileSync(filePath)

  const decoder = new MPEGDecoder()
  await decoder.ready

  const { channelData, sampleRate } = decoder.decode(buffer)

  // We expect mono or we take the first channel if stereo
  const samples = channelData[0]

  decoder.free()

  return { samples, sampleRate }
}
