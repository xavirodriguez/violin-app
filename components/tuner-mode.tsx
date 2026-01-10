"use client"

import { useEffect, useRef } from "react"
import { useTunerStore } from "@/lib/stores/tuner-store"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, MicOff, AlertCircle } from "lucide-react"
import { ViolinFingerboard } from "@/components/ui/violin-fingerboard"

export function TunerMode() {
  const {
    state,
    error,
    currentPitch,
    currentNote,
    centsDeviation,
    confidence,
    analyser,
    detector,
    initialize,
    retry,
    reset,
    updatePitch,
  } = useTunerStore()

  const animationFrameRef = useRef<number>()

  // Audio analysis loop
  useEffect(() => {
    if (!analyser || !detector || state === "IDLE" || state === "ERROR") {
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
  }, [analyser, detector, state, updatePitch])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2">Violin Tuner</h2>
          <p className="text-muted-foreground">Play a note on your violin to see its pitch</p>
        </div>

        {/* Tuner Display */}
        <Card className="p-8">
          {state === "IDLE" && (
            <div className="text-center space-y-4">
              <Mic className="w-16 h-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Ready to tune?</h3>
                <p className="text-muted-foreground mb-4">Grant microphone access to start tuning your violin</p>
                <Button onClick={initialize} size="lg" className="gap-2">
                  <Mic className="w-4 h-4" />
                  Start Tuner
                </Button>
              </div>
            </div>
          )}

          {state === "INITIALIZING" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <p className="text-muted-foreground">Initializing microphone...</p>
            </div>
          )}

          {state === "ERROR" && (
            <div className="text-center space-y-4">
              <AlertCircle className="w-16 h-16 mx-auto text-destructive" />
              <div>
                <h3 className="text-xl font-semibold mb-2 text-destructive">Microphone Error</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <div className="flex gap-2 justify-center">
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

          {(state === "READY" || state === "LISTENING" || state === "DETECTED") && (
            <div className="space-y-6">
              <ViolinFingerboard
                targetNote={currentNote}
                detectedPitch={currentPitch}
                centsDeviation={centsDeviation}
                isInTune={confidence > 0.85 && Math.abs(centsDeviation || 0) <= 10}
              />

              <div className="flex justify-center gap-2">
                <Button onClick={reset} variant="outline" className="gap-2 bg-transparent">
                  <MicOff className="w-4 h-4" />
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
