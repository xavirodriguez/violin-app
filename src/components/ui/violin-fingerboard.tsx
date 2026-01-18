'use client'

import { useEffect, useRef } from 'react'
import { MusicalNote } from '@/lib/musical-note'

interface ViolinString {
  name: 'G' | 'D' | 'A' | 'E'
  openPitch: string // 'G3', 'D4', 'A4', 'E5'
  color: string // Visual color for the string
}

interface FingerPosition {
  string: ViolinString['name']
  finger: 0 | 1 | 2 | 3 | 4 // 0 = open string, 1-4 = fingers
  position: number // 1st position, 2nd position, etc.
  pitch: string // 'A4', 'B4', etc.
  cents: number // 0 = perfect, +/- = deviation
  fretDistance: number // Distance from nut in mm (for visual positioning)
}

const STRINGS: ViolinString[] = [
  { name: 'E', openPitch: 'E5', color: '#E8DCC8' },
  { name: 'A', openPitch: 'A4', color: '#D4B896' },
  { name: 'D', openPitch: 'D4', color: '#C8A882' },
  { name: 'G', openPitch: 'G3', color: '#B89870' },
]

// Position mapping (simplified - first position only for v1)
const FINGER_POSITIONS: Record<string, FingerPosition> = {
  // G String (G3)
  G3: { string: 'G', finger: 0, position: 1, pitch: 'G3', cents: 0, fretDistance: 0 },
  A3: { string: 'G', finger: 1, position: 1, pitch: 'A3', cents: 0, fretDistance: 45 },
  B3: { string: 'G', finger: 2, position: 1, pitch: 'B3', cents: 0, fretDistance: 90 },
  C4: { string: 'G', finger: 3, position: 1, pitch: 'C4', cents: 0, fretDistance: 120 },

  // D String (D4)
  D4: { string: 'D', finger: 0, position: 1, pitch: 'D4', cents: 0, fretDistance: 0 },
  E4: { string: 'D', finger: 1, position: 1, pitch: 'E4', cents: 0, fretDistance: 45 },
  'F#4': { string: 'D', finger: 2, position: 1, pitch: 'F#4', cents: 0, fretDistance: 85 },
  G4: { string: 'D', finger: 3, position: 1, pitch: 'G4', cents: 0, fretDistance: 120 },

  // A String (A4)
  A4: { string: 'A', finger: 0, position: 1, pitch: 'A4', cents: 0, fretDistance: 0 },
  B4: { string: 'A', finger: 1, position: 1, pitch: 'B4', cents: 0, fretDistance: 45 },
  'C#5': { string: 'A', finger: 2, position: 1, pitch: 'C#5', cents: 0, fretDistance: 85 },
  D5: { string: 'A', finger: 3, position: 1, pitch: 'D5', cents: 0, fretDistance: 120 },

  // E String (E5)
  E5: { string: 'E', finger: 0, position: 1, pitch: 'E5', cents: 0, fretDistance: 0 },
  'F#5': { string: 'E', finger: 1, position: 1, pitch: 'F#5', cents: 0, fretDistance: 45 },
  'G#5': { string: 'E', finger: 2, position: 1, pitch: 'G#5', cents: 0, fretDistance: 85 },
  A5: { string: 'E', finger: 3, position: 1, pitch: 'A5', cents: 0, fretDistance: 120 },
}

