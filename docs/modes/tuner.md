# Tuner Mode Documentation

## Overview

Tuner Mode provides real-time pitch detection for tuning violin strings. It continuously analyzes microphone input and displays the detected note with cents deviation.

## State Machine

The TunerStore manages a state machine with six possible states: [26](#0-25)

### State Transitions

| From State   | Event           | To State     | Condition            |
| ------------ | --------------- | ------------ | -------------------- |
| IDLE         | `initialize()`  | INITIALIZING | Valid state for init |
| IDLE         | `initialize()`  | IDLE         | Already initialized  |
| INITIALIZING | Success         | READY        | Mic access granted   |
| INITIALIZING | Error           | ERROR        | Mic access denied    |
| ERROR        | `retry()`       | INITIALIZING | User retries         |
| ERROR        | `reset()`       | IDLE         | User cancels         |
| READY        | Analysis starts | LISTENING    | Analysis loop begins |
| LISTENING    | Pitch detected  | DETECTED     | Confidence > 0.85    |
| LISTENING    | No signal       | LISTENING    | Low confidence       |
| DETECTED     | Signal lost     | LISTENING    | Confidence drops     |
| DETECTED     | Pitch detected  | DETECTED     | Continuous detection |
| \*           | `reset()`       | IDLE         | User stops tuner     |

**State guard**: [27](#0-26)

## Store Fields

### State Fields [28](#0-27)

| Field            | Type           | Purpose                            |
| ---------------- | -------------- | ---------------------------------- |
| `state`          | TunerState     | Current state machine state        |
| `error`          | string \| null | Error message if state is ERROR    |
| `currentPitch`   | number \| null | Detected frequency in Hz           |
| `currentNote`    | string \| null | Detected note name (e.g., "A4")    |
| `centsDeviation` | number \| null | Cents off from perfect pitch (±50) |
| `confidence`     | number         | Detection confidence (0.0-1.0)     |

### Audio Resources [29](#0-28)

| Field          | Type                  | Purpose                 |
| -------------- | --------------------- | ----------------------- |
| `audioContext` | AudioContext \| null  | Web Audio API context   |
| `analyser`     | AnalyserNode \| null  | Frequency analyzer      |
| `mediaStream`  | MediaStream \| null   | Microphone stream       |
| `detector`     | PitchDetector \| null | YIN algorithm detector  |
| `gainNode`     | GainNode \| null      | Sensitivity control     |
| `devices`      | MediaDeviceInfo[]     | Available microphones   |
| `deviceId`     | string \| null        | Selected microphone ID  |
| `sensitivity`  | number                | Gain multiplier (0-100) |

### Sensitivity Mapping [30](#0-29)

Formula: `gain = sensitivity / 50`

- sensitivity=50 → gain=1.0 (unity)
- sensitivity=100 → gain=2.0 (2x amplification)
- sensitivity=0 → gain=0.0 (muted)

## Audio Processing Loop

The tuner continuously analyzes audio in a `requestAnimationFrame` loop: [4](#0-3)

**Loop steps**:

1. Get time-domain audio data from analyser (2048 samples)
2. Run YIN pitch detection with validation
3. Update store with pitch and confidence
4. Store evaluates detection and updates UI state

**FFT Configuration**: [31](#0-30)

- `fftSize`: 2048 samples
- `smoothingTimeConstant`: 0 (no smoothing for real-time response)

## Detection Thresholds

### Signal Detection [32](#0-31)

A valid signal requires:

- **Confidence threshold**: > 0.85
- **Valid frequency**: > 0 Hz

### In-Tune Threshold

UI considers a note "in tune" when: [33](#0-32)

- **Cents deviation**: ≤ 10 cents
- **Confidence**: > 0.85

## UI Feedback States

### IDLE State

Shows "Ready to tune?" prompt with "Start Tuner" button. [34](#0-33)

### INITIALIZING State

Shows loading spinner with "Initializing microphone..." message. [35](#0-34)

### ERROR State

Shows error icon, error message, and "Retry"/"Cancel" buttons. [36](#0-35)

### READY/LISTENING/DETECTED States

Shows ViolinFingerboard component with real-time feedback and "Stop Tuner" button. [37](#0-36)

## Error Handling

### Microphone Access Error [38](#0-37)

Common causes:

1. User denied permission
2. Microphone already in use by another app
3. No microphone available
4. Browser security policy (non-HTTPS)

### Retry Behavior [39](#0-38)

The `retry()` action simply re-invokes `initialize()` to request microphone access again.

### Reset Behavior [17](#0-16)

**Cleanup steps**:

1. Stop all MediaStream tracks
2. Disconnect GainNode
3. Close AudioContext
4. Reset all state to initial values

**Critical**: Always call `reset()` when unmounting or switching modes to prevent resource leaks.

## Device Selection

Users can select a specific microphone via Settings dialog: [40](#0-39)

**Behavior when changing device**:

1. Set new deviceId
2. If currently active (not IDLE/ERROR), automatically reset and re-initialize with new device
3. User must grant permission again if it's a new device

## Musical Note Representation

Detected frequencies are converted to musical notes using the MusicalNote value object: [41](#0-40)

**Note creation**: [42](#0-41)

**Cents calculation**: Based on MIDI number distance from A4=440Hz [43](#0-42)

## Known Constraints

1. **Frequency range**: YIN detector is tuned for violin range (180-700 Hz) [44](#0-43)

2. **Cents deviation limit**: ±50 cents (note creation fails outside this range) [45](#0-44)

3. **Browser compatibility**: Requires Web Audio API and MediaDevices API

4. **No persistence**: Tuner state is not saved between sessions
