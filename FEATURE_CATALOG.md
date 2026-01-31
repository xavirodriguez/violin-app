# Feature Catalog - Violin Mentor

This catalog provides a comprehensive list of all feature flags, their purpose, status, and usage instructions.

## 📋 Feature Index

| Flag | Category | Status | Risk |
| :--- | :--- | :--- | :--- |
| `FEATURE_UI_VIOLIN_FINGERBOARD` | UI_UX | ACTIVE | LOW |
| `FEATURE_ANALYTICS_DASHBOARD` | BETA | ACTIVE | LOW |
| `FEATURE_TECHNICAL_FEEDBACK` | UI_UX | ACTIVE | LOW |
| `FEATURE_PRACTICE_ADAPTIVE_DIFFICULTY` | EXPERIMENTAL | DEFINED | MEDIUM |
| `FEATURE_AUDIO_WEB_WORKER` | PERFORMANCE | DEFINED | HIGH |
| `FEATURE_UI_INTONATION_HEATMAPS` | EXPERIMENTAL | DEFINED | LOW |
| `FEATURE_PRACTICE_ASSISTANT` | BETA | DEFINED | MEDIUM |
| `FEATURE_SOCIAL_PRACTICE_ROOMS` | EXPERIMENTAL | PLANNED | HIGH |
| `FEATURE_TELEMETRY_ACCURACY` | INTEGRATION | PLANNED | LOW |

---

## 🛠 Active Features

### Violin Fingerboard Visualization
- **ID**: `FEATURE_UI_VIOLIN_FINGERBOARD`
- **Description**: Displays a virtual violin fingerboard that highlights notes as they are played.
- **Impact**: Provides immediate visual reference for finger placement.
- **How to test**: Open Practice mode and ensure the fingerboard is visible at the bottom.

### Progress Analytics Dashboard
- **ID**: `FEATURE_ANALYTICS_DASHBOARD`
- **Description**: A dedicated view for tracking practice time, streaks, and skill progression.
- **Impact**: Increases user engagement and motivation.
- **How to test**: Toggle the 'Dashboard' tab in the main header.

### Advanced Technical Feedback
- **ID**: `FEATURE_TECHNICAL_FEEDBACK`
- **Description**: Shows pedagogical tips and technical observations (e.g., "Keep it steady!") during practice.
- **Impact**: Provides qualitative feedback beyond simple pitch accuracy.
- **How to test**: Perform a practice session and look for text observations in the feedback panel.

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

### Contextual Practice Assistant
- **ID**: `FEATURE_PRACTICE_ASSISTANT`
- **Description**: A command-palette style assistant (powered by `cmdk`) for quick navigation and drill selection.
- **Status**: Integration in `app/layout.tsx` pending.

---

## 📅 Planned Features

### Social Practice Rooms
- **ID**: `FEATURE_SOCIAL_PRACTICE_ROOMS`
- **Description**: Collaborative practice spaces for students and teachers.
- **Status**: Concept stage.

### Accuracy Telemetry
- **ID**: `FEATURE_TELEMETRY_ACCURACY`
- **Description**: Anonymous tracking of detection confidence levels to optimize the algorithm for different hardware.
- **Status**: Researching privacy-safe implementation.

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