export function ViolinFingerboard({
  targetNote,
  detectedPitch,
  centsDeviation,
  isInTune,
}: {
  targetNote: string | null // e.g., "A4"
  detectedPitch: number | null // Hz
  centsDeviation: number | null
  isInTune: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw fingerboard
    drawFingerboard(ctx, canvas.width, canvas.height)

    // Draw target position
    if (targetNote) {
      const targetPosition = FINGER_POSITIONS[targetNote]
      if (targetPosition) {
        drawTargetPosition(ctx, targetPosition, canvas.width, canvas.height)
      }
    }

    // Draw detected position
    if (detectedPitch && targetNote) {
      const detectedNote = frequencyToNote(detectedPitch)
      const detectedPosition = FINGER_POSITIONS[detectedNote]
      if (detectedPosition) {
        drawDetectedPosition(
          ctx,
          detectedPosition,
          centsDeviation || 0,
          isInTune,
          canvas.width,
          canvas.height,
        )
      }
    }
  }, [targetNote, detectedPitch, centsDeviation, isInTune])

  return (
    <div className="violin-fingerboard">
      <canvas ref={canvasRef} width={400} height={300} className="fingerboard-canvas" />

      {/* Pitch accuracy indicator */}
      {centsDeviation !== null && (
        <PitchAccuracyIndicator cents={centsDeviation} isInTune={isInTune} />
      )}

      {/* Finger placement guide */}
      {targetNote && FINGER_POSITIONS[targetNote] && (
        <FingerPlacementGuide position={FINGER_POSITIONS[targetNote]} />
      )}
    </div>
  )
}

function drawFingerboard(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const nutX = 50
  const bridgeX = width - 50
  const stringSpacing = (height - 100) / (STRINGS.length - 1)

  // Draw fingerboard background
  ctx.fillStyle = '#2D1B0E' // Dark wood color
  ctx.fillRect(nutX, 30, bridgeX - nutX, height - 60)

  // Draw strings
  STRINGS.forEach((string, index) => {
    const y = 50 + index * stringSpacing
    const thickness = 1 + (3 - index) * 0.5 // G string thickest

    ctx.strokeStyle = string.color
    ctx.lineWidth = thickness
    ctx.beginPath()
    ctx.moveTo(nutX, y)
    ctx.lineTo(bridgeX, y)
    ctx.stroke()

    // String label
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '14px Inter'
    ctx.fillText(string.name, 20, y + 5)
  })

  // Draw nut
  ctx.fillStyle = '#F5F5DC' // Bone color
  ctx.fillRect(nutX - 5, 30, 5, height - 60)

  // Draw position markers (1st, 3rd positions)
  const positions = [
    { pos: 1, distance: 80 },
    { pos: 3, distance: 200 },
  ]

  positions.forEach(({ pos, distance }) => {
    const x = nutX + distance
    ctx.strokeStyle = '#8B7355'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(x, 30)
    ctx.lineTo(x, height - 30)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = '#8B7355'
    ctx.font = '10px Inter'
    ctx.fillText(`${pos}st`, x - 8, height - 10)
  })
}

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

  // Draw target circle (blue)
  ctx.fillStyle = '#3B82F6'
  ctx.strokeStyle = '#1E40AF'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x, y, 15, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Draw finger number
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 14px Inter'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(position.finger === 0 ? 'O' : position.finger.toString(), x, y)

  // Draw pitch label above
  ctx.fillStyle = '#1E40AF'
  ctx.font = '12px Inter'
  ctx.fillText(position.pitch, x, y - 25)
}

