/**
 * ViolinFingerboard
 * A visual representation of a violin fingerboard using HTML5 Canvas.
 * It provides real-time feedback on finger placement for both target and detected notes.
 */

'use client'

import { useEffect, useRef } from 'react'
import { MusicalNote, assertValidNoteName } from '@/lib/practice-core'
import { clamp } from '@/lib/ui-utils'
import { logger } from '@/lib/observability/logger'

// --- Type Definitions ---

/** Represents a finger index: 0 (Open), 1 (Index), 2 (Middle), 3 (Ring), 4 (Pinky). */
type Finger = 0 | 1 | 2 | 3 | 4

/**
 * Encapsulates the visual positioning information for a note on the fingerboard.
 */
interface FingerPosition {
  /** The string on which the note is played. */
  string: 'G' | 'D' | 'A' | 'E'
  /** The finger used to play the note. */
  finger: Finger
  /** The horizontal distance from the nut in pixels. */
  fretDistance: number
}

// --- Constants for fingerboard drawing ---

/** Definition of violin strings for rendering. */
const STRINGS = [
  { name: 'E', openPitch: 'E5', color: '#E8DCC8' },
  { name: 'A', openPitch: 'A4', color: '#D4B896' },
  { name: 'D', openPitch: 'D4', color: '#C8A882' },
  { name: 'G', openPitch: 'G3', color: '#B89870' },
] as const

/**
 * Mapping of musical notes to their visual positions on the fingerboard.
 * @internal
 */
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

/**
 * Props for the ViolinFingerboard component.
 */
interface ViolinFingerboardProps {
  /** The note the student should be playing (e.g., "A4"). */
  targetNote: string | null
  /** The note currently detected by the pitch tracker. */
  detectedPitchName: string | null
  /** The deviation in cents from the ideal frequency. Used for visual offset. */
  centsDeviation: number | null
  /** The tolerance in cents within which a note is considered "In Tune". @defaultValue 25 */
  centsTolerance?: number
  /** Explicit override for the in-tune state. */
  isInTune?: boolean
}

/**
 * Renders a visual representation of a violin fingerboard on a `<canvas>`.
 *
 * @param props - Component properties.
 * @returns A JSX element containing two layered canvases (base and overlay).
 *
 * @remarks
 * Architectural Pattern:
 * - Uses a dual-canvas strategy:
 *   1. `baseCanvas`: Renders the static fingerboard and strings once.
 *   2. `overlayCanvas`: Renders dynamic indicators (target/detected notes) on every update.
 * - This optimizes performance by avoiding full redraws of the complex fingerboard background.
 *
 * Interaction:
 * - Shows a blue circle for the `targetNote` with the required finger number.
 * - Shows a green (in-tune) or red (out-of-tune) circle for the `detectedPitchName`.
 * - The horizontal position of the detected note is shifted based on `centsDeviation`.
 */
export function ViolinFingerboard({
  targetNote,
  detectedPitchName,
  centsDeviation,
  centsTolerance = 25,
  isInTune,
}: ViolinFingerboardProps) {
  const baseCanvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)

  // Draw static fingerboard (base) only once on mount
  useEffect(() => {
    const canvas = baseCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    drawFingerboard(ctx, canvas.width, canvas.height)
  }, [])

  // Redraw dynamic indicators (overlay) whenever props change
  useEffect(() => {
    const canvas = overlayCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    handleTargetDrawing(ctx, targetNote, canvas.width, canvas.height)
    handleDetectedDrawing(
      ctx,
      detectedPitchName,
      centsDeviation,
      centsTolerance,
      isInTune,
      canvas.width,
      canvas.height,
    )
  }, [targetNote, detectedPitchName, centsDeviation, centsTolerance, isInTune])

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
 * Draws the base violin fingerboard and strings onto the canvas.
 *
 * @param ctx - The 2D canvas rendering context.
 * @param width - The width of the canvas.
 * @param height - The height of the canvas.
 * @internal
 */
