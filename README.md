# Violin Mentor

An interactive violin training application with real-time pitch detection, guided practice exercises, and progress analytics.

## What is Violin Mentor?

Violin Mentor helps violinists improve their intonation and practice skills through three integrated modes:

1. **Tuner Mode**: Real-time pitch detection to tune your violin
2. **Practice Mode**: Guided exercises with interactive sheet music and real-time feedback
3. **Analytics Dashboard**: Track your progress, streaks, and achievements

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Microphone access (browser will prompt for permission)

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
pnpm build
pnpm start
```

## Available Commands

| Command             | Description               |
| ------------------- | ------------------------- |
| `pnpm dev`          | Start development server  |
| `pnpm build`        | Build for production      |
| `pnpm start`        | Start production server   |
| `pnpm lint`         | Run ESLint checks         |
| `pnpm lint:fix`     | Auto-fix ESLint issues    |
| `pnpm format`       | Format code with Prettier |
| `pnpm format:check` | Check code formatting     |

**Note**: No test command is configured yet.

## Tech Stack

- **Framework**: Next.js 16.0.10 (App Router) + React 19.2.0
- **State Management**: Zustand
- **Pitch Detection**: YIN algorithm (custom implementation)
- **Sheet Music**: OpenSheetMusicDisplay
- **UI Components**: Radix UI + Tailwind CSS
- **Charts**: Recharts

## Project Structure

```
violin-app/
├── app/                    # Next.js app router
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page (mode switcher)
├── components/            # React components
│   ├── ui/               # Reusable UI components (Radix)
│   ├── tuner-mode.tsx    # Tuner mode component
│   ├── practice-mode.tsx # Practice mode component
│   ├── analytics-dashboard.tsx
│   ├── sheet-music.tsx
│   └── practice-feedback.tsx
├── lib/                   # Core logic
│   ├── stores/           # Zustand stores
│   │   ├── tuner-store.ts
│   │   ├── practice-store.ts
│   │   └── analytics-store.ts
│   ├── exercises/        # Exercise definitions
│   ├── pitch-detector.ts # YIN algorithm implementation
│   └── musical-note.ts   # Musical note value object
└── hooks/                # Custom React hooks
```

## Troubleshooting

### Microphone Access Issues

**Problem**: "Microphone access denied" error

**Solutions**:

1. Check browser permissions (usually a camera icon in address bar)
2. Ensure you're using HTTPS in production or localhost in development
3. Try a different browser (Chrome/Edge recommended)
4. Check if another application is using the microphone

### Audio Not Detecting

**Problem**: Tuner/Practice mode not detecting any sound

**Solutions**:

1. Open Settings dialog (gear icon) and select correct microphone
2. Increase sensitivity slider in Settings
3. Play louder or closer to microphone
4. Check system sound input levels

### Sheet Music Not Displaying

**Problem**: Sheet music fails to render in Practice mode

**Solutions**:

1. Check browser console for errors
2. Ensure OpenSheetMusicDisplay loaded correctly
3. Try refreshing the page

## Documentation

See `docs/` folder for detailed architecture and mode documentation:

- `docs/architecture.md` - System architecture and data flow
- `docs/modes/tuner.md` - Tuner mode details
- `docs/modes/practice.md` - Practice mode details
- `docs/modes/dashboard.md` - Analytics dashboard details
- `docs/audio.md` - Audio pipeline documentation
- `docs/state-management.md` - Zustand store details
- `docs/glossary.md` - Musical and technical terms

## License

Built with v0
