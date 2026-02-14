/**
 * TunerMode
 *
 * Provides the user interface for the standalone violin tuner.
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
 * Main component for the Standalone Tuner Mode.
 *
 * @remarks
 * This component provides a focused interface for tuning the violin strings. It manages its own
 * high-frequency analysis loop using `requestAnimationFrame` when the tuner is active.
 *
 * **Key Features**:
 * 1. **Visual Tuning**: Displays a high-accuracy `ViolinFingerboard` with cents deviation indicators.
 * 2. **Audio Lifecycle**: Manages the start/stop of the analyzer loop and synchronizes with the `TunerStore`.
 * 3. **Error Resilience**: Handles microphone access errors and provides a specialized retry mechanism.
 * 4. **State Orchestration**: Uses a formal state machine from the store to handle UI transitions (IDLE, INITIALIZING, READY, LISTENING, ERROR).
 *
 * **Performance**: The analysis loop pulls raw PCM samples and runs the pitch detection algorithm
 * every animation frame (approx. 16ms). The `updatePitch` action in the store is optimized for
 * this frequency.
 *
 * @example
 * ```tsx
 * <TunerMode />
 * ```
 *
 * @example
 * ```tsx
 * <TunerMode />
 * ```
 *
 * @public
 */
export function TunerMode() {
  const { state, analyser, detector, initialize, retry, reset, updatePitch } = useTunerStore()

  // Derived state for UI logic orchestration
  const isIdle = state.kind === 'IDLE'
  const isInitializing = state.kind === 'INITIALIZING'
  const isError = state.kind === 'ERROR'
  const isActive = state.kind === 'READY' || state.kind === 'LISTENING' || state.kind === 'DETECTED'

  const currentNote = state.kind === 'DETECTED' ? state.note : null
  const centsDeviation = state.kind === 'DETECTED' ? state.cents : null
  const errorMessage = state.kind === 'ERROR' ? state.error.message : null

  /** Reference to the current animation frame to ensure clean teardown. */
  const animationFrameRef = useRef<number>(undefined)

  /**
   * Effect that manages the real-time audio analysis loop for the tuner.
   *
   * @remarks
   * **Workflow**:
   * 1. **Guard**: Verifies that both the `analyser` (Web Audio) and `detector` (algorithm) are initialized.
   * 2. **Buffer Allocation**: Creates a `Float32Array` sized to the analyser's `fftSize`.
   * 3. **The Loop**: Uses a recursive `requestAnimationFrame` to achieve low-latency
   *    visual feedback (approx. 60 updates per second).
   * 4. **Analysis**: Pulls raw time-domain data and passes it to the pitch detector.
   * 5. **Store Sync**: Updates the global `TunerStore` with raw frequency and
   *    confidence values.
   *
   * **Memory Management**:
   * The `buffer` is pre-allocated outside the recursive loop to prevent
   * high-frequency garbage collection cycles, ensuring smooth UI animations.
   *
   * **Cleanup**:
   * Automatically cancels the `requestAnimationFrame` handle on component
   * unmount or state changes to prevent background processing.
   */
  useEffect(() => {
    if (!analyser || !detector || isIdle || isError) {
      return
    }

    const buffer = new Float32Array(analyser.fftSize)

    const analyze = () => {
      // Pull PCM samples from the Web Audio AnalyserNode
      analyser.getFloatTimeDomainData(buffer)

      // Run pitch detection with domain-specific validation (e.g., confidence thresholds)
      const result = detector.detectPitchWithValidation(buffer)

      // Update the store. The store handles thresholding and scientific pitch mapping.
      updatePitch(result.pitchHz, result.confidence)

      // Schedule the next frame
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
        {/* Title and description */}
        <div className="text-center">
          <h2 className="text-foreground mb-2 text-3xl font-bold">Violin Tuner</h2>
          <p className="text-muted-foreground">Play a note on your violin to see its pitch accuracy</p>
        </div>

        {/* Central Tuner Card */}
        <Card className="p-8">
          {/* IDLE State: Waiting for user to start */}
          {isIdle && (
            <div className="space-y-4 text-center">
              <Mic className="text-muted-foreground mx-auto h-16 w-16" />
              <div>
                <h3 className="mb-2 text-xl font-semibold">Ready to tune?</h3>
                <p className="text-muted-foreground mb-4">
                  Grant microphone access to start tuning your violin strings (G, D, A, E)
                </p>
                <Button onClick={initialize} size="lg" className="gap-2">
                  <Mic className="h-4 w-4" />
                  Start Tuner
                </Button>
              </div>
            </div>
          )}

          {/* INITIALIZING State: Hardware acquisition */}
          {isInitializing && (
            <div className="space-y-4 text-center">
              <div className="border-primary mx-auto h-16 w-16 animate-spin rounded-full border-4 border-t-transparent" />
              <p className="text-muted-foreground">Initializing microphone and audio pipeline...</p>
            </div>
          )}

          {/* ERROR State: Hardware or Permission failure */}
          {isError && (
            <div className="space-y-4 text-center">
              <AlertCircle className="text-destructive mx-auto h-16 w-16" />
              <div>
                <h3 className="text-destructive mb-2 text-xl font-semibold">Microphone Error</h3>
                <p className="text-muted-foreground mb-4">{errorMessage}</p>
                <div className="flex justify-center gap-2">
                  <Button onClick={retry} variant="default">
                    Retry Connection
                  </Button>
                  <Button onClick={reset} variant="outline">
                    Go Back
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE States: Tuning interface */}
          {isActive && (
            <div className="space-y-6">
              <ViolinFingerboard
                targetNote={currentNote}
                detectedPitchName={currentNote}
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
