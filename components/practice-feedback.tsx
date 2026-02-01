'use client'

import { Info, AlertTriangle } from 'lucide-react'
import { Observation } from '@/lib/technique-types'
import { EmotionalFeedback } from './emotional-feedback'
import { usePreferencesStore } from '@/stores/preferences-store'
import { FEEDBACK_CONFIGS } from '@/lib/user-preferences'
import { Card } from '@/components/ui/card'

interface PracticeFeedbackProps {
  targetNote: string
  detectedPitchName?: string
  centsOff?: number | null
  status: string
  liveObservations?: Observation[]
  /** The allowable pitch deviation in cents for a note to be considered "In Tune". @defaultValue 25 */
  centsTolerance?: number
}

export function PracticeFeedback({
  targetNote,
  detectedPitchName,
  centsOff,
  status,
  liveObservations = [],
  centsTolerance = 25,
}: PracticeFeedbackProps) {
  const isInTune =
    centsOff !== null && centsOff !== undefined && Math.abs(centsOff) < centsTolerance
  const isPlaying = !!(detectedPitchName && detectedPitchName !== '')
  const isCorrectNote = detectedPitchName === targetNote

  return (
    <div className="space-y-8">

      {/* NIVEL 1: Estado Principal - Ocupa 60% del espacio visual */}
      <div className="flex items-center justify-center min-h-[200px]">
        {status === 'listening' && !isPlaying && (
          <div className="text-center">
            <div className="text-6xl mb-4" role="img" aria-label="violin">🎻</div>
            <div className="text-2xl text-muted-foreground font-medium">
              Play {targetNote}
            </div>
          </div>
        )}

        {isPlaying && isCorrectNote && isInTune && (
          <div className="text-center">
            <CheckCircle2 className="w-32 h-32 text-green-500 mx-auto mb-4" />
            <div className="text-4xl font-bold text-green-500">Perfect!</div>
          </div>
        )}

        {isPlaying && isCorrectNote && !isInTune && (
          <div className="text-center">
            <div className="text-8xl font-bold mb-4" style={{
              color: Math.abs(centsOff!) < 15 ? '#F59E0B' : '#EF4444'
            }}>
              {centsOff! > 0 ? '↑' : '↓'}
            </div>
            <div className="text-3xl font-semibold" style={{
              color: Math.abs(centsOff!) < 15 ? '#F59E0B' : '#EF4444'
            }}>
              {Math.abs(centsOff!) < 15 ? 'Almost!' : 'Adjust'}
            </div>
            <div className="text-xl text-muted-foreground mt-2">
              {centsOff! > 0 ? 'Move finger down' : 'Move finger up'}
            </div>
          </div>
        )}

        {isPlaying && !isCorrectNote && (
          <div className="text-center">
            <AlertTriangle className="w-24 h-24 text-yellow-500 mx-auto mb-4" />
            <div className="text-3xl font-bold text-yellow-500 mb-2">
              Wrong Note
            </div>
            <div className="text-xl text-muted-foreground">
              Playing: <span className="font-mono">{detectedPitchName}</span>
            </div>
            <div className="text-xl text-muted-foreground">
              Need: <span className="font-mono">{targetNote}</span>
            </div>
          </div>
        )}
      </div>

      {/* NIVEL 2: Métricas Precisas - Colapsable, fuente pequeña */}
      {isPlaying && centsOff !== null && centsOff !== undefined && (
        <details className="text-center">
          <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            Show Technical Details
          </summary>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-center gap-8">
              <div>
                <div className="text-muted-foreground">Deviation</div>
                <div className="font-mono text-lg">
                  {centsOff > 0 ? '+' : ''}{centsOff.toFixed(1)}¢
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Tolerance</div>
                <div className="font-mono text-lg">±10¢</div>
              </div>
            </div>
          </div>
        </details>
      )}

      {/* NIVEL 3: Observaciones en Vivo - Solo las más importantes */}
      {liveObservations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            <Info className="h-4 w-4" />
            <span>Live Feedback</span>
          </div>
          {liveObservations.slice(0, 2).map((obs, idx) => (
            <div
              key={idx}
              className={`rounded-lg border p-3 transition-all ${
                obs.severity === 3
                  ? 'bg-red-500/10 border-red-500/20'
                  : obs.severity === 2
                    ? 'bg-yellow-500/10 border-yellow-500/20'
                    : 'bg-blue-500/10 border-blue-500/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className={`h-5 w-5 flex-shrink-0 ${
                    obs.severity === 3 ? 'text-red-500' : 'text-yellow-500'
                  }`}
                />
                <div className="flex-1">
                  <div className="text-sm font-bold">{obs.message}</div>
                  <div className="text-xs text-muted-foreground">{obs.tip}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
