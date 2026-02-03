# Type Conventions in Violin Mentor

## 1. Branded Types
We use Branded Types to ensure that strings with specific formats (like musical note names) are not confused with regular strings.

### NoteName
Represents a note in Scientific Pitch Notation (e.g., "C4", "G#3").
```typescript
type NoteName = string & { readonly __brand: unique symbol };
```
Use `assertValidNoteName(name)` to cast a string to `NoteName`.

## 2. Discriminated Unions for State
Zustand stores should use Discriminated Unions to manage complex state transitions.
Example from `TunerStore`:
```typescript
type TunerState =
  | { kind: 'IDLE' }
  | { kind: 'INITIALIZING'; readonly sessionToken: number }
  | { kind: 'READY'; readonly sessionToken: number }
  ...
```

## 3. Explicit Nulls
Favor `| null` over optional properties (`?`) for data that is expected but may be currently absent (e.g., detected pitch).
Use optional properties ONLY for truly optional configuration parameters.

## 4. Immutable Snapshots
Asynchronous processes (like the practice pipeline) should consume immutable snapshots of context instead of reading from a mutable store directly, to prevent state drift during long operations.
