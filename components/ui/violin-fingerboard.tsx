'use client'

import { useEffect, useRef } from 'react'
import { MusicalNote } from '@/lib/practice-core'
import { clamp } from '@/lib/ui-utils'
import { logger } from '@/lib/observability/logger'

// --- Type Definitions ---

type Finger = 0 | 1 | 2 | 3 | 4
interface FingerPosition {
  string: 'G' | 'D' | 'A' | 'E'
  finger: Finger
  fretDistance: number // in pixels from the nut
}

// --- (Omitted for brevity: Constants for fingerboard drawing) ---

const STRINGS = [
  { name: 'E', openPitch: 'E5', color: '#E8DCC8' },
  { name: 'A', openPitch: 'A4', color: '#D4B896' },
  { name: 'D', openPitch: 'D4', color: '#C8A882' },
  { name: 'G', openPitch: 'G3', color: '#B89870' },
] as const

const FINGER_POSITIONS: Record<string, FingerPosition> = {
  // G String
  G3: { string: 'G', finger: 0, fretDistance: 0 },
  'G#3': { string: 'G', finger: 1, fretDistance: 20 },
  A3: { string: 'G', finger: 1, fretDistance: 45 },
  'A#3': { string: 'G', finger: 2, fretDistance: 65 },
  B3: { string: 'G', finger: 2, fretDistance: 90 },
  C4: { string: 'G', finger: 3, fretDistance: 120 },
  'C#4': { string: 'G', finger: 4, fretDistance: 150 },
  // D String
  D4: { string: 'D', finger: 0, fretDistance: 0 },
  'D#4': { string: 'D', finger: 1, fretDistance: 20 },
  E4: { string: 'D', finger: 1, fretDistance: 45 },
  F4: { string: 'D', finger: 2, fretDistance: 65 },
  'F#4': { string: 'D', finger: 2, fretDistance: 85 },
  G4: { string: 'D', finger: 3, fretDistance: 120 },
  'G#4': { string: 'D', finger: 4, fretDistance: 150 },
  // A String
  A4: { string: 'A', finger: 0, fretDistance: 0 },
  'A#4': { string: 'A', finger: 1, fretDistance: 20 },
  B4: { string: 'A', finger: 1, fretDistance: 45 },
  C5: { string: 'A', finger: 2, fretDistance: 65 },
  'C#5': { string: 'A', finger: 2, fretDistance: 85 },
  D5: { string: 'A', finger: 3, fretDistance: 120 },
  'D#5': { string: 'A', finger: 4, fretDistance: 150 },
  // E String
  E5: { string: 'E', finger: 0, fretDistance: 0 },
  F5: { string: 'E', finger: 1, fretDistance: 20 },
  'F#5': { string: 'E', finger: 1, fretDistance: 45 },
  G5: { string: 'E', finger: 2, fretDistance: 65 },
  'G#5': { string: 'E', finger: 2, fretDistance: 85 },
  A5: { string: 'E', finger: 3, fretDistance: 120 },
}

interface ViolinFingerboardProps {
  targetNote: string | null
  detectedPitchName?: string
  centsDeviation?: number | null
  centsTolerance?: number
}

/**
 * Renderiza una representación visual del diapasón de un violín en un elemento `<canvas>`.
 * @remarks Muestra la posición de la nota objetivo y la nota detectada para proporcionar
 * retroalimentación visual sobre la posición de los dedos.
 */
