/**
 * TunerMode
 * Provides the user interface for the violin tuner.
 * Handles the audio analysis loop and visualizes pitch detection results.
 */

'use client'

import { useEffect, useRef } from 'react'
import { useTunerStore } from '@/stores/tuner-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Mic, MicOff, AlertCircle } from 'lucide-react'
import { ViolinFingerboard } from '@/components/ui/violin-fingerboard'

/**
 * Main component for the Tuner mode.
 */
export function TunerMode() {
  const { state, analyser, detector, initialize, retry, reset, updatePitch } = useTunerStore()

  // Derived state for UI logic
  const isIdle = state.kind === 'IDLE'
  const isInitializing = state.kind === 'INITIALIZING'
  const isError = state.kind === 'ERROR'
  const isActive = state.kind === 'READY' || state.kind === 'LISTENING' || state.kind === 'DETECTED'

  const currentNote = state.kind === 'DETECTED' ? state.note : null
  const centsDeviation = state.kind === 'DETECTED' ? state.cents : null
  const errorMessage = state.kind === 'ERROR' ? state.error.message : null

  const animationFrameRef = useRef<number>(undefined)

  // Audio analysis loop
  useEffect(() => {
    if (!analyser || !detector || isIdle || isError) {
      return
    }

    const buffer = new Float32Array(analyser.fftSize)

    const analyze = () => {
      analyser.getFloatTimeDomainData(buffer)
      const result = detector.detectPitchWithValidation(buffer)
      updatePitch(result.pitchHz, result.confidence)
      animationFrameRef.current = requestAnimationFrame(analyze)
    }

    analyze()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [analyser, detector, isIdle, isError, updatePitch])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-6">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-foreground mb-2 text-3xl font-bold">Violin Tuner</h2>
          <p className="text-muted-foreground">Play a note on your violin to see its pitch</p>
        </div>

        {/* Tuner Display */}
        <Card className="p-8">
          {isIdle && (
            <div className="space-y-4 text-center">
              <Mic className="text-muted-foreground mx-auto h-16 w-16" />
              <div>
                <h3 className="mb-2 text-xl font-semibold">Ready to tune?</h3>
                <p className="text-muted-foreground mb-4">
                  Grant microphone access to start tuning your violin
                </p>
                <Button onClick={initialize} size="lg" className="gap-2">
                  <Mic className="h-4 w-4" />
                  Start Tuner
                </Button>
              </div>
            </div>
          )}

          {isInitializing && (
            <div className="space-y-4 text-center">
              <div className="border-primary mx-auto h-16 w-16 animate-spin rounded-full border-4 border-t-transparent" />
              <p className="text-muted-foreground">Initializing microphone...</p>
            </div>
          )}

          {isError && (
            <div className="space-y-4 text-center">
              <AlertCircle className="text-destructive mx-auto h-16 w-16" />
              <div>
                <h3 className="text-destructive mb-2 text-xl font-semibold">Microphone Error</h3>
                <p className="text-muted-foreground mb-4">{errorMessage}</p>
                <div className="flex justify-center gap-2">
                  <Button onClick={retry} variant="default">
                    Retry
                  </Button>
                  <Button onClick={reset} variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isActive && (
            <div className="space-y-6">
              <ViolinFingerboard
                targetNote={currentNote}
                detectedPitchName={currentNote ?? undefined}
                centsDeviation={centsDeviation}
                centsTolerance={10}
              />

              <div className="flex justify-center gap-2">
                <Button onClick={reset} variant="outline" className="gap-2 bg-transparent">
                  <MicOff className="h-4 w-4" />
                  Stop Tuner
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
