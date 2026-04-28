# Directrices para la Robustez de la Lógica del Juego

Tras analizar en profundidad el proyecto, aquí están las directrices críticas organizadas por capa del sistema.

---

## 1. La Cadena de Detección de Pitch (Capa más crítica)

El flujo completo es:

```
Micrófono → AudioManager → AnalyserNode → WebAudioFrameAdapter
→ PitchDetector (YIN) → RawPitchEvent → NoteSegmenter
→ createPracticeEventPipeline → PracticeEvent → reducePracticeEvent → UI
```

**Regla #1: Nunca modificar las constantes del algoritmo YIN sin tests.**

El `PitchDetector` tiene tres constantes que definen toda la sensibilidad del sistema:

- `MIN_FREQUENCY = 180` Hz (por debajo de G3 del violín)
- `MAX_FREQUENCY = 3000` Hz (por encima de E7)
- `YIN_THRESHOLD = 0.1` (balance falsos positivos/negativos) [1](#0-0) 

Cambiar `YIN_THRESHOLD` sin tests puede hacer que el detector sea demasiado permisivo (detecta ruido como notas) o demasiado estricto (no detecta notas reales). El test de referencia es: [2](#0-1) 

**Regla #2: El `AudioManager` desactiva deliberadamente `echoCancellation`, `noiseSuppression` y `autoGainControl`.** [3](#0-2) 

Esto es **intencional**: el procesado del navegador distorsiona el pitch. Nunca activar estas opciones. El `fftSize = 2048` y `smoothingTimeConstant = 0` del `AnalyserNode` también son críticos para la precisión. [4](#0-3) 

---

## 2. Las Tres Puertas de Validación (Gate Logic)

Antes de que un frame de audio se convierta en un evento de juego, pasa por **tres filtros en cascada**. Si cualquiera falla, se emite `NO_NOTE_DETECTED` y el hold timer se resetea.

```
Frame → [1] RMS Gate → [2] Confidence Gate → [3] Cents Tolerance Gate → NOTE_DETECTED
```

Los valores por defecto en `note-stream.ts`: [5](#0-4) 

La función que los aplica: [6](#0-5) 

**Regla #3: Los tres umbrales deben mantenerse consistentes entre `NoteStreamOptions` y `NoteSegmenter`.**

El `NoteSegmenter` tiene sus propios valores por defecto que deben ser coherentes: [7](#0-6) 

Nótese que `minRms` del segmenter (0.015) es diferente al del pipeline (0.01). Si se cambia uno, revisar el otro. La invariante que **nunca debe romperse** es: [8](#0-7) 

---

## 3. La Lógica de Matching de Notas

**Regla #4: `isMatch` usa comparación enarmónica por MIDI, no por nombre de nota.**

`C#4` y `Db4` son la misma nota. El sistema lo maneja correctamente vía `isEnharmonic`: [9](#0-8) 

La función `checkPitchAndTune` convierte ambas notas a MIDI antes de comparar: [10](#0-9) 

**Nunca comparar nombres de nota como strings directamente** para determinar si una nota es correcta.

**Regla #5: La tolerancia en cents es `< tolerance` (exclusivo), no `<=`.** [11](#0-10) 

Los tests lo verifican explícitamente: [12](#0-11) 

**Regla #6: La tolerancia es adaptativa según el skill del usuario.** [13](#0-12) 

Rango: 35 cents (principiante) → 10 cents (experto). Cualquier cambio en esta fórmula afecta directamente la dificultad del juego.

---

## 4. El Hold Timer y el NOTE_MATCHED

Este es el mecanismo central del "Guitar Hero": la nota debe mantenerse estable durante `requiredHoldTime` ms.

**Regla #7: `NOTE_MATCHED` solo se emite cuando el segmento completo cumple DOS condiciones simultáneas.** [14](#0-13) 

1. La nota detectada coincide con el target (pitch + cents dentro de tolerancia)
2. La duración del segmento supera `requiredHoldTime` (default: 500ms)

Si se cambia `requiredHoldTime`, cambiar también los tests de integración: [15](#0-14) 

**Regla #8: `NO_NOTE_DETECTED` resetea el hold timer completamente.** [16](#0-15) 

Esto significa que si el alumno levanta el arco aunque sea un instante, debe volver a empezar. El `NoteSegmenter` tiene `pitchDropoutToleranceMs = 100ms` para tolerar micro-interrupciones del violín: [7](#0-6) 

---

## 5. Las Máquinas de Estado

**Regla #9: Nunca hacer transiciones de estado directas, siempre usar las funciones `transitions`.** [17](#0-16) 

El flujo válido del `PracticeStore` es:
```
idle → initializing → ready → active → idle
                                     ↘ error → idle
```

El flujo válido del `TunerStore` es:
```
IDLE → INITIALIZING → READY → LISTENING → DETECTED
                    ↘ ERROR
``` [18](#0-17) 

**Regla #10: El `reducePracticeEvent` es la única fuente de verdad para el estado del juego.** [19](#0-18) 

`NOTE_MATCHED` solo avanza el índice si el estado es `listening` o `validating`. Si el estado es `idle` o `completed`, el evento se ignora silenciosamente: [20](#0-19) 

---

## 6. Protección contra Race Conditions

**Regla #11: El `sessionToken` es el mecanismo anti-stale más importante del sistema.**

Hay dos implementaciones paralelas:

- **TunerStore**: usa `initToken` (número entero incremental) [21](#0-20) 

- **PracticeStore**: usa `crypto.randomUUID()` [22](#0-21) 

Cualquier update al estado que llegue con un token diferente al actual se descarta: [23](#0-22) 

El test que verifica esto: [24](#0-23) 

**Regla #12: El `AbortController` debe propagarse correctamente por toda la cadena.**

La cadena de cancelación es: `PracticeStore.stop()` → `abortController.abort()` → `runner.cancel()` → `signal.aborted` en el loop → `audioManager.cleanup()`. [25](#0-24) 

Si se añade cualquier nuevo loop asíncrono, **debe** aceptar y respetar el `AbortSignal`.

---

## 7. Invariantes del `NoteSegmenter`

El `NoteSegmenter` es el componente más complejo y con más estados internos. Sus debounces son críticos:

| Parámetro | Default | Propósito |
|---|---|---|
| `onsetDebounceMs` | 50ms | Evita falsos inicios de nota |
| `offsetDebounceMs` | 150ms | Evita falsos finales de nota |
| `noteChangeDebounceMs` | 60ms | Evita cambios de nota espurios |
| `pitchDropoutToleranceMs` | 100ms | Tolera micro-silencios del violín | [7](#0-6) 

**Regla #13: Los buffers tienen límites duros para evitar memory leaks en sesiones largas.**

`maxNoteFrames = 2000` (~33 segundos a 60fps). Si una nota se mantiene más tiempo, los frames más antiguos se descartan con FIFO: [26](#0-25) 

---

## 8. Estrategia de Testing Obligatoria

**Regla #14: Cualquier cambio en la lógica de juego requiere tests en estos 4 archivos como mínimo:**

| Archivo | Qué protege |
|---|---|
| `lib/pitch-detector.test.ts` | Algoritmo YIN, rangos de frecuencia |
| `lib/practice-core.test.ts` | Reducer, matching enarmónico, tolerancia |
| `lib/note-stream.test.ts` | Pipeline completo, hold timer, filtros |
| `lib/note-segmenter.test.ts` | Onset/offset/note-change debounces |

**Regla #15: Los tests del pipeline usan `createMockStream` con delays reales.** [27](#0-26) 

Los delays son necesarios porque el hold timer usa `Date.now()` real. Tests que mockeen el tiempo pueden dar falsos positivos.

---

## 9. Riesgos Conocidos y Puntos Frágiles

1. **`requestAnimationFrame` se pausa en background**: Si el usuario cambia de pestaña, el loop se detiene y el hold timer puede quedar en un estado inconsistente. [28](#0-27) 

2. **`WebAudioFrameAdapter` devuelve una referencia al buffer interno**, no una copia. Si algún consumidor guarda la referencia entre frames, leerá datos corruptos. [29](#0-28) 

3. **`formatPitchName` lanza excepción para `alter` fuera de `{-1, 0, 1}`**. Si los datos de ejercicios contienen valores como `alter: 2` (doble sostenido), el juego crashea. [30](#0-29) 

4. **La tolerancia adaptativa puede llegar a 10 cents** para usuarios avanzados, lo que es extremadamente estricto para el violín. Considerar un mínimo de 15 cents. [13](#0-12) 

5. **`PitchDetectorAdapter.detect()` llama a `detectPitch` (sin validación RMS)**, no a `detectPitchWithValidation`. La validación RMS la hace el pipeline, no el detector directamente. [31](#0-30)

### Citations

**File:** lib/pitch-detector.ts (L37-52)
```typescript
  private readonly MIN_FREQUENCY = 180

  /**
   * The maximum frequency we care about (in Hz).
   * For violin, the practical upper limit is E7 at ~2637 Hz.
   * We set this to 3000 Hz by default to comfortably support the full professional range.
   */
  private MAX_FREQUENCY = 3000

  /**
   * The threshold for the YIN algorithm.
   * Lower values = more strict (fewer false positives, might miss quiet notes)
   * Higher values = more lenient (more detections, but less reliable)
   * 0.1 is a good balance for musical instruments.
   */
  private readonly YIN_THRESHOLD = 0.1
```

**File:** lib/pitch-detector.test.ts (L18-23)
```typescript
  it('should detect A4 (440 Hz) correctly', () => {
    const buffer = createSineWave(440, 0.1)
    const result = detector.detectPitch(buffer)
    expect(result.pitchHz).toBeCloseTo(440, 1)
    expect(result.confidence).toBeGreaterThan(0.9)
  })
```

**File:** lib/infrastructure/audio-manager.ts (L150-160)
```typescript
  private getAudioConstraints(deviceId?: string): MediaStreamConstraints {
    const config = {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    }

    return {
      audio: deviceId ? { ...config, deviceId: { exact: deviceId } } : config,
    }
  }
```

**File:** lib/infrastructure/audio-manager.ts (L162-168)
```typescript
  private initializeContextNodes(): void {
    this.context = new AudioContext()
    this.analyser = this.context.createAnalyser()
    this.analyser.fftSize = 2048
    this.analyser.smoothingTimeConstant = 0
    this.gainNode = this.context.createGain()
  }
```

**File:** lib/note-stream.ts (L86-92)
```typescript
const defaultOptions: NoteStreamOptions = {
  minRms: 0.01,
  minConfidence: 0.85,
  centsTolerance: 25,
  requiredHoldTime: 500,
  bpm: 60,
}
```

**File:** lib/note-stream.ts (L602-614)
```typescript
function isDetectionHighQuality(params: {
  raw: RawPitchEvent
  noteName: string
  cents: number
  options: NoteStreamOptions
}): boolean {
  const { raw, noteName, cents, options } = params
  const hasRms = raw.rms >= options.minRms
  const hasConfidence = raw.confidence >= options.minConfidence
  const isPitched = !!noteName && Math.abs(cents) <= 50

  return hasRms && hasConfidence && isPitched
}
```

**File:** lib/note-stream.ts (L667-688)
```typescript
function isValidMatch(params: {
  target: TargetNote
  segment: NoteSegment
  pitchedFrames: PitchedFrame[]
  options: NoteStreamOptions
}): boolean {
  const { target, segment, pitchedFrames, options } = params
  const lastFrame = pitchedFrames[pitchedFrames.length - 1]
  const lastDetected: DetectedNote = {
    pitch: segment.targetPitch,
    pitchHz: lastFrame.pitchHz,
    cents: lastFrame.cents,
    timestamp: segment.endTime,
    confidence: lastFrame.confidence,
  }

  const isMatched = isMatch({ target, detected: lastDetected, tolerance: options.centsTolerance })
  const isDurationValid = segment.durationMs >= options.requiredHoldTime

  const result = isMatched && isDurationValid
  return result
}
```

**File:** lib/note-segmenter.ts (L35-46)
```typescript
const defaultOptions: SegmenterOptions = {
  minRms: 0.015,
  maxRmsSilence: 0.008,
  minConfidence: 0.8,
  onsetDebounceMs: 50,
  offsetDebounceMs: 150,
  noteChangeDebounceMs: 60,
  pitchDropoutToleranceMs: 100,
  noisyGapResetMs: 50,
  maxGapFrames: 100,
  maxNoteFrames: 2000, // Approx 33 seconds at 60fps
}
```

**File:** lib/note-segmenter.ts (L60-69)
```typescript
function validateRmsOptions(options: SegmenterOptions): void {
  const minRmsValue = options.minRms
  const silenceThreshold = options.maxRmsSilence
  const isInvalid = minRmsValue <= silenceThreshold

  if (isInvalid) {
    const msg = 'minRms must be greater than maxRmsSilence'
    throw new Error(msg)
  }
}
```

**File:** lib/note-segmenter.ts (L502-512)
```typescript
  private pushToBuffer(params: {
    buffer: TechniqueFrame[]
    frame: TechniqueFrame
    limit: number
  }): void {
    const { buffer, frame, limit } = params
    buffer.push(frame)
    if (buffer.length > limit) {
      buffer.shift()
    }
  }
```

**File:** lib/practice-core.ts (L72-79)
```typescript
  isEnharmonic(other: MusicalNote): boolean {
    const selfMidi = this.midiNumber
    const otherMidi = other.midiNumber
    const isSamePitch = selfMidi === otherMidi

    const result = isSamePitch
    return result
  }
```

**File:** lib/practice-core.ts (L253-267)
```typescript
function getAlterString(canonicalAlter: number, originalAlter: number | string): string {
  switch (canonicalAlter) {
    case 1:
      return '#'
    case -1:
      return 'b'
    case 0:
      return ''
    default:
      throw new AppError({
        message: `Unsupported alter value: ${originalAlter}`,
        code: ERROR_CODES.DATA_VALIDATION_ERROR,
      })
  }
}
```

**File:** lib/practice-core.ts (L294-311)
```typescript
function checkPitchAndTune(params: {
  target: TargetNote
  detected: DetectedNote
  tolerance: number
}): boolean {
  const { target, detected, tolerance } = params
  const targetNoteName = formatPitchName(target.pitch)
  const targetNote = MusicalNote.fromName(targetNoteName)
  const detectedNoteName = detected.pitch as NoteName
  assertValidNoteName(detectedNoteName)
  const detectedNote = MusicalNote.fromName(detectedNoteName)

  const isPitchMatch = targetNote.isEnharmonic(detectedNote)
  const isInTune = Math.abs(detected.cents) < tolerance
  const result = isPitchMatch && isInTune

  return result
}
```

**File:** lib/practice-core.ts (L346-381)
```typescript
export function reducePracticeEvent(state: PracticeState, event: PracticeEvent): PracticeState {
  const handler = getEventHandler(event.type)
  const resultState = handler ? handler(state, event) : state

  return resultState
}

const PRACTICE_EVENT_HANDLERS: Record<
  string,
  (state: PracticeState, event: PracticeEvent) => PracticeState
> = {
  START: handleStart,
  STOP: handleStopReset,
  RESET: handleStopReset,
  NOTE_DETECTED: (state, event) => {
    const typed = event as Extract<PracticeEvent, { type: 'NOTE_DETECTED' }>
    return handleNoteDetected(state, typed.payload)
  },
  HOLDING_NOTE: (state, event) => {
    const typed = event as Extract<PracticeEvent, { type: 'HOLDING_NOTE' }>
    return handleHoldingNote(state, typed.payload.duration)
  },
  NO_NOTE_DETECTED: (state, _event) => handleNoNoteDetected(state),
  NOTE_MATCHED: (state, event) => {
    const typed = event as Extract<PracticeEvent, { type: 'NOTE_MATCHED' }>
    return handleNoteMatched(state, typed.payload)
  },
}

function getEventHandler(type: string) {
  const handlerTable = PRACTICE_EVENT_HANDLERS
  const eventHandler = handlerTable[type]
  const finalHandler = eventHandler

  return finalHandler
}
```

**File:** lib/practice-core.ts (L465-478)
```typescript
function handleNoNoteDetected(state: PracticeState): PracticeState {
  const emptyHistory: DetectedNote[] = []
  const listeningStatus: PracticeStatus = 'listening'
  const zeroDuration = 0

  const resetState = {
    ...state,
    detectionHistory: emptyHistory,
    status: listeningStatus,
    holdDuration: zeroDuration,
  }

  return resetState
}
```

**File:** lib/practice-core.ts (L497-504)
```typescript
function canMatchNote(status: PracticeStatus): boolean {
  const isListening = status === 'listening'
  const isValidating = status === 'validating'
  const isMatchCandidate = isListening || isValidating

  const isEligible = isMatchCandidate
  return isEligible
}
```

**File:** lib/practice-core.test.ts (L320-325)
```typescript
  it('should return false if cents are exactly at the tolerance boundary (inclusive)', () => {
    const detectedPositive = { pitch: 'A4', pitchHz: 440, cents: 25, timestamp: 0, confidence: 1 }
    const detectedNegative = { pitch: 'A4', pitchHz: 440, cents: -25, timestamp: 0, confidence: 1 }
    expect(isMatch({ target, detected: detectedPositive, tolerance: 25 })).toBe(false)
    expect(isMatch({ target, detected: detectedNegative, tolerance: 25 })).toBe(false)
  })
```

**File:** stores/practice-store.ts (L86-86)
```typescript
    const token = crypto.randomUUID()
```

**File:** stores/practice-store.ts (L233-241)
```typescript
  const { set, get, currentToken } = params
  const safeSet = (partial: SafePartial) => {
    const isStale = get().sessionToken !== currentToken
    if (isStale) return
    set((currentState) => resolveSafeUpdate({ currentState, partial }))
  }

  return safeSet
}
```

**File:** stores/practice-store.ts (L316-324)
```typescript
function calculateCentsTolerance(): number {
  const { intonationSkill } = useProgressStore.getState()
  const baseTolerance = 35
  const skillBonus = (intonationSkill / 100) * 25
  const adaptiveTolerance = Math.round(baseTolerance - skillBonus)
  const tolerance = adaptiveTolerance

  return tolerance
}
```

**File:** stores/practice-store.ts (L392-403)
```typescript
function cancelActiveRunner(state: PracticeStoreState) {
  const isActive = state.status === 'active'
  if (isActive) {
    try {
      const active = state as ActiveState
      active.abortController.abort()
      active.runner.cancel()
    } catch (err) {
      console.warn('[PracticeStore] Error cancelling runner:', err)
    }
  }
}
```

**File:** lib/note-stream.test.ts (L16-28)
```typescript
async function* createMockStream(
  events: Array<RawPitchEvent | { delay: number }>,
): AsyncGenerator<RawPitchEvent> {
  for (const event of events) {
    if ('delay' in event) {
      await new Promise((resolve) => setTimeout(resolve, event.delay))
    } else {
      yield event
      // Simulate a minimal delay between events to allow the pipeline to process them
      await new Promise((resolve) => setTimeout(resolve, 1))
    }
  }
}
```

**File:** lib/note-stream.test.ts (L114-148)
```typescript
  it('should emit NOTE_MATCHED when a correct note is held for the required time', async () => {
    const startTime = Date.now()
    const rawEvents = [
      { pitchHz: 441, confidence: 0.9, rms: 0.02, timestamp: startTime },
      { delay: 50 },
      { pitchHz: 442, confidence: 0.9, rms: 0.02, timestamp: startTime + 50 },
      { delay: 50 },
      { pitchHz: 439, confidence: 0.9, rms: 0.02, timestamp: startTime + 100 },
      { delay: 50 },
      // This last event should push the hold time over the 120ms threshold
      { pitchHz: 440, confidence: 0.9, rms: 0.02, timestamp: startTime + 150 },
      { delay: 200 },
      { pitchHz: 0, confidence: 0, rms: 0, timestamp: startTime + 350 }, // Silence starts
      { pitchHz: 0, confidence: 0, rms: 0, timestamp: startTime + 510 }, // Offset triggered
    ]
    const rawPitchStream = createMockStream(rawEvents)
    const pipeline = createPracticeEventPipeline({
      rawPitchStream,
      context: { ...testContext, sessionStartTime: startTime },
      options: {
        ...testOptions,
        requiredHoldTime: 120,
      },
      signal: new AbortController().signal,
    })
    const events = await collectAsyncIterable(pipeline)

    const noteDetectedCount = events.filter((e) => e.type === 'NOTE_DETECTED').length
    const noteMatchedCount = events.filter((e) => e.type === 'NOTE_MATCHED').length

    // We expect 4 detections and 1 final match event.
    expect(noteDetectedCount).toBe(4)
    expect(noteMatchedCount).toBe(1)
    expect(events.at(-1)?.type).toBe('NOTE_MATCHED')
  })
```

**File:** lib/practice/practice-states.ts (L157-232)
```typescript
export const transitions = {
  /**
   * Transitions the system to the initializing state.
   */
  initialize: (exercise: Exercise | undefined): InitializingState => ({
    status: 'initializing',
    exercise,
    progress: 0,
    error: undefined,
  }),

  /**
   * Transitions to the ready state once resources (microphone, detector) are acquired.
   */
  ready: (resources: {
    audioLoop: AudioLoopPort
    detector: PitchDetectionPort
    exercise: Exercise
  }): ReadyState => ({
    status: 'ready',
    ...resources,
    error: undefined,
  }),

  /**
   * Transitions from ready to active, commencing the session execution.
   */
  start: (
    state: ReadyState,
    runner: PracticeSessionRunner,
    abortController: AbortController,
    startIndex = 0,
  ): ActiveState => ({
    status: 'active',
    audioLoop: state.audioLoop,
    detector: state.detector,
    exercise: state.exercise,
    runner,
    abortController,
    error: undefined,
    practiceState: {
      status: 'listening',
      exercise: state.exercise,
      currentIndex: startIndex,
      detectionHistory: [],
      perfectNoteStreak: 0,
    },
  }),

  /**
   * Transitions back to idle from active or ready, performing a graceful stop.
   */
  stop: (state: ActiveState | ReadyState): IdleState => ({
    status: 'idle',
    exercise: state.exercise,
    error: undefined,
  }),

  /**
   * Transitions to the error state due to a failure in initialization or execution.
   */
  error: (error: AppError, exercise: Exercise | undefined = undefined): ErrorState => ({
    status: 'error',
    exercise,
    error,
  }),

  /**
   * Resets the state machine to its absolute initial state, clearing all context.
   */
  reset: (): IdleState => ({
    status: 'idle',
    exercise: undefined,
    error: undefined,
  }),

```

**File:** lib/domain/musical-types.ts (L198-241)
```typescript
export type TunerState =
  | {
      /** Initial state before any action is taken. */
      kind: 'IDLE'
    }
  | {
      /** State while acquiring microphone and setting up audio graph. */
      kind: 'INITIALIZING'
      /** Unique token for the current initialization attempt to prevent race conditions. */
      readonly sessionToken: number | string
    }
  | {
      /** State when audio is ready but no analysis results have been received. */
      kind: 'READY'
      /** Unique token for the current session. */
      readonly sessionToken: number | string
    }
  | {
      /** State when the engine is actively listening but signal strength/confidence is low. */
      kind: 'LISTENING'
      /** Unique token for the current session. */
      readonly sessionToken: number | string
    }
  | {
      /** State when a clear, confident pitch has been detected and mapped to a note. */
      kind: 'DETECTED'
      /** Detected frequency in Hz. */
      pitch: number
      /** Scientific pitch name (e.g., "A4"). */
      note: string
      /** Deviation in cents from the ideal frequency of the note. */
      cents: number
      /** Detection confidence (0.0 to 1.0). */
      confidence: number
      /** Unique token for the current session. */
      readonly sessionToken: number | string
    }
  | {
      /** Terminal or recoverable error state (e.g., permission denied). */
      kind: 'ERROR'
      /** Details of the application-level error encountered. */
      error: AppError
    }

```

**File:** stores/tuner-store.ts (L43-43)
```typescript
  let initToken = 0
```

**File:** __tests__/practice-store-robustness.test.ts (L161-196)
```typescript
  it('should ignore updates from old session tokens', async () => {
    await usePracticeStore.getState().loadExercise(mockExercise as Exercise)

    const sessionResources: MockAudioResources = {
      context: { sampleRate: 44100 },
      analyser: { fftSize: 2048, context: { sampleRate: 44100 } },
      stream: { getTracks: () => [] },
    }
    vi.mocked(audioManager.initialize).mockResolvedValue(
      sessionResources as unknown as AudioResources,
    )

    await usePracticeStore.getState().start()
    const firstToken = usePracticeStore.getState().sessionToken
    expect(firstToken).not.toBeUndefined()

    // Get a reference to safeSet (it's passed to runner)
    const runnerArgs = vi.mocked(PracticeSessionRunnerImpl).mock.calls[0][0]
    const safeSet = runnerArgs.store.setState

    // Stop and start new session
    await usePracticeStore.getState().stop()
    await usePracticeStore.getState().start()
    const secondToken = usePracticeStore.getState().sessionToken
    expect(secondToken).not.toEqual(firstToken)

    // Attempt to update using the old safeSet
    const oldPracticeState = {
      ...usePracticeStore.getState().practiceState,
      holdDuration: 999,
    }
    safeSet({ practiceState: oldPracticeState as PracticeState })

    // Should NOT have updated because sessionToken in store is now different
    expect(usePracticeStore.getState().practiceState?.holdDuration).not.toBe(999)
  })
```

**File:** lib/adapters/web-audio.adapter.ts (L51-55)
```typescript
  captureFrame(): Float32Array {
    // @ts-expect-error - Float32Array<ArrayBufferLike> vs Float32Array<ArrayBuffer> mismatch in strict Web Audio types
    this.analyser.getFloatTimeDomainData(this.buffer)
    return this.buffer
  }
```

**File:** lib/adapters/web-audio.adapter.ts (L76-82)
```typescript
 * will be throttled or paused by the browser when the tab is in the background
 * to save power. For background-stable processing, consider an implementation
 * using `AudioWorklet` or a `Web Worker`.
 *
 * @public
 */
export class WebAudioLoopAdapter implements AudioLoopPort {
```

**File:** lib/adapters/web-audio.adapter.ts (L175-177)
```typescript
  detect(frame: Float32Array): PitchDetectionResult {
    return this.detector.detectPitch(frame)
  }
```


Voy a explorar las áreas que no cubrí en el análisis anterior: el runner de sesión, el sistema de ejercicios, el progress store, y la arquitectura de puertos.

Aquí continúan las directrices, cubriendo las capas que no se analizaron en la respuesta anterior.

---

## 10. El Motor de Práctica (`PracticeEngine`) y la Dificultad Adaptativa

El `PracticeEngine` es la capa que orquesta el pipeline por nota. Su flujo interno es:

```
executeNoteLoop → iterateScoreNotes → setupPipeline → processPipeline
     ↑                                                       |
     └──────────── (siguiente nota si NOTE_MATCHED) ─────────┘
```

**Regla #16: La dificultad adaptativa existe en el código pero NO se aplica dinámicamente durante una sesión.**

`calculateAdaptiveDifficulty` calcula tolerancia y hold time basándose en `perfectNoteStreak`, pero `getEngineOptions` siempre la llama con `0`: [1](#1-0) [2](#1-1) 

El `EngineState` sí rastrea `perfectNoteStreak` correctamente en el reducer: [3](#1-2) 

Pero ese valor nunca se pasa a `getEngineOptions`. Si se implementa la dificultad adaptativa real, hay que pasar `getState().perfectNoteStreak` a `calculateAdaptiveDifficulty`. Hasta entonces, la tolerancia efectiva viene siempre de `ctx.centsTolerance ?? 25`.

**Regla #17: `SESSION_COMPLETED` solo se emite cuando se matchea la última nota.**

La condición de terminación es `currentNoteIndex >= scoreLength` después de un `NOTE_MATCHED`: [4](#1-3) 

Si `scoreLength` es 0 (ejercicio vacío), el loop termina inmediatamente sin emitir ningún evento. Validar que `exercise.notes.length > 0` antes de iniciar una sesión.

---

## 11. El `PracticeSessionRunnerImpl` y el Patrón de Doble AbortController

**Regla #18: Llamar a `runner.run()` dos veces en la misma instancia cancela la primera ejecución.**

El runner llama a `this.cancel()` al inicio de cada `run()`: [5](#1-4) 

Esto es intencional para garantizar que solo haya una sesión activa por instancia. El `PracticeStore` crea una nueva instancia por sesión, por lo que en la práctica no es un problema, pero si se reutiliza la instancia, la sesión anterior se cancela silenciosamente.

**Regla #19: Los errores de tipo `AbortError` se tratan como cancelaciones, no como errores.** [6](#1-5) 

Esto significa que si el pipeline lanza un `AbortError` por cualquier razón (no solo por cancelación del usuario), el `SessionResult` reportará `reason: 'cancelled'` en lugar de `reason: 'error'`. No se registrará en analytics ni se mostrará al usuario.

**Regla #20: `mapMatchedEvent` tiene una aserción no-null que puede silenciar errores.** [7](#1-6) 

`payload.technique!` — si `technique` es `undefined` en el payload (por ejemplo, si el `NoteSegmenter` no generó frames suficientes), TypeScript no lo detectará en runtime. El `NOTE_MATCHED` se emitirá con `technique: undefined` y el análisis técnico fallará silenciosamente aguas abajo.

---

## 12. El `TechniqueAnalysisAgent` y sus Umbrales

El agente analiza 6 dimensiones técnicas. Sus umbrales son invariantes críticos:

| Métrica | Umbral de alerta | Función |
|---|---|---|
| Drift de pitch | > 15 cents/seg | `generateStabilityObservations` |
| Vibrato lento | < 4.5 Hz | `checkSlowVibrato` |
| Vibrato ancho | > 35 cents | `checkWideVibrato` |
| Ataque lento | > 200ms | `analyzeSlowAttack` |
| Pitch scoop | > 15 cents | `analyzePitchScoop` |
| Glissando audible | > 50 cents + > 120ms | `analyzeAudibleGlissando` |
| Error de landing | > 20 cents | `analyzeLandingError` |
| Error rítmico | > 60ms | `generateRhythmObservations` | [8](#1-7) 

**Regla #21: El vibrato solo se analiza si el segmento tiene ≥ 20 frames Y ≥ 500ms de duración.** [9](#1-8) 

Para notas cortas (corcheas a 60 BPM = 500ms), el análisis de vibrato nunca se ejecutará. Esto es correcto pedagógicamente pero hay que tenerlo en cuenta al interpretar la ausencia de feedback de vibrato.

**Regla #22: El detector de wolf tone tiene umbrales fijos que pueden dar falsos positivos en violines de estudio.** [10](#1-9) 

`lowConfRatio > 0.3 && rmsBeatingScore > 0.4` — violines baratos con resonancias irregulares pueden activar esto frecuentemente. Si los usuarios reportan demasiadas alertas de "wolf tone", estos umbrales necesitan ajuste.

**Regla #23: `prioritizeObservations` limita el feedback a máximo 3 observaciones por nota.** [11](#1-10) 

Las observaciones se ordenan por `severity * confidence`. Si se añaden nuevos tipos de observación, deben tener `severity` y `confidence` calibrados correctamente o desplazarán feedback más importante.

---

## 13. El Sistema de Progreso y su Impacto en la Dificultad

**Regla #24: `intonationSkill` afecta directamente la tolerancia de cents en el juego.**

La cadena completa es:
```
PracticeSession.accuracy → updateSkills() → intonationSkill (0-100)
→ calculateCentsTolerance() → centsTolerance (35 → 10 cents)
→ PracticeSessionRunnerImpl → PracticeEngine
``` [12](#1-11) 

La función `calculateIntonationSkill` usa las últimas 10 sesiones y añade un bonus de tendencia. Si las últimas 5 sesiones muestran mejora, el skill sube más rápido. Esto puede hacer que la tolerancia baje bruscamente si el usuario tiene una racha buena seguida de una sesión difícil.

**Regla #25: El buffer de eventos tiene un límite de 1000 items y TTL de 90 días, pero el orden de operaciones importa.** [13](#1-12) 

El nuevo evento se prepend, luego se hace `slice(0, 1000)`, luego se filtra por TTL. Si hay exactamente 1000 eventos recientes, un evento antiguo que debería purgarse puede sobrevivir si está dentro de los primeros 1000. No es un bug crítico pero puede inflar el storage.

**Regla #26: Los snapshots se generan cada 50 sesiones y se limitan a 10.** [14](#1-13) 

Si se borra el `localStorage` o se migra el schema, los snapshots históricos se pierden. El `schemaVersion: 1` con el migrador actual solo rellena campos faltantes, no recalcula snapshots.

---

## 14. El Modelo de Datos de Ejercicios y sus Invariantes

**Regla #27: `normalizeAccidental` mapea dobles accidentales a simples de forma silenciosa.** [15](#1-14) 

`'double-sharp'`, `'##'` y `'2'` se mapean a `1` (sostenido simple). Esto significa que si un ejercicio MusicXML contiene un doble sostenido (Do##), se tratará como Do# en el matching. Para el violín de nivel básico esto no es un problema, pero si se añaden ejercicios avanzados con dobles accidentales, el pitch matching será incorrecto.

**Regla #28: `assertValidNoteName` acepta `##` y `bb` pero `getAlterString` lanza excepción para `alter` fuera de `{-1, 0, 1}`.** [16](#1-15) 

El regex `/^[A-G](?:b{1,2}|#{1,2})?[0-8]$/` acepta `C##4` como nombre válido, pero si ese nombre llega a `formatPitchName` → `getAlterString`, lanzará `AppError` porque `alter: 2` no está en el switch. La normalización de `normalizeAccidental` previene esto en la mayoría de los casos, pero es una inconsistencia latente.

**Regla #29: `isExercise` valida estructura pero no semántica.** [17](#1-16) 

`isExercise` verifica que `notes` sea un array de `Note` válidos, pero no valida que `alter` esté en `{-1, 0, 1}`, que `octave` esté en rango para el violín, ni que `duration` sea un `NoteDuration` válido. Un ejercicio con `alter: 2` pasará el type guard pero crasheará en runtime.

**Regla #30: `parsePitch` solo acepta un accidental simple (`#` o `b`), no dobles.** [18](#1-17) 

El regex `/^([A-G])([#b]?)(\d)$/` rechaza `G##4` o `Bbb3`. Si se intenta parsear un pitch con doble accidental desde un string, lanzará un error. Esto es consistente con la limitación de `normalizeAccidental`.

---

## 15. La Fábrica `createPitchDetectorForDifficulty`

**Regla #31: El detector tiene límites de frecuencia diferentes por dificultad.**

Los tests documentan los valores esperados: [19](#1-18) 

| Dificultad | MAX_FREQUENCY | Nota más alta |
|---|---|---|
| Beginner | 1320 Hz | E6 |
| Intermediate | 1760 Hz | A6 |
| Advanced | 2637 Hz | E7 |

Si se añade un ejercicio de nivel Beginner con notas por encima de E6, el detector no las detectará. Verificar siempre que el rango de notas del ejercicio sea compatible con el `MAX_FREQUENCY` del detector para esa dificultad.

---

## 16. Resumen de Invariantes Críticos (Checklist)

Antes de cualquier cambio en la lógica del juego, verificar:

```
[ ] YIN_THRESHOLD = 0.1, MIN_FREQUENCY = 180, MAX_FREQUENCY según dificultad
[ ] echoCancellation/noiseSuppression/autoGainControl = false
[ ] minRms (note-stream) < minRms (note-segmenter) — ambos coherentes
[ ] minRms (segmenter) > maxRmsSilence (segmenter) — validado en constructor
[ ] isMatch usa < tolerance (exclusivo), no <=
[ ] Comparación de notas siempre por MIDI (isEnharmonic), nunca por string
[ ] sessionToken verificado antes de cualquier setState asíncrono
[ ] AbortSignal propagado a todos los loops asíncronos
[ ] exercise.notes.length > 0 antes de iniciar sesión
[ ] alter en {-1, 0, 1} en todos los datos de ejercicios
[ ] Dificultad del ejercicio compatible con MAX_FREQUENCY del detector
[ ] NOTE_MATCHED solo avanza índice si status es 'listening' o 'validating'
[ ] transitions.* usado para todos los cambios de estado del PracticeStore
``` [20](#1-19) [21](#1-20) [15](#1-14) [22](#1-21)

### Citations

**File:** lib/practice-engine/engine.ts (L163-173)
```typescript
function getInitialEngineState(exercise: Exercise, initialNoteIndex = 0): EngineState {
  const noteCount = exercise.notes.length
  const initialState: EngineState = {
    ...INITIAL_ENGINE_STATE,
    scoreLength: noteCount,
    currentNoteIndex: initialNoteIndex,
  }

  const result = initialState
  return result
}
```

**File:** lib/practice-engine/engine.ts (L179-191)
```typescript
function getEngineOptions(ctx: PracticeEngineContext): NoteStreamOptions {
  const difficulty = calculateAdaptiveDifficulty(0)
  const options: NoteStreamOptions = {
    exercise: ctx.exercise,
    bpm: 60,
    centsTolerance: ctx.centsTolerance ?? difficulty.centsTolerance,
    requiredHoldTime: difficulty.requiredHoldTime,
    minRms: 0.01,
    minConfidence: 0.85,
  }

  return options
}
```

**File:** lib/practice-engine/engine.ts (L200-208)
```typescript
function calculateAdaptiveDifficulty(perfectNoteStreak: number) {
  const streak = perfectNoteStreak
  const toleranceBase = 25
  const centsTolerance = Math.max(10, toleranceBase - Math.floor(streak / 3) * 5)
  const holdBase = 180
  const requiredHoldTime = Math.min(800, holdBase + Math.floor(streak / 5) * 100)

  const result = { centsTolerance, requiredHoldTime }
  return result
```

**File:** lib/practice-engine/engine.ts (L377-391)
```typescript
function mapMatchedEvent(payload: {
  technique?: NoteTechnique
  observations?: Observation[]
  isPerfect?: boolean
}): PracticeEngineEvent {
  const technique = payload.technique!
  const observations = payload.observations ?? []
  const isPerfect = payload.isPerfect ?? false

  const matched: PracticeEngineEvent = {
    type: 'NOTE_MATCHED',
    payload: { technique, observations, isPerfect },
  }
  return matched
}
```

**File:** lib/practice-engine/engine.ts (L422-428)
```typescript
function isTerminalEvent(event: PracticeEngineEvent, state: EngineState): boolean {
  const isMatch = event.type === 'NOTE_MATCHED'
  const isLastNote = state.currentNoteIndex >= state.scoreLength
  const isTerminal = isMatch && isLastNote
  const result = isTerminal

  return result
```

**File:** lib/practice-engine/engine.reducer.ts (L33-45)
```typescript
  NOTE_MATCHED: (state, event) => {
    const typedEvent = event as Extract<PracticeEngineEvent, { type: 'NOTE_MATCHED' }>
    const { technique, isPerfect } = typedEvent.payload
    const nextIndex = state.currentNoteIndex + 1
    const nextStreak = isPerfect ? state.perfectNoteStreak + 1 : 0

    return {
      ...state,
      currentNoteIndex: nextIndex,
      lastTechnique: technique,
      liveObservations: [],
      perfectNoteStreak: nextStreak,
    }
```

**File:** lib/practice/session-runner.ts (L111-123)
```typescript
  async run(externalSignal: AbortSignal): Promise<SessionResult> {
    this.cancel()
    const controller = new AbortController()
    this.abortController = controller

    const onAbort = () => this.cancel()
    externalSignal.addEventListener('abort', onAbort)

    const executionParams = { internalSignal: controller.signal, externalSignal, onAbort }
    const result = await this.executeSession(executionParams)

    return result
  }
```

**File:** lib/practice/session-runner.ts (L165-177)
```typescript
  private handleRunError(error: unknown): SessionResult {
    const isAbort =
      error instanceof Error && (error.name === 'AbortError' || error.message === 'Aborted')

    if (isAbort) {
      const cancelled: SessionResult = { completed: false, reason: 'cancelled' }
      return cancelled
    }

    console.error('[Runner] Session execution failed:', error)
    const errorResult: SessionResult = { completed: false, reason: 'error', error: error as Error }
    return errorResult
  }
```

**File:** lib/technique-analysis-agent.ts (L20-27)
```typescript
const DEFAULT_OPTIONS: Required<AnalysisOptions> = {
  settlingTimeMs: 150 as TimestampMs,
  inTuneThresholdCents: 15 as Cents,
  vibratoMinRateHz: 4 as Hz,
  vibratoMaxRateHz: 10 as Hz,
  vibratoMinWidthCents: 10 as Cents,
  vibratoMinRegularity: 0.5 as Ratio01,
}
```

**File:** lib/technique-analysis-agent.ts (L109-118)
```typescript
  private prioritizeObservations(observations: Observation[]): Observation[] {
    const sorted = observations.sort((a, b) => {
      const scoreA = a.severity * a.confidence
      const scoreB = b.severity * b.confidence
      return scoreB - scoreA
    })
    const limited = sorted.slice(0, 3)

    return limited
  }
```

**File:** lib/technique-analysis-agent.ts (L234-242)
```typescript
  private isVibratoCandidate(frames: PitchedFrame[]): boolean {
    if (frames.length < 20) return false
    const duration = frames[frames.length - 1].timestamp - frames[0].timestamp
    if (duration < 500) return false
    const pitchStd = this.calculateStdDev(frames.map((f) => f.cents))

    const isCandidate = pitchStd <= 40
    return isCandidate
  }
```

**File:** lib/technique-analysis-agent.ts (L425-436)
```typescript
  private detectWolfTone(params: {
    lowConfRatio: number
    rmsBeatingScore: number
    pitchChaosScore: number
  }): boolean {
    const { lowConfRatio, rmsBeatingScore, pitchChaosScore } = params
    const isConfInstability = lowConfRatio > 0.3 && rmsBeatingScore > 0.4
    const isChaosInstability = rmsBeatingScore > 0.6 && pitchChaosScore > 20

    const isWolf = isConfInstability || isChaosInstability
    return isWolf
  }
```

**File:** stores/progress.store.ts (L250-257)
```typescript
function calculateIntonationSkill(sessions: PracticeSession[]): number {
  if (sessions.length === 0) return 0
  const recentSessions = sessions.slice(0, 10)
  const avgAccuracy = recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length
  const trend =
    recentSessions.length >= 5 ? recentSessions[0].accuracy - recentSessions[4].accuracy : 0
  return Math.min(100, Math.max(0, avgAccuracy + trend * 0.5))
}
```

**File:** stores/progress.store.ts (L369-379)
```typescript
function manageEventBuffer(params: {
  event: ProgressEvent
  currentBuffer: ProgressEvent[]
}): ProgressEvent[] {
  const { event, currentBuffer } = params
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
  const combined = [event, ...currentBuffer].slice(0, 1000)
  const pruned = combined.filter((e) => e.ts > ninetyDaysAgo)

  return pruned
}
```

**File:** stores/progress.store.ts (L439-454)
```typescript
function generateSnapshotIfDue(params: {
  counter: number
  session: PracticeSession
  get: () => ProgressState
}): ProgressSnapshot[] {
  const { counter, session, get } = params
  const snapshots = get().snapshots
  const isDue = counter % 50 === 0

  if (!isDue) {
    return snapshots
  }

  const snapshot: ProgressSnapshot = assembleSnapshot(session, get)
  return [snapshot, ...snapshots].slice(0, 10)
}
```

**File:** lib/domain/musical-domain.ts (L33-49)
```typescript
const ACCIDENTAL_MAP: Record<string, CanonicalAccidental> = {
  '1': 1,
  sharp: 1,
  '#': 1,
  '2': 1,
  'double-sharp': 1,
  '##': 1,
  '-1': -1,
  flat: -1,
  b: -1,
  '-2': -1,
  'double-flat': -1,
  bb: -1,
  '0': 0,
  natural: 0,
  '': 0,
}
```

**File:** lib/practice-core.ts (L32-43)
```typescript
export function assertValidNoteName(name: string): asserts name is NoteName {
  const noteRegex = /^[A-G](?:b{1,2}|#{1,2})?[0-8]$/
  const isValid = noteRegex.test(name)

  if (!isValid) {
    const message = `Invalid note name format: "${name}" (expected scientific pitch notation, e.g., "A4", "Bb3", octave 0-8)`
    throw new AppError({
      message,
      code: ERROR_CODES.NOTE_PARSING_FAILED,
    })
  }
}
```

**File:** lib/domain/type-guards.ts (L53-64)
```typescript
export function isExercise(x: unknown): x is Exercise {
  return (
    !!x &&
    typeof x === 'object' &&
    'id' in x &&
    'name' in x &&
    'notes' in x &&
    'musicXML' in x &&
    Array.isArray((x as Exercise).notes) &&
    (x as Exercise).notes.every(isNote)
  )
}
```

**File:** lib/exercises/utils.ts (L33-47)
```typescript
export const parsePitch = (pitchString: string): Pitch => {
  const match = pitchString.match(/^([A-G])([#b]?)(\d)$/)
  if (!match) {
    const errorMsg = `Invalid pitch format: "${pitchString}". Expected format like "G#4" or "C5".`
    throw new Error(errorMsg)
  }

  const [, step, alter, octave] = match

  return {
    step: step as PitchName,
    alter: normalizeAccidental(alter),
    octave: parseInt(octave, 10),
  }
}
```

**File:** __tests__/bug-fixes.test.ts (L85-118)
```typescript
describe('BUG-3 · MAX_FREQUENCY configurable via constructor', () => {
  it('should use default MAX_FREQUENCY when no parameter provided', () => {
    const detector = new PitchDetector(44100)
    // Default is 2637 Hz (E7). We test by detecting a pitch within range.
    expect(detector).toBeDefined()
  })

  it('should accept custom maxFrequency via constructor', () => {
    const detector = new PitchDetector(44100, 1400)
    expect(detector).toBeDefined()
  })

  it('should throw on invalid sample rate', () => {
    expect(() => new PitchDetector(0)).toThrow()
    expect(() => new PitchDetector(-1)).toThrow()
  })
})

describe('BUG-3 · createPitchDetectorForDifficulty factory', () => {
  it('should create detector for Beginner with 1320 Hz limit', () => {
    const detector = createPitchDetectorForDifficulty('Beginner', 44100)
    expect(detector).toBeInstanceOf(PitchDetector)
  })

  it('should create detector for Intermediate with 1760 Hz limit', () => {
    const detector = createPitchDetectorForDifficulty('Intermediate', 44100)
    expect(detector).toBeInstanceOf(PitchDetector)
  })

  it('should create detector for Advanced with 2637 Hz limit', () => {
    const detector = createPitchDetectorForDifficulty('Advanced', 44100)
    expect(detector).toBeInstanceOf(PitchDetector)
  })
})
```

**File:** lib/practice/practice-states.ts (L157-204)
```typescript
export const transitions = {
  /**
   * Transitions the system to the initializing state.
   */
  initialize: (exercise: Exercise | undefined): InitializingState => ({
    status: 'initializing',
    exercise,
    progress: 0,
    error: undefined,
  }),

  /**
   * Transitions to the ready state once resources (microphone, detector) are acquired.
   */
  ready: (resources: {
    audioLoop: AudioLoopPort
    detector: PitchDetectionPort
    exercise: Exercise
  }): ReadyState => ({
    status: 'ready',
    ...resources,
    error: undefined,
  }),

  /**
   * Transitions from ready to active, commencing the session execution.
   */
  start: (
    state: ReadyState,
    runner: PracticeSessionRunner,
    abortController: AbortController,
    startIndex = 0,
  ): ActiveState => ({
    status: 'active',
    audioLoop: state.audioLoop,
    detector: state.detector,
    exercise: state.exercise,
    runner,
    abortController,
    error: undefined,
    practiceState: {
      status: 'listening',
      exercise: state.exercise,
      currentIndex: startIndex,
      detectionHistory: [],
      perfectNoteStreak: 0,
    },
  }),
```