export function ViolinFingerboard({
  targetNote,
  detectedPitchName,
  centsDeviation,
  centsTolerance = 25,
}: ViolinFingerboardProps) {
  const baseCanvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)

  // Dibuja el fingerboard estático (base) solo una vez
  useEffect(() => {
    const canvas = baseCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    drawFingerboard(ctx, canvas.width, canvas.height)
  }, [])

  // Dibuja las notas (overlay) cada vez que cambian
  useEffect(() => {
    const canvas = overlayCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Normalizar y dibujar la nota objetivo
    let targetPosition: FingerPosition | null = null
    if (targetNote) {
      try {
        const normalizedTarget = MusicalNote.fromName(targetNote)
        targetPosition = FINGER_POSITIONS[normalizedTarget.nameWithOctave]
        if (targetPosition) {
          drawTargetPosition(ctx, targetPosition, canvas.width, canvas.height)
        }
      } catch (error) {
        logger.debug(`[ViolinFingerboard] Target note not found or invalid: ${targetNote}`, {
          error,
        })
      }
    }

    // Normalizar y dibujar la nota detectada
    if (detectedPitchName) {
      try {
        const normalizedDetected = MusicalNote.fromName(detectedPitchName)
        const detectedPosition = FINGER_POSITIONS[normalizedDetected.nameWithOctave]

        if (detectedPosition) {
          const isInTune =
            centsDeviation !== null &&
            centsDeviation !== undefined &&
            Math.abs(centsDeviation) < centsTolerance

          drawDetectedPosition(
            ctx,
            detectedPosition,
            centsDeviation || 0,
            isInTune,
            canvas.width,
            canvas.height,
          )
        }
      } catch (error) {
        logger.debug(
          `[ViolinFingerboard] Detected note not found or invalid: ${detectedPitchName}`,
          { error },
        )
      }
    }
  }, [targetNote, detectedPitchName, centsDeviation, centsTolerance])

  return (
    <div className="violin-fingerboard" style={{ position: 'relative' }}>
      <canvas
        ref={baseCanvasRef}
        width={400}
        height={300}
        className="fingerboard-canvas-base"
        style={{ position: 'absolute', left: 0, top: 0, zIndex: 0 }}
      />
      <canvas
        ref={overlayCanvasRef}
        width={400}
        height={300}
        className="fingerboard-canvas-overlay"
        style={{ position: 'absolute', left: 0, top: 0, zIndex: 1 }}
      />
    </div>
  )
}

/**
 * Dibuja el diapasón base del violín en el canvas.
 * @param ctx - El contexto 2D del canvas.
 * @param width - El ancho del canvas.
 * @param height - La altura del canvas.
 */
function drawFingerboard(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const nutX = 50,
    bridgeX = width - 50
  const stringSpacing = (height - 100) / (STRINGS.length - 1)
  ctx.fillStyle = '#2D1B0E'
  ctx.fillRect(nutX, 30, bridgeX - nutX, height - 60)
  STRINGS.forEach((string, index) => {
    const y = 50 + index * stringSpacing
    ctx.strokeStyle = string.color
    ctx.lineWidth = 1 + (3 - index) * 0.5
    ctx.beginPath()
    ctx.moveTo(nutX, y)
    ctx.lineTo(bridgeX, y)
    ctx.stroke()
  })
  ctx.fillStyle = '#F5F5DC'
  ctx.fillRect(nutX - 5, 30, 5, height - 60)
}

/**
 * Dibuja el indicador para la nota objetivo en el diapasón.
 * @param ctx - El contexto 2D del canvas.
 * @param position - La información de la posición de la nota.
 * @param width - El ancho del canvas.
 * @param height - La altura del canvas.
 */
function drawTargetPosition(
  ctx: CanvasRenderingContext2D,
  position: FingerPosition,
  width: number,
  height: number,
) {
  const nutX = 50
  const stringIndex = STRINGS.findIndex((s) => s.name === position.string)
  const stringSpacing = (height - 100) / (STRINGS.length - 1)
  const y = 50 + stringIndex * stringSpacing
  const x = nutX + position.fretDistance
  ctx.fillStyle = '#3B82F6'
  ctx.strokeStyle = '#1E40AF'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x, y, 15, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 14px Inter'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(position.finger === 0 ? 'O' : position.finger.toString(), x, y)
}

/**
 * Dibuja el indicador para la nota detectada en el diapasón.
 * @param ctx - El contexto 2D del canvas.
 * @param position - La información de la posición de la nota.
 * @param centsDeviation - La desviación en cents para ajustar la posición.
 * @param isInTune - Si la nota está afinada, para colorear el indicador.
 * @param width - El ancho del canvas.
 * @param height - La altura del canvas.
 */
function drawDetectedPosition(
  ctx: CanvasRenderingContext2D,
  position: FingerPosition,
  centsDeviation: number,
  isInTune: boolean,
  width: number,
  height: number,
) {
  const nutX = 50
  const bridgeX = width - 50
  const maxOffsetPx = (bridgeX - nutX) / 12 // Limita el offset a un semitono aprox.

  const stringIndex = STRINGS.findIndex((s) => s.name === position.string)
  const stringSpacing = (height - 100) / (STRINGS.length - 1)
  const y = 50 + stringIndex * stringSpacing
  const baseX = nutX + position.fretDistance

  // Clamping del desplazamiento visual
  const xOffset = clamp(centsDeviation * 0.3, -maxOffsetPx, maxOffsetPx)
  const finalX = clamp(baseX + xOffset, nutX + 12, bridgeX - 12) // +12 para el radio del círculo

  ctx.fillStyle = isInTune ? '#4ADE80' : '#F87171'
  ctx.strokeStyle = isInTune ? '#16A34A' : '#DC2626'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(finalX, y, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
}
