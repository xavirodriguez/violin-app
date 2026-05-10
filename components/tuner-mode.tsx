'use client'

import { useTunerStore } from '@/stores/tuner-store'
import { PitchAccuracyMeter } from '@/components/ui/pitch-accuracy-meter'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEffect, useRef } from 'react'
import { Mic, MicOff, AlertCircle, RefreshCw } from 'lucide-react'

/**
 * TunerMode
 * Simplified version for MVP in Spanish.
 */
export function TunerMode() {
  const {
    state,
    initialize,
    startListening,
    stopListening,
    reset,
    analyser,
    detector,
    updatePitch,
    detectionThreshold
  } = useTunerStore()

  useEffect(() => {
    return () => {
        reset()
    }
  }, [reset])

  const animationFrameRef = useRef<number>(undefined)

  useEffect(() => {
    if (!analyser || !detector || state.kind === 'IDLE' || state.kind === 'ERROR') {
      return
    }

    const buffer = new Float32Array(analyser.fftSize)

    const analyze = () => {
      analyser.getFloatTimeDomainData(buffer)
      const result = detector.detectPitchWithValidation(buffer, detectionThreshold, true)
      updatePitch(result.pitchHz, result.confidence)
      animationFrameRef.current = requestAnimationFrame(analyze)
    }

    analyze()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [analyser, detector, state.kind, updatePitch, detectionThreshold])

  const isListening = state.kind === 'LISTENING' || state.kind === 'DETECTED'
  const isInitializing = state.kind === 'INITIALIZING'
  const isReady = state.kind === 'READY'
  const isError = state.kind === 'ERROR'

  const note = state.kind === 'DETECTED' ? state.note : '--'
  const cents = state.kind === 'DETECTED' ? state.cents : undefined

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card className="p-8 text-center shadow-xl border-2">
        <h2 className="text-3xl font-bold mb-8">Afinador de Violín</h2>

        <div className="mb-12">
          <div className="text-8xl font-black mb-4 font-mono text-primary">
            {note}
          </div>
          <div className="h-24 flex items-end justify-center">
            <PitchAccuracyMeter
                centsOff={cents}
                isInTune={cents !== undefined && Math.abs(cents) < 10}
            />
          </div>
        </div>

        <div className="space-y-4">
          {!isListening && !isInitializing && (
            <Button onClick={initialize} size="lg" className="w-full gap-2">
              <Mic className="h-5 w-5" /> Iniciar Afinación
            </Button>
          )}

          {isListening && (
            <Button onClick={reset} variant="outline" size="lg" className="w-full gap-2">
              <MicOff className="h-5 w-5" /> Detener
            </Button>
          )}

          {isInitializing && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Inicializando micrófono...
            </div>
          )}

          {isError && (
            <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p>Error: {state.kind === 'ERROR' ? state.error.message : 'No se pudo acceder al micrófono'}</p>
                </div>
                <Button onClick={initialize} variant="secondary" className="w-full">
                    Reintentar
                </Button>
            </div>
          )}
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
            Asegúrate de estar en un lugar silencioso para una mejor precisión.
        </p>
      </Card>
    </div>
  )
}
