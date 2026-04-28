# Completed Tasks - 2025-05-22

## Summary

Completed 3 high-priority robustness tasks from `TASKS.md` ensuring system invariants, clean resource management, and session integrity.

## Tasks completed

### 1. TASK-20 — Crear suite de invariantes críticos

- **Status:** Done
- **Files changed:**
  - `lib/pitch-detector.ts`
  - `lib/note-stream.ts`
  - `__tests__/invariants.test.ts`
- **What changed:**
  - Exposed `DEFAULT_YIN_THRESHOLD` and `DEFAULT_MIN_FREQUENCY` as static constants in `PitchDetector`.
  - Exported `DEFAULT_NOTE_STREAM_OPTIONS` in `lib/note-stream.ts`.
  - Implemented `__tests__/invariants.test.ts` to verify 12 critical system invariants, including YIN thresholds, frequency ranges, audio processing configuration, RMS coherency, and matching logic.
- **Validation:**
  - `pnpm test:unit __tests__/invariants.test.ts` — passed
- **Notes:** Ensures that any future changes to critical constants will be caught by automated tests.

### 2. TASK-14 — Test de `stop() → abort → cleanup`

- **Status:** Done
- **Files changed:**
  - `__tests__/task-14.test.ts`
- **What changed:**
  - Implemented integration test verifying the full cancellation chain in `PracticeStore`.
  - Confirmed that calling `stop()` aborts the active `AbortController`, cancels the `PracticeSessionRunner`, and calls `audioManager.cleanup()`.
- **Validation:**
  - `pnpm test:unit __tests__/task-14.test.ts` — passed
- **Notes:** Validates clean resource disposal and prevents leaking microphone handles or async loops.

### 3. TASK-15 — Test anti-stale con `sessionToken`

- **Status:** Done
- **Files changed:**
  - `__tests__/task-15.test.ts`
- **What changed:**
  - Implemented tests for the `sessionToken` anti-stale mechanism in `PracticeStore`.
  - Verified that `consumePipelineEvents` correctly ignores events if the token has changed.
  - Verified the `safeSet` pattern correctly discards state updates from old session tokens.
- **Validation:**
  - `pnpm test:unit __tests__/task-15.test.ts` — passed
- **Notes:** Protects against race conditions when exercises are loaded in rapid succession.

## Final Validation Summary

- **Typecheck:** `pnpm typecheck` — passed
- **Unit Tests:** `pnpm test:unit` — all 259 tests passed.
- **Pre-commit:** All robustness checks completed.
