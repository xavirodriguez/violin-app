# Documentation: Audio-Practice Integration and Pedagogical Feedback

## Data Flow Diagram

```mermaid
graph TD
    Mic[Microphone] --> AM[AudioManager]
    AM --> Analyser[AnalyserNode]
    Analyser --> PD[PitchDetector]
    PD --> RPS[createRawPitchStream]
    RPS --> PEP[createPracticeEventPipeline]

    subgraph "React Component: PracticeMode"
        PEP --> UE[useEffect Loop]
        UE --> CPE[consumePipelineEvents]
    end

    subgraph "State Management: PracticeStore"
        C CPE --> Reducer[reducePracticeEvent]
        Reducer --> State[PracticeState]
        CPE --> LO[calculateLiveObservations]
        LO --> LiveObs[liveObservations]
    end

    State --> UI[PracticeFeedback UI]
    LiveObs --> UI
```

## Performance Metrics (Analysis)

| Metric | Target | Actual (Estimated) | Note |
|--------|--------|-------------------|------|
| **Feedback Latency** | < 150ms | ~50-100ms | Real-time pitch detection runs on `requestAnimationFrame` (~16.6ms per frame). Total latency includes audio buffer processing and React render cycle. |
| **CPU Usage** | < 20% | 5-15% | Pitch detection (YIN/FFT) is the most intensive part, but optimized for single-thread JS. |
| **Memory Stability** | Constant | Stable | `FixedRingBuffer` prevents memory leaks by limiting the detection history to the last 10 frames. |
| **Event Throughput** | 60 ops/s | ~60 ops/s | Synced with screen refresh rate for smooth UI updates. |

## Validation Checklist

### Problema 1: Integración Audio-Práctica
- [x] `stores/practice-store.ts` exists and exports `usePracticeStore`.
- [x] Store manages `practiceState`, `analyser`, `detector`, and `liveObservations`.
- [x] `start()` correctly initializes resources and transitions state.

### Problema 2: Loop de Audio
- [x] `practice-mode.tsx` implements the `useEffect` loop.
- [x] Pipeline is correctly configured with tolerances and hold times.
- [x] Resources are cleaned up on unmount or status change.

### Problema 3: Estado Conectado
- [x] `consumePipelineEvents` updates the store using the pure reducer.
- [x] `currentIndex` increments correctly on `NOTE_MATCHED`.
- [x] UI reflects state changes in real-time.

### Problema 4: Feedback Jerárquico
- [x] `PracticeFeedback` implements 4 visual levels.
- [x] Primary status (Perfect/Adjust/Wrong) is dominant.
- [x] Technical details are hidden behind a collapsible section.

### Problema 5: Observaciones en Vivo
- [x] `calculateLiveObservations` analyzes persistent intonation and stability.
- [x] Observations appear while playing (after 5+ frames).
- [x] Feedback is prioritized by severity and confidence.
