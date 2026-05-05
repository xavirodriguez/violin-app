'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { useTunerStore } from '@/stores/tuner-store'
import { Badge } from '@/components/ui/badge'
import { ArrowUp, ArrowDown, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * TunerDisplay
 *
 * Provides a high-fidelity visual interface for the violin tuner,
 * including a precision gauge and actionable pedagogical feedback.
 */
export function TunerDisplay() {
  const { state, thresholds } = useTunerStore()

  if (state.kind !== 'DETECTED' && state.kind !== 'LISTENING') return null

  const isDetected = state.kind === 'DETECTED'
  const note = isDetected ? state.note : '--'
  const cents = isDetected ? state.cents : 0
  const confidence = isDetected ? state.confidence : 0

  const feedback = getTunerFeedback(cents, isDetected, thresholds)
  const isString = ['G3', 'D4', 'A4', 'E5'].includes(note)

  return (
    <div className="space-y-12">
      {/* Target String Indicators */}
      <div className="flex justify-center gap-4">
        {['G3', 'D4', 'A4', 'E5'].map(s => (
          <Badge
            key={s}
            variant={note === s ? 'default' : 'outline'}
            className={cn(
              "px-4 py-1 text-lg font-bold transition-all duration-300",
              note === s ? "scale-110 shadow-lg" : "opacity-40 grayscale"
            )}
          >
            {s}
          </Badge>
        ))}
      </div>

      {/* Main Gauge */}
      <div className="relative flex flex-col items-center justify-center">
        <div className="text-9xl font-black tracking-tighter text-slate-900 mb-4 tabular-nums">
          {note}
        </div>

        <div className="w-full max-w-md h-24 relative flex items-end justify-center px-8">
          {/* Gauge Background */}
          <div className="absolute inset-x-8 bottom-4 h-2 bg-slate-100 rounded-full" />
          <div className="absolute left-1/2 bottom-2 w-0.5 h-6 bg-slate-300" />

          {/* Indicators */}
          <div className="absolute inset-x-8 bottom-0 flex justify-between px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Flat</span>
            <span>In Tune</span>
            <span>Sharp</span>
          </div>

          {/* Needle */}
          {isDetected && (
            <div
              className={cn(
                "absolute bottom-4 w-1 h-12 rounded-t-full transition-all duration-150 ease-out origin-bottom",
                Math.abs(cents) < thresholds.bitLow ? "bg-green-500 shadow-green-500/50" : "bg-amber-500"
              )}
              style={{
                left: `${50 + (cents / 50) * 50}%`,
                transform: `translateX(-50%) rotate(${(cents / 50) * 30}deg)`
              }}
            >
              <div className="w-4 h-4 rounded-full bg-inherit absolute -bottom-2 -left-1.5 shadow-sm" />
            </div>
          )}
        </div>
      </div>

      {/* Actionable Feedback */}
      <div className="text-center min-h-[100px] flex flex-col items-center justify-center space-y-3">
        <div className={cn(
          "text-3xl font-bold transition-colors",
          feedback.color
        )}>
          {feedback.message}
        </div>

        {isDetected && (
           <div className="flex items-center gap-2 text-slate-500 font-mono text-sm">
             <span>{cents > 0 ? '+' : ''}{cents.toFixed(1)} cents</span>
             <span className="opacity-30">|</span>
             <span>{Math.round(confidence * 100)}% Match</span>
           </div>
        )}
      </div>
    </div>
  )
}

function getTunerFeedback(cents: number, isDetected: boolean, thresholds: any) {
  if (!isDetected) {
    return { message: 'Toca una cuerda', color: 'text-slate-400' }
  }

  if (cents < thresholds.tooLow) {
    return { message: 'Muy bajo. Sube un poco.', color: 'text-red-500', icon: ArrowUp }
  }
  if (cents < thresholds.bitLow) {
    return { message: 'Un poco bajo.', color: 'text-amber-500', icon: ArrowUp }
  }
  if (cents <= thresholds.bitHigh) {
    return { message: 'Afinado', color: 'text-green-500', icon: CheckCircle2 }
  }
  if (cents <= thresholds.tooHigh) {
    return { message: 'Un poco alto.', color: 'text-amber-500', icon: ArrowDown }
  }
  return { message: 'Muy alto. Baja un poco.', color: 'text-red-500', icon: ArrowDown }
}