function handleTargetDrawing(
  ctx: CanvasRenderingContext2D,
  targetNote: string | null,
  width: number,
  height: number,
) {
  if (!targetNote) return
  try {
    assertValidNoteName(targetNote)
    const normalizedTarget = MusicalNote.fromName(targetNote)
    const targetPosition = FINGER_POSITIONS[normalizedTarget.nameWithOctave]
    if (targetPosition) {
      drawTargetPosition(ctx, targetPosition, width, height)
    }
  } catch (error) {
    logger.debug(`[ViolinFingerboard] Target note not found or invalid: ${targetNote}`, {
      error,
    })
  }
}

function handleDetectedDrawing(
  ctx: CanvasRenderingContext2D,
  detectedPitchName: string | null,
  centsDeviation: number | null,
  centsTolerance: number,
  isInTune: boolean | undefined,
  width: number,
  height: number,
) {
  if (!detectedPitchName) return
  try {
    assertValidNoteName(detectedPitchName)
    const normalizedDetected = MusicalNote.fromName(detectedPitchName)
    const detectedPosition = FINGER_POSITIONS[normalizedDetected.nameWithOctave]

    if (detectedPosition) {
      const isNoteInTune =
        isInTune ?? (centsDeviation !== null && Math.abs(centsDeviation) < centsTolerance)

      drawDetectedPosition(ctx, detectedPosition, centsDeviation || 0, isNoteInTune, width, height)
    }
  } catch (error) {
    logger.debug(`[ViolinFingerboard] Detected note not found or invalid: ${detectedPitchName}`, {
      error,
    })
  }
}

function drawFingerboard(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const nutX = 50,
    bridgeX = width - 50
  const stringSpacing = (height - 100) / (STRINGS.length - 1)

  // Draw the fingerboard wood (dark brown rectangle)
  ctx.fillStyle = '#2D1B0E'
  ctx.fillRect(nutX, 30, bridgeX - nutX, height - 60)

  // Draw each string with its specific color and thickness
  STRINGS.forEach((string, index) => {
    const y = 50 + index * stringSpacing
    ctx.strokeStyle = string.color
    ctx.lineWidth = 1 + (3 - index) * 0.5
    ctx.beginPath()
    ctx.moveTo(nutX, y)
    ctx.lineTo(bridgeX, y)
    ctx.stroke()
  })

  // Draw the nut (ivory/bone colored bar)
  ctx.fillStyle = '#F5F5DC'
  ctx.fillRect(nutX - 5, 30, 5, height - 60)
}

/**
 * Draws the indicator for the target note position.
 *
 * @param ctx - The 2D canvas rendering context.
 * @param position - The fingerboard position data.
 * @param width - Canvas width.
 * @param height - Canvas height.
 * @internal
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

  // Outer circle (blue)
  ctx.fillStyle = '#3B82F6'
  ctx.strokeStyle = '#1E40AF'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x, y, 15, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Finger label
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 14px Inter'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(position.finger === 0 ? 'O' : position.finger.toString(), x, y)
}

/**
 * Draws the indicator for the currently detected pitch.
 *
 * @param ctx - The 2D canvas rendering context.
 * @param position - The ideal fingerboard position for the detected note.
 * @param centsDeviation - The deviation from ideal pitch, used for horizontal offset.
 * @param isInTune - Flag to determine color (green if in tune, red otherwise).
 * @param width - Canvas width.
 * @param height - Canvas height.
 * @internal
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
  const maxOffsetPx = (bridgeX - nutX) / 12 // Limit visual offset to approximately one semitone

  const stringIndex = STRINGS.findIndex((s) => s.name === position.string)
  const stringSpacing = (height - 100) / (STRINGS.length - 1)
  const y = 50 + stringIndex * stringSpacing
  const baseX = nutX + position.fretDistance

  // Apply visual displacement based on cents deviation
  const xOffset = clamp(centsDeviation * 0.3, -maxOffsetPx, maxOffsetPx)
  const finalX = clamp(baseX + xOffset, nutX + 12, bridgeX - 12) // +12 to keep circle within bounds

  ctx.fillStyle = isInTune ? '#4ADE80' : '#F87171'
  ctx.strokeStyle = isInTune ? '#16A34A' : '#DC2626'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(finalX, y, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
}