function drawDetectedPosition(
  ctx: CanvasRenderingContext2D,
  position: FingerPosition,
  centsDeviation: number,
  isInTune: boolean,
  width: number,
  height: number,
) {
  const nutX = 50
  const stringIndex = STRINGS.findIndex((s) => s.name === position.string)
  const stringSpacing = (height - 100) / (STRINGS.length - 1)
  const y = 50 + stringIndex * stringSpacing

  // Adjust x position based on cents deviation
  // Each cent ≈ 0.3mm visual offset
  const baseX = nutX + position.fretDistance
  const xOffset = centsDeviation * 0.3
  const x = baseX + xOffset

  // Draw detected circle (green if in tune, red if not)
  ctx.fillStyle = isInTune ? '#4ADE80' : '#F87171'
  ctx.strokeStyle = isInTune ? '#16A34A' : '#DC2626'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x, y, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Draw connection line to target if not in tune
  if (!isInTune && Math.abs(xOffset) > 3) {
    ctx.strokeStyle = '#F59E0B'
    ctx.lineWidth = 2
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(baseX, y)
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Pulse animation when in tune
  if (isInTune) {
    ctx.fillStyle = 'rgba(74, 222, 128, 0.3)'
    ctx.beginPath()
    ctx.arc(x, y, 20, 0, Math.PI * 2)
    ctx.fill()
  }
}

function frequencyToNote(frequency: number): string {
  if (frequency <= 0) {
    return ''
  }
  const note = MusicalNote.fromFrequency(frequency)
  return note.getFullName()
}

export function PitchAccuracyIndicator({ cents, isInTune }: { cents: number; isInTune: boolean }) {
  // Normalize cents to -50 to +50 range for display
  const normalizedCents = Math.max(-50, Math.min(50, cents))
  const percentage = ((normalizedCents + 50) / 100) * 100

  return (
    <div className="pitch-accuracy">
      <h3>Pitch Accuracy</h3>

      {/* Visual slider */}
      <div className="accuracy-slider">
        <div className="slider-track">
          {/* Center line (perfect pitch) */}
          <div className="center-line" />

          {/* Current position indicator */}
          <div
            className={`position-indicator ${isInTune ? 'in-tune' : 'out-of-tune'}`}
            style={{ left: `${percentage}%` }}
          >
            <div className="indicator-dot" />
            <div className="indicator-label">
              {cents > 0 ? '+' : ''}
              {cents.toFixed(0)}¢
            </div>
          </div>
        </div>

        {/* Labels */}
        <div className="slider-labels">
          <span>-50¢ FLAT</span>
          <span>0¢ TUNE</span>
          <span>+50¢ SHARP</span>
        </div>
      </div>

      {/* Status text */}
      <div className={`status ${isInTune ? 'in-tune' : 'out-of-tune'}`}>
        {isInTune ? '✓ In Tune!' : getTuningAdvice(cents)}
      </div>
    </div>
  )
}

function getTuningAdvice(cents: number): string {
  if (cents > 15) return '↑ Too Sharp - Lower your finger slightly'
  if (cents > 5) return '↑ Slightly Sharp - Lower finger a bit'
  if (cents < -15) return '↓ Too Flat - Raise your finger slightly'
  if (cents < -5) return '↓ Slightly Flat - Raise finger a bit'
  return 'Almost there!'
}

export function FingerPlacementGuide({ position }: { position: FingerPosition }) {
  const fingerNames = ['Open', 'Index (1st)', 'Middle (2nd)', 'Ring (3rd)', 'Pinky (4th)']

  return (
    <div className="finger-guide">
      <h3>🎻 Finger Placement</h3>

      <div className="target-info">
        <div className="info-row">
          <span className="label">Target:</span>
          <span className="value">{position.pitch}</span>
        </div>
        <div className="info-row">
          <span className="label">String:</span>
          <span className="value">{position.string} String</span>
        </div>
        <div className="info-row">
          <span className="label">Finger:</span>
          <span className="value">{fingerNames[position.finger]}</span>
        </div>
        <div className="info-row">
          <span className="label">Position:</span>
          <span className="value">
            {position.position === 1 ? '1st Position' : `${position.position}rd Position`}
          </span>
        </div>
        {position.fretDistance > 0 && (
          <div className="info-row">
            <span className="label">Distance from nut:</span>
            <span className="value">~{Math.round(position.fretDistance / 2.5)}mm</span>
          </div>
        )}
      </div>

      {/* Simple finger diagram */}
      <div className="finger-diagram">
        <svg width="200" height="100" viewBox="0 0 200 100">
          {/* String */}
          <line x1="20" y1="50" x2="180" y2="50" stroke="#C8A882" strokeWidth="2" />

          {/* Nut */}
          <rect x="15" y="30" width="5" height="40" fill="#F5F5DC" />

          {/* Finger position marker */}
          {position.finger > 0 && (
            <>
              <circle
                cx={20 + position.fretDistance / 1.5}
                cy="50"
                r="12"
                fill="#3B82F6"
                stroke="#1E40AF"
                strokeWidth="2"
              />
              <text
                x={20 + position.fretDistance / 1.5}
                y="55"
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="bold"
              >
                {position.finger}
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  )
}
