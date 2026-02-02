# Feature Catalog - Violin Mentor

This catalog provides a comprehensive list of all feature flags, their purpose, status, and usage instructions.

## ✅ Stable Features (Permanent)

These features were previously behind flags but are now a permanent part of the core experience.

### Violin Fingerboard Visualization
- **ID**: `FEATURE_UI_VIOLIN_FINGERBOARD` (Promoted)
- **Description**: Displays a virtual violin fingerboard that highlights notes as they are played.
- **Impact**: Provides immediate visual reference for finger placement.
- **Status**: Stable.

### Advanced Technical Feedback
- **ID**: `FEATURE_TECHNICAL_FEEDBACK` (Promoted)
- **Description**: Shows pedagogical tips and technical observations (e.g., "Keep it steady!") during practice.
- **Impact**: Provides qualitative feedback beyond simple pitch accuracy.
- **Status**: Stable.

### Progress Analytics Dashboard
- **ID**: `FEATURE_ANALYTICS_DASHBOARD` (Promoted)
- **Description**: A dedicated view for tracking practice time, streaks, and skill progression.
- **Impact**: Increases user engagement and motivation.
- **Status**: Stable.

### Contextual Practice Assistant
- **ID**: `FEATURE_PRACTICE_ASSISTANT` (Promoted)
- **Description**: A command-palette style assistant (powered by `cmdk`) for quick navigation and drill selection.
- **Status**: Stable. Accessible via `Meta+K` or `Ctrl+K`.

---

## 📋 Active Feature Flags

| Flag | Category | Status | Risk |
| :--- | :--- | :--- | :--- |
| `FEATURE_TELEMETRY_ACCURACY` | INTEGRATION | ACTIVE (Log) | LOW |
| `FEATURE_PRACTICE_ADAPTIVE_DIFFICULTY` | EXPERIMENTAL | DEFINED | MEDIUM |
| `FEATURE_AUDIO_WEB_WORKER` | PERFORMANCE | DEFINED | HIGH |
| `FEATURE_UI_INTONATION_HEATMAPS` | EXPERIMENTAL | DEFINED | LOW |
| `FEATURE_SOCIAL_PRACTICE_ROOMS` | EXPERIMENTAL | PLANNED | HIGH |
| `FEATURE_PRACTICE_ZEN_MODE` | EXPERIMENTAL | ACTIVE | LOW |
| `FEATURE_PRACTICE_AUTO_START` | BETA | ACTIVE | LOW |
| `FEATURE_PRACTICE_EXERCISE_RECOMMENDER` | BETA | ACTIVE | MEDIUM |
| `FEATURE_PRACTICE_ACHIEVEMENT_SYSTEM` | BETA | ACTIVE | MEDIUM |

---

## 🧪 Experimental & In-Progress

### Adaptive Difficulty Engine
- **ID**: `FEATURE_PRACTICE_ADAPTIVE_DIFFICULTY`
- **Description**: Automatically adjusts intonation thresholds and exercise complexity based on user performance.
- **Status**: Logic defined but not yet integrated into the practice loop.

### Web Worker Audio Processing
- **ID**: `FEATURE_AUDIO_WEB_WORKER`
- **Description**: Moves heavy DSP (Digital Signal Processing) tasks to a background thread.
- **Status**: Planned to improve UI responsiveness on low-end devices.

### Intonation Heatmaps
- **ID**: `FEATURE_UI_INTONATION_HEATMAPS`
- **Description**: Visualizes pitch accuracy patterns over time on a staff or fingerboard overlay.
- **Status**: UI components being designed.

### Zen Mode
- **ID**: `FEATURE_PRACTICE_ZEN_MODE`
- **Description**: Simplifies the UI to focus on the score, hiding distractions.
- **Status**: Implemented as local state, now formalized as a flag.

### Auto-start Listening
- **ID**: `FEATURE_PRACTICE_AUTO_START`
- **Description**: Automatically starts the audio detection loop when an exercise is loaded.
- **Status**: Stable implementation, formalized as a flag.

### Exercise Recommender
- **ID**: `FEATURE_PRACTICE_EXERCISE_RECOMMENDER`
- **Description**: Suggests the next exercise based on previous performance and skills.
- **Status**: Algorithmic implementation active.

### Achievement System
- **ID**: `FEATURE_PRACTICE_ACHIEVEMENT_SYSTEM`
- **Description**: Tracks and unlocks rewards for technical milestones.
- **Status**: Core logic integrated with ProgressStore.


---

## 📅 Planned Features

### Social Practice Rooms
- **ID**: `FEATURE_SOCIAL_PRACTICE_ROOMS`
- **Description**: Collaborative practice spaces for students and teachers.
- **Status**: Concept stage.

### Accuracy Telemetry
- **ID**: `FEATURE_TELEMETRY_ACCURACY`
- **Description**: Anonymous tracking of detection confidence levels to optimize the algorithm for different hardware.
- **Status**: Integrated (Basic Logging). Enabled to collect real-world detection data.

---

## 📖 Usage in Code

### Checking a flag (React)
```tsx
import { useFeatureFlag } from '@/lib/feature-flags'

const isEnabled = useFeatureFlag('FEATURE_ANALYTICS_DASHBOARD')
```

### Checking a flag (Server/TS)
```typescript
import { featureFlags } from '@/lib/feature-flags'

if (featureFlags.isEnabled('FEATURE_ANALYTICS_DASHBOARD')) {
  // logic
}
```
