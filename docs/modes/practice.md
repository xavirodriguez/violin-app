# Practice Mode Documentation

## Overview

Practice Mode guides users through violin exercises with real-time pitch feedback, interactive sheet music, and note-by-note progression tracking. It records analytics for each practice session.

## State Machine

The PracticeStore manages an 8-state machine: [46](#0-45)

### State Transitions

| From State     | Event            | To State          | Condition                 |
| -------------- | ---------------- | ----------------- | ------------------------- |
| IDLE           | `loadExercise()` | LOADED            | Exercise loaded           |
| LOADED         | `start()`        | INITIALIZING      | User starts               |
| LOADED         | `loadExercise()` | LOADED            | Switch exercise           |
| INITIALIZING   | Success          | PRACTICING        | Mic access granted        |
| INITIALIZING   | Error            | ERROR             | Mic access denied         |
| PRACTICING     | Detect pitch     | NOTE_DETECTED     | Wrong note or out of tune |
| PRACTICING     | Detect in-tune   | VALIDATING        | Correct note, in tune     |
| PRACTICING     | No signal        | PRACTICING        | Silence/noise             |
| NOTE_DETECTED  | In-tune          | VALIDATING        | Now in tune               |
| NOTE_DETECTED  | Out-of-tune      | NOTE_DETECTED     | Still wrong               |
| VALIDATING     | Hold complete    | NOTE_COMPLETED    | Hold ≥ requiredHoldTime   |
| VALIDATING     | Hold incomplete  | VALIDATING        | Still holding             |
| VALIDATING     | Out-of-tune      | PRACTICING        | Lost pitch                |
| NOTE_COMPLETED | Auto-advance     | PRACTICING        | Next note (200ms delay)   |
| NOTE_COMPLETED | All done         | EXERCISE_COMPLETE | Last note completed       |
| \*             | `stop()`         | LOADED            | User stops                |
| \*             | `reset()`        | IDLE              | Full reset                |

## Store Fields

### State Fields [47](#0-46)

| Field              | Type             | Purpose                         |
| ------------------ | ---------------- | ------------------------------- |
| `state`            | PracticeState    | Current state machine state     |
| `error`            | string \| null   | Error message if state is ERROR |
| `currentExercise`  | Exercise \| null | Loaded exercise data            |
| `currentNoteIndex` | number           | Index of target note (0-based)  |
| `completedNotes`   | boolean[]        | Which notes have been completed |

### Detection Fields [48](#0-47)

| Field           | Type           | Purpose                            |
| --------------- | -------------- | ---------------------------------- |
| `detectedPitch` | number \| null | Current frequency in Hz            |
| `confidence`    | number         | YIN algorithm confidence (0.0-1.0) |
| `isInTune`      | boolean        | Whether detected pitch is in tune  |
| `centsOff`      | number \| null | Cents deviation from target        |

### Timing Fields [49](#0-48)

| Field              | Type           | Purpose                                    |
| ------------------ | -------------- | ------------------------------------------ |
| `noteStartTime`    | number \| null | Timestamp when note first detected in tune |
| `holdDuration`     | number         | Milliseconds held in tune                  |
| `requiredHoldTime` | number         | Milliseconds required (default: 500)       |

## Thresholds and Criteria

### Signal Detection [50](#0-49)

A valid signal requires:

- **RMS threshold**: > 0.01
- **Confidence threshold**: > 0.85

### In-Tune Definition [51](#0-50)

A note is considered "in tune" when:

- **Cents deviation**: < 25 cents (absolute value)

This is **more lenient** than tuner mode (which uses 10 cents).

### Hold Time Requirement [52](#0-51)

Default hold time: **500 milliseconds**

User must maintain correct pitch and tuning for this duration to complete a note.

### Note Completion Criteria [53](#0-52)

A note is completed when:

1. **Correct note detected** (MIDI number matches target)
2. **In tune** (cents deviation < 25)
3. **Held long enough** (duration ≥ requiredHoldTime)

### Note Matching [54](#0-53)

Target note is extracted from exercise pitch string (e.g., "G4") and compared via MIDI number matching. [55](#0-54)

## Audio Processing Loop

Similar to tuner mode, but with additional RMS calculation: [56](#0-55)

**Loop steps**:

1. Get time-domain audio data (2048 samples)
2. Run pitch detection with validation
3. Calculate RMS (for signal presence check)
4. Update store with pitch, confidence, and RMS
5. Store evaluates note matching and timing

**Active states**: Loop only runs when state is PRACTICING, NOTE_DETECTED, or VALIDATING.

## Exercise Loading [57](#0-56)

**Loading behavior**:

1. Stop any active audio (cleanup)
2. Set state to LOADED
3. Load exercise data
4. Reset note index to 0
5. Initialize completedNotes array (all false)

## Note Progression

### Advancing to Next Note [58](#0-57)

**Auto-advance trigger**: [59](#0-58)

After 200ms delay, the store advances to the next note.

**Progression logic**:

1. Record note completion time in analytics
2. Mark current note as completed in completedNotes array
3. If not last note: increment index, reset detection state
4. If last note: call `completeExercise()`

### Exercise Completion [60](#0-59)

**Completion actions**:

1. End analytics session
2. Set state to EXERCISE_COMPLETE
3. Reset timing fields

Audio resources remain active; user can restart with "Practice Again" button.

## Analytics Integration

Practice mode records detailed analytics via cross-store calls:

### Session Start [9](#0-8)

Recorded data: exercise ID, name, mode="practice"

### Note Attempts [10](#0-9)

Recorded on every pitch detection when note is detected (even if out of tune).

**UNKNOWN**: Whether attempts are recorded for silence/noise (appears not)
**WHY IT MATTERS**: Accuracy calculation might not reflect actual difficulty
**HOW TO CONFIRM**: Check AnalyticsStore.recordNoteAttempt call sites

### Note Completions [11](#0-10)

Recorded: note index, time to complete (ms)

### Session End [61](#0-60)

Called when exercise completes or user stops practice.

## UI Feedback Components

### Sheet Music Display

Rendered via OpenSheetMusicDisplay (OSMD): [62](#0-61)

Props:

- `musicXML`: Generated MusicXML string
- `currentNoteIndex`: Which note is active
- `completedNotes`: Which notes are marked done

### Practice Feedback Panel

Shows target note, detected note, and hold progress: [63](#0-62)

Component details: [64](#0-63)

**Hold progress bar**: [65](#0-64)

Only visible when state is VALIDATING or NOTE_COMPLETED.

### Violin Fingerboard

Visual feedback showing finger positions: [66](#0-65)

## Error Handling [67](#0-66)

Errors transition to ERROR state with message. User must click "Reset" to return to IDLE.

**Error UI**: [68](#0-67)

## Known Constraints

1. **Exercise selection during practice**: Loading a new exercise stops current session [69](#0-68)

2. **Hold time not configurable**: Fixed at 500ms [52](#0-51)

3. **In-tune threshold not configurable**: Fixed at 25 cents [51](#0-50)

4. **No partial credit**: Must complete all notes to finish exercise

5. **Sheet music errors**: Wrapped in ErrorBoundary but fallback is generic [70](#0-69)
