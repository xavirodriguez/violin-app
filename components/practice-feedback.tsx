'use client'

import { CheckCircle2, AlertTriangle } from 'lucide-react'

/**
 * Props for the {@link PracticeFeedback} component.
 */
export interface PracticeFeedbackProps {
  targetNote: string
  detectedPitchName: string | undefined
  centsOff: number | undefined
  status: string
  centsTolerance?: number
  holdDuration?: number
  requiredHoldTime?: number
}

/**
 * Component that provides simplified real-time feedback.
 * Focused on: In Tune, Sharp, Flat, Wrong Note.
 */
export function PracticeFeedback(props: PracticeFeedbackProps) {
  const {
    targetNote,
    detectedPitchName,
    centsOff,
    centsTolerance = 25,
    holdDuration = 0,
    requiredHoldTime = 300,
  } = props

  const isPlaying = !!(detectedPitchName && detectedPitchName !== '')
  const isCorrectNote = detectedPitchName === targetNote
  const isInTune = isCorrectNote && centsOff !== undefined && Math.abs(centsOff) < centsTolerance

  if (!isPlaying) {
    return (
      <div className="flex min-h-[150px] items-center justify-center border-2 border-dashed rounded-xl">
        <div className="text-center text-muted-foreground">
          <p className="text-xl font-medium">Toca la nota {targetNote}</p>
        </div>
      </div>
    )
  }

  if (isCorrectNote) {
    if (isInTune) {
        const progress = Math.min(100, (holdDuration / requiredHoldTime) * 100)
        return (
            <div className="flex min-h-[150px] flex-col items-center justify-center bg-green-500/10 border-2 border-green-500 rounded-xl">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                <p className="text-2xl font-bold text-green-600">¡Perfecto!</p>
                <div className="w-48 h-2 bg-green-200 rounded-full mt-4 overflow-hidden">
                    <div
                        className="h-full bg-green-500 transition-all duration-75"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        )
    }

    const direction = centsOff! > 0 ? 'Más Bajo' : 'Más Alto'
    const colorClass = Math.abs(centsOff!) < 50 ? 'text-amber-500' : 'text-red-500'
    const borderClass = Math.abs(centsOff!) < 50 ? 'border-amber-500' : 'border-red-500'
    const bgClass = Math.abs(centsOff!) < 50 ? 'bg-amber-500/10' : 'bg-red-500/10'

    return (
        <div className={`flex min-h-[150px] flex-col items-center justify-center ${bgClass} border-2 ${borderClass} rounded-xl`}>
            <p className={`text-4xl font-black ${colorClass} mb-2`}>
                {centsOff! > 0 ? '↓' : '↑'}
            </p>
            <p className={`text-2xl font-bold ${colorClass}`}>{direction}</p>
            <p className="text-sm text-muted-foreground mt-2">{Math.abs(Math.round(centsOff!))} cents de desviación</p>
        </div>
    )
  }

  return (
    <div className="flex min-h-[150px] flex-col items-center justify-center bg-yellow-500/10 border-2 border-yellow-500 rounded-xl">
      <AlertTriangle className="h-10 w-10 text-yellow-600 mb-2" />
      <p className="text-xl font-bold text-yellow-700">Nota Incorrecta</p>
      <p className="text-muted-foreground">Estás tocando: <span className="font-mono font-bold text-foreground">{detectedPitchName}</span></p>
      <p className="text-muted-foreground">Debes tocar: <span className="font-mono font-bold text-foreground">{targetNote}</span></p>
    </div>
  )
}
