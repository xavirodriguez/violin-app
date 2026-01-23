'use client'

import { useEffect, useRef } from 'react'
import { MusicalNote } from '@/lib/practice-core'

// --- (Omitted for brevity: Interfaces and constants for fingerboard drawing) ---

const STRINGS = [
    { name: 'E', openPitch: 'E5', color: '#E8DCC8' },
    { name: 'A', openPitch: 'A4', color: '#D4B896' },
    { name: 'D', openPitch: 'D4', color: '#C8A882' },
    { name: 'G', openPitch: 'G3', color: '#B89870' },
]

const FINGER_POSITIONS = {
  G3: { string: 'G', finger: 0, fretDistance: 0 }, A3: { string: 'G', finger: 1, fretDistance: 45 },
  B3: { string: 'G', finger: 2, fretDistance: 90 }, C4: { string: 'G', finger: 3, fretDistance: 120 },
  D4: { string: 'D', finger: 0, fretDistance: 0 }, E4: { string: 'D', finger: 1, fretDistance: 45 },
  'F#4': { string: 'D', finger: 2, fretDistance: 85 }, G4: { string: 'D', finger: 3, fretDistance: 120 },
  A4: { string: 'A', finger: 0, fretDistance: 0 }, B4: { string: 'A', finger: 1, fretDistance: 45 },
  'C#5': { string: 'A', finger: 2, fretDistance: 85 }, D5: { string: 'A', finger: 3, fretDistance: 120 },
  E5: { string: 'E', finger: 0, fretDistance: 0 }, 'F#5': { string: 'E', finger: 1, fretDistance: 45 },
  'G#5': { string: 'E', finger: 2, fretDistance: 85 }, A5: { string: 'E', finger: 3, fretDistance: 120 },
}


interface ViolinFingerboardProps {
  targetNote: string | null
  detectedPitchName?: string
  centsDeviation?: number | null
}


export function ViolinFingerboard({
  targetNote,
  detectedPitchName,
  centsDeviation,
}: ViolinFingerboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isInTune = centsDeviation !== null && centsDeviation !== undefined && Math.abs(centsDeviation) < 25;

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawFingerboard(ctx, canvas.width, canvas.height)

    if (targetNote) {
      const targetPosition = FINGER_POSITIONS[targetNote]
      if (targetPosition) {
        drawTargetPosition(ctx, targetPosition, canvas.width, canvas.height)
      }
    }

    if (detectedPitchName) {
        const detectedPosition = FINGER_POSITIONS[detectedPitchName];
        if(detectedPosition) {
            drawDetectedPosition(ctx, detectedPosition, centsDeviation || 0, isInTune, canvas.width, canvas.height);
        }
    }

  }, [targetNote, detectedPitchName, centsDeviation, isInTune])

  return (
    <div className="violin-fingerboard">
      <canvas ref={canvasRef} width={400} height={300} className="fingerboard-canvas" />
    </div>
  )
}

// --- (Omitted for brevity: Drawing helper functions: drawFingerboard, drawTargetPosition, drawDetectedPosition) ---
function drawFingerboard(ctx, width, height) {
    const nutX = 50, bridgeX = width - 50;
    const stringSpacing = (height - 100) / (STRINGS.length - 1);
    ctx.fillStyle = '#2D1B0E';
    ctx.fillRect(nutX, 30, bridgeX - nutX, height - 60);
    STRINGS.forEach((string, index) => {
        const y = 50 + index * stringSpacing;
        ctx.strokeStyle = string.color;
        ctx.lineWidth = 1 + (3 - index) * 0.5;
        ctx.beginPath();
        ctx.moveTo(nutX, y);
        ctx.lineTo(bridgeX, y);
        ctx.stroke();
    });
    ctx.fillStyle = '#F5F5DC';
    ctx.fillRect(nutX - 5, 30, 5, height - 60);
}

function drawTargetPosition(ctx, position, width, height) {
    const nutX = 50;
    const stringIndex = STRINGS.findIndex(s => s.name === position.string);
    const stringSpacing = (height - 100) / (STRINGS.length - 1);
    const y = 50 + stringIndex * stringSpacing;
    const x = nutX + position.fretDistance;
    ctx.fillStyle = '#3B82F6';
    ctx.strokeStyle = '#1E40AF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(position.finger === 0 ? 'O' : position.finger.toString(), x, y);
}

function drawDetectedPosition(ctx, position, centsDeviation, isInTune, width, height) {
    const nutX = 50;
    const stringIndex = STRINGS.findIndex(s => s.name === position.string);
    const stringSpacing = (height - 100) / (STRINGS.length - 1);
    const y = 50 + stringIndex * stringSpacing;
    const baseX = nutX + position.fretDistance;
    const xOffset = centsDeviation * 0.3;
    const x = baseX + xOffset;
    ctx.fillStyle = isInTune ? '#4ADE80' : '#F87171';
    ctx.strokeStyle = isInTune ? '#16A34A' : '#DC2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
}

