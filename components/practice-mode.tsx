'use client'

import { useEffect, useRef } from 'react'
import { usePracticeStore } from '@/lib/stores/practice-store'
import { G_MAJOR_SCALE_EXERCISE } from '@/lib/music-data'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Play, Square, RotateCcw, Trophy, AlertCircle } from 'lucide-react'
import { SheetMusic } from '@/components/sheet-music'
import { ErrorBoundary } from '@/components/error-boundary'
import { PracticeFeedback } from '@/components/practice-feedback'
import { ViolinFingerboard } from '@/components/ui/violin-fingerboard'

export function PracticeMode() {
  const {
    state,
    error,
    currentExercise,
    currentNoteIndex,
    completedNotes,
    detectedPitch,
    confidence,
    isInTune,
    centsOff,
    holdDuration,
    requiredHoldTime,
    analyser,
    detector,
    loadExercise,
    start,
    stop,
    reset,
    updateDetectedPitch,
  } = usePracticeStore()

  const animationFrameRef = useRef<number>()
  const loadedRef = useRef(false)

  // Load exercise on mount
  useEffect(() => {
    // In React 18's Strict Mode, this effect runs twice. Use a ref to ensure
    // the exercise is loaded only once on the initial mount.
    if (!loadedRef.current) {
      loadExercise(G_MAJOR_SCALE_EXERCISE)
      loadedRef.current = true
    }
  }, [loadExercise])

  // Audio analysis loop
  useEffect(() => {
    if (!analyser || !detector || !['PRACTICING', 'NOTE_DETECTED', 'VALIDATING'].includes(state)) {
      return
    }

    const buffer = new Float32Array(analyser.fftSize)

    const analyze = () => {
      analyser.getFloatTimeDomainData(buffer)

      const result = detector.detectPitchWithValidation(buffer)
      const rms = detector.calculateRMS(buffer)

      updateDetectedPitch(result.pitchHz, result.confidence, rms)

      animationFrameRef.current = requestAnimationFrame(analyze)
    }

    analyze()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [analyser, detector, state, updateDetectedPitch])

  const currentNote = currentExercise?.notes[currentNoteIndex]
  const totalNotes = currentExercise?.notes.length || 0
  const progress = totalNotes > 0 ? ((currentNoteIndex + 1) / totalNotes) * 100 : 0

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-6">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-foreground mb-2 text-3xl font-bold">Practice G Major Scale</h2>
          <p className="text-muted-foreground">
            Play each note in tune and hold for {requiredHoldTime}ms to advance
          </p>
        </div>

        {/* Error State */}
        {state === 'ERROR' && (
          <Card className="bg-destructive/10 border-destructive p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-destructive h-6 w-6" />
              <div className="flex-1">
                <h3 className="text-destructive font-semibold">Error</h3>
                <p className="text-muted-foreground text-sm">{error}</p>
              </div>
              <Button onClick={reset} variant="outline">
                Reset
              </Button>
            </div>
          </Card>
        )}

        {/* Controls */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {state === 'LOADED' && (
                <Button onClick={start} size="lg" className="gap-2">
                  <Play className="h-4 w-4" />
                  Start Practice
                </Button>
              )}

              {state === 'INITIALIZING' && (
                <Button disabled size="lg">
                  <div className="border-primary-foreground mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                  Awaiting microphone...
                </Button>
              )}

              {['PRACTICING', 'NOTE_DETECTED', 'VALIDATING', 'NOTE_COMPLETED'].includes(state) && (
                <Button onClick={stop} size="lg" variant="destructive" className="gap-2">
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              )}

              {state === 'EXERCISE_COMPLETE' && (
                <Button onClick={start} size="lg" className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Practice Again
                </Button>
              )}
            </div>

            {/* Progress */}
            <div className="flex items-center gap-4">
              <div className="text-muted-foreground text-sm">
                Note {currentNoteIndex + 1} of {totalNotes}
              </div>
              <div className="bg-muted h-2 w-32 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {currentExercise && state !== 'IDLE' && (
          <Card className="p-6">
            <ErrorBoundary fallback={<div>Failed to load sheet music</div>}>
              <SheetMusic
                musicXML={currentExercise.musicXML}
                currentNoteIndex={currentNoteIndex}
                completedNotes={completedNotes}
              />
            </ErrorBoundary>
          </Card>
        )}

        {/* Practice Feedback */}
        {['PRACTICING', 'NOTE_DETECTED', 'VALIDATING', 'NOTE_COMPLETED'].includes(state) &&
          currentNote && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6">
                <PracticeFeedback
                  targetNote={currentNote.pitch}
                  detectedPitch={detectedPitch}
                  confidence={confidence}
                  isInTune={isInTune}
                  centsOff={centsOff}
                  holdDuration={holdDuration}
                  requiredHoldTime={requiredHoldTime}
                  state={state}
                />
              </Card>
              <Card className="p-6">
                <ViolinFingerboard
                  targetNote={currentNote.pitch}
                  detectedPitch={detectedPitch}
                  centsDeviation={centsOff}
                  isInTune={isInTune}
                />
              </Card>
            </div>
          )}

        {/* Completion */}
        {state === 'EXERCISE_COMPLETE' && (
          <Card className="bg-primary/10 p-8 text-center">
            <Trophy className="text-primary mx-auto mb-4 h-20 w-20" />
            <h3 className="mb-2 text-2xl font-bold">🎉 Scale Complete!</h3>
            <p className="text-muted-foreground mb-6">
              Excellent work! You've successfully played the G Major scale.
            </p>
            <Button onClick={start} size="lg" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Practice Again
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}
