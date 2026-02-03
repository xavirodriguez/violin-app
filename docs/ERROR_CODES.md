# Application Error Codes

## intonation/pitch
- `NOTE_PARSING_FAILED`: Thrown when a string cannot be parsed as a valid musical note.
  - *Example*: `MusicalNote.fromName("H9")`
- `DATA_VALIDATION_ERROR`: Thrown when a value is outside of its expected range or has an unsupported format.
  - *Example*: `normalizeAccidental("X")` or `clamp(5, 10, 0)`

## microphone/audio
- `MIC_PERMISSION_DENIED`: User blocked microphone access.
- `MIC_GENERIC_ERROR`: Failed to initialize audio pipeline.
