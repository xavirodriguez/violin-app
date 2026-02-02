/**
 * Puerto para análisis de audio independiente de Web Audio API
 * Permite testing con datos sintéticos
 */

import { PitchDetectionResult } from '../pitch-detector'

export interface AudioFramePort {
  /**
   * Obtiene el siguiente frame de audio
   * @returns Buffer de muestras PCM float32 [-1, 1]
   */
  getFrame(): Float32Array

  /**
   * Sample rate del stream
   */
  readonly sampleRate: number
}

export interface PitchDetectionPort {
  /**
   * Detecta pitch del frame
   * @throws Never - retorna confidence=0 en fallo
   */
  detect(frame: Float32Array): PitchDetectionResult

  /**
   * Calcula el RMS (volumen) del frame
   */
  calculateRMS(frame: Float32Array): number
}

/**
 * Puerto para obtener frames en loop (reemplaza RAF)
 */
export interface AudioLoopPort {
  /**
   * Ejecuta callback en cada frame disponible
   * @param onFrame Callback ejecutado con cada nuevo frame
   * @param signal Cancela el loop
   */
  start(
    onFrame: (frame: Float32Array) => void,
    signal: AbortSignal
  ): Promise<void>
}
