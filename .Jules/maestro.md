# Maestro's Journal 🎻

## Critical Learnings

### Session Orchestration & Analytics
- **Final Note Edge Case**: In the practice mode event loop, analytics for the final note completion (`NOTE_MATCHED`) must be recorded *before* the state update via `handlePracticeEvent`. This is because the state update can trigger a session-ending sequence (`onCompleted -> stop()`) which may reset the store state, making the note index and target data unavailable for subsequent recording calls.
- **Data Integrity in Analytics**: Always ensure that complex objects like musical pitches are correctly stringified or transformed into the primitive types expected by the analytics store (e.g., transforming a `Pitch` object into a standard notation string like "A4" or "C#5") to avoid type mismatches and ensure clean historical data.
- **Unique Progress Tracking**: Implementing "set-like" logic for tracking completed exercise IDs prevents redundant entries in the user's progress record, providing a clean count of unique pedagogical milestones achieved.
