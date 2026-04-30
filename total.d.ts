
// ===== types-docs/.next/dev/types/validator.d.ts =====

export {};

// ===== types-docs/.next/types/validator.d.ts =====

export {};

// ===== types-docs/__tests__/achievement-system.test.d.ts =====

export {};

// ===== types-docs/__tests__/full-flow-verification.test.d.ts =====

export {};

// ===== types-docs/__tests__/initialization-flow.test.d.ts =====

export {};

// ===== types-docs/__tests__/practice-flow.test.d.ts =====

export {};

// ===== types-docs/__tests__/practice-integration.test.d.ts =====

export {};

// ===== types-docs/__tests__/type-safety/branded-types.test.d.ts =====

export {};

// ===== types-docs/__tests__/type-safety/exercise-compatibility.test.d.ts =====

export {};

// ===== types-docs/__tests__/type-safety/range-validation.test.d.ts =====

export {};

// ===== types-docs/app/error.d.ts =====

/**
 * Implements the Next.js error boundary for a specific route segment.
 * @remarks This component catches errors that occur during rendering of a
 * server or client component within its segment and provides a graceful
_fallback UI. It also logs the error for observability.
 * See: https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function Error({ error, reset, }: {
    error: Error & {
        digest?: string;
    };
    reset: () => void;
}): import("react/jsx-runtime").JSX.Element;

// ===== types-docs/app/global-error.d.ts =====

import './globals.css';
/**
 * Implements the Next.js global error boundary for the entire application.
 * @remarks This component catches errors that occur in the root layout and
 * provides a full-page fallback UI. It is a last-resort error handler.
 * It MUST define its own `<html>` and `<body>` tags.
 * See: https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-errors-in-root-layouts
 */
export default function GlobalError({ error, reset, }: {
    error: Error & {
        digest?: string;
    };
    reset: () => void;
}): import("react/jsx-runtime").JSX.Element;

// ===== types-docs/app/layout.d.ts =====

import type React from 'react';
import type { Metadata } from 'next';
import './globals.css';
export declare const metadata: Metadata;
/**
 * The root layout for the application.
 * @remarks This component wraps all pages and sets up the base `<html>` and `<body>`
 * elements, including fonts and Vercel analytics.
 */
export default function RootLayout({ children, }: Readonly<{
    children: React.ReactNode;
}>): import("react/jsx-runtime").JSX.Element;

// ===== types-docs/app/page.d.ts =====

/**
 * The main component for the home page.
 * @remarks Renders the header, footer, and main content, which dynamically
 * changes based on the selected mode (`Tuner`, `Practice`, or `Dashboard`).
 * It also manages the visibility of the settings dialog.
 */
export default function Home(): import("react/jsx-runtime").JSX.Element;

// ===== types-docs/app/test-pages/sheet-music/page.d.ts =====

export default function SheetMusicTestPage(): import("react/jsx-runtime").JSX.Element;

// ===== types-docs/components/achievement-toast.d.ts =====

import type { Achievement } from '@/stores/analytics-store';
interface AchievementToastProps {
    achievement: Achievement;
    onDismiss: () => void;
    autoHideDuration?: number;
}
/**
 * Notificación animada que celebra logros desbloqueados
 */
export declare function AchievementToast({ achievement, onDismiss, autoHideDuration, }: AchievementToastProps): import("react/jsx-runtime").JSX.Element;
/**
 * Manager component para manejar cola de notificaciones de logros
 */
export declare function AchievementNotificationManager(): import("react/jsx-runtime").JSX.Element;
export {};

// ===== types-docs/components/analytics-dashboard.d.ts =====

/**
 * AnalyticsDashboard
 */
/**
 * Lean orchestration component for the analytics dashboard.
 * Refactored for Senior Software Craftsmanship compliance.
 */
export declare function AnalyticsDashboard(): import("react/jsx-runtime").JSX.Element;

// ===== types-docs/components/analytics/AchievementsSection.d.ts =====

import { Achievement } from '@/stores/analytics-store';
interface AchievementsSectionProps {
    achievements: Achievement[];
}
/**
 * Displays recent achievements and locked achievements with progress bars.
 *
 * @param props - Contains the list of unlocked achievements.
 */
export declare function AchievementsSection(props: AchievementsSectionProps): import("react/jsx-runtime").JSX.Element;
export {};
/**
 * Renders a locked achievement with a progress bar showing completion percentage.
 */

// ===== types-docs/components/analytics/HeatmapSection.d.ts =====

interface HeatmapSectionProps {
    data: Array<{
        noteIndex: number;
        targetPitch: string;
        accuracy: number;
        cents: number;
    }>;
}
export declare function HeatmapSection(props: HeatmapSectionProps): import("react/jsx-runtime").JSX.Element;
export {};

// ===== types-docs/components/analytics/IntonationHeatmap.d.ts =====

import { type ExerciseStats } from '@/stores/analytics-store';
interface IntonationHeatmapProps {
    exerciseStats: Record<string, ExerciseStats>;
}
/**
 * Visualizes pitch accuracy patterns for all exercises in a heatmap grid.
 * Refactored to satisfy Senior Software Craftsmanship 5-15 line limits.
 */
export declare function IntonationHeatmap({ exerciseStats }: IntonationHeatmapProps): import("react/jsx-runtime").JSX.Element;
export {};

// ===== types-docs/components/analytics/MetricsSection.d.ts =====

interface MetricsSectionProps {
    streak: number;
    todayDuration: number;
    totalSessions: number;
    completedExercises: number;
}
export declare function MetricsSection(props: MetricsSectionProps): import("react/jsx-runtime").JSX.Element;
export {};

// ===== types-docs/components/analytics/PracticeTimeSection.d.ts =====

interface PracticeTimeSectionProps {
    data: Array<{
        day: string;
        minutes: number;
    }>;
}
export declare function PracticeTimeSection(props: PracticeTimeSectionProps): import("react/jsx-runtime").JSX.Element;
export {};

// ===== types-docs/components/analytics/SkillSection.d.ts =====

interface SkillSectionProps {
    intonation: number;
    rhythm: number;
    overall: number;
}
export declare function SkillSection(props: SkillSectionProps): import("react/jsx-runtime").JSX.Element;
export {};

// ===== types-docs/components/analytics/utils.d.ts =====

import { PracticeSession } from '@/lib/domain/practice-session';
export declare function formatTime(seconds: number): string;
export declare function getLast7DaysData(sessions: PracticeSession[]): {
    day: string;
    minutes: number;
}[];
interface DailyStatsParams {
    sessions: PracticeSession[];
    dayOffset: number;
}
export declare function getDailyStats(params: DailyStatsParams): {
    day: string;
    minutes: number;
};
export declare function getDayName(date: Date): string;
export declare function filterSessionsByDate(sessions: PracticeSession[], date: Date): PracticeSession[];
export declare function calculateTotalMinutes(sessions: PracticeSession[]): number;
export declare function getHeatmapData(lastSession: PracticeSession | undefined): {
    noteIndex: number;
    targetPitch: string;
    accuracy: number;
    cents: number;
}[];
export {};

// ===== types-docs/components/debug/PitchDebugPanel.d.ts =====

/**
 * Component to display real-time pitch detection diagnostics.
 */
export declare function PitchDebugPanel(): import("react/jsx-runtime").JSX.Element;

// ===== types-docs/components/debug/PitchDebugPanel.test.d.ts =====

export {};

// ===== types-docs/components/emotional-feedback.d.ts =====

interface EmotionalFeedbackProps {
    centsOff: number | undefined;
    isInTune: boolean;
    noteMatches: boolean;
    status: string;
}
/**
 * Componente que proporciona feedback emocional visual
 * adaptado al nivel de experiencia del usuario
 */
export declare function EmotionalFeedback({ centsOff, isInTune, noteMatches, status, }: EmotionalFeedbackProps): import("react/jsx-runtime").JSX.Element;
export {};

// ===== types-docs/components/error-boundary.d.ts =====

/**
 * ErrorBoundary
 * A classic React error boundary for catching client-side rendering errors.
 */
import React from 'react';
/**
 * Props for the ErrorBoundary component.
 */
interface Props {
    /** The children components to be wrapped and monitored for errors. */
    children: React.ReactNode;
    /** An optional fallback UI to display when an error occurs. */
    fallback?: React.ReactNode;
    /** An optional callback triggered when an error is caught. */
    onError?: (error: Error) => void;
}
/**
 * Internal state for the ErrorBoundary.
 */
interface State {
    /** Whether an error has been caught in the current boundary. */
    hasError: boolean;
    /** The error object that was caught, if any. */
    error: Error | undefined;
}
/**
 * A class-based component that catches JavaScript errors anywhere in its child component tree.
 *
 * @remarks
 * This boundary:
 * 1. Logs errors to the centralized `logger` with structured metadata.
 * 2. Provides a "Retry" button in its default fallback UI.
 * 3. Supports a custom `fallback` prop for tailored error states.
 */
export declare class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props);
    /** Updates state so the next render will show the fallback UI. */
    static getDerivedStateFromError(error: Error): State;
    /**
     * Called after an error has been thrown by a descendant component.
     * Logs the error and its component stack trace.
     */
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
    render(): string | number | bigint | boolean | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | import("react/jsx-runtime").JSX.Element | null | undefined;
    private renderDefaultFallback;
}
export {};

// ===== types-docs/components/exercise-card.d.ts =====

import type { Exercise } from '@/lib/domain/musical-types';
interface ExerciseCardProps {
    exercise: Exercise;
    isRecommended?: boolean;
    lastAttempt?: {
        accuracy: number;
        timestamp: number;
    };
    onClick: () => void;
    isSelected: boolean;
}
/**
 * Visual card representing a violin exercise with OSMD preview.
 */
export declare function ExerciseCard(props: ExerciseCardProps): import("react/jsx-runtime").JSX.Element;
export {};

// ===== types-docs/components/exercise-preview-modal.d.ts =====

import type { Exercise } from '@/lib/domain/musical-types';
interface ExercisePreviewModalProps {
    exercise: Exercise | undefined;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onStart: () => void;
}
export declare function ExercisePreviewModal({ exercise, isOpen, onOpenChange, onStart, }: ExercisePreviewModalProps): import("react/jsx-runtime").JSX.Element;
export {};

// ===== types-docs/components/keyboard-shortcuts-dialog.d.ts =====

/**
 * Dialog component that displays available keyboard shortcuts in practice mode.
 *
 * @remarks
 * Can be opened via the `?` key or by clicking the help button.
 * Uses Radix UI Dialog for accessibility.
 */
export declare function KeyboardShortcutsDialog(): import("react/jsx-runtime").JSX.Element;

// ===== types-docs/components/onboarding/onboarding-flow.d.ts =====

export declare function OnboardingFlow({ onComplete }: {
    onComplete: () => void;
}): import("react/jsx-runtime").JSX.Element;

// ===== types-docs/components/practice-assistant.d.ts =====

/**
 * PracticeAssistant
 * A command-palette style assistant for quick navigation and exercise selection.
 * Uses the `cmdk` library for a high-performance, accessible search experience.
 */
/**
 * PracticeAssistant component.
 *
 * @remarks
 * This component remains hidden until the user triggers it via `Meta+K` or `Ctrl+K`.
 * It provides a searchable interface for all available exercises.
 */
export declare function PracticeAssistant(): import("react/jsx-runtime").JSX.Element;

// ===== types-docs/components/practice-completion.d.ts =====

import { type PracticeSession } from '@/lib/domain/practice-session';
interface PracticeCompletionProps {
    onRestart: () => void;
    sessionData: PracticeSession | undefined;
}
export declare function PracticeCompletion({ onRestart, sessionData }: PracticeCompletionProps): import("react/jsx-runtime").JSX.Element;
export {};

// ===== types-docs/components/practice-feedback.d.ts =====

import { Observation } from '@/lib/technique-types';
/**
 * Props for the {@link PracticeFeedback} component.
 *
 * @public
 */
export interface PracticeFeedbackProps {
    /** The scientific pitch name of the target note (e.g., "A4"). */
    targetNote: string;
    /** The scientific pitch name detected by the audio engine. */
    detectedPitchName: string | undefined;
    /** Pitch deviation in cents from the target note's ideal frequency. */
    centsOff: number | undefined;
    /** Current status of the practice state machine. */
    status: string;
    /** Maximum allowed deviation in cents to be considered "in tune". */
    centsTolerance?: number;
    /** List of real-time technical observations. */
    liveObservations?: Observation[];
    /** Duration the current note has been held correctly in tune (ms). */
    holdDuration?: number;
    /** Required hold time for a note to be considered successfully matched (ms). */
    requiredHoldTime?: number;
    /** Current count of consecutive notes played with high accuracy. */
    perfectNoteStreak?: number;
}
/**
 * Component that provides real-time pedagogical feedback during a practice session.
 */
export declare function PracticeFeedback(props: PracticeFeedbackProps): import("react/jsx-runtime").JSX.Element;

// ===== types-docs/components/practice-feedback.test.d.ts =====

export {};

// ===== types-docs/components/practice-mode.d.ts =====

/**
 * PracticeMode
 *
 * The main container component for the interactive practice session.
 */
import { Exercise } from '@/lib/exercises/types';
/**
 * Custom hook to manage the local UI state for the practice view.
 */
export declare function usePracticeViewState(): {
    state: {
        preview: Exercise | undefined;
        view: "focused" | "full";
        isZen: boolean;
    };
    actions: {
        setPreview: import("react").Dispatch<import("react").SetStateAction<Exercise | undefined>>;
        setView: import("react").Dispatch<import("react").SetStateAction<"focused" | "full">>;
        setIsZen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    };
};
export declare function PracticeMode(): import("react/jsx-runtime").JSX.Element;

// ===== types-docs/components/practice-quick-actions.d.ts =====

interface PracticeQuickActionsProps {
    status: string;
    onRepeatNote: () => void;
    onRepeatMeasure: () => void;
    onContinue: () => void;
    onTogglePause: () => void;
    onToggleZen: () => void;
    isZen: boolean;
}
export declare function PracticeQuickActions({ status, onRepeatNote, onRepeatMeasure: _onRepeatMeasure, onContinue, onTogglePause, onToggleZen, isZen, }: PracticeQuickActionsProps): import("react/jsx-runtime").JSX.Element;
export {};

// ===== types-docs/components/practice-summary-chart.d.ts =====

interface NoteAttempt {
    noteIndex: number;
    targetPitch: string;
    accuracy: number;
    cents: number;
}
interface PracticeSummaryChartProps {
    noteAttempts: NoteAttempt[];
}
/**
 * Visual summary of exercise performance with accuracy heatmap.
 */
export declare function PracticeSummaryChart({ noteAttempts }: PracticeSummaryChartProps): import("react/jsx-runtime").JSX.Element;
export {};

// ===== types-docs/components/practice/error-display.d.ts =====

/**
 * Display for application-level errors during practice.
 */
export declare function ErrorDisplay({ error, onReset }: {
    error: string;
    onReset: () => void;
}): import("react/jsx-runtime").JSX.Element;

// ===== types-docs/components/practice/exercise-library.d.ts =====

import type { Exercise } from '@/lib/domain/musical-types';
interface ExerciseLibraryProps {
    selectedId?: string;
    onSelect: (exercise: Exercise) => void;
    disabled: boolean;
}
/**
 * Library component for browsing and selecting exercises.
 */
export declare function ExerciseLibrary(props: ExerciseLibraryProps): import("react/jsx-runtime").JSX.Element;
export {};

// ===== types-docs/components/practice/practice-active-view.d.ts =====

import type { TargetNote, DetectedNote } from '@/lib/practice-core';
import type { Observation } from '@/lib/technique-types';
/**
 * View displaying real-time feedback and fingerboard visualization during practice.
 */
export declare function PracticeActiveView({ status, targetNote, targetPitchName, lastDetectedNote, liveObservations, holdDuration, perfectNoteStreak, zenMode, centsTolerance, }: {
    status: string;
    targetNote: TargetNote | undefined;
    targetPitchName: string | undefined;
    lastDetectedNote: DetectedNote | undefined;
    liveObservations?: Observation[];
    holdDuration?: number;
    perfectNoteStreak?: number;
    zenMode: boolean;
    centsTolerance?: number;
}): import("react/jsx-runtime").JSX.Element;

// ===== types-docs/components/practice/practice-controls.d.ts =====

import { PracticeStatus } from '@/lib/practice-core';
interface PracticeControlsProps {
    status: PracticeStatus;
    hasExercise: boolean;
    onStart: () => void;
    onStop: () => void;
    onRestart: () => void;
    progress: number;
    currentNoteIndex: number;
    totalNotes: number;
}
/**
 * Control bar for starting, stopping, and monitoring practice progress.
 */
export declare function PracticeControls(props: PracticeControlsProps): import("react/jsx-runtime").JSX.Element;
export {};

// ===== types-docs/components/practice/practice-header.d.ts =====

/**
 * Header component for the practice mode, displaying the exercise name.
 */
export declare function PracticeHeader({ exerciseName }: {
    exerciseName?: string;
}): import("react/jsx-runtime").JSX.Element;

// ===== types-docs/components/practice/practice-main-content.d.ts =====

/**
 * PracticeMainContent
 *
 * Orchestrates the main views of the practice mode: settings, library, and active session view.
 */
import { Exercise, Note } from '@/lib/exercises/types';
import { PracticeState, DetectedNote } from '@/lib/practice-core';
import { Observation } from '@/lib/technique-types';
import { useOSMDSafe } from '@/hooks/use-osmd-safe';
import { PracticeStoreState } from '@/lib/practice/practice-states';
import { PracticeSession } from '@/lib/domain/practice-session';
interface PracticeMainContentProps {
    state: PracticeStoreState;
    practiceState: PracticeState | undefined;
    status: string;
    isZenModeEnabled: boolean;
    autoStartEnabled: boolean;
    setAutoStart: (enabled: boolean) => void;
    setPreviewExercise: (exercise: Exercise) => void;
    currentNoteIndex: number;
    targetNote: Note | undefined;
    targetPitchName: string | undefined;
    lastDetectedNote: DetectedNote | undefined;
    liveObservations: Observation[];
    centsTolerance: number;
    sheetMusicView: 'focused' | 'full';
    setSheetMusicView: (view: 'focused' | 'full') => void;
    osmdHook: ReturnType<typeof useOSMDSafe>;
    handleRestart: () => void;
    sessions: PracticeSession[];
    start: () => void;
    stop: () => void;
    setIsZenModeEnabled: (enabled: boolean | ((prev: boolean) => boolean)) => void;
    setNoteIndex: (index: number) => void;
}
export declare function PracticeMainContent(props: PracticeMainContentProps): import("react/jsx-runtime").JSX.Element;
export {};

// ===== types-docs/components/practice/practice-settings.d.ts =====

interface PracticeSettingsProps {
    autoStartEnabled: boolean;
    onAutoStartChange: (enabled: boolean) => void;
}
/**
 * UI component for practice-specific settings like auto-start.
 */
export declare function PracticeSettings({ autoStartEnabled, onAutoStartChange }: PracticeSettingsProps): import("react/jsx-runtime").JSX.Element;
export {};

// ===== types-docs/components/practice/selection-prompt.d.ts =====

/**
 * SelectionPrompt
 *
 * Encourages the user to select an exercise when none is active.
 */
export declare function SelectionPrompt(): import("react/jsx-runtime").JSX.Element;

// ===== types-docs/components/practice/sheet-music-container.d.ts =====

/**
 * SheetMusicContainer
 *
 * Manages the display and annotations for the exercise sheet music.
 */
import { PracticeState } from '@/lib/practice-core';
import { useOSMDSafe } from '@/hooks/use-osmd-safe';
interface SheetMusicContainerProps {
    status: string;
    sheetMusicView: 'focused' | 'full';
    setSheetMusicView: (v: 'focused' | 'full') => void;
    practiceState: PracticeState | undefined;
    osmdHook: ReturnType<typeof useOSMDSafe>;
    currentNoteIndex: number;
}
export declare function SheetMusicContainer(props: SheetMusicContainerProps): import("react/jsx-runtime").JSX.Element;
export {};

// ===== types-docs/components/practice/sheet-music-view.d.ts =====

/**
 * Display for musical notation using OpenSheetMusicDisplay.
 */
export declare function SheetMusicView({ musicXML, isReady, error, containerRef, }: {
    musicXML?: string;
    isReady: boolean;
    error: string | undefined;
    containerRef: React.RefObject<HTMLDivElement | null>;
}): import("react/jsx-runtime").JSX.Element;

// ===== types-docs/components/practice/view-toggle-button.d.ts =====

/**
 * ViewToggleButton
 *
 * Allows toggling between focused and full views of the sheet music.
 */
export declare function ViewToggleButton({ view, onToggle, }: {
    view: 'focused' | 'full';
    onToggle: () => void;
}): import("react/jsx-runtime").JSX.Element;

// ===== types-docs/components/settings-dialog.d.ts =====

/**
 * SettingsDialog
 * A dialog component for managing application-wide settings like audio input and sensitivity.
 */
import { FC } from 'react';
/**
 * Props for the SettingsDialog component.
 */
interface SettingsDialogProps {
    /** Controls whether the dialog is visible. */
    isOpen: boolean;
    /** Callback function to close the dialog. */
    onClose: () => void;
}
/**
 * Renders a settings modal that allows users to configure their audio environment.
 *
 * @param props - Component properties.
 * @returns A JSX element containing the dialog with device and sensitivity controls.
 */
declare const SettingsDialog: FC<SettingsDialogProps>;
export default SettingsDialog;

// ===== types-docs/components/sheet-music-annotations.d.ts =====

import React from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
/**
 * Visual metadata for a specific note on the sheet music.
 *
 * @remarks
 * Encapsulates the pedagogical hints that are rendered as an overlay on the SVG staff.
 *
 * @public
 */
export interface Annotation {
    /**
     * Suggested finger number (1-4).
     * `0` represents an open string.
     */
    fingerNumber?: 0 | 1 | 2 | 3 | 4;
    /**
     * Suggested bowing direction.
     * - `up`: Push the bow (V symbol).
     * - `down`: Pull the bow (bridge symbol).
     */
    bowDirection?: 'up' | 'down';
    /**
     * Whether to show a visual warning flag (e.g., for difficult shifts or accidentals).
     */
    warningFlag?: boolean;
}
/**
 * Props for the {@link SheetMusicAnnotations} component.
 *
 * @public
 */
interface SheetMusicAnnotationsProps {
    /**
     * Map of note index to its respective pedagogical annotations.
     */
    annotations: Record<number, Annotation>;
    /**
     * Index of the currently active note being practiced in the session.
     */
    currentNoteIndex: number;
    /**
     * The active OpenSheetMusicDisplay (OSMD) instance.
     * Required to calculate the precise SVG coordinates for each note.
     */
    osmd: OpenSheetMusicDisplay | null | undefined;
    /**
     * Reference to the container element holding the rendered SVG staff.
     */
    containerRef: React.RefObject<HTMLDivElement | null>;
}
/**
 * Overlay component that renders pedagogical annotations directly over the sheet music staff.
 *
 * @remarks
 * This component acts as a "Head-Up Display" (HUD) for students. It uses the OSMD
 * cursor position to dynamically calculate where to place annotations (fingerings,
 * bowing signs) in relation to the rendered SVG elements.
 *
 * **Implementation Details**:
 * - **Coordinate Mapping**: Translates raw SVG/Canvas coordinates from OSMD to
 *   absolute CSS positioning for React-based overlay elements.
 * - **Synchronization**: Updates alignment whenever `currentNoteIndex` changes or
 *   on window resize.
 * - **Visual Design**: Uses backdrop blurs and transitions to ensure annotations
 *   are readable without obscuring the underlying musical notation.
 *
 * **Performance**: Coordinate lookups are debounced (100ms) to ensure smooth
 * rendering without blocking the main UI thread during resizing or rapid playback.
 *
 * @param props - Component props.
 *
 * @example
 * ```tsx
 * <SheetMusicAnnotations
 *   annotations={{ 0: { fingerNumber: 1 } }}
 *   currentNoteIndex={0}
 *   osmd={osmdInstance}
 *   containerRef={ref}
 * />
 * ```
 *
 * @public
 */
export declare function SheetMusicAnnotations({ annotations, currentNoteIndex, osmd, containerRef, }: SheetMusicAnnotationsProps): import("react/jsx-runtime").JSX.Element;
export {};

// ===== types-docs/components/sheet-music-display.d.ts =====

/**
 * SheetMusicDisplay
 * A high-level component for displaying sheet music with configurable options.
 */
import { IOSMDOptions } from 'opensheetmusicdisplay';
/**
 * Props for the SheetMusicDisplay component.
 */
interface SheetMusicDisplayProps {
    /** The MusicXML string to be rendered. */
    musicXML: string;
    /** Initial configuration options for OSMD. */
    initialOptions?: IOSMDOptions;
}
/**
 * Renders a sheet music display with a toggle for dark mode.
 *
 * @param props - Component properties.
 * @returns A JSX element containing the sheet music and controls.
 *
 * @remarks
 * This component demonstrates how to use the `useOSMDSafe` hook and
 * provides a simple UI to interact with OSMD options.
 */
export declare function SheetMusicDisplay({ musicXML, initialOptions }: SheetMusicDisplayProps): import("react/jsx-runtime").JSX.Element;
export {};

// ===== types-docs/components/sheet-music.d.ts =====

/**
 * SheetMusic
 * A presentation component for rendering the OSMD sheet music container.
 */
import React from 'react';
/**
 * Props for the SheetMusic component.
 */
interface SheetMusicProps {
    /**
     * A ref to the div element where OSMD will render the score.
     */
    containerRef: React.RefObject<HTMLDivElement | null>;
    /** Indicates if the sheet music has finished rendering. */
    isReady: boolean;
    /** Error message to display if rendering fails. */
    error: string | undefined;
}
/**
 * Renders the visual container and loading/error states for sheet music.
 */
export declare function SheetMusic({ containerRef, isReady, error }: SheetMusicProps): import("react/jsx-runtime").JSX.Element;
export {};

// ===== types-docs/components/theme-provider.d.ts =====

import { type ThemeProviderProps } from 'next-themes';
/**
 * A wrapper around `next-themes`'s `ThemeProvider` to integrate with the Next.js App Router.
 *
 * @remarks
 * This component is marked with "use client" and is responsible for providing theme context
 * to all client-side components in the application. It accepts all the props of the
 * original `ThemeProvider` from `next-themes`.
 *
 * @param props - The properties for the theme provider, including children.
 * @returns A JSX element that provides theme context to its children.
 */
export declare function ThemeProvider({ children, ...props }: ThemeProviderProps): import("react/jsx-runtime").JSX.Element;

// ===== types-docs/components/tuner-display.d.ts =====

/**
 * TunerDisplay
 * A visual representation of the tuner state, including a needle meter and note info.
 */
/**
 * Props for the TunerDisplay component.
 */
interface TunerDisplayProps {
    /** The musical name of the detected note (e.g., "A4"). */
    note: string | undefined;
    /** The deviation from the ideal frequency in cents. */
    cents: number | undefined;
    /** The confidence level of the pitch detection (0-1). */
    confidence: number;
}
/**
 * Renders the tuner's main visual feedback.
 */
export declare function TunerDisplay(props: TunerDisplayProps): import("react/jsx-runtime").JSX.Element;
export {};

// ===== types-docs/components/tuner-mode.d.ts =====

/**
 * TunerMode
 *
 * Provides the user interface for the standalone violin tuner.
 * Handles the audio analysis loop and visualizes pitch detection results.
 */
/**
 * Main component for the Standalone Tuner Mode.
 *
 * @remarks
 * This component provides a focused interface for tuning the violin strings. It manages its own
 * high-frequency analysis loop using `requestAnimationFrame` when the tuner is active.
 *
 * **Key Features**:
 * 1. **Visual Tuning**: Displays a high-accuracy `ViolinFingerboard` with cents deviation indicators.
 * 2. **Audio Lifecycle**: Manages the start/stop of the analyzer loop and synchronizes with the `TunerStore`.
 * 3. **Error Resilience**: Handles microphone access errors and provides a specialized retry mechanism.
 * 4. **State Orchestration**: Uses a formal state machine from the store to handle UI transitions (IDLE, INITIALIZING, READY, LISTENING, ERROR).
 *
 * **Performance**: The analysis loop pulls raw PCM samples and runs the pitch detection algorithm
 * every animation frame (approx. 16ms). The `updatePitch` action in the store is optimized for
 * this frequency.
 *
 * @example
 * ```tsx
 * <TunerMode />
 * ```
 *
 * @example
 * ```tsx
 * <TunerMode />
 * ```
 *
 * @public
 */
export declare function TunerMode(): import("react/jsx-runtime").JSX.Element;

// ===== types-docs/components/ui/badge.d.ts =====

import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
declare const badgeVariants: (props?: ({
    variant?: "default" | "outline" | "destructive" | "secondary" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
}
declare function Badge({ className, variant, ...props }: BadgeProps): import("react/jsx-runtime").JSX.Element;
export { Badge, badgeVariants };

// ===== types-docs/components/ui/button.d.ts =====

import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
declare const buttonVariants: (props?: ({
    variant?: "default" | "link" | "outline" | "destructive" | "secondary" | "ghost" | null | undefined;
    size?: "default" | "icon" | "sm" | "lg" | "icon-sm" | "icon-lg" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Un componente de botón personalizable con variantes de estilo y tamaño.
 * @remarks Se basa en `class-variance-authority` para gestionar las variantes
 * y `Radix UI Slot` para permitir la composición con otros componentes.
 */
declare function Button({ className, variant, size, asChild, ...props }: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
}): import("react/jsx-runtime").JSX.Element;
export { Button, buttonVariants };

// ===== types-docs/components/ui/card.d.ts =====

import * as React from 'react';
/**
 * Un contenedor de contenido flexible para agrupar información relacionada.
 */
declare function Card({ className, ...props }: React.ComponentProps<'div'>): import("react/jsx-runtime").JSX.Element;
/**
 * La sección de cabecera de un `Card`, ideal para `CardTitle` y `CardDescription`.
 */
declare function CardHeader({ className, ...props }: React.ComponentProps<'div'>): import("react/jsx-runtime").JSX.Element;
/**
 * El título de un `Card`, para ser usado dentro de `CardHeader`.
 */
declare function CardTitle({ className, ...props }: React.ComponentProps<'div'>): import("react/jsx-runtime").JSX.Element;
/**
 * La descripción de un `Card`, para ser usada dentro de `CardHeader`.
 */
declare function CardDescription({ className, ...props }: React.ComponentProps<'div'>): import("react/jsx-runtime").JSX.Element;
/**
 * Un contenedor para acciones (ej. un botón) dentro de `CardHeader`.
 */
declare function CardAction({ className, ...props }: React.ComponentProps<'div'>): import("react/jsx-runtime").JSX.Element;
/**
 * La sección principal de contenido de un `Card`.
 */
declare function CardContent({ className, ...props }: React.ComponentProps<'div'>): import("react/jsx-runtime").JSX.Element;
/**
 * La sección de pie de página de un `Card`.
 */
declare function CardFooter({ className, ...props }: React.ComponentProps<'div'>): import("react/jsx-runtime").JSX.Element;
export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };

// ===== types-docs/components/ui/dialog.d.ts =====

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
/**
 * El contenedor raíz para un cuadro de diálogo, basado en `Radix UI Dialog`.
 */
declare function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>): import("react/jsx-runtime").JSX.Element;
/**
 * El botón o elemento que abre el cuadro de diálogo.
 */
declare function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>): import("react/jsx-runtime").JSX.Element;
/**
 * Renderiza el contenido del diálogo en un portal, fuera de la jerarquía DOM principal.
 */
declare function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>): import("react/jsx-runtime").JSX.Element;
/**
 * Un botón o elemento que cierra el cuadro de diálogo.
 */
declare function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>): import("react/jsx-runtime").JSX.Element;
/**
 * El fondo semitransparente que se muestra detrás del cuadro de diálogo.
 */
declare function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>): import("react/jsx-runtime").JSX.Element;
/**
 * El contenedor principal del contenido del cuadro de diálogo.
 */
declare function DialogContent({ className, children, showCloseButton, ...props }: React.ComponentProps<typeof DialogPrimitive.Content> & {
    /** Muestra u oculta el botón de cierre por defecto. */
    showCloseButton?: boolean;
}): import("react/jsx-runtime").JSX.Element;
/**
 * La cabecera del cuadro de diálogo, ideal para `DialogTitle` y `DialogDescription`.
 */
declare function DialogHeader({ className, ...props }: React.ComponentProps<'div'>): import("react/jsx-runtime").JSX.Element;
/**
 * El pie de página del cuadro de diálogo, útil para botones de acción.
 */
declare function DialogFooter({ className, ...props }: React.ComponentProps<'div'>): import("react/jsx-runtime").JSX.Element;
/**
 * El título del cuadro de diálogo, para ser usado dentro de `DialogHeader`.
 */
declare function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>): import("react/jsx-runtime").JSX.Element;
/**
 * La descripción del cuadro de diálogo, para ser usada dentro de `DialogHeader`.
 */
declare function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>): import("react/jsx-runtime").JSX.Element;
export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger, };

// ===== types-docs/components/ui/label.d.ts =====

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
/**
 * Muestra una etiqueta accesible para elementos de formulario.
 * @remarks Se basa en `Radix UI Label` para proporcionar una mejor accesibilidad y
 * se integra con los estilos del sistema de diseño.
 */
declare function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>): import("react/jsx-runtime").JSX.Element;
export { Label };

// ===== types-docs/components/ui/pitch-accuracy-meter.d.ts =====

interface PitchAccuracyMeterProps {
    centsOff: number | undefined;
    isInTune: boolean;
    showNumericValue?: boolean;
}
export declare function PitchAccuracyMeter({ centsOff, isInTune, showNumericValue, }: PitchAccuracyMeterProps): import("react/jsx-runtime").JSX.Element;
export {};

// ===== types-docs/components/ui/progress.d.ts =====

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
declare const Progress: React.ForwardRefExoticComponent<Omit<ProgressPrimitive.ProgressProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
export { Progress };

// ===== types-docs/components/ui/scroll-area.d.ts =====

import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
declare const ScrollArea: React.ForwardRefExoticComponent<Omit<ScrollAreaPrimitive.ScrollAreaProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const ScrollBar: React.ForwardRefExoticComponent<Omit<ScrollAreaPrimitive.ScrollAreaScrollbarProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
export { ScrollArea, ScrollBar };

// ===== types-docs/components/ui/select.d.ts =====

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
/**
 * El contenedor raíz para un menú de selección, basado en `Radix UI Select`.
 */
declare function Select({ ...props }: React.ComponentProps<typeof SelectPrimitive.Root>): import("react/jsx-runtime").JSX.Element;
/**
 * Agrupa opciones dentro de un `Select`.
 */
declare function SelectGroup({ ...props }: React.ComponentProps<typeof SelectPrimitive.Group>): import("react/jsx-runtime").JSX.Element;
/**
 * Muestra el valor seleccionado de un `Select` cuando está cerrado.
 */
declare function SelectValue({ ...props }: React.ComponentProps<typeof SelectPrimitive.Value>): import("react/jsx-runtime").JSX.Element;
/**
 * El botón que abre y cierra el menú de selección.
 */
declare function SelectTrigger({ className, size, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
    size?: 'sm' | 'default';
}): import("react/jsx-runtime").JSX.Element;
/**
 * El contenedor de las opciones del menú de selección.
 */
declare function SelectContent({ className, children, position, align, ...props }: React.ComponentProps<typeof SelectPrimitive.Content>): import("react/jsx-runtime").JSX.Element;
/**
 * Una etiqueta para un grupo de opciones de `Select`.
 */
declare function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>): import("react/jsx-runtime").JSX.Element;
/**
 * Una opción individual dentro de un `Select`.
 */
declare function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>): import("react/jsx-runtime").JSX.Element;
/**
 * Un separador visual para agrupar opciones en un `Select`.
 */
declare function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>): import("react/jsx-runtime").JSX.Element;
/**
 * Un botón para desplazarse hacia arriba en la lista de opciones.
 */
declare function SelectScrollUpButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>): import("react/jsx-runtime").JSX.Element;
/**
 * Un botón para desplazarse hacia abajo en la lista de opciones.
 */
declare function SelectScrollDownButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>): import("react/jsx-runtime").JSX.Element;
export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue, };

// ===== types-docs/components/ui/slider.d.ts =====

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
/**
 * Un control deslizante que permite al usuario seleccionar un valor de un rango.
 * @remarks Se basa en `Radix UI Slider` para una mayor accesibilidad y se integra
 * con el sistema de diseño para una apariencia consistente.
 */
declare function Slider({ className, defaultValue, value, min, max, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>): import("react/jsx-runtime").JSX.Element;
export { Slider };

// ===== types-docs/components/ui/switch.d.ts =====

import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
declare const Switch: React.ForwardRefExoticComponent<Omit<SwitchPrimitives.SwitchProps & React.RefAttributes<HTMLButtonElement>, "ref"> & React.RefAttributes<HTMLButtonElement>>;
export { Switch };

// ===== types-docs/components/ui/tabs.d.ts =====

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
/**
 * El contenedor raíz para un conjunto de pestañas, basado en `Radix UI Tabs`.
 */
declare function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>): import("react/jsx-runtime").JSX.Element;
/**
 * La lista que contiene los disparadores de las pestañas (`TabsTrigger`).
 */
declare function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>): import("react/jsx-runtime").JSX.Element;
/**
 * El botón que activa una pestaña para mostrar su contenido.
 */
declare function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>): import("react/jsx-runtime").JSX.Element;
/**
 * El contenedor para el contenido de una pestaña.
 */
declare function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>): import("react/jsx-runtime").JSX.Element;
export { Tabs, TabsList, TabsTrigger, TabsContent };

// ===== types-docs/components/ui/toggle-group.d.ts =====

import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { toggleVariants } from '@/components/ui/toggle';
declare function ToggleGroup({ className, variant, size, spacing, children, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Root> & VariantProps<typeof toggleVariants> & {
    spacing?: number;
}): import("react/jsx-runtime").JSX.Element;
declare function ToggleGroupItem({ className, children, variant, size, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleVariants>): import("react/jsx-runtime").JSX.Element;
export { ToggleGroup, ToggleGroupItem };

// ===== types-docs/components/ui/toggle.d.ts =====

import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { Toggle as TogglePrimitive } from '@radix-ui/react-toggle';
declare const toggleVariants: (props?: ({
    variant?: "default" | "outline" | null | undefined;
    size?: "default" | "sm" | "lg" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
declare function Toggle({ className, variant, size, ...props }: React.ComponentProps<typeof TogglePrimitive> & VariantProps<typeof toggleVariants>): import("react/jsx-runtime").JSX.Element;
export { Toggle, toggleVariants };

// ===== types-docs/components/ui/tooltip.d.ts =====

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
/**
 * El proveedor que engloba la aplicación o una parte de ella para habilitar los tooltips.
 */
declare function TooltipProvider({ delayDuration, ...props }: React.ComponentProps<typeof TooltipPrimitive.Provider>): import("react/jsx-runtime").JSX.Element;
declare const Tooltip: React.FC<TooltipPrimitive.TooltipProps>;
/**
 * El elemento que activa el tooltip al pasar el ratón sobre él.
 */
declare function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>): import("react/jsx-runtime").JSX.Element;
/**
 * El contenido del tooltip que se muestra al activarse.
 */
declare function TooltipContent({ className, sideOffset, children, ...props }: React.ComponentProps<typeof TooltipPrimitive.Content>): import("react/jsx-runtime").JSX.Element;
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };

// ===== types-docs/components/ui/violin-fingerboard.d.ts =====

/**
 * ViolinFingerboard
 * A visual representation of a violin fingerboard using HTML5 Canvas.
 * It provides real-time feedback on finger placement for both target and detected notes.
 */
/**
 * Props for the ViolinFingerboard component.
 */
export interface ViolinFingerboardProps {
    /** The note the student should be playing (e.g., "A4"). */
    targetNote: string | undefined;
    /** The note currently detected by the pitch tracker. */
    detectedPitchName: string | undefined;
    /** The deviation in cents from the ideal frequency. Used for visual offset. */
    centsDeviation: number | undefined;
    /** The tolerance in cents within which a note is considered "In Tune". @defaultValue 25 */
    centsTolerance?: number;
    /** Explicit override for the in-tune state. */
    isInTune?: boolean;
}
/**
 * Renders a visual representation of a violin fingerboard on a `<canvas>`.
 *
 * @param props - Component properties.
 * @returns A JSX element containing two layered canvases (base and overlay).
 *
 * @remarks
 * Architectural Pattern:
 * - Uses a dual-canvas strategy:
 *   1. `baseCanvas`: Renders the static fingerboard and strings once.
 *   2. `overlayCanvas`: Renders dynamic indicators (target/detected notes) on every update.
 * - This optimizes performance by avoiding full redraws of the complex fingerboard background.
 *
 * Interaction:
 * - Shows a blue circle for the `targetNote` with the required finger number.
 * - Shows a green (in-tune) or red (out-of-tune) circle for the `detectedPitchName`.
 * - The horizontal position of the detected note is shifted based on `centsDeviation`.
 */
export declare function ViolinFingerboard({ targetNote, detectedPitchName, centsDeviation, centsTolerance, isInTune, }: ViolinFingerboardProps): import("react/jsx-runtime").JSX.Element;

// ===== types-docs/e2e/settings.spec.d.ts =====

export {};

// ===== types-docs/e2e/sheet-music-display.spec.d.ts =====

export {};

// ===== types-docs/hooks/use-exercise-library.d.ts =====

/**
 * Custom hook to manage the state and logic of the Exercise Library.
 */
export declare function useExerciseLibrary(): {
    activeTab: string;
    setActiveTab: import("react").Dispatch<import("react").SetStateAction<string>>;
    difficultyFilter: string;
    setDifficultyFilter: import("react").Dispatch<import("react").SetStateAction<string>>;
    filtered: import("../lib/domain/musical-types").Exercise[];
    recommended: import("../lib/domain/musical-types").Exercise | undefined;
    exerciseStats: Record<string, import("@/stores/analytics-store").ExerciseStats>;
};

// ===== types-docs/hooks/use-osmd-safe.d.ts =====

/**
 * useOSMDSafe
 * A custom React hook for safely initializing and managing OpenSheetMusicDisplay (OSMD) instances.
 */
import { OpenSheetMusicDisplay, IOSMDOptions } from 'opensheetmusicdisplay';
import { ScoreViewPort } from '@/lib/ports/score-view.port';
/**
 * Hook for safely managing OpenSheetMusicDisplay instances.
 * Refactored for documented lifecycle behavior and null elimination.
 *
 * @param musicXML - Valid MusicXML 3.1 string
 * @param options - OSMD configuration
 *
 * @returns Object with:
 * - `containerRef`: Attach to a `<div>` element
 * - `isReady`: True when OSMD is initialized and rendered
 * - `error`: Error message if initialization failed
 * - `resetCursor()`: Resets cursor to start (no-op if !isReady)
 * - `advanceCursor()`: Moves cursor forward (no-op if !isReady)
 *
 * @remarks
 * **Preconditions**:
 * 1. `containerRef` MUST be attached to a mounted DOM element
 * 2. Cursor methods are safe to call anytime (no-op when !isReady)
 * 3. Re-initializes when `musicXML` or `options` change
 *
 * @example
 * ```tsx
 * function SheetMusic({ xml }: { xml: string }) {
 *   const { containerRef, isReady, resetCursor } = useOSMDSafe(xml);
 *
 *   return (
 *     <>
 *       <button onClick={resetCursor} disabled={!isReady}>
 *         Reset
 *       </button>
 *       <div ref={containerRef} />
 *     </>
 *   );
 * }
 * ```
 */
export declare function useOSMDSafe(musicXML: string, options?: IOSMDOptions): {
    isReady: boolean;
    error: string | undefined;
    containerRef: import('react').RefObject<HTMLDivElement | null>;
    /** Safe to call anytime - no-op when !isReady */
    resetCursor: () => void;
    /** Safe to call anytime - no-op when !isReady */
    advanceCursor: () => void;
    /** Highlights the note at the given index */
    highlightCurrentNote: () => void;
    /** Reference to the OSMD instance for advanced interactions */
    osmd: OpenSheetMusicDisplay | undefined;
    /** Implementation of the ScoreViewPort for decoupled visual control */
    scoreView: ScoreViewPort;
};

// ===== types-docs/hooks/use-osmd-safe.test.d.ts =====

export {};

// ===== types-docs/hooks/use-page-visibility.d.ts =====

/**
 * Hook to track the visibility state of the document.
 */
export declare function usePageVisibility(): boolean;

// ===== types-docs/hooks/use-pitch-debug.d.ts =====

import { type PitchDebugEvent } from '@/lib/observability/pitch-debug';
/**
 * Hook to subscribe to pitch debug events.
 * Maintains a history of the last N events.
 *
 * @param maxEvents - Maximum number of events to keep in history.
 * @returns An array of PitchDebugEvent objects.
 */
export declare function usePitchDebug(maxEvents?: number): PitchDebugEvent[];

// ===== types-docs/hooks/use-practice-lifecycle.d.ts =====

/**
 * usePracticeLifecycle
 *
 * Orchestrates the lifecycle of a practice session.
 */
import { PracticeState } from '@/lib/practice-core';
import { useOSMDSafe } from './use-osmd-safe';
import { Exercise } from '@/lib/exercises/types';
import { DerivedPracticeState } from '@/lib/practice/practice-utils';
interface LifecycleParams {
    practiceState: PracticeState | undefined;
    loadExercise: (exercise: Exercise) => Promise<void>;
    start: () => Promise<void>;
    stop: () => Promise<void>;
    setIsZen: (enabled: boolean | ((prev: boolean) => boolean)) => void;
    osmdHook: ReturnType<typeof useOSMDSafe>;
    derived: DerivedPracticeState;
    autoStartEnabled: boolean;
    lastLoadedAt: number;
}
export declare function usePracticeLifecycle(params: LifecycleParams): void;
export {};

// ===== types-docs/hooks/use-practice-pipeline.d.ts =====

import { AudioLoopPort, PitchDetectionPort } from '@/lib/ports/audio.port';
import type { PracticeState, PracticeEvent } from '@/lib/practice-core';
/**
 * Hook to encapsulate the high-frequency audio pipeline lifecycle.
 * Refactored to satisfy Senior Software Craftsmanship 5-15 line limits.
 */
export declare function usePracticePipeline({ practiceState, audioLoop, detector, consumePipelineEvents, }: {
    practiceState: PracticeState | undefined;
    audioLoop: AudioLoopPort | undefined;
    detector: PitchDetectionPort | undefined;
    consumePipelineEvents: (pipeline: AsyncIterable<PracticeEvent>) => Promise<void>;
}): void;

// ===== types-docs/hooks/use-practice-ui-effects.d.ts =====

import { ScoreViewPort } from '@/lib/ports/score-view.port';
/**
 * Custom hook to manage keyboard shortcuts and cursor synchronization for the practice session.
 *
 * @param params - Hook dependencies including state and actions.
 */
export declare function usePracticeUIEffects(params: {
    status: string;
    currentNoteIndex: number;
    start: () => void;
    stop: () => void;
    setZenMode: (v: (prev: boolean) => boolean) => void;
    scoreView: ScoreViewPort;
}): void;

// ===== types-docs/hooks/use-window-size.d.ts =====

export declare function useWindowSize(): {
    width: number;
    height: number;
};

// ===== types-docs/lib/achievement-image-generator.d.ts =====

import type { PracticeSession } from '@/lib/domain/practice-session';
/**
 * Generates a shareable image for exercise completion.
 * Decomposed into focused helpers for Senior Software Craftsmanship.
 */
export declare function generateAchievementImage(sessionData: PracticeSession, stars: number): Promise<Blob>;

// ===== types-docs/lib/achievements/achievement-checker.d.ts =====

import { AchievementCheckStats, AchievementDefinition } from './achievement-definitions';
import type { Achievement } from '@/stores/analytics-store';
/**
 * Identifies which achievements have been newly unlocked based on current statistics.
 *
 * @param params - The stats and already unlocked IDs.
 * @returns An array of newly unlocked {@link Achievement} objects.
 */
export declare function checkAchievements(params: {
    stats: AchievementCheckStats;
    unlockedAchievementIds: string[];
}): Achievement[];
/**
 * Retrieves the full definition of an achievement by its unique identifier.
 *
 * @param id - The achievement ID to look up.
 * @returns The definition object or undefined if not found.
 */
export declare function getAchievementDefinition(id: string): AchievementDefinition | undefined;
/**
 * Calculates the progress percentage (0–100) towards unlocking an achievement.
 *
 * @param definition - The achievement definition to evaluate.
 * @param stats - The current user statistics.
 * @returns A number from 0 to 100 representing completion percentage.
 *
 * @remarks
 * Supports various condition types based on the achievement definitions.
 * Refactored to meet Senior Software Craftsmanship standards.
 */
export declare function getAchievementProgress(definition: AchievementDefinition, stats: AchievementCheckStats): number;
/**
 * Groups all available achievements by their respective categories.
 *
 * @returns A record mapping category names to arrays of definitions.
 */
export declare function getAllAchievementsByCategory(): Record<string, AchievementDefinition[]>;

// ===== types-docs/lib/achievements/achievement-definitions.d.ts =====

/**
 * Achievement system based on practice milestones
 */
export interface AchievementDefinition {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'practice' | 'accuracy' | 'streak' | 'mastery' | 'exploration';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    condition: (stats: AchievementCheckStats) => boolean;
    reward?: {
        message: string;
        confetti?: boolean;
        sound?: string;
    };
}
export interface AchievementCheckStats {
    currentSession: {
        correctNotes: number;
        perfectNoteStreak: number;
        accuracy: number;
        durationMs: number;
        exerciseId: string;
    };
    totalSessions: number;
    totalPracticeDays: number;
    currentStreak: number;
    longestStreak: number;
    exercisesCompleted: string[];
    totalPracticeTimeMs: number;
    averageAccuracy: number;
    /** Cumulative number of notes completed across all sessions. */
    totalNotesCompleted: number;
}
export declare const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[];

// ===== types-docs/lib/adapters/web-audio.adapter.d.ts =====

import { AudioFramePort, AudioLoopPort, PitchDetectionPort } from '../ports/audio.port';
import { PitchDetector, PitchDetectionResult } from '../pitch-detector';
/**
 * Adapter that connects a Web Audio {@link AnalyserNode} to the {@link AudioFramePort}.
 *
 * @remarks
 * This class handles the extraction of time-domain data from the Web Audio graph
 * and ensures it's compatible with the internal audio processing pipeline.
 *
 * **Memory Management**: It uses a pre-allocated `Float32Array` buffer to minimize
 * garbage collection overhead during high-frequency sampling (typically 60Hz or more).
 *
 * **Browser Compatibility**: Relies on `getFloatTimeDomainData`, which is supported
 * in all modern browsers. In legacy environments, this may require a fallback or polyfill.
 *
 * @public
 */
export declare class WebAudioFrameAdapter implements AudioFramePort {
    private analyser;
    /** Internal buffer used to store time-domain data. */
    private buffer;
    /**
     * Creates an instance of WebAudioFrameAdapter.
     *
     * @param analyser - The Web Audio AnalyserNode to pull data from.
     */
    constructor(analyser: AnalyserNode);
    /**
     * Captures the current time-domain data from the analyser node.
     *
     * @remarks
     * This method uses `getFloatTimeDomainData` which provides PCM samples
     * in the range [-1.0, 1.0]. The returned buffer is shared across calls
     * to minimize garbage collection pressure in high-frequency loops.
     *
     * **Contract**:
     * The returned buffer is a reference to an internal pre-allocated buffer.
     * Consumers MUST read the data synchronously and MUST NOT store a reference
     * to this buffer or attempt to use it across multiple calls (frames).
     * If you need to preserve the audio data for long-term storage or asynchronous
     * processing, you MUST explicitly clone it (e.g., using `.slice()`).
     *
     * **Thread Safety**: This method is intended to be called from the main thread.
     * If the underlying {@link AudioContext} is suspended or closed, the buffer
     * will be filled with zeros.
     *
     * @returns A {@link Float32Array} containing the audio samples.
     *
     * @throws This method does not throw, but will return silent data if the
     *         hardware is unavailable.
     */
    captureFrame(): Float32Array;
    /**
     * Returns the sample rate of the underlying AudioContext.
     *
     * @remarks
     * The sample rate is determined by the hardware and browser settings (typically 44100Hz or 48000Hz).
     */
    get sampleRate(): number;
}
/**
 * Adapter that implements {@link AudioLoopPort} using browser scheduling.
 *
 * @remarks
 * Uses `requestAnimationFrame` to drive the audio processing loop. This is ideal for
 * UI-driven applications as it automatically synchronizes with the display refresh rate.
 *
 * **Performance Note**: While suitable for UI-synced applications, this loop
 * will be throttled or paused by the browser when the tab is in the background
 * to save power. For background-stable processing, consider an implementation
 * using `AudioWorklet` or a `Web Worker`.
 *
 * @public
 */
export declare class WebAudioLoopAdapter implements AudioLoopPort {
    private framePort;
    /**
     * Creates an instance of WebAudioLoopAdapter.
     *
     * @param framePort - The source of audio frames.
     */
    constructor(framePort: AudioFramePort);
    /**
     * Starts the animation-frame-based audio loop.
     *
     * @remarks
     * The loop uses a recursive `requestAnimationFrame` pattern. This implementation
     * provides the lowest possible latency for UI-synced visualizations, as it
     * aligns audio processing with the browser's paint cycle.
     *
     * **Resource Management**: It handles cleanup by removing the abort listener
     * once the signal is triggered to avoid memory leaks.
     *
     * **Edge Cases**:
     * - If the `signal` is already aborted, the loop will not start.
     * - If the tab is hidden, the browser will throttle this loop, which may
     *   lead to discontinuous audio analysis.
     *
     * @param onFrame - Callback invoked for each audio frame received from the hardware.
     * @param signal - An {@link AbortSignal} used to gracefully terminate the loop.
     * @returns A promise that resolves when the loop is terminated and all handlers are removed.
     *
     * @example
     * ```ts
     * const controller = new AbortController();
     * const loop = new WebAudioLoopAdapter(framePort);
     *
     * try {
     *   await loop.start((frame) => {
     *     const pitch = detector.detect(frame);
     *     console.log('Pitch:', pitch);
     *   }, controller.signal);
     * } catch (err) {
     *   console.error('Loop failed:', err);
     * }
     * ```
     */
    start(onFrame: (frame: Float32Array) => void, signal: AbortSignal): Promise<void>;
}
/**
 * Adapter that wraps a standard {@link PitchDetector} to satisfy the {@link PitchDetectionPort} interface.
 *
 * @remarks
 * This serves as a bridge between the core pitch detection algorithm and the port-based architecture.
 * It ensures that the detector's output is correctly mapped to the domain results.
 *
 * @public
 */
export declare class PitchDetectorAdapter implements PitchDetectionPort {
    readonly detector: PitchDetector;
    /**
     * Creates an instance of PitchDetectorAdapter.
     *
     * @param detector - The underlying pitch detector implementation.
     */
    constructor(detector: PitchDetector);
    /**
     * Detects pitch in the given audio frame.
     *
     * @remarks
     * Delegates to the internal `detector.detectPitch` method.
     *
     * @param frame - Audio samples.
     * @returns Detection result including pitch and confidence.
     */
    detect(frame: Float32Array): PitchDetectionResult;
    /**
     * Calculates the volume (RMS) of the given audio frame.
     *
     * @remarks
     * RMS (Root Mean Square) is used to determine if the audio signal is strong
     * enough for reliable pitch detection.
     *
     * @param frame - Audio samples.
     * @returns Root Mean Square value (typically 0.0 to 1.0).
     */
    calculateRMS(frame: Float32Array): number;
}

// ===== types-docs/lib/analytics-tracker.d.ts =====

interface AnalyticsEvent {
    name: string;
    properties?: Record<string, unknown>;
    timestamp: number;
}
declare class AnalyticsTracker {
    private events;
    track(name: string, properties?: Record<string, unknown>): void;
    getEvents(): AnalyticsEvent[];
}
export declare const analytics: AnalyticsTracker;
export {};

// ===== types-docs/lib/contracts/openapi.d.ts =====

export declare const generateOpenApiDocument: () => unknown;
export declare const openApiDocument: unknown;

// ===== types-docs/lib/contracts/registry.d.ts =====

import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
export declare const registry: OpenAPIRegistry;

// ===== types-docs/lib/contracts/v1/achievements.contract.d.ts =====

import { z } from 'zod';
export declare const AchievementsContractV1: z.ZodObject<{
    schemaVersion: z.ZodLiteral<1>;
    state: z.ZodObject<{
        schemaVersion: z.ZodDefault<z.ZodLiteral<1>>;
        unlocked: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodString;
            icon: z.ZodString;
            unlockedAtMs: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            id: string;
            unlockedAtMs: number;
            icon: string;
            description: string;
            name: string;
        }, {
            id: string;
            unlockedAtMs: number;
            icon: string;
            description: string;
            name: string;
        }>, "many">;
        pending: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodString;
            icon: z.ZodString;
            unlockedAtMs: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            id: string;
            unlockedAtMs: number;
            icon: string;
            description: string;
            name: string;
        }, {
            id: string;
            unlockedAtMs: number;
            icon: string;
            description: string;
            name: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        schemaVersion: 1;
        unlocked: {
            id: string;
            unlockedAtMs: number;
            icon: string;
            description: string;
            name: string;
        }[];
        pending: {
            id: string;
            unlockedAtMs: number;
            icon: string;
            description: string;
            name: string;
        }[];
    }, {
        unlocked: {
            id: string;
            unlockedAtMs: number;
            icon: string;
            description: string;
            name: string;
        }[];
        pending: {
            id: string;
            unlockedAtMs: number;
            icon: string;
            description: string;
            name: string;
        }[];
        schemaVersion?: 1 | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    state: {
        schemaVersion: 1;
        unlocked: {
            id: string;
            unlockedAtMs: number;
            icon: string;
            description: string;
            name: string;
        }[];
        pending: {
            id: string;
            unlockedAtMs: number;
            icon: string;
            description: string;
            name: string;
        }[];
    };
    schemaVersion: 1;
}, {
    state: {
        unlocked: {
            id: string;
            unlockedAtMs: number;
            icon: string;
            description: string;
            name: string;
        }[];
        pending: {
            id: string;
            unlockedAtMs: number;
            icon: string;
            description: string;
            name: string;
        }[];
        schemaVersion?: 1 | undefined;
    };
    schemaVersion: 1;
}>;

// ===== types-docs/lib/contracts/v1/practice.contract.d.ts =====

import { z } from 'zod';
export declare const PracticeContractV1: z.ZodObject<{
    schemaVersion: z.ZodLiteral<1>;
    session: z.ZodObject<{
        id: z.ZodString;
        startTimeMs: z.ZodNumber;
        endTimeMs: z.ZodNumber;
        durationMs: z.ZodNumber;
        exerciseId: z.ZodString;
        exerciseName: z.ZodString;
        mode: z.ZodEnum<["tuner", "practice"]>;
        noteResults: z.ZodArray<z.ZodObject<{
            noteIndex: z.ZodNumber;
            targetPitch: z.ZodString;
            attempts: z.ZodNumber;
            timeToCompleteMs: z.ZodOptional<z.ZodNumber>;
            averageCents: z.ZodNumber;
            wasInTune: z.ZodBoolean;
            technique: z.ZodOptional<z.ZodObject<{
                vibrato: z.ZodObject<{
                    present: z.ZodBoolean;
                    rateHz: z.ZodNumber;
                    widthCents: z.ZodNumber;
                    regularity: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                }, {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                }>;
                pitchStability: z.ZodObject<{
                    settlingStdCents: z.ZodNumber;
                    globalStdCents: z.ZodNumber;
                    driftCentsPerSec: z.ZodNumber;
                    inTuneRatio: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                }, {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                }>;
                rhythm: z.ZodObject<{
                    onsetErrorMs: z.ZodOptional<z.ZodNumber>;
                    durationErrorMs: z.ZodOptional<z.ZodNumber>;
                }, "strip", z.ZodTypeAny, {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                }, {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                }>;
            }, "strip", z.ZodTypeAny, {
                vibrato: {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                };
                rhythm: {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                };
                pitchStability: {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                };
            }, {
                vibrato: {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                };
                rhythm: {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                };
                pitchStability: {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                };
            }>>;
        }, "strip", z.ZodTypeAny, {
            noteIndex: number;
            targetPitch: string;
            wasInTune: boolean;
            attempts: number;
            averageCents: number;
            timeToCompleteMs?: number | undefined;
            technique?: {
                vibrato: {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                };
                rhythm: {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                };
                pitchStability: {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                };
            } | undefined;
        }, {
            noteIndex: number;
            targetPitch: string;
            wasInTune: boolean;
            attempts: number;
            averageCents: number;
            timeToCompleteMs?: number | undefined;
            technique?: {
                vibrato: {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                };
                rhythm: {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                };
                pitchStability: {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                };
            } | undefined;
        }>, "many">;
        notesAttempted: z.ZodNumber;
        notesCompleted: z.ZodNumber;
        accuracy: z.ZodNumber;
        averageCents: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        durationMs: number;
        accuracy: number;
        id: string;
        exerciseId: string;
        exerciseName: string;
        mode: "tuner" | "practice";
        noteResults: {
            noteIndex: number;
            targetPitch: string;
            wasInTune: boolean;
            attempts: number;
            averageCents: number;
            timeToCompleteMs?: number | undefined;
            technique?: {
                vibrato: {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                };
                rhythm: {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                };
                pitchStability: {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                };
            } | undefined;
        }[];
        endTimeMs: number;
        startTimeMs: number;
        averageCents: number;
        notesAttempted: number;
        notesCompleted: number;
    }, {
        durationMs: number;
        accuracy: number;
        id: string;
        exerciseId: string;
        exerciseName: string;
        mode: "tuner" | "practice";
        noteResults: {
            noteIndex: number;
            targetPitch: string;
            wasInTune: boolean;
            attempts: number;
            averageCents: number;
            timeToCompleteMs?: number | undefined;
            technique?: {
                vibrato: {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                };
                rhythm: {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                };
                pitchStability: {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                };
            } | undefined;
        }[];
        endTimeMs: number;
        startTimeMs: number;
        averageCents: number;
        notesAttempted: number;
        notesCompleted: number;
    }>;
}, "strip", z.ZodTypeAny, {
    session: {
        durationMs: number;
        accuracy: number;
        id: string;
        exerciseId: string;
        exerciseName: string;
        mode: "tuner" | "practice";
        noteResults: {
            noteIndex: number;
            targetPitch: string;
            wasInTune: boolean;
            attempts: number;
            averageCents: number;
            timeToCompleteMs?: number | undefined;
            technique?: {
                vibrato: {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                };
                rhythm: {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                };
                pitchStability: {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                };
            } | undefined;
        }[];
        endTimeMs: number;
        startTimeMs: number;
        averageCents: number;
        notesAttempted: number;
        notesCompleted: number;
    };
    schemaVersion: 1;
}, {
    session: {
        durationMs: number;
        accuracy: number;
        id: string;
        exerciseId: string;
        exerciseName: string;
        mode: "tuner" | "practice";
        noteResults: {
            noteIndex: number;
            targetPitch: string;
            wasInTune: boolean;
            attempts: number;
            averageCents: number;
            timeToCompleteMs?: number | undefined;
            technique?: {
                vibrato: {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                };
                rhythm: {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                };
                pitchStability: {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                };
            } | undefined;
        }[];
        endTimeMs: number;
        startTimeMs: number;
        averageCents: number;
        notesAttempted: number;
        notesCompleted: number;
    };
    schemaVersion: 1;
}>;

// ===== types-docs/lib/contracts/v1/progress.contract.d.ts =====

import { z } from 'zod';
export declare const ProgressContractV1: z.ZodObject<{
    schemaVersion: z.ZodLiteral<1>;
    state: z.ZodObject<{
        schemaVersion: z.ZodDefault<z.ZodLiteral<1>>;
        totalPracticeSessions: z.ZodNumber;
        totalPracticeTime: z.ZodNumber;
        exercisesCompleted: z.ZodArray<z.ZodString, "many">;
        currentStreak: z.ZodNumber;
        longestStreak: z.ZodNumber;
        intonationSkill: z.ZodNumber;
        rhythmSkill: z.ZodNumber;
        overallSkill: z.ZodNumber;
        exerciseStats: z.ZodRecord<z.ZodString, z.ZodObject<{
            exerciseId: z.ZodString;
            timesCompleted: z.ZodNumber;
            bestAccuracy: z.ZodNumber;
            averageAccuracy: z.ZodNumber;
            fastestCompletionMs: z.ZodNumber;
            lastPracticedMs: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            exerciseId: string;
            fastestCompletionMs: number;
            lastPracticedMs: number;
            timesCompleted: number;
            bestAccuracy: number;
            averageAccuracy: number;
        }, {
            exerciseId: string;
            fastestCompletionMs: number;
            lastPracticedMs: number;
            timesCompleted: number;
            bestAccuracy: number;
            averageAccuracy: number;
        }>>;
        eventBuffer: z.ZodDefault<z.ZodArray<z.ZodObject<{
            ts: z.ZodNumber;
            exerciseId: z.ZodString;
            accuracy: z.ZodNumber;
            rhythmErrorMs: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            accuracy: number;
            exerciseId: string;
            ts: number;
            rhythmErrorMs: number;
        }, {
            accuracy: number;
            exerciseId: string;
            ts: number;
            rhythmErrorMs: number;
        }>, "many">>;
        snapshots: z.ZodDefault<z.ZodArray<z.ZodObject<{
            userId: z.ZodString;
            window: z.ZodEnum<["7d", "30d", "all"]>;
            aggregates: z.ZodObject<{
                intonation: z.ZodNumber;
                rhythm: z.ZodNumber;
                overall: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                intonation: number;
                rhythm: number;
                overall: number;
            }, {
                intonation: number;
                rhythm: number;
                overall: number;
            }>;
            lastSessionId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            userId: string;
            window: "7d" | "30d" | "all";
            aggregates: {
                intonation: number;
                rhythm: number;
                overall: number;
            };
            lastSessionId: string;
        }, {
            userId: string;
            window: "7d" | "30d" | "all";
            aggregates: {
                intonation: number;
                rhythm: number;
                overall: number;
            };
            lastSessionId: string;
        }>, "many">>;
        eventCounter: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        exerciseStats: Record<string, {
            exerciseId: string;
            fastestCompletionMs: number;
            lastPracticedMs: number;
            timesCompleted: number;
            bestAccuracy: number;
            averageAccuracy: number;
        }>;
        schemaVersion: 1;
        totalPracticeSessions: number;
        totalPracticeTime: number;
        exercisesCompleted: string[];
        currentStreak: number;
        longestStreak: number;
        intonationSkill: number;
        rhythmSkill: number;
        overallSkill: number;
        eventBuffer: {
            accuracy: number;
            exerciseId: string;
            ts: number;
            rhythmErrorMs: number;
        }[];
        snapshots: {
            userId: string;
            window: "7d" | "30d" | "all";
            aggregates: {
                intonation: number;
                rhythm: number;
                overall: number;
            };
            lastSessionId: string;
        }[];
        eventCounter: number;
    }, {
        exerciseStats: Record<string, {
            exerciseId: string;
            fastestCompletionMs: number;
            lastPracticedMs: number;
            timesCompleted: number;
            bestAccuracy: number;
            averageAccuracy: number;
        }>;
        totalPracticeSessions: number;
        totalPracticeTime: number;
        exercisesCompleted: string[];
        currentStreak: number;
        longestStreak: number;
        intonationSkill: number;
        rhythmSkill: number;
        overallSkill: number;
        schemaVersion?: 1 | undefined;
        eventBuffer?: {
            accuracy: number;
            exerciseId: string;
            ts: number;
            rhythmErrorMs: number;
        }[] | undefined;
        snapshots?: {
            userId: string;
            window: "7d" | "30d" | "all";
            aggregates: {
                intonation: number;
                rhythm: number;
                overall: number;
            };
            lastSessionId: string;
        }[] | undefined;
        eventCounter?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    state: {
        exerciseStats: Record<string, {
            exerciseId: string;
            fastestCompletionMs: number;
            lastPracticedMs: number;
            timesCompleted: number;
            bestAccuracy: number;
            averageAccuracy: number;
        }>;
        schemaVersion: 1;
        totalPracticeSessions: number;
        totalPracticeTime: number;
        exercisesCompleted: string[];
        currentStreak: number;
        longestStreak: number;
        intonationSkill: number;
        rhythmSkill: number;
        overallSkill: number;
        eventBuffer: {
            accuracy: number;
            exerciseId: string;
            ts: number;
            rhythmErrorMs: number;
        }[];
        snapshots: {
            userId: string;
            window: "7d" | "30d" | "all";
            aggregates: {
                intonation: number;
                rhythm: number;
                overall: number;
            };
            lastSessionId: string;
        }[];
        eventCounter: number;
    };
    schemaVersion: 1;
}, {
    state: {
        exerciseStats: Record<string, {
            exerciseId: string;
            fastestCompletionMs: number;
            lastPracticedMs: number;
            timesCompleted: number;
            bestAccuracy: number;
            averageAccuracy: number;
        }>;
        totalPracticeSessions: number;
        totalPracticeTime: number;
        exercisesCompleted: string[];
        currentStreak: number;
        longestStreak: number;
        intonationSkill: number;
        rhythmSkill: number;
        overallSkill: number;
        schemaVersion?: 1 | undefined;
        eventBuffer?: {
            accuracy: number;
            exerciseId: string;
            ts: number;
            rhythmErrorMs: number;
        }[] | undefined;
        snapshots?: {
            userId: string;
            window: "7d" | "30d" | "all";
            aggregates: {
                intonation: number;
                rhythm: number;
                overall: number;
            };
            lastSessionId: string;
        }[] | undefined;
        eventCounter?: number | undefined;
    };
    schemaVersion: 1;
}>;

// ===== types-docs/lib/domain/data-structures.d.ts =====

/**
 * Data Structures
 *
 * Provides specialized, type-safe data structures for domain-specific needs.
 */
/**
 * A fixed-size circular buffer that automatically discards the oldest elements.
 * Useful for tracking detection history without unbounded memory growth.
 *
 * @remarks
 * Refactored for better type safety and immutability.
 * T - The type of elements in the buffer.
 * N - The maximum size of the buffer.
 */
export declare class FixedRingBuffer<T, N extends number> {
    readonly maxSize: N;
    private items;
    /**
     * @param maxSize - The maximum number of elements the buffer can hold.
     */
    constructor(maxSize: N);
    /**
     * Adds one or more items to the front of the buffer, displacing the oldest.
     *
     * @param items - The items to add.
     */
    push(...items: T[]): void;
    /**
     * Returns a read-only snapshot of the current buffer contents.
     *
     * @returns A readonly array of items. Mutations will not affect the buffer.
     */
    toArray(): readonly T[];
    /**
     * Clears all items from the buffer.
     */
    clear(): void;
    /**
     * Returns the number of items currently in the buffer.
     */
    get length(): number;
}

// ===== types-docs/lib/domain/data-structures.test.d.ts =====

export {};

// ===== types-docs/lib/domain/musical-domain.d.ts =====

/**
 * Musical Domain
 *
 * Defines the canonical types and normalization logic for musical concepts
 * shared across the application. This module serves as the source of truth for
 * scientific pitch notation and accidental mapping.
 *
 * @remarks
 * All musical logic in the application follows the standards defined here to
 * ensure consistency between the audio engine, the notation renderer, and
 * the persistence layer.
 */
/**
 * Represents a pitch alteration in a canonical numeric format.
 *
 * @remarks
 * This numeric representation is used for internal calculations and
 * pitch-to-frequency mapping.
 *
 * **Canonical Values**:
 * - `-1`: Flat (b)
 * - `0`: Natural
 * - `1`: Sharp (#)
 *
 * @public
 */
export type CanonicalAccidental = -1 | 0 | 1;
/**
 * Normalizes various accidental representations to the canonical numeric format.
 *
 * @remarks
 * This function handles the variability of accidental representation in
 * different formats (MusicXML, user input, internal constants).
 *
 * **Supported Formats**:
 * - **Numeric**: -1 (flat), 0 (natural), 1 (sharp).
 * - **MusicXML Labels**: "flat", "natural", "sharp", "double-flat", "double-sharp".
 * - **Notation Symbols**: "b", "#", "##", "bb".
 * - **Nullability**: `undefined` are treated as `0` (natural).
 *
 * @param input - Accidental in any supported format.
 *
 * @returns A {@link CanonicalAccidental} (-1, 0, or 1).
 *
 * @throws {@link AppError} with code `DATA_VALIDATION_ERROR` if the input
 *         cannot be mapped to a known accidental.
 *
 * @example
 * ```ts
 * normalizeAccidental(1);        // returns 1
 * normalizeAccidental("#");      // returns 1
 * normalizeAccidental("flat");   // returns -1
 * ```
 *
 * @public
 */
export declare function normalizeAccidental(input: number | string | undefined): CanonicalAccidental;

// ===== types-docs/lib/domain/musical-types.d.ts =====

import type { CanonicalAccidental } from '@/lib/domain/musical-domain';
import type { AppError } from '@/lib/errors/app-error';
import type { PitchDetector } from '@/lib/pitch-detector';
/**
 * Represents the base name of a musical pitch (the white keys on a piano).
 *
 * @public
 */
export type PitchName = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
/**
 * Represents a specific pitch on the musical staff, including its octave and accidental.
 *
 * @remarks
 * Uses scientific pitch notation (SPN) for octave numbering.
 *
 * @public
 */
export interface Pitch {
    /** The letter name of the pitch (e.g., 'A', 'C'). */
    step: PitchName;
    /**
     * The octave number in scientific pitch notation (e.g., 4 for Middle C).
     *
     * **Violin Standard Tuning**:
     * - G3 (G string)
     * - D4 (D string)
     * - A4 (A string)
     * - E5 (E string)
     */
    octave: number;
    /**
     * The accidental for the pitch.
     *
     * @remarks
     * Expressed as a {@link CanonicalAccidental}: -1 for flat, 0 for natural, 1 for sharp.
     */
    alter: CanonicalAccidental;
}
/**
 * Represents the rhythmic duration of a note relative to a whole note.
 *
 * @remarks
 * Expressed as the denominator of the division of a whole note.
 *
 * **Standard Mappings**:
 * - `1`: Whole note (4 beats in 4/4)
 * - `2`: Half note (2 beats)
 * - `4`: Quarter note (1 beat)
 * - `6`: Dotted quarter note (1.5 beats)
 * - `8`: Eighth note (0.5 beats)
 * - `16`: Sixteenth note (0.25 beats)
 * - `32`: Thirty-second note (0.125 beats)
 *
 * @public
 */
export type NoteDuration = 1 | 2 | 4 | 6 | 8 | 16 | 32;
/**
 * Represents a single musical note, combining pitch, duration, and pedagogical metadata.
 *
 * @public
 */
export interface Note {
    /** The scientific pitch definition of the note. */
    pitch: Pitch;
    /** The rhythmic duration value. */
    duration: NoteDuration;
    /** Optional pedagogical annotations to assist the student during practice. */
    annotations?: {
        /** Suggested finger number (1-4). 0 or undefined for open strings. */
        fingerNumber?: 1 | 2 | 3 | 4;
        /** Suggested bowing direction ('up' for push, 'down' for pull). */
        bowDirection?: 'up' | 'down';
        /** Whether to show a visual warning flag (e.g., for difficult shifts or accidentals). */
        warningFlag?: boolean;
    };
}
/**
 * High-level categories for grouping musical exercises in the library.
 *
 * @public
 */
export type ExerciseCategory = 'Open Strings' | 'Scales' | 'Songs';
/**
 * Difficulty levels used for pedagogical progression and recommendations.
 *
 * @public
 */
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
/**
 * Metadata defining the musical properties required for score rendering.
 *
 * @remarks
 * This information is used by the MusicXML engine to create valid headers
 * and staff definitions compatible with OpenSheetMusicDisplay (OSMD).
 *
 * @public
 */
export interface ScoreMetadata {
    /** The clef used for the staff. Violin always uses 'G' (treble clef). */
    clef: 'G' | 'F' | 'C';
    /** The time signature of the piece. */
    timeSignature: {
        /** Number of beats per measure (numerator). */
        beats: number;
        /** The note value that represents one beat (denominator). */
        beatType: number;
    };
    /**
     * The key signature, represented as the number of sharps (positive) or flats (negative) in the circle of fifths.
     *
     * @example
     * - `2`: D Major / B Minor (F#, C#)
     * - `-1`: F Major / D Minor (Bb)
     * - `0`: C Major / A Minor
     */
    keySignature: number;
}
/**
 * Raw definition of an exercise, containing structured musical data.
 *
 * @remarks
 * This interface represents the "blueprint" of an exercise before it's converted
 * to visual MusicXML for rendering.
 *
 * @public
 */
export interface ExerciseData {
    /** Unique identifier for the exercise (UUID). */
    id: string;
    /** Human-readable display name. */
    name: string;
    /** Detailed description of the exercise's objective and technical focus. */
    description: string;
    /** The pedagogical category it belongs to (e.g., "Scales"). */
    category: ExerciseCategory;
    /** The intended difficulty level for student progression. */
    difficulty: Difficulty;
    /** Metadata required for rendering the musical score (clef, time signature, etc.). */
    scoreMetadata: ScoreMetadata;
    /** Ordered array of notes that make up the exercise. */
    notes: Note[];
    /** List of technical skills the student will improve (e.g., "Third Position"). */
    technicalGoals: string[];
    /** Human-readable estimated time to complete (e.g., "5 mins"). */
    estimatedDuration: string;
    /** The primary technique focus (e.g., "Legato", "Staccato", "Intonation"). */
    technicalTechnique: string;
    /** Whether this exercise is highlighted as a recommendation in the UI. */
    recommended?: boolean;
    /** Optional tempo range for the exercise. */
    tempoRange?: {
        /** Minimum tempo in BPM. */
        min: number;
        /** Maximum tempo in BPM. */
        max: number;
    };
}
/**
 * A fully-realized exercise including its visual MusicXML representation.
 *
 * @remarks
 * This is the final object used by the `PracticeStore` and `SheetMusic` components.
 *
 * @public
 */
export interface Exercise extends ExerciseData {
    /** The complete, generated MusicXML string for the exercise. */
    musicXML: string;
}
/**
 * Possible states for the Standalone Tuner.
 *
 * @remarks
 * Implements a Discriminated Union pattern to handle the complex lifecycle
 * of microphone acquisition and real-time pitch detection.
 *
 * **Lifecycle**:
 * 1. `IDLE`: Waiting for initialization.
 * 2. `INITIALIZING`: Requesting microphone access.
 * 3. `READY`: Audio pipeline is warm; listening.
 * 4. `DETECTED`: A stable pitch has been found.
 * 5. `ERROR`: Hardware or permission failure.
 *
 * @public
 */
export type TunerState = {
    /** Initial state before any action is taken. */
    kind: 'IDLE';
} | {
    /** State while acquiring microphone and setting up audio graph. */
    kind: 'INITIALIZING';
    /** Unique token for the current initialization attempt to prevent race conditions. */
    readonly sessionToken: number | string;
} | {
    /** State when audio is ready but no analysis results have been received. */
    kind: 'READY';
    /** Unique token for the current session. */
    readonly sessionToken: number | string;
} | {
    /** State when the engine is actively listening but signal strength/confidence is low. */
    kind: 'LISTENING';
    /** Unique token for the current session. */
    readonly sessionToken: number | string;
} | {
    /** State when a clear, confident pitch has been detected and mapped to a note. */
    kind: 'DETECTED';
    /** Detected frequency in Hz. */
    pitch: number;
    /** Scientific pitch name (e.g., "A4"). */
    note: string;
    /** Deviation in cents from the ideal frequency of the note. */
    cents: number;
    /** Detection confidence (0.0 to 1.0). */
    confidence: number;
    /** Unique token for the current session. */
    readonly sessionToken: number | string;
} | {
    /** Terminal or recoverable error state (e.g., permission denied). */
    kind: 'ERROR';
    /** Details of the application-level error encountered. */
    error: AppError;
};
/**
 * States for microphone permission handling.
 *
 * @remarks
 * - `PROMPT`: Browser hasn't asked for permissions yet.
 * - `GRANTED`: Access allowed.
 * - `DENIED`: Access blocked by user or system.
 *
 * @public
 */
export type PermissionState = 'PROMPT' | 'GRANTED' | 'DENIED';
/**
 * Interface representing the tuner store's state and available actions.
 *
 * @remarks
 * This store manages the entire lifecycle of the standalone violin tuner.
 *
 * @public
 */
export interface TunerStore {
    /**
     * Current reactive state with session tracking.
     *
     * @remarks
     * States with `sessionToken` prevent stale updates from previous sessions
     * during asynchronous initialization.
     */
    state: TunerState;
    /**
     * User's current microphone permission status.
     */
    permissionState: PermissionState;
    /**
     * The active pitch detection algorithm instance.
     */
    detector: PitchDetector | undefined;
    /**
     * List of audio input devices detected on the system.
     */
    devices: MediaDeviceInfo[];
    /**
     * ID of the device currently used for input. `undefined` uses the default system device.
     */
    deviceId: string | undefined;
    /**
     * Sensitivity of the input (0-100).
     *
     * @remarks
     * Maps to internal gain: `0 -\> 0x`, `50 -\> 1x`, `100 -\> 2x`.
     */
    sensitivity: number;
    /**
     * Web Audio AnalyserNode for real-time visualization (e.g., waveforms).
     */
    analyser: AnalyserNode | undefined;
    /**
     * Initializes the audio pipeline and requests hardware permissions.
     *
     * @remarks
     * **Concurrency Safety**:
     * - Multiple calls are idempotent: previous sessions are automatically invalidated.
     * - Uses an internal `initToken` to ensure only the latest attempt updates the state.
     *
     * **Transitions**:
     * - `IDLE` → `INITIALIZING` → `READY` (on success)
     * - `IDLE` → `INITIALIZING` → `ERROR` (on failure)
     *
     * @returns A promise that resolves when initialization is complete.
     */
    initialize: () => Promise<void>;
    /**
     * Resets the current state and attempts to re-initialize the audio hardware.
     *
     * @returns A promise that resolves when re-initialization is complete.
     */
    retry: () => Promise<void>;
    /**
     * Stops the tuner, invalidates pending sessions, and releases hardware resources.
     *
     * @returns A promise that resolves when cleanup is complete.
     */
    reset: () => Promise<void>;
    /**
     * Processes a raw frequency/confidence pair from the detector and updates the store state.
     *
     * @remarks
     * Implementation should include signal thresholding to filter out ambient noise.
     *
     * @param pitch - Detected frequency in Hz.
     * @param confidence - Detection confidence (0.0 to 1.0).
     */
    updatePitch: (pitch: number, confidence: number) => void;
    /**
     * Internal handler for processing detected pitch and updating state.
     * @internal
     */
    handleDetectedPitch: (params: {
        pitch: number;
        confidence: number;
        token: number | string;
    }) => void;
    /**
     * Transitions the tuner into the 'LISTENING' state.
     */
    startListening: () => void;
    /**
     * Transitions the tuner back to 'READY', pausing input analysis.
     */
    stopListening: () => void;
    /**
     * Refreshes the list of available audio input hardware from the browser.
     *
     * @returns A promise that resolves when the device list is updated.
     */
    loadDevices: () => Promise<void>;
    /**
     * Switches the active input source to a different device.
     *
     * @param deviceId - Unique ID of the new device.
     * @returns A promise that resolves when the switch is complete.
     */
    setDeviceId: (deviceId: string) => Promise<void>;
    /**
     * Adjusts the detector's input gain to improve sensitivity in quiet or noisy environments.
     *
     * @param sensitivity - Value from 0 to 100.
     */
    setSensitivity: (sensitivity: number) => void;
}

// ===== types-docs/lib/domain/practice-session.d.ts =====

import { NoteTechnique } from '../technique-types';
/**
 * Summary of technical performance for a note, focused on MVP priorities.
 */
export interface NoteTechniqueSummary {
    pitchStability: {
        settlingStdCents: number;
        globalStdCents: number;
    };
    resonance: {
        rmsBeatingScore: number;
    };
    attackRelease?: {
        attackTimeMs: number;
    };
    rhythm?: {
        onsetErrorMs: number;
    };
}
/**
 * Result of practicing a single note.
 * Can represent a note in progress or a completed one.
 */
export interface NoteResult {
    noteIndex: number;
    targetPitch: string;
    attempts: number;
    /** Optional because it's only available once the note is completed. */
    timeToCompleteMs?: number;
    averageCents: number;
    wasInTune: boolean;
    /** Full technique data if available, or summary for persistence. */
    technique?: NoteTechnique | NoteTechniqueSummary;
}
/**
 * Canonical model for a practice session.
 * Used for live tracking, analytics, and persistence.
 */
export interface PracticeSession {
    id: string;
    startTimeMs: number;
    endTimeMs: number;
    durationMs: number;
    exerciseId: string;
    exerciseName: string;
    mode: 'tuner' | 'practice';
    noteResults: NoteResult[];
    notesAttempted: number;
    notesCompleted: number;
    accuracy: number;
    averageCents: number;
}

// ===== types-docs/lib/domain/type-guards.d.ts =====

/**
 * Type Guards
 *
 * Provides type-safe narrowing functions for domain types.
 * These are used to validate data at runtime, especially when receiving
 * data from external sources or persistence.
 */
import type { Note, Exercise, Pitch } from './musical-types';
/**
 * Validates if an unknown value is a Pitch object.
 *
 * @param x - The value to check.
 * @returns True if x is a Pitch.
 */
export declare function isPitch(x: unknown): x is Pitch;
/**
 * Validates if an unknown value is a Note object.
 *
 * @param x - The value to check.
 * @returns True if x is a Note.
 */
export declare function isNote(x: unknown): x is Note;
/**
 * Validates if an unknown value is an Exercise object.
 *
 * @param x - The value to check.
 * @returns True if x is an Exercise.
 */
export declare function isExercise(x: unknown): x is Exercise;

// ===== types-docs/lib/errors/app-error.d.ts =====

/**
 * Defines a standardized application error structure to ensure consistent
 * error handling and reporting across the application.
 * @remarks This file introduces the `AppError` class, error severity levels,
 * standard error codes, and a utility `toAppError` to normalize caught exceptions.
 * Using a structured error format is crucial for robust observability and for
 * presenting consistent UI feedback to the user.
 */
/**
 * Defines the severity level of an error, which can be used to determine
 * the urgency and the scope of the impact.
 * - 'fatal': The entire application is in an unusable state.
 * - 'error': A specific feature or component is broken, but the rest of the app may be functional.
 * - 'warning': An unexpected condition that does not yet cause a failure but might indicate a problem.
 */
export type ErrorSeverity = 'fatal' | 'error' | 'warning';
/**
 * A standardized dictionary of error codes.
 * @remarks Using codes instead of raw messages allows for easier error tracking,
 * localization, and prevents sensitive information from leaking into logs or UI.
 */
export declare const ERROR_CODES: {
    readonly UNKNOWN: "UNKNOWN";
    readonly NOT_IMPLEMENTED: "NOT_IMPLEMENTED";
    readonly AUDIO_CONTEXT_FAILED: "AUDIO_CONTEXT_FAILED";
    readonly MIC_PERMISSION_DENIED: "MIC_PERMISSION_DENIED";
    readonly MIC_NOT_FOUND: "MIC_NOT_FOUND";
    readonly MIC_IN_USE: "MIC_IN_USE";
    readonly MIC_GENERIC_ERROR: "MIC_GENERIC_ERROR";
    readonly STATE_INVALID_TRANSITION: "STATE_INVALID_TRANSITION";
    readonly DATA_VALIDATION_ERROR: "DATA_VALIDATION_ERROR";
    readonly NOTE_PARSING_FAILED: "NOTE_PARSING_FAILED";
    readonly TECHNIQUE_MISSING: "TECHNIQUE_MISSING";
    readonly INVALID_EXERCISE: "INVALID_EXERCISE";
    readonly OSMD_INIT_FAILED: "OSMD_INIT_FAILED";
    readonly OSMD_RENDER_FAILED: "OSMD_RENDER_FAILED";
    readonly COMPONENT_RENDER_ERROR: "COMPONENT_RENDER_ERROR";
};
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
/**
 * Represents a serializable, structured application error.
 *
 * @remarks
 * This class extends the native `Error` but is designed to be plain-object-like
 * so it can be reliably stored in state management libraries (like Zustand) and
 * passed between client/server components. It includes a unique `id`, a standard
 * `code`, `severity`, and optional `context` for debuggability. The `cause`
 * property can hold the original exception that was caught.
 */
export declare class AppError extends Error {
    readonly id: string;
    readonly code: ErrorCode;
    readonly severity: ErrorSeverity;
    readonly context?: Record<string, unknown>;
    readonly cause?: unknown;
    constructor(params: {
        message: string;
        code?: ErrorCode;
        severity?: ErrorSeverity;
        context?: Record<string, unknown>;
        cause?: unknown;
    });
}
export declare function toAppError(err: unknown, fallbackCode?: ErrorCode, context?: Record<string, unknown>): AppError;

// ===== types-docs/lib/errors/app-error.test.d.ts =====

export {};

// ===== types-docs/lib/exercise-recommender.d.ts =====

import type { Exercise } from '@/lib/domain/musical-types';
import type { AnalyticsStore } from '@/stores/analytics-store';
/** Shorthand for user progress from the Analytics store. */
type UserProgress = AnalyticsStore['progress'];
/**
 * Pedagogical exercise recommender engine.
 *
 * @remarks
 * This function implements a heuristic-based logic designed to optimize
 * the student's learning path based on historical performance. It acts as
 * an automated tutor, ensuring the student is neither bored nor overwhelmed.
 *
 * **Recommendation Rules (in order of priority)**:
 * 1. **Persistence on Failure**: If the last exercise played had low accuracy (`< 80%`) and was attempted today, suggest trying it again to build muscle memory.
 * 2. **Review with Regression**: If a completed exercise has low accuracy (`< 70%`), suggest an easier exercise in the same category to reinforce fundamentals.
 * 3. **Progression**: If all exercises in the current difficulty are mastered, suggest the first exercise of the next level.
 * 4. **Discovery**: Suggest the first unplayed exercise in the current target difficulty.
 * 5. **Spaced Repetition**: Fallback to the oldest practiced exercise that wasn't played today.
 *
 * @param exercises - Array of all available exercises in the library.
 * @param userProgress - The user's historical progress, including attempt counts and best scores.
 * @param lastPlayedId - ID of the exercise practiced in the previous session for continuity.
 * @returns The recommended {@link Exercise}, or the first available one as a fallback. Returns `undefined` if the library is empty.
 *
 * @example
 * ```ts
 * const rec = getRecommendedExercise(allExercises, progress, lastId);
 * if (rec) console.log(`We recommend: ${rec.name}`);
 * ```
 *
 * @example
 * ```ts
 * const nextExercise = getRecommendedExercise(allExercises, progress, "scale_c_major");
 * console.log(`Recommended: ${nextExercise.name}`);
 * ```
 *
 * @public
 */
export declare function getRecommendedExercise(params: {
    exercises: Exercise[];
    userProgress: UserProgress;
    lastPlayedId?: string;
    difficultyFilter?: string;
}): Exercise | undefined;
export {};

// ===== types-docs/lib/exercises/categories/open-strings.d.ts =====

/**
 * OpenStringsExercises
 * Exercise definitions focused on playing open strings (G, D, A, E)
 * with a steady tone and correct posture.
 *
 * @remarks
 * These exercises are designed for absolute beginners to establish basic
 * bowing technique and ear training without the complexity of left-hand fingering.
 */
import type { ExerciseData } from '../types';
/**
 * List of beginner exercises for open strings.
 */
export declare const openStringsExercises: ExerciseData[];

// ===== types-docs/lib/exercises/categories/scales.d.ts =====

/**
 * ScaleExercises
 * Exercise definitions for fundamental violin scales across one octave.
 *
 * @remarks
 * Scale practice is essential for developing:
 * - Muscle memory for finger placements
 * - Intonation accuracy across strings
 * - String crossing technique
 * - Bow distribution and control
 *
 * This module follows the Suzuki method progression, starting with
 * tetrachords (4-note patterns) before progressing to full octaves.
 */
import type { ExerciseData } from '../types';
/**
 * Enhanced exercise data with violin-specific pedagogical information.
 */
interface ViolinExerciseData extends ExerciseData {
    /** Starting string for the exercise (G, D, A, or E) */
    startingString?: 'G' | 'D' | 'A' | 'E';
    /** Finger pattern for the exercise (e.g., "0-1-2-3" for open-1st-2nd-3rd finger) */
    fingerPattern?: string;
    /** Recommended tempo range in BPM */
    tempoRange?: {
        min: number;
        max: number;
    };
    /** Learning objectives for this specific exercise */
    learningObjectives?: string[];
}
/**
 * Beginner scale exercises focusing on tetrachords and fundamental patterns.
 * Follows a progressive pedagogical approach starting with single-string exercises.
 */
export declare const scalesExercises: readonly ViolinExerciseData[];
/**
 * Utility to get exercises by difficulty level.
 * Useful for progressive lesson planning.
 */
export declare const getExercisesByDifficulty: (difficulty: "Beginner" | "Intermediate" | "Advanced") => ViolinExerciseData[];
/**
 * Utility to get exercises by starting string.
 * Useful for focusing practice on specific strings.
 */
export declare const getExercisesByString: (string: "G" | "D" | "A" | "E") => ViolinExerciseData[];
export {};

// ===== types-docs/lib/exercises/categories/songs.d.ts =====

/**
 * SongExercises
 * Short musical excerpts from popular songs and traditional tunes.
 *
 * @remarks
 * These exercises allow students to apply their technical skills (intonation,
 * rhythm, string crossing) to recognizable melodies, increasing engagement
 * and musicality.
 */
import type { ExerciseData } from '../types';
/**
 * List of beginner exercises featuring song fragments.
 */
export declare const songsExercises: ExerciseData[];

// ===== types-docs/lib/exercises/index.d.ts =====

/**
 * Exercises
 * Main entry point for the exercises module.
 * This file aggregates raw exercise data from various categories,
 * processes them to generate MusicXML, and exports the final collection.
 */
import type { Exercise } from './types';
/**
 * A comprehensive collection of all exercises available in the application.
 *
 * @remarks
 * This array is used by the `PracticeMode` component to populate its selection
 * dropdown and by the store to load individual exercises.
 *
 * Exercises are processed once at module load time.
 */
export declare const allExercises: Exercise[];

// ===== types-docs/lib/exercises/musicxml-builder.d.ts =====

/**
 * MusicXMLBuilder
 * Provides logic for generating MusicXML 3.1 strings from structured exercise data.
 */
import type { ExerciseData } from './types';
/**
 * Generates a complete MusicXML string from an ExerciseData object.
 */
export declare const generateMusicXML: (exercise: ExerciseData) => string;

// ===== types-docs/lib/exercises/musicxml-builder.test.d.ts =====

export {};

// ===== types-docs/lib/exercises/types.d.ts =====

/**
 * ExerciseTypes
 * Shared type definitions for violin exercises, covering musical properties,
 * score metadata, and exercise data structures.
 */
export * from '@/lib/domain/musical-types';

// ===== types-docs/lib/exercises/utils.d.ts =====

/**
 * Utility functions for handling exercise data.
 */
import type { NoteDuration, Pitch, Exercise } from './types';
import { ExerciseStats } from '@/stores/progress.store';
/**
 * Calculates the duration of a note in milliseconds based on BPM.
 */
export declare const getDurationMs: (duration: NoteDuration, bpm?: number) => number;
/**
 * Parses a pitch string (e.g., "G#4", "Bb3") into a Pitch object.
 *
 * @remarks
 * Does not support double accidentals (##, bb) at this time.
 */
export declare const parsePitch: (pitchString: string) => Pitch;
/**
 * Parameters for filtering exercises.
 */
export interface ExerciseFilterParams {
    exercises: Exercise[];
    filter: {
        activeTab: string;
        difficulty?: string;
    };
    stats: Record<string, ExerciseStats>;
}
/**
 * Pure function to filter exercises based on tab and difficulty.
 */
export declare function filterExercises(params: ExerciseFilterParams): Exercise[];

// ===== types-docs/lib/exercises/utils.test.d.ts =====

export {};

// ===== types-docs/lib/exercises/validation.d.ts =====

import { Exercise } from './types';
/**
 * Validates an exercise for semantic correctness.
 * Throws AppError if validation fails.
 *
 * @param exercise - The exercise to validate.
 * @returns The validated exercise cast to Exercise type.
 */
export declare function validateExercise(exercise: unknown): Exercise;

// ===== types-docs/lib/export/progress-exporter.d.ts =====

import { PracticeSession } from '@/lib/domain/practice-session';
/**
 * Generates a CSV string from an array of practice sessions.
 *
 * @param sessions - The list of practice sessions to export.
 * @returns A formatted CSV string with headers.
 */
export declare function exportSessionsToCSV(sessions: PracticeSession[]): string;
/**
 * Triggers a browser download for the provided CSV content.
 *
 * @param content - The CSV string to download.
 * @param filename - The desired name of the file (e.g., "progress.csv").
 */
export declare function downloadCSV(content: string, filename: string): void;

// ===== types-docs/lib/feature-flags.d.ts =====

/**
 * Feature Flags Management System
 *
 * This module provides a centralized way to manage experimental features
 * and conditional code execution based on environment variables.
 */
/**
 * Categories of feature flags to define their maturity and lifecycle stage.
 */
export type FeatureFlagType = 'EXPERIMENTAL' | 'BETA' | 'STABLE' | 'UNSTABLE' | 'INTEGRATION' | 'PERFORMANCE' | 'UI_UX' | 'DEPRECATED';
/**
 * Detailed metadata for a feature flag.
 */
export interface FeatureFlagMetadata {
    name: string;
    key: string;
    type: FeatureFlagType;
    description: string;
    defaultValue: boolean;
    affectedFiles?: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    rollbackStrategy?: string;
    dependencies?: string[];
}
export declare const FEATURE_FLAGS_METADATA: {
    readonly FEATURE_AUDIO_WEB_WORKER: {
        readonly name: "FEATURE_AUDIO_WEB_WORKER";
        readonly key: "audioWebWorker";
        readonly type: "PERFORMANCE";
        readonly description: "Offload audio processing to a Web Worker for 60Hz+ analysis.";
        readonly defaultValue: false;
        readonly riskLevel: "HIGH";
        readonly affectedFiles: ["lib/pitch-detector.ts", "lib/note-stream.ts", "public/workers/audio-processor.worker.ts"];
        readonly rollbackStrategy: "Fallback to main-thread audio processing.";
    };
    readonly FEATURE_SOCIAL_PRACTICE_ROOMS: {
        readonly name: "FEATURE_SOCIAL_PRACTICE_ROOMS";
        readonly key: "socialPracticeRooms";
        readonly type: "EXPERIMENTAL";
        readonly description: "Real-time synchronization for group practice or teacher-led sessions.";
        readonly defaultValue: false;
        readonly riskLevel: "HIGH";
        readonly affectedFiles: [];
        readonly rollbackStrategy: "Disable real-time synchronization features.";
    };
    readonly FEATURE_TELEMETRY_ACCURACY: {
        readonly name: "FEATURE_TELEMETRY_ACCURACY";
        readonly key: "telemetryAccuracy";
        readonly type: "INTEGRATION";
        readonly description: "Collect anonymous pitch detection accuracy data for optimization.";
        readonly defaultValue: true;
        readonly riskLevel: "LOW";
        readonly affectedFiles: ["lib/practice/session-runner.ts"];
        readonly rollbackStrategy: "Disable telemetry logging.";
    };
};
export type FeatureFlagName = keyof typeof FEATURE_FLAGS_METADATA;
/**
 * Service for querying and validating feature flags.
 * Exported to support dynamic testing and isolation.
 */
export declare class FeatureFlagsManager {
    /**
     * Resolves the value of a feature flag from environment variables.
     * Uses manual switch-case to ensure static inlining by Next.js compiler.
     */
    private getClientValue;
    private getFeatureMapping;
    private lookupFlagValue;
    isEnabled(flagName: FeatureFlagName): boolean;
    get<T = unknown>(flagName: FeatureFlagName, defaultValue?: T): T | string | boolean | undefined;
    getAll(): Record<string, boolean>;
    validateFlags(): {
        valid: boolean;
        errors: string[];
    };
    private checkDependencies;
}
export declare const featureFlags: FeatureFlagsManager;
export declare function useFeatureFlag(flagName: FeatureFlagName): boolean;
export declare function useFeatureFlags(flagNames: FeatureFlagName[]): Record<string, boolean>;

// ===== types-docs/lib/feature-flags.test.d.ts =====

export {};

// ===== types-docs/lib/infrastructure/audio-manager.d.ts =====

/**
 * Audio Manager
 *
 * Infrastructure layer for managing Web Audio API resources.
 * Encapsulates the complexity of initialization, resource tracking, and cleanup.
 */
/**
 * Collection of Web Audio resources managed by the {@link AudioManager}.
 *
 * @public
 */
export interface AudioResources {
    /** The primary Web Audio API context. */
    context: AudioContext;
    /** The raw media stream from the input device (microphone). */
    stream: MediaStream;
    /** The analyser node used for pitch detection and visualization. */
    analyser: AnalyserNode;
    /** Optional gain node for sensitivity adjustment. */
    gainNode?: GainNode;
}
/**
 * Service for managing hardware-level Web Audio API resources.
 *
 * @remarks
 * This class encapsulates the lifecycle of the `AudioContext` and `MediaStream`.
 * It provides a singleton interface to ensure that only one microphone handle
 * is active at any given time, preventing resource leaks and hardware conflicts.
 *
 * **Resource Lifecycle**:
 * 1. **Initialize**: Acquires microphone access and creates the audio graph.
 * 2. **Cleanup**: Disconnects all nodes and closes the audio context.
 *
 * @public
 */
export declare class AudioManager {
    private context;
    private stream;
    private analyser;
    private source;
    private gainNode;
    /**
     * Initializes the audio pipeline.
     *
     * @param deviceId - Optional ID of the microphone to use.
     * @returns A promise that resolves to the initialized audio resources.
     * @throws AppError if microphone access is denied or hardware fails.
     */
    initialize(deviceId?: string): Promise<AudioResources>;
    /**
     * Releases all audio resources and closes the context.
     */
    cleanup(): Promise<void>;
    /**
     * Retrieves the current Web Audio context.
     * @returns The active `AudioContext` or `undefined` if not initialized.
     */
    getContext(): AudioContext | undefined;
    /**
     * Retrieves the raw microphone media stream.
     * @returns The active `MediaStream` or `undefined` if not initialized.
     */
    getStream(): MediaStream | undefined;
    /**
     * Retrieves the shared AnalyserNode for signal analysis.
     * @returns The active `AnalyserNode` or `undefined` if not initialized.
     */
    getAnalyser(): AnalyserNode | undefined;
    /**
     * Adjusts the input sensitivity by setting the gain node value.
     *
     * @param value - Gain value (usually 0.0 to 2.0).
     */
    setGain(value: number): void;
    /**
     * Checks if the audio pipeline is currently running.
     * @returns `true` if context is initialized and not closed.
     */
    isActive(): boolean;
    private acquireMicStream;
    private getAudioConstraints;
    private initializeContextNodes;
    private buildAudioGraph;
    private getAudioResources;
    private stopMediaTracks;
    private disconnectAudioNodes;
    private closeAudioContext;
    private resetResourceReferences;
}
/**
 * Singleton instance of the AudioManager to be used across the application.
 */
export declare const audioManager: AudioManager;

// ===== types-docs/lib/infrastructure/audio-manager.test.d.ts =====

export {};

// ===== types-docs/lib/live-observations.d.ts =====

import { DetectedNote } from './practice-core';
import { Observation } from './technique-types';
/**
 * Calculates real-time technical observations based on a history of recent detections.
 *
 * @remarks
 * Processes high-frequency pitch data into actionable pedagogical advice.
 * Limited to the top 2 most relevant observations by severity and confidence.
 *
 * @param recentDetections - Chronological detections (newest first).
 * @param targetPitch - Target scientific pitch name (e.g., "A4").
 * @returns Prioritized {@link Observation} objects.
 *
 * @public
 */
export declare function calculateLiveObservations(recentDetections: readonly DetectedNote[], targetPitch: string): Observation[];

// ===== types-docs/lib/live-observations.test.d.ts =====

export {};

// ===== types-docs/lib/music-data.d.ts =====

/**
 * LegacyMusicData
 * Contains legacy exercise definitions and interfaces.
 *
 * @deprecated This module is maintained for backward compatibility.
 * Use the new exercise system in `lib/exercises/` for new features.
 */
import type { Exercise } from './exercises/types';
/**
 * Represents a single musical note in the legacy system.
 * @internal
 */
interface LegacyNote {
    /** Note name with octave (e.g., "G4"). */
    pitch: string;
    /** Rhythmic duration (e.g., "quarter"). */
    duration: string;
    /** The measure number where this note resides. */
    measure: number;
}
/**
 * Interface for the legacy Exercise object.
 *
 * @deprecated Use Exercise from `\@/lib/exercises/types` instead.
 * This type will be removed in v2.0.
 */
export interface LegacyExercise {
    /** Unique identifier. */
    id: string;
    /** Human-readable name. */
    name: string;
    /** List of notes in the exercise. */
    notes: LegacyNote[];
    /** Pre-generated MusicXML string. */
    musicXML: string;
}
/**
 * Example legacy exercise for G Major Scale.
 */
export declare const G_MAJOR_SCALE_EXERCISE: LegacyExercise;
/**
 * Adapts a legacy exercise into the modern Exercise format.
 */
export declare function adaptLegacyExercise(legacy: LegacyExercise): Exercise;
export {};

// ===== types-docs/lib/note-segmenter.d.ts =====

import { TechniqueFrame, MusicalNoteName, TimestampMs, NoteSegment } from './technique-types';
/**
 * Configuration options for the `NoteSegmenter`.
 */
export interface SegmenterOptions {
    /** The minimum RMS value to be considered a potential signal. */
    minRms: number;
    /** The maximum RMS value to be considered silence. */
    maxRmsSilence: number;
    /** The minimum confidence score from the pitch detector to trust the note name. */
    minConfidence: number;
    /** The duration in milliseconds a signal must be present to trigger an `ONSET` event. */
    onsetDebounceMs: number;
    /** The duration in milliseconds a signal must be absent to trigger an `OFFSET` event. */
    offsetDebounceMs: number;
    /** The duration in milliseconds a new pitch must be stable to trigger a `NOTE_CHANGE`. */
    noteChangeDebounceMs: number;
    /** The duration in milliseconds to tolerate pitch dropouts if RMS is still high. */
    pitchDropoutToleranceMs: number;
    /** The duration of silence that resets the noisy gap buffer. */
    noisyGapResetMs: number;
    /** Maximum number of frames to keep in the gap buffer. */
    maxGapFrames: number;
    /** Maximum number of frames to keep in the note buffer. */
    maxNoteFrames: number;
}
/**
 * Validates the provided options for the NoteSegmenter.
 * @throws Error if options are invalid or inconsistent.
 */
export declare function validateOptions(options: SegmenterOptions): void;
/**
 * Possible segmenter events emitted during note detection.
 */
export type SegmenterEvent = {
    type: 'ONSET';
    timestamp: TimestampMs;
    noteName: MusicalNoteName;
    gapFrames: ReadonlyArray<TechniqueFrame>;
} | {
    type: 'OFFSET';
    timestamp: TimestampMs;
    segment: NoteSegment;
} | {
    type: 'NOTE_CHANGE';
    timestamp: TimestampMs;
    noteName: MusicalNoteName;
    segment: NoteSegment;
};
/**
 * A stateful class that segments an audio stream into musical notes.
 */
export declare class NoteSegmenter {
    private readonly options;
    private state;
    private frames;
    private gapFrames;
    private lastSignalTime;
    private segmentCount;
    constructor(options?: Partial<SegmenterOptions>);
    processFrame(frame: TechniqueFrame): SegmenterEvent | undefined;
    reset(): void;
    private isSignal;
    private handleSilenceState;
    private processSilenceSignal;
    private evaluateOnsetEligibility;
    private resetSilenceOnThreshold;
    private triggerOnset;
    private initializeNoteState;
    private prepareFramesForOnset;
    private handleNoteState;
    private detectNoteOffset;
    private shouldTriggerOffsetTimer;
    private resetOffsetTimer;
    private handleOffsetTimer;
    private triggerOffset;
    private detectNoteChange;
    private isDifferentNoteDetected;
    private resetPendingNoteChange;
    private processPendingNoteChange;
    private evaluateNoteChangeEligibility;
    private triggerNoteChange;
    private createSegment;
    private assembleSegment;
    private pushToBuffer;
}

// ===== types-docs/lib/note-segmenter.test.d.ts =====

export {};

// ===== types-docs/lib/note-stream.d.ts =====

/**
 * This file creates a declarative pipeline using `iter-tools` to process raw
 * pitch detection events into a stream of well-defined `PracticeEvent`s.
 * This decouples the audio input source from the state management logic.
 */
import { type PracticeEvent, type TargetNote } from '@/lib/practice-core';
import { AudioLoopPort, PitchDetectionPort } from './ports/audio.port';
import { NoteSegment, PitchedFrame } from './technique-types';
import type { Exercise } from './exercises/types';
/**
 * The raw data yielded from the pitch detector on each animation frame.
 */
export interface RawPitchEvent {
    /** The detected fundamental frequency in Hertz. */
    pitchHz: number;
    /** The pitch detector's confidence in the result (0-1). */
    confidence: number;
    /** The Root Mean Square (volume) of the audio buffer. */
    rms: number;
    /** The timestamp when the event was generated. */
    timestamp: number;
}
/**
 * Configuration options for the note stream pipeline.
 */
export interface NoteStreamOptions {
    /** The minimum RMS (volume) to consider as a valid signal. */
    minRms: number;
    /** The minimum confidence score from the pitch detector to trust the result. */
    minConfidence: number;
    /** The allowable pitch deviation in cents for a note to be considered a match. */
    centsTolerance: number;
    /** The duration in milliseconds a note must be held to be considered "matched". */
    requiredHoldTime: number;
    /** The full exercise object, used for rhythm analysis. */
    exercise?: Exercise;
    /** The start time of the session, used as a reference for rhythm calculations. */
    sessionStartTime?: number;
    /** The beats per minute (BPM) of the exercise, for rhythm analysis. */
    bpm: number;
}
/**
 * Immutable snapshot of pipeline context.
 * Captured once at pipeline creation to prevent state drift.
 */
export interface PipelineContext {
    readonly targetNote: TargetNote | undefined;
    readonly currentIndex: number;
    readonly sessionStartTime: number;
}
/** @internal */
export declare const DEFAULT_NOTE_STREAM_OPTIONS: NoteStreamOptions;
/**
 * Creates an async iterable of raw pitch events using audio ports.
 */
export declare function createRawPitchStream(params: {
    audioLoop: AudioLoopPort;
    detector: PitchDetectionPort;
    signal: AbortSignal;
}): AsyncGenerator<RawPitchEvent>;
export declare function isValidMatch(params: {
    target: TargetNote;
    segment: NoteSegment;
    pitchedFrames: PitchedFrame[];
    options: NoteStreamOptions;
}): boolean;
/**
 * Creates a practice event processing pipeline with immutable context.
 *
 * @param params - Configuration parameters for the pipeline.
 * @returns An `AsyncIterable` that yields `PracticeEvent` objects.
 *
 * @remarks
 * This design prevents context drift during async iteration.
 * When the exercise note changes, create a new pipeline.
 */
export declare function createPracticeEventPipeline(params: {
    rawPitchStream: AsyncIterable<RawPitchEvent>;
    context: PipelineContext;
    options: (Partial<NoteStreamOptions> & {
        exercise: Exercise;
    }) | (() => NoteStreamOptions);
    signal: AbortSignal;
}): AsyncIterable<PracticeEvent>;

// ===== types-docs/lib/note-stream.test.d.ts =====

export {};

// ===== types-docs/lib/observability/logger.d.ts =====

/**
 * Provides a centralized logging service for the application.
 * @remarks This logger wraps the native `console` object, providing a consistent
 * interface for logging structured data. In a development environment, it enhances
 * readability by color-coding log levels. In production, this module can be
 * extended to send logs to a dedicated observability service (like Sentry,
 * Datadog, or an OpenTelemetry collector) without changing the code at the
 * call sites.
 */
import { ERROR_CODES } from '@/lib/errors/app-error';
/**
 * A simple, structured logger instance.
 * @remarks It provides methods for different log levels (`debug`, `info`, `warn`, `error`).
 * The `error` method is specifically designed to work with `AppError`, ensuring
 * all caught exceptions are logged in a standardized format.
 */
export declare const logger: {
    debug: (msg: string, context?: Record<string, unknown>) => void;
    info: (msg: string, context?: Record<string, unknown>) => void;
    warn: (msg: string, context?: Record<string, unknown>) => void;
    /**
     * Logs a structured error.
     * @param payload - Can be a simple string, or a structured object containing
     * the error instance, a message, and additional context.
     */
    error: (payload: string | {
        msg: string;
        err: unknown;
        code?: (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
        context?: Record<string, unknown>;
    }) => void;
};

// ===== types-docs/lib/observability/pitch-debug.d.ts =====

export type PitchDebugEvent = {
    stage: 'raw_audio';
    rms: number;
    timestamp: number;
} | {
    stage: 'yin_silent';
    rms: number;
    threshold: number;
    timestamp: number;
} | {
    stage: 'yin_no_pitch';
    rms: number;
    confidence: number;
    timestamp: number;
} | {
    stage: 'yin_out_of_range';
    pitchHz: number;
    minHz: number;
    maxHz: number;
    timestamp: number;
} | {
    stage: 'yin_detected';
    pitchHz: number;
    confidence: number;
    rms: number;
    timestamp: number;
} | {
    stage: 'quality_rejected';
    reason: 'low_rms' | 'low_confidence' | 'unpitched';
    rms: number;
    confidence: number;
    noteName: string;
    timestamp: number;
} | {
    stage: 'quality_passed';
    noteName: string;
    cents: number;
    rms: number;
    confidence: number;
    timestamp: number;
} | {
    stage: 'segmenter_frame';
    segmenterState: 'SILENCE' | 'NOTE';
    isSignal: boolean;
    isSilence: boolean;
    timestamp: number;
} | {
    stage: 'segmenter_event';
    eventType: 'ONSET' | 'OFFSET' | 'NOTE_CHANGE';
    noteName: string;
    timestamp: number;
} | {
    stage: 'match_check';
    detectedNote: string;
    targetNote: string;
    cents: number;
    centsTolerance: number;
    durationMs: number;
    requiredHoldTime: number;
    passed: boolean;
    timestamp: number;
};
type DebugListener = (event: PitchDebugEvent) => void;
export declare const pitchDebugBus: {
    emit: (event: PitchDebugEvent) => void;
    subscribe: (listener: DebugListener) => () => void;
};
export {};

// ===== types-docs/lib/persistence/legacy-types.d.ts =====

/** Sesión tal como se guardaba antes de la migración v3. */
export interface LegacySessionV2 {
    duration?: number;
    startTime?: string | Date;
    endTime?: string | Date;
    durationMs?: number;
    startTimeMs?: number;
    endTimeMs?: number;
    noteResults?: LegacyNoteResultV2[];
    [key: string]: unknown;
}
/** NoteResult antes de la migración. */
export interface LegacyNoteResultV2 {
    timeToComplete?: number;
    timeToCompleteMs?: number;
    [key: string]: unknown;
}
/** Achievement antes de la migración. */
export interface LegacyAchievementV2 {
    unlockedAt?: string | Date;
    unlockedAtMs?: number;
    [key: string]: unknown;
}
/** ExerciseStats antes de la migración. */
export interface LegacyExerciseStatsV2 {
    fastestCompletion?: number;
    fastestCompletionMs?: number;
    lastPracticed?: string | Date;
    lastPracticedMs?: number;
    [key: string]: unknown;
}
/** Estado completo persistido del facade antes de migraciones. */
export interface LegacyPersistedFacadeState {
    sessions?: LegacySessionV2[];
    progress?: {
        achievements?: LegacyAchievementV2[];
        exerciseStats?: Record<string, LegacyExerciseStatsV2>;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

// ===== types-docs/lib/persistence/migrator.d.ts =====

/**
 * Type-safe persistence migration utilities.
 */
export type MigrationFn<T = unknown> = (state: T) => T;
export interface MigratorConfig<T> {
    [version: number]: MigrationFn<T>;
}
/**
 * Creates a declarative migrator for Zustand's persist middleware.
 *
 * @example
 * ```ts
 * const migrator = createMigrator({
 *   1: (state) => ({ ...state, newField: 'default' }),
 *   2: (state) => ({ ...state, schemaVersion: 2 })
 * });
 * ```
 */
export declare function createMigrator<T>(config: MigratorConfig<T>): (persistedState: unknown, version: number) => T;

// ===== types-docs/lib/persistence/persistence-core.d.ts =====

import { z } from 'zod';
/**
 * Serializes and compresses a value for local storage.
 */
export declare function serializeAndCompress(value: unknown): string;
/**
 * Decompresses and deserializes a value from local storage.
 */
export declare function decompressAndDeserialize(val: string): unknown;
/**
 * Validates and merges persisted state with current state.
 */
export declare function validateAndMerge<T>(schema: z.ZodType<T>, persistedState: unknown, currentState: T, options: {
    name: string;
    merge?: (persisted: T, current: T) => T;
}): T;

// ===== types-docs/lib/persistence/storage-types.d.ts =====

/** Valor deserializado desde el storage comprimido. Puede ser null si no existe. */
export type DeserializedStorageValue = Record<string, unknown> | null | undefined;

// ===== types-docs/lib/persistence/validated-persist.d.ts =====

import { StateCreator } from 'zustand';
import { PersistOptions } from 'zustand/middleware';
import { z } from 'zod';
/**
 * Wrapper for Zustand's persist middleware that adds Zod validation.
 *
 * @remarks
 * Uses internal type casting for the state creator to handle complex mutator
 * array types from Zustand's middleware.
 */
export declare const validatedPersist: <T>(schema: z.ZodType<T>, config: StateCreator<T, any, any>, options: PersistOptions<T, any>) => StateCreator<T, any, any>;

// ===== types-docs/lib/pitch-detector.d.ts =====

/**
 * Pure JavaScript pitch detection using the YIN algorithm.
 * No external dependencies - optimized for violin pitch detection.
 *
 * The YIN algorithm is considered the gold standard for monophonic pitch detection
 * and is particularly well-suited for musical instruments like the violin.
 *
 * Reference: "YIN, a fundamental frequency estimator for speech and music"
 * by Alain de Cheveigné and Hideki Kawahara (2002)
 */
export interface PitchDetectionResult {
    /** Detected frequency in Hz (0 if no pitch detected) */
    pitchHz: number;
    /** Confidence level from 0.0 to 1.0 */
    confidence: number;
}
/**
 * Pure JavaScript pitch detector optimized for violin.
 * Uses the YIN algorithm for accurate fundamental frequency detection.
 *
 * @remarks
 * This class encapsulates the YIN algorithm implementation and its configuration.
 * It is designed to be instantiated once per audio stream and reused for each audio buffer.
 * The core logic is based on the original paper by de Cheveigné and Kawahara.
 */
export declare class PitchDetector {
    private readonly sampleRate;
    /**
     * The minimum frequency we care about (in Hz).
     * For violin, the lowest note is G3 at ~196 Hz, but we go a bit lower for safety.
     */
    static readonly DEFAULT_MIN_FREQUENCY = 180;
    private readonly MIN_FREQUENCY;
    /**
     * The maximum frequency we care about (in Hz).
     * For violin, the practical upper limit is E7 at ~2637 Hz.
     * We set this to 3000 Hz by default to comfortably support the full professional range.
     */
    private MAX_FREQUENCY;
    /**
     * The threshold for the YIN algorithm.
     * Lower values = more strict (fewer false positives, might miss quiet notes)
     * Higher values = more lenient (more detections, but less reliable)
     * 0.1 is a good balance for musical instruments.
     */
    static readonly DEFAULT_YIN_THRESHOLD = 0.1;
    private readonly YIN_THRESHOLD;
    /**
     * The default threshold for the Root Mean Square (RMS) calculation.
     * This value is used to determine if there's enough signal to attempt pitch detection.
     * An RMS value below this threshold is considered silence.
     */
    private readonly DEFAULT_RMS_THRESHOLD;
    /**
     * Constructs a new PitchDetector instance.
     *
     * @param sampleRate - The sample rate of the audio context in which the detector will be used.
     * @param maxFrequency - Optional maximum frequency threshold (defaults to 3000 Hz).
     * @throws Will throw an error if the sample rate is not a positive number.
     */
    constructor(sampleRate: number, maxFrequency?: number);
    /**
     * Detects the pitch of an audio buffer using the full YIN algorithm.
     *
     * @remarks
     * This is the core method of the class. It processes a raw audio buffer and returns the
     * detected frequency and a confidence level. For performance, it's recommended to use
     * `detectPitchWithValidation` to avoid running the algorithm on silent buffers.
     *
     * @param buffer - A `Float32Array` of raw audio data.
     * @returns A `PitchDetectionResult` object. If no pitch is detected, `pitchHz` and `confidence` will be 0.
     */
    detectPitch(buffer: Float32Array): PitchDetectionResult;
    private executeYinAnalysis;
    private validateAndRefineYinResult;
    /**
     * Calculates the Root Mean Square (RMS) of an audio buffer, which represents its volume.
     *
     * @param buffer - The audio data to analyze.
     * @returns The RMS value, a non-negative number.
     */
    calculateRMS(buffer: Float32Array): number;
    /**
     * Utility method to detect if there's enough signal to attempt pitch detection.
     *
     * @remarks
     * This is used as a performance optimization to avoid running the expensive YIN algorithm
     * on buffers that are essentially silent.
     *
     * @param buffer - The audio data to check.
     * @param threshold - The RMS threshold above which a signal is considered present.
     * @returns `true` if the buffer's RMS exceeds the threshold, `false` otherwise.
     * @defaultValue `threshold` is `this.DEFAULT_RMS_THRESHOLD`.
     */
    hasSignal(buffer: Float32Array, threshold?: number): boolean;
    /**
     * A wrapper around `detectPitch` that first validates if the signal is strong enough.
     *
     * @remarks
     * This is the recommended method for real-time pitch detection, as it prevents
     * unnecessary computation on silent audio frames.
     *
     * @param buffer - The audio data to analyze.
     * @param rmsThreshold - The RMS threshold to use for the signal check.
     * @returns A `PitchDetectionResult`. If the signal is below the threshold, it returns a result indicating no pitch.
     * @defaultValue `rmsThreshold` is `this.DEFAULT_RMS_THRESHOLD`.
     */
    detectPitchWithValidation(buffer: Float32Array, rmsThreshold?: number): PitchDetectionResult;
    /**
     * Gets the sample rate the detector was configured with.
     * Refactored for range validation.
     * @returns The sample rate in Hz.
     */
    getSampleRate(): number;
    /**
     * Gets the effective frequency range the detector is configured to find.
     * @returns An object containing the min and max frequencies in Hz.
     */
    getFrequencyRange(): {
        min: number;
        max: number;
    };
    /**
     * Updates the maximum frequency threshold for pitch detection.
     *
     * @param maxHz - Maximum frequency in Hz (must be \> MIN_FREQUENCY and \<= 20000)
     * @throws AppError - CODE: DATA_VALIDATION_ERROR if out of valid range
     *
     * @example
     * detector.setMaxFrequency(2637);  // ✅ E7 for violin
     * detector.setMaxFrequency(-100);  // ❌ Throws AppError
     * detector.setMaxFrequency(25000); // ❌ Throws AppError (above human hearing)
     */
    setMaxFrequency(maxHz: number): void;
    private calculateSearchSize;
    private refineAndValidatePitch;
    private isFrequencyInRange;
    /** Step 1: Difference function */
    private difference;
    private calculateSquaredDifferenceSum;
    /** Step 2: Cumulative mean normalized difference function */
    private cumulativeMeanNormalizedDifference;
    /** Step 3: Absolute threshold */
    private absoluteThreshold;
    private findFirstBelowThreshold;
    private localMinimum;
    private findGlobalMinimum;
    /** Step 4: Parabolic interpolation */
    private parabolicInterpolation;
    private isAtSearchEdge;
    private calculateParabolicCorrection;
}
/**
 * Helper function to create a PitchDetector from a Web Audio API `AudioContext`.
 *
 * @remarks
 * This is a convenience factory function that extracts the correct sample rate from
 * the audio context, ensuring the `PitchDetector` is properly configured.
 *
 * @param audioContext - The `AudioContext` of the current audio pipeline.
 * @returns A new, correctly configured `PitchDetector` instance.
 */
export declare function createPitchDetectorFromContext(audioContext: AudioContext): PitchDetector;
/**
 * Factory function to create a PitchDetector instance based on difficulty.
 *
 * @param difficulty - The difficulty level of the exercise.
 * @param sampleRate - The audio sample rate.
 * @returns A PitchDetector instance configured for the difficulty.
 */
export declare function createPitchDetectorForDifficulty(difficulty: 'Beginner' | 'Intermediate' | 'Advanced', sampleRate: number): PitchDetector;

// ===== types-docs/lib/pitch-detector.test.d.ts =====

export {};

// ===== types-docs/lib/ports/audio.port.d.ts =====

import { PitchDetectionResult } from '../pitch-detector';
/**
 * Port for retrieving raw audio frames from an input source.
 *
 * @remarks
 * This interface abstracts the source of audio data (e.g., Web Audio AnalyserNode,
 * File API, or synthetic generators), facilitating testing and platform independence.
 *
 * **Concurrency Note**: Implementations must ensure that `getFrame()` is reentrant-safe
 * or explicitly documented as single-threaded if used in a Web Worker context.
 *
 * @public
 */
export interface AudioFramePort {
    /**
     * Captures and retrieves the next available frame of audio data.
     *
     * @remarks
     * **Side Effects**: This method typically performs a side-effect by reading
     * from a live hardware buffer (e.g., via `getFloatTimeDomainData`).
     *
     * **Performance & Memory**:
     * For performance reasons, many implementations (like {@link WebAudioFrameAdapter})
     * will return a reference to a pre-allocated internal buffer. Consumers should
     * **not** mutate this buffer and should copy the data (e.g., via `.slice()`)
     * if it needs to be persisted across multiple frames.
     *
     * **Signal Characteristics**:
     * The returned buffer contains PCM samples as 32-bit floats, typically
     * normalized in the range `[-1.0, 1.0]`.
     *
     * @returns A {@link Float32Array} of PCM samples.
     */
    captureFrame(): Float32Array;
    /**
     * The sample rate of the audio stream in Hz (e.g., 44100).
     *
     * @remarks
     * This value is critical for accurate pitch detection algorithms that rely on
     * time-frequency transformations. It is assumed to be constant for the duration
     * of the port's lifecycle.
     */
    readonly sampleRate: number;
}
/**
 * Port for pitch detection and signal analysis.
 *
 * @remarks
 * Encapsulates the logic for extracting musical information from raw audio frames.
 *
 * **Statelessness**:
 * Implementations should ideally be stateless or handle internal state such that
 * detections are consistent and re-entrant.
 *
 * @public
 */
export interface PitchDetectionPort {
    /**
     * Detects the pitch and confidence of a given audio frame.
     *
     * @remarks
     * **Performance**:
     * The detection algorithm's complexity (e.g., YIN, McLeod, FFT-based) determines
     * the latency of this call. High-frequency pipelines (e.g., 60Hz) should
     * monitor execution time to avoid dropping frames or causing UI stutter.
     *
     * **Error Handling & Gating**:
     * This method should not throw. If detection fails or the signal is too weak,
     * it should return a result with `confidence: 0` and `pitchHz: 0` (or `NaN`).
     *
     * @param frame - The raw PCM audio samples to analyze.
     * @returns A {@link PitchDetectionResult} containing frequency (Hz) and confidence level (0.0 to 1.0).
     */
    detect(frame: Float32Array): PitchDetectionResult;
    /**
     * Calculates the Root Mean Square (RMS) of the frame, representing its volume/intensity.
     *
     * @remarks
     * RMS provides a more stable representation of perceived loudness than peak amplitude.
     * Useful for noise gating and onset detection.
     *
     * @param frame - The raw audio samples.
     * @returns The calculated RMS value, normalized between 0.0 (silence) and 1.0 (full scale).
     */
    calculateRMS(frame: Float32Array): number;
}
/**
 * Port for managing an asynchronous audio processing loop.
 *
 * @remarks
 * Standardizes the execution of real-time audio analysis. This port replaces manual
 * `requestAnimationFrame` or `setInterval` with a managed lifecycle that
 * respects an {@link AbortSignal}.
 *
 * @public
 */
export interface AudioLoopPort {
    /**
     * Starts the high-frequency audio processing loop.
     *
     * @remarks
     * The loop execution is tied to the provided `signal`. Once the signal is aborted,
     * the loop must terminate promptly and resolve the returned promise.
     *
     * @param onFrame - A callback executed for each new frame delivered by the hardware/source.
     * @param signal - An {@link AbortSignal} to gracefully terminate the loop.
     * @returns A promise that resolves when the loop has stopped.
     *
     * @example
     * ```ts
     * const controller = new AbortController();
     * await loopPort.start((frame) => {
     *   const result = detector.detect(frame);
     *   if (result.confidence > 0.9) {
     *     console.log(`Frequency: ${result.pitchHz.toFixed(1)} Hz`);
     *   }
     * }, controller.signal);
     * ```
     *
     * @throws Error - If the loop fails to start or encounters a fatal hardware error.
     */
    start(onFrame: (frame: Float32Array) => void, signal: AbortSignal): Promise<void>;
}

// ===== types-docs/lib/ports/score-view.port.d.ts =====

/**
 * Port for managing the visual representation of a musical score.
 *
 * @remarks
 * This interface abstracts the underlying sheet music rendering engine (e.g., OSMD, VexFlow, SVG),
 * allowing the application logic to control the visual state without being coupled to a specific
 * library's API or DOM structure.
 *
 * @public
 */
export interface ScoreViewPort {
    /**
     * Indicates if the score view is initialized and ready for interaction.
     */
    readonly isReady: boolean;
    /**
     * Synchronizes the visual state of the score (cursor, highlights, scroll) with the current practice note.
     *
     * @param noteIndex - The index of the note in the exercise to highlight/focus.
     *
     * @remarks
     * This method should encapsulate:
     * 1. Moving the visual cursor to the correct position.
     * 2. Highlighting the current note.
     * 3. Ensuring the current note is visible in the viewport (scrolling).
     */
    sync(noteIndex: number): void;
    /**
     * Resets the visual state to the beginning of the score.
     */
    reset(): void;
}

// ===== types-docs/lib/practice-core.d.ts =====

/**
 * This file contains the pure, side-effect-free core logic for the violin practice mode.
 * It defines the state, events, and a reducer function to handle state transitions in an immutable way.
 * This core is decoupled from React, Zustand, OSMD, and any browser-specific APIs.
 * Refactored for branded types and strict validation.
 */
import { NoteTechnique, Observation } from './technique-types';
import type { Exercise, Note as TargetNote } from '@/lib/exercises/types';
export type { TargetNote };
/**
 * A valid note name in scientific pitch notation.
 *
 * @example "C4", "F#5", "Bb3"
 * @remarks Pattern: `^[A-G][#b]?[0-8]$`
 */
export type NoteName = string & {
    readonly __brand: unique symbol;
};
/**
 * Type guard to validate note name format.
 *
 * @param name - The string to validate.
 *
 * @remarks
 * Throws `AppError` with code `NOTE_PARSING_FAILED` if invalid.
 */
export declare function assertValidNoteName(name: string): asserts name is NoteName;
/**
 * Represents a musical note with properties derived from its frequency.
 */
export declare class MusicalNote {
    readonly frequency: number;
    readonly midiNumber: number;
    readonly noteName: string;
    readonly octave: number;
    readonly centsDeviation: number;
    private constructor();
    isEnharmonic(other: MusicalNote): boolean;
    static fromFrequency(frequency: number): MusicalNote;
    static fromMidi(midiNumber: number): MusicalNote;
    /**
     * Parses a note name in scientific pitch notation.
     *
     * @param fullName - A valid note name (e.g., "C4", "F#5", "Bb3")
     * @returns A MusicalNote instance
     * @throws {@link AppError} with code `NOTE_PARSING_FAILED` if format is invalid
     */
    static fromName(fullName: NoteName): MusicalNote;
    get nameWithOctave(): NoteName;
}
/**
 * Defines the tolerance boundaries for matching a note.
 */
export interface MatchHysteresis {
    enter: number;
    exit: number;
}
/** Represents a note detected from the user's microphone input. */
export interface DetectedNote {
    pitch: string;
    pitchHz: number;
    cents: number;
    timestamp: number;
    confidence: number;
}
/** The status of the practice session. */
export type PracticeStatus = 'idle' | 'listening' | 'validating' | 'correct' | 'completed';
/** The complete, self-contained state of the practice session. */
export interface PracticeState {
    status: PracticeStatus;
    exercise: Exercise;
    currentIndex: number;
    detectionHistory: readonly DetectedNote[];
    holdDuration?: number;
    lastObservations?: Observation[];
    perfectNoteStreak: number;
}
/** Events that can modify the practice state. */
export type PracticeEvent = {
    type: 'START';
    payload?: {
        startIndex?: number;
    };
} | {
    type: 'STOP';
} | {
    type: 'RESET';
} | {
    type: 'NOTE_DETECTED';
    payload: DetectedNote;
} | {
    type: 'HOLDING_NOTE';
    payload: {
        duration: number;
    };
} | {
    type: 'NOTE_MATCHED';
    payload?: {
        technique: NoteTechnique;
        observations?: Observation[];
        isPerfect?: boolean;
    };
} | {
    type: 'NO_NOTE_DETECTED';
};
/**
 * Converts a `TargetNote`'s pitch into a standard, parsable note name string.
 *
 * @param pitch - The pitch object from a `TargetNote`.
 * @returns A standardized branded note name string like `"C#4"`.
 */
export declare function formatPitchName(pitch: TargetNote['pitch']): NoteName;
/**
 * Checks if a detected note matches a target note within a specified tolerance.
 * Short-circuits if target or detected note is undefined.
 */
export declare function isMatch(params: {
    target: TargetNote | undefined;
    detected: DetectedNote | undefined;
    tolerance?: number | MatchHysteresis;
    matchStatus?: 'initial' | 'maintaining';
}): boolean;
/**
 * Entry point for entering the matched state.
 */
export declare function isNewMatch(params: {
    target: TargetNote | undefined;
    detected: DetectedNote | undefined;
    tolerance?: number | MatchHysteresis;
}): boolean;
/**
 * Entry point for maintaining the matched state.
 */
export declare function isStillMatched(params: {
    target: TargetNote | undefined;
    detected: DetectedNote | undefined;
    tolerance?: number | MatchHysteresis;
}): boolean;
/**
 * The core reducer for the practice mode, handling all state transitions.
 */
export declare function reducePracticeEvent(state: PracticeState, event: PracticeEvent): PracticeState;

// ===== types-docs/lib/practice-core.test.d.ts =====

export {};

// ===== types-docs/lib/practice-engine/engine.d.ts =====

import { PracticeEngineEvent } from './engine.types';
import { AudioLoopPort, PitchDetectorPort } from './engine.ports';
import { Exercise } from '../exercises/types';
import { EngineState } from './engine.state';
import { PracticeReducer } from './engine.reducer';
import { NoteTechnique, Observation } from '../technique-types';
/**
 * Configuration context for the {@link PracticeEngine}.
 *
 * @public
 */
export interface PracticeEngineContext {
    /** Source of raw audio frames. */
    audio: AudioLoopPort;
    /** Algorithm used to detect pitch and confidence. */
    pitch: PitchDetectorPort;
    /** The musical exercise being practiced. */
    exercise: Exercise;
    /** Optional custom reducer for state transitions. Defaults to {@link engineReducer}. */
    reducer?: PracticeReducer;
    /** Optional cents tolerance override. */
    centsTolerance?: number;
    /** The index of the note to start practicing from. */
    initialNoteIndex?: number;
}
/**
 * Interface for the core musical practice engine.
 *
 * @public
 */
export interface PracticeEngine {
    /**
     * Starts the asynchronous engine loop.
     *
     * @param signal - An {@link AbortSignal} to terminate the loop.
     * @returns An async iterator yielding musical events in real-time.
     */
    start(signal: AbortSignal): AsyncIterable<PracticeEngineEvent>;
    /**
     * Immediately stops the engine and releases internal resources.
     */
    stop(): void;
    /**
     * Retrieves the current internal state of the engine.
     */
    getState(): EngineState;
}
/**
 * Factory function to create a new {@link PracticeEngine} instance.
 *
 * @param ctx - The execution context.
 * @returns A new PracticeEngine instance.
 * @public
 */
export declare function createPracticeEngine(ctx: PracticeEngineContext): PracticeEngine;
/**
 * Calculates adaptive difficulty parameters based on performance history.
 *
 * @param perfectNoteStreak - Current streak of perfect notes.
 * @returns Object containing intonation tolerance and required hold duration.
 * @internal
 */
/** @internal */
export declare function calculateAdaptiveDifficulty(perfectNoteStreak: number): {
    centsTolerance: number;
    requiredHoldTime: number;
};
/** @internal */
export declare function mapMatchedEvent(payload: {
    technique?: NoteTechnique;
    observations?: Observation[];
    isPerfect?: boolean;
}): PracticeEngineEvent;

// ===== types-docs/lib/practice-engine/engine.ports.d.ts =====

import { EngineState } from './engine.state';
import { AudioLoopPort as GlobalAudioLoopPort, PitchDetectionPort as GlobalPitchDetectionPort } from '../ports/audio.port';
/**
 * Port for retrieving raw audio frames from an input source.
 *
 * @public
 */
export type AudioLoopPort = GlobalAudioLoopPort;
/**
 * Port for pitch detection and volume analysis.
 *
 * @public
 */
export type PitchDetectorPort = GlobalPitchDetectionPort;
/**
 * Interface for controlling sheet music visual feedback.
 *
 * @public
 */
export interface ScoreCursorPort {
    /** Moves the active cursor to the specified note index. */
    moveTo(index: number): void;
    /** Highlights the note at the specified index. */
    highlight(index: number): void;
}
/**
 * State synchronization port for the engine.
 *
 * @public
 */
export interface PracticeStatePort {
    /** Retrieves the current persistent state. */
    getState(): EngineState;
    /** Atomically updates the state with a new value. */
    update(next: EngineState): void;
}

// ===== types-docs/lib/practice-engine/engine.reducer.d.ts =====

import { EngineState } from './engine.state';
import { PracticeEngineEvent } from './engine.types';
/**
 * Pure reducer function for the {@link PracticeEngine} state.
 *
 * @public
 */
export type PracticeReducer = (state: EngineState, event: PracticeEngineEvent) => EngineState;
/**
 * Reducer for the musical practice engine, handling transitions between states.
 *
 * @remarks
 * This implementation uses a record-based handler map to ensure the function
 * stays within the recommended line limit while being easily extensible.
 *
 * @param state - Current engine state.
 * @param event - The event to process.
 * @returns The next engine state.
 * @public
 */
export declare const engineReducer: PracticeReducer;

// ===== types-docs/lib/practice-engine/engine.state.d.ts =====

import { EngineStatus, Observation, NoteTechnique } from './engine.types';
/**
 * The complete, reactive state of a {@link PracticeEngine} session.
 *
 * @public
 */
export interface EngineState {
    /** The current status of the engine loop. */
    status: EngineStatus;
    /** The zero-based index of the note currently being practiced. */
    currentNoteIndex: number;
    /** The total number of notes in the active exercise. */
    scoreLength: number;
    /** High-frequency observations for the currently detected pitch. */
    liveObservations: Observation[];
    /** The technical metrics of the most recently matched note. */
    lastTechnique?: NoteTechnique;
    /** Number of consecutive notes that met the 'perfect' threshold. */
    perfectNoteStreak: number;
}
/**
 * Default starting state for a new engine instance.
 *
 * @public
 */
export declare const INITIAL_ENGINE_STATE: EngineState;

// ===== types-docs/lib/practice-engine/engine.types.d.ts =====

import { NoteTechnique, Observation } from '../technique-types';
import { TargetNote, DetectedNote } from '../practice-core';
import { RawPitchEvent } from '../note-stream';
export type { NoteTechnique, Observation, TargetNote, RawPitchEvent, DetectedNote };
/**
 * Valid statuses for the internal practice engine.
 *
 * @public
 */
export type EngineStatus = 'idle' | 'ready' | 'active' | 'completed';
/**
 * Payload for the NOTE_DETECTED event.
 *
 * @public
 */
export type NoteDetectedPayload = DetectedNote;
/**
 * Payload for the HOLDING_NOTE event.
 *
 * @public
 */
export interface HoldingNotePayload {
    /** The total duration in milliseconds the note has been held. */
    duration: number;
}
/**
 * Payload for the NOTE_MATCHED event.
 *
 * @public
 */
export interface NoteMatchedPayload {
    /** Technical analysis of the matched note. */
    technique: NoteTechnique;
    /** Pedagogical observations generated from the analysis. */
    observations: Observation[];
    /** Whether the note met the 'perfect' threshold for streak counting. */
    isPerfect: boolean;
}
/**
 * Discriminated union of all possible events emitted by the PracticeEngine.
 *
 * @public
 */
export type PracticeEngineEvent = {
    type: 'NOTE_DETECTED';
    payload: NoteDetectedPayload;
} | {
    type: 'HOLDING_NOTE';
    payload: HoldingNotePayload;
} | {
    type: 'NOTE_MATCHED';
    payload: NoteMatchedPayload;
} | {
    type: 'NO_NOTE';
} | {
    type: 'SESSION_COMPLETED';
};
/**
 * Represents a note that has been fully processed and analyzed by the engine.
 *
 * @public
 */
export interface CompletedNote {
    /** The zero-based index of the note in the exercise. */
    index: number;
    /** The final technical metrics for this note. */
    technique: NoteTechnique;
    /** Any feedback observations for this note. */
    observations: Observation[];
}

// ===== types-docs/lib/practice/practice-event-sink.d.ts =====

import { type PracticeState, type PracticeEvent } from '@/lib/practice-core';
/**
 * A type representing the core state management functions of a Zustand store,
 * generic over the state type `T`.
 *
 * @remarks
 * This interface is a subset of the standard Zustand `StoreApi`, used here
 * to decouple the event sink from specific store implementations.
 *
 * @public
 */
type StoreApi<T> = {
    /**
     * Retrieves the current state from the store.
     *
     * @returns The current state object.
     */
    getState: () => T;
    /**
     * Updates the store state using a partial update or an updater function.
     *
     * @remarks
     * When using an updater function, Zustand ensures that the state is updated
     * atomically within its own reactive lifecycle.
     *
     * @param partial - The new state values or a function that receives the current state and returns updates.
     * @param replace - If true, replaces the entire state instead of merging. Defaults to false.
     */
    setState: (partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: boolean) => void;
};
/**
 * Parameters for the practice event handler.
 * @public
 */
export interface HandlePracticeEventParams<T> {
    /** The practice event to process. */
    event: PracticeEvent;
    /** The Zustand store API instance where the state resides. */
    store: StoreApi<T>;
    /** Callback triggered when the state transitions to 'completed'. */
    onCompleted: () => void;
    /** Optional handlers for telemetry and session data recording. */
    analytics?: {
        endSession: () => void;
    };
}
/**
 * Handles state transitions and side effects for practice events emitted by the audio pipeline.
 *
 * @remarks
 * This function acts as the "event sink" that bridges the gap between the asynchronous,
 * high-frequency audio pipeline and the reactive Zustand stores.
 *
 * @param params - Configuration parameters for the handler.
 *
 * @example
 * ```ts
 * handlePracticeEvent({
 *   event,
 *   store: usePracticeStore,
 *   onCompleted: () => showConfetti(),
 *   analytics: { endSession: () => analytics.track('session_end') }
 * });
 * ```
 *
 * @public
 */
export declare const handlePracticeEvent: <T extends {
    practiceState: PracticeState | undefined;
}>(params: HandlePracticeEventParams<T>) => void;
export {};

// ===== types-docs/lib/practice/practice-states.d.ts =====

import { PracticeState } from '../practice-core';
import { AudioLoopPort, PitchDetectionPort } from '../ports/audio.port';
import { Exercise } from '../exercises/types';
import { AppError } from '../errors/app-error';
import { PracticeSessionRunner } from './session-runner';
/**
 * Union type representing all possible states of the Practice Store.
 *
 * @remarks
 * This state machine uses a Discriminated Union pattern (based on the `status` field)
 * to ensure type safety and eliminate invalid states (e.g., an active session without
 * an instantiated runner).
 *
 * **Workflow**:
 * 1. `idle`: Application is waiting for an exercise to be selected.
 * 2. `initializing`: Hardware resources (microphone) are being acquired.
 * 3. `ready`: Hardware is ready; waiting for user to press "Start".
 * 4. `active`: Practice session is running; audio is being processed.
 * 5. `error`: A terminal error occurred (e.g., mic access denied).
 *
 * **State Flow**:
 * `idle` -\> `initializing` -\> `ready` -\> `active` -\> `idle` (or `error`)
 *
 * @public
 */
export type PracticeStoreState = IdleState | InitializingState | ReadyState | ActiveState | ErrorState;
/**
 * Represents the initial state where no exercise is actively being practiced.
 *
 * @public
 */
export interface IdleState {
    /** The state machine status identifier. */
    status: 'idle';
    /** The currently selected exercise, if any. */
    exercise: Exercise | undefined;
    /** No error is present in this state. */
    error: undefined;
}
/**
 * Represents the state while audio resources or exercises are being loaded.
 *
 * @remarks
 * Transitions to `ReadyState` upon success or `ErrorState` upon failure.
 *
 * @public
 */
export interface InitializingState {
    /** The state machine status identifier. */
    status: 'initializing';
    /** The exercise being initialized. */
    exercise: Exercise | undefined;
    /**
     * Progress percentage of the initialization (0-100).
     * Currently unused but reserved for long-running resource downloads.
     */
    progress: number;
    /** No error is present while initializing. */
    error: undefined;
}
/**
 * Represents the state when resources are loaded and the session is ready to start.
 *
 * @remarks
 * In this state, the microphone has been acquired and the pitch detector is ready,
 * but the real-time processing loop has not yet started.
 *
 * @public
 */
export interface ReadyState {
    /** The state machine status identifier. */
    status: 'ready';
    /** The initialized audio loop port, ready to be started. */
    audioLoop: AudioLoopPort;
    /** The initialized pitch detector port. */
    detector: PitchDetectionPort;
    /** The exercise ready to be played. */
    exercise: Exercise;
    /** No error is present in ready state. */
    error: undefined;
}
/**
 * Represents the state during an active practice session.
 *
 * @remarks
 * This is the "hot" state where the audio pipeline is actively consuming frames.
 *
 * **Lifecycle Management**:
 * - The `runner` is responsible for orchestrating the audio/domain loop.
 * - The `abortController` allows for clean termination and resource release.
 * - `practiceState` holds the real-time progress (current note, history).
 *
 * @public
 */
export interface ActiveState {
    /** The state machine status identifier. */
    status: 'active';
    /** The audio loop driving the session. */
    audioLoop: AudioLoopPort;
    /** The pitch detector being used for analysis. */
    detector: PitchDetectionPort;
    /** The exercise currently being practiced. */
    exercise: Exercise;
    /** The runner instance managing the session orchestration. */
    runner: PracticeSessionRunner;
    /** The domain-specific practice progress state. */
    practiceState: PracticeState;
    /** Controller used to signal cancellation of the session and the underlying pipeline. */
    abortController: AbortController;
    /** No error is present while active. */
    error: undefined;
}
/**
 * Represents a state where a terminal or recoverable error has occurred.
 *
 * @remarks
 * Recoverable errors (like hardware disconnects) can transition back to `idle`
 * via a reset or retry operation.
 *
 * @public
 */
export interface ErrorState {
    /** The state machine status identifier. */
    status: 'error';
    /** The exercise that was being used when the error occurred. */
    exercise: Exercise | undefined;
    /** Detailed error information, conforming to the application error standard. */
    error: AppError;
}
/**
 * Factory for valid state transitions in the practice system.
 *
 * @remarks
 * These functions enforce the formal invariants of the Finite State Machine (FSM).
 * They ensure that state objects are always correctly shaped and that transitions
 * follow the intended business logic, preventing "impossible" states (e.g.,
 * being `active` without a `runner`).
 *
 * **Immutability**: Every transition returns a new state object, following
 * the principles of functional programming and ensuring compatibility with
 * reactive stores like Zustand.
 *
 * @public
 */
export declare const transitions: {
    /**
     * Transitions the system to the initializing state.
     */
    initialize: (exercise: Exercise | undefined) => InitializingState;
    /**
     * Transitions to the ready state once resources (microphone, detector) are acquired.
     */
    ready: (resources: {
        audioLoop: AudioLoopPort;
        detector: PitchDetectionPort;
        exercise: Exercise;
    }) => ReadyState;
    /**
     * Transitions from ready to active, commencing the session execution.
     */
    start: (state: ReadyState, runner: PracticeSessionRunner, abortController: AbortController, startIndex?: number) => ActiveState;
    /**
     * Transitions back to idle from active or ready, performing a graceful stop.
     */
    stop: (state: ActiveState | ReadyState) => IdleState;
    /**
     * Transitions to the error state due to a failure in initialization or execution.
     */
    error: (error: AppError, exercise?: Exercise | undefined) => ErrorState;
    /**
     * Resets the state machine to its absolute initial state, clearing all context.
     */
    reset: () => IdleState;
    /**
     * Transitions to idle while selecting a specific exercise for future practice.
     */
    selectExercise: (exercise: Exercise) => IdleState;
};

// ===== types-docs/lib/practice/practice-states.test.d.ts =====

export {};

// ===== types-docs/lib/practice/practice-utils.d.ts =====

/**
 * practice-utils
 *
 * Pure utility functions for the practice mode domain.
 */
import { PracticeState, DetectedNote, PracticeStatus } from '@/lib/practice-core';
import { Note } from '@/lib/exercises/types';
/**
 * Derived state used by UI components to represent the current progress
 * and targets of a practice session.
 */
export interface DerivedPracticeState {
    status: PracticeStatus;
    currentNoteIndex: number;
    targetNote: Note | undefined;
    totalNotes: number;
    progress: number;
    lastDetectedNote: DetectedNote | undefined;
    targetPitchName: string | undefined;
}
/**
 * Derives calculated UI state from the raw practice domain state.
 *
 * @param practiceState - The current state from the practice engine.
 * @returns A simplified representation for UI consumption.
 */
export declare function derivePracticeState(practiceState: PracticeState | undefined): DerivedPracticeState;

// ===== types-docs/lib/practice/session-runner.d.ts =====

import { type PracticeState } from '@/lib/practice-core';
import type { AudioLoopPort, PitchDetectionPort } from '../ports/audio.port';
import type { Exercise } from '@/lib/exercises/types';
import { NoteTechnique, Observation } from '../technique-types';
/**
 * Result of a completed or cancelled practice session runner execution.
 *
 * @public
 */
export interface SessionResult {
    completed: boolean;
    reason: 'finished' | 'cancelled' | 'error';
    error?: Error;
}
/**
 * Interface for the practice session runner, responsible for coordinating the audio
 * loop, pitch detection, and state updates during a session.
 *
 * @public
 */
export interface PracticeSessionRunner {
    /**
     * Starts the practice session and runs until completion, cancellation, or error.
     *
     * @param signal - An external {@link AbortSignal} to cancel the session.
     * @returns A promise that resolves with the {@link SessionResult}.
     */
    run(signal: AbortSignal): Promise<SessionResult>;
    /**
     * Immediately stops the running session.
     */
    cancel(): void;
}
/**
 * Minimal store interface for state management and UI synchronization.
 * @internal
 */
export interface RunnerStore {
    getState: () => {
        practiceState: PracticeState | undefined;
        liveObservations?: Observation[];
    };
    setState: (partial: {
        practiceState: PracticeState | undefined;
        liveObservations?: Observation[];
    } | Partial<{
        practiceState: PracticeState | undefined;
        liveObservations?: Observation[];
    }> | ((state: {
        practiceState: PracticeState | undefined;
        liveObservations?: Observation[];
    }) => {
        practiceState: PracticeState | undefined;
        liveObservations?: Observation[];
    } | Partial<{
        practiceState: PracticeState | undefined;
        liveObservations?: Observation[];
    }>), replace?: boolean) => void;
    stop: () => Promise<void>;
}
/**
 * Analytics handlers for recording performance metrics.
 * @internal
 */
export interface RunnerAnalytics {
    endSession: () => void;
    recordNoteAttempt: (params: {
        index: number;
        pitch: string;
        cents: number;
        inTune: boolean;
    }) => void;
    recordNoteCompletion: (params: {
        index: number;
        time: number;
        technique?: NoteTechnique;
    }) => void;
}
/**
 * Dependencies required by the {@link PracticeSessionRunnerImpl}.
 *
 * @public
 */
export interface SessionRunnerDependencies {
    audioLoop: AudioLoopPort;
    detector: PitchDetectionPort;
    exercise: Exercise;
    sessionStartTime: number;
    store: RunnerStore;
    analytics: RunnerAnalytics;
    updatePitch?: (pitch: number, confidence: number) => void;
    centsTolerance?: number;
}
/**
 * Implementation of {@link PracticeSessionRunner} that orchestrates the Practice Engine
 * and synchronizes with the application stores.
 *
 * @public
 */
export declare class PracticeSessionRunnerImpl implements PracticeSessionRunner {
    private abortController;
    private sessionStats;
    private environment;
    constructor(environment: SessionRunnerDependencies);
    run(externalSignal: AbortSignal): Promise<SessionResult>;
    private executeSession;
    cancel(): void;
    private determineResult;
    private handleRunError;
    private executeLoop;
    private initializeEngine;
    private processEngineEvent;
    private mapToLegacyEvent;
    private dispatchInternalEvent;
    private handleEventOutcome;
    private synchronizeFeedback;
    private clearFeedback;
    private handleEventCompletion;
    private propagateToEventSink;
    private logTelemetry;
    private recordNoteMilestone;
    private emitAnalytics;
    private updateRunnerStats;
}
/**
 * @deprecated Use `PracticeSessionRunnerImpl` directly.
 */
export declare function runPracticeSession(deps: SessionRunnerDependencies): Promise<SessionResult>;

// ===== types-docs/lib/practice/session-runner.test.d.ts =====

export {};

// ===== types-docs/lib/schemas/persistence.schema.d.ts =====

import { z } from 'zod';
/**
 * Zod schema for validating the technical performance metrics of a single note.
 *
 * @remarks
 * Used for both real-time validation and persistent storage of technique analysis results.
 *
 * @public
 */
export declare const NoteTechniqueSchema: z.ZodObject<{
    vibrato: z.ZodObject<{
        present: z.ZodBoolean;
        rateHz: z.ZodNumber;
        widthCents: z.ZodNumber;
        regularity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        rateHz: number;
        widthCents: number;
        regularity: number;
        present: boolean;
    }, {
        rateHz: number;
        widthCents: number;
        regularity: number;
        present: boolean;
    }>;
    pitchStability: z.ZodObject<{
        settlingStdCents: z.ZodNumber;
        globalStdCents: z.ZodNumber;
        driftCentsPerSec: z.ZodNumber;
        inTuneRatio: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        settlingStdCents: number;
        globalStdCents: number;
        driftCentsPerSec: number;
        inTuneRatio: number;
    }, {
        settlingStdCents: number;
        globalStdCents: number;
        driftCentsPerSec: number;
        inTuneRatio: number;
    }>;
    rhythm: z.ZodObject<{
        onsetErrorMs: z.ZodOptional<z.ZodNumber>;
        durationErrorMs: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        onsetErrorMs?: number | undefined;
        durationErrorMs?: number | undefined;
    }, {
        onsetErrorMs?: number | undefined;
        durationErrorMs?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    vibrato: {
        rateHz: number;
        widthCents: number;
        regularity: number;
        present: boolean;
    };
    rhythm: {
        onsetErrorMs?: number | undefined;
        durationErrorMs?: number | undefined;
    };
    pitchStability: {
        settlingStdCents: number;
        globalStdCents: number;
        driftCentsPerSec: number;
        inTuneRatio: number;
    };
}, {
    vibrato: {
        rateHz: number;
        widthCents: number;
        regularity: number;
        present: boolean;
    };
    rhythm: {
        onsetErrorMs?: number | undefined;
        durationErrorMs?: number | undefined;
    };
    pitchStability: {
        settlingStdCents: number;
        globalStdCents: number;
        driftCentsPerSec: number;
        inTuneRatio: number;
    };
}>;
/**
 * Zod schema for validating the summarized results of practicing a single note.
 *
 * @public
 */
export declare const NoteResultSchema: z.ZodObject<{
    noteIndex: z.ZodNumber;
    targetPitch: z.ZodString;
    attempts: z.ZodNumber;
    timeToCompleteMs: z.ZodOptional<z.ZodNumber>;
    averageCents: z.ZodNumber;
    wasInTune: z.ZodBoolean;
    technique: z.ZodOptional<z.ZodObject<{
        vibrato: z.ZodObject<{
            present: z.ZodBoolean;
            rateHz: z.ZodNumber;
            widthCents: z.ZodNumber;
            regularity: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            rateHz: number;
            widthCents: number;
            regularity: number;
            present: boolean;
        }, {
            rateHz: number;
            widthCents: number;
            regularity: number;
            present: boolean;
        }>;
        pitchStability: z.ZodObject<{
            settlingStdCents: z.ZodNumber;
            globalStdCents: z.ZodNumber;
            driftCentsPerSec: z.ZodNumber;
            inTuneRatio: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            settlingStdCents: number;
            globalStdCents: number;
            driftCentsPerSec: number;
            inTuneRatio: number;
        }, {
            settlingStdCents: number;
            globalStdCents: number;
            driftCentsPerSec: number;
            inTuneRatio: number;
        }>;
        rhythm: z.ZodObject<{
            onsetErrorMs: z.ZodOptional<z.ZodNumber>;
            durationErrorMs: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            onsetErrorMs?: number | undefined;
            durationErrorMs?: number | undefined;
        }, {
            onsetErrorMs?: number | undefined;
            durationErrorMs?: number | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        vibrato: {
            rateHz: number;
            widthCents: number;
            regularity: number;
            present: boolean;
        };
        rhythm: {
            onsetErrorMs?: number | undefined;
            durationErrorMs?: number | undefined;
        };
        pitchStability: {
            settlingStdCents: number;
            globalStdCents: number;
            driftCentsPerSec: number;
            inTuneRatio: number;
        };
    }, {
        vibrato: {
            rateHz: number;
            widthCents: number;
            regularity: number;
            present: boolean;
        };
        rhythm: {
            onsetErrorMs?: number | undefined;
            durationErrorMs?: number | undefined;
        };
        pitchStability: {
            settlingStdCents: number;
            globalStdCents: number;
            driftCentsPerSec: number;
            inTuneRatio: number;
        };
    }>>;
}, "strip", z.ZodTypeAny, {
    noteIndex: number;
    targetPitch: string;
    wasInTune: boolean;
    attempts: number;
    averageCents: number;
    timeToCompleteMs?: number | undefined;
    technique?: {
        vibrato: {
            rateHz: number;
            widthCents: number;
            regularity: number;
            present: boolean;
        };
        rhythm: {
            onsetErrorMs?: number | undefined;
            durationErrorMs?: number | undefined;
        };
        pitchStability: {
            settlingStdCents: number;
            globalStdCents: number;
            driftCentsPerSec: number;
            inTuneRatio: number;
        };
    } | undefined;
}, {
    noteIndex: number;
    targetPitch: string;
    wasInTune: boolean;
    attempts: number;
    averageCents: number;
    timeToCompleteMs?: number | undefined;
    technique?: {
        vibrato: {
            rateHz: number;
            widthCents: number;
            regularity: number;
            present: boolean;
        };
        rhythm: {
            onsetErrorMs?: number | undefined;
            durationErrorMs?: number | undefined;
        };
        pitchStability: {
            settlingStdCents: number;
            globalStdCents: number;
            driftCentsPerSec: number;
            inTuneRatio: number;
        };
    } | undefined;
}>;
/**
 * Zod schema for validating a complete practice session.
 *
 * @remarks
 * This schema ensures that session data is durable and can be safely rehydrated
 * from `localStorage`.
 *
 * @public
 */
export declare const PracticeSessionSchema: z.ZodObject<{
    id: z.ZodString;
    startTimeMs: z.ZodNumber;
    endTimeMs: z.ZodNumber;
    durationMs: z.ZodNumber;
    exerciseId: z.ZodString;
    exerciseName: z.ZodString;
    mode: z.ZodEnum<["tuner", "practice"]>;
    noteResults: z.ZodArray<z.ZodObject<{
        noteIndex: z.ZodNumber;
        targetPitch: z.ZodString;
        attempts: z.ZodNumber;
        timeToCompleteMs: z.ZodOptional<z.ZodNumber>;
        averageCents: z.ZodNumber;
        wasInTune: z.ZodBoolean;
        technique: z.ZodOptional<z.ZodObject<{
            vibrato: z.ZodObject<{
                present: z.ZodBoolean;
                rateHz: z.ZodNumber;
                widthCents: z.ZodNumber;
                regularity: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                rateHz: number;
                widthCents: number;
                regularity: number;
                present: boolean;
            }, {
                rateHz: number;
                widthCents: number;
                regularity: number;
                present: boolean;
            }>;
            pitchStability: z.ZodObject<{
                settlingStdCents: z.ZodNumber;
                globalStdCents: z.ZodNumber;
                driftCentsPerSec: z.ZodNumber;
                inTuneRatio: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                settlingStdCents: number;
                globalStdCents: number;
                driftCentsPerSec: number;
                inTuneRatio: number;
            }, {
                settlingStdCents: number;
                globalStdCents: number;
                driftCentsPerSec: number;
                inTuneRatio: number;
            }>;
            rhythm: z.ZodObject<{
                onsetErrorMs: z.ZodOptional<z.ZodNumber>;
                durationErrorMs: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                onsetErrorMs?: number | undefined;
                durationErrorMs?: number | undefined;
            }, {
                onsetErrorMs?: number | undefined;
                durationErrorMs?: number | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            vibrato: {
                rateHz: number;
                widthCents: number;
                regularity: number;
                present: boolean;
            };
            rhythm: {
                onsetErrorMs?: number | undefined;
                durationErrorMs?: number | undefined;
            };
            pitchStability: {
                settlingStdCents: number;
                globalStdCents: number;
                driftCentsPerSec: number;
                inTuneRatio: number;
            };
        }, {
            vibrato: {
                rateHz: number;
                widthCents: number;
                regularity: number;
                present: boolean;
            };
            rhythm: {
                onsetErrorMs?: number | undefined;
                durationErrorMs?: number | undefined;
            };
            pitchStability: {
                settlingStdCents: number;
                globalStdCents: number;
                driftCentsPerSec: number;
                inTuneRatio: number;
            };
        }>>;
    }, "strip", z.ZodTypeAny, {
        noteIndex: number;
        targetPitch: string;
        wasInTune: boolean;
        attempts: number;
        averageCents: number;
        timeToCompleteMs?: number | undefined;
        technique?: {
            vibrato: {
                rateHz: number;
                widthCents: number;
                regularity: number;
                present: boolean;
            };
            rhythm: {
                onsetErrorMs?: number | undefined;
                durationErrorMs?: number | undefined;
            };
            pitchStability: {
                settlingStdCents: number;
                globalStdCents: number;
                driftCentsPerSec: number;
                inTuneRatio: number;
            };
        } | undefined;
    }, {
        noteIndex: number;
        targetPitch: string;
        wasInTune: boolean;
        attempts: number;
        averageCents: number;
        timeToCompleteMs?: number | undefined;
        technique?: {
            vibrato: {
                rateHz: number;
                widthCents: number;
                regularity: number;
                present: boolean;
            };
            rhythm: {
                onsetErrorMs?: number | undefined;
                durationErrorMs?: number | undefined;
            };
            pitchStability: {
                settlingStdCents: number;
                globalStdCents: number;
                driftCentsPerSec: number;
                inTuneRatio: number;
            };
        } | undefined;
    }>, "many">;
    notesAttempted: z.ZodNumber;
    notesCompleted: z.ZodNumber;
    accuracy: z.ZodNumber;
    averageCents: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    durationMs: number;
    accuracy: number;
    id: string;
    exerciseId: string;
    exerciseName: string;
    mode: "tuner" | "practice";
    noteResults: {
        noteIndex: number;
        targetPitch: string;
        wasInTune: boolean;
        attempts: number;
        averageCents: number;
        timeToCompleteMs?: number | undefined;
        technique?: {
            vibrato: {
                rateHz: number;
                widthCents: number;
                regularity: number;
                present: boolean;
            };
            rhythm: {
                onsetErrorMs?: number | undefined;
                durationErrorMs?: number | undefined;
            };
            pitchStability: {
                settlingStdCents: number;
                globalStdCents: number;
                driftCentsPerSec: number;
                inTuneRatio: number;
            };
        } | undefined;
    }[];
    endTimeMs: number;
    startTimeMs: number;
    averageCents: number;
    notesAttempted: number;
    notesCompleted: number;
}, {
    durationMs: number;
    accuracy: number;
    id: string;
    exerciseId: string;
    exerciseName: string;
    mode: "tuner" | "practice";
    noteResults: {
        noteIndex: number;
        targetPitch: string;
        wasInTune: boolean;
        attempts: number;
        averageCents: number;
        timeToCompleteMs?: number | undefined;
        technique?: {
            vibrato: {
                rateHz: number;
                widthCents: number;
                regularity: number;
                present: boolean;
            };
            rhythm: {
                onsetErrorMs?: number | undefined;
                durationErrorMs?: number | undefined;
            };
            pitchStability: {
                settlingStdCents: number;
                globalStdCents: number;
                driftCentsPerSec: number;
                inTuneRatio: number;
            };
        } | undefined;
    }[];
    endTimeMs: number;
    startTimeMs: number;
    averageCents: number;
    notesAttempted: number;
    notesCompleted: number;
}>;
/**
 * Zod schema for validating lifetime statistics for an individual exercise.
 *
 * @public
 */
export declare const ExerciseStatsSchema: z.ZodObject<{
    exerciseId: z.ZodString;
    timesCompleted: z.ZodNumber;
    bestAccuracy: z.ZodNumber;
    averageAccuracy: z.ZodNumber;
    fastestCompletionMs: z.ZodNumber;
    lastPracticedMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    exerciseId: string;
    fastestCompletionMs: number;
    lastPracticedMs: number;
    timesCompleted: number;
    bestAccuracy: number;
    averageAccuracy: number;
}, {
    exerciseId: string;
    fastestCompletionMs: number;
    lastPracticedMs: number;
    timesCompleted: number;
    bestAccuracy: number;
    averageAccuracy: number;
}>;
export declare const ProgressEventSchema: z.ZodObject<{
    ts: z.ZodNumber;
    exerciseId: z.ZodString;
    accuracy: z.ZodNumber;
    rhythmErrorMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    accuracy: number;
    exerciseId: string;
    ts: number;
    rhythmErrorMs: number;
}, {
    accuracy: number;
    exerciseId: string;
    ts: number;
    rhythmErrorMs: number;
}>;
export declare const SkillAggregatesSchema: z.ZodObject<{
    intonation: z.ZodNumber;
    rhythm: z.ZodNumber;
    overall: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    intonation: number;
    rhythm: number;
    overall: number;
}, {
    intonation: number;
    rhythm: number;
    overall: number;
}>;
export declare const ProgressSnapshotSchema: z.ZodObject<{
    userId: z.ZodString;
    window: z.ZodEnum<["7d", "30d", "all"]>;
    aggregates: z.ZodObject<{
        intonation: z.ZodNumber;
        rhythm: z.ZodNumber;
        overall: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        intonation: number;
        rhythm: number;
        overall: number;
    }, {
        intonation: number;
        rhythm: number;
        overall: number;
    }>;
    lastSessionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    window: "7d" | "30d" | "all";
    aggregates: {
        intonation: number;
        rhythm: number;
        overall: number;
    };
    lastSessionId: string;
}, {
    userId: string;
    window: "7d" | "30d" | "all";
    aggregates: {
        intonation: number;
        rhythm: number;
        overall: number;
    };
    lastSessionId: string;
}>;
/**
 * Zod schema for the entire persistent progress state.
 *
 * @remarks
 * Defines the canonical structure of the user's technical profile in storage.
 *
 * @public
 */
export declare const ProgressStateSchema: z.ZodObject<{
    schemaVersion: z.ZodDefault<z.ZodLiteral<1>>;
    totalPracticeSessions: z.ZodNumber;
    totalPracticeTime: z.ZodNumber;
    exercisesCompleted: z.ZodArray<z.ZodString, "many">;
    currentStreak: z.ZodNumber;
    longestStreak: z.ZodNumber;
    intonationSkill: z.ZodNumber;
    rhythmSkill: z.ZodNumber;
    overallSkill: z.ZodNumber;
    exerciseStats: z.ZodRecord<z.ZodString, z.ZodObject<{
        exerciseId: z.ZodString;
        timesCompleted: z.ZodNumber;
        bestAccuracy: z.ZodNumber;
        averageAccuracy: z.ZodNumber;
        fastestCompletionMs: z.ZodNumber;
        lastPracticedMs: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        exerciseId: string;
        fastestCompletionMs: number;
        lastPracticedMs: number;
        timesCompleted: number;
        bestAccuracy: number;
        averageAccuracy: number;
    }, {
        exerciseId: string;
        fastestCompletionMs: number;
        lastPracticedMs: number;
        timesCompleted: number;
        bestAccuracy: number;
        averageAccuracy: number;
    }>>;
    eventBuffer: z.ZodDefault<z.ZodArray<z.ZodObject<{
        ts: z.ZodNumber;
        exerciseId: z.ZodString;
        accuracy: z.ZodNumber;
        rhythmErrorMs: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        accuracy: number;
        exerciseId: string;
        ts: number;
        rhythmErrorMs: number;
    }, {
        accuracy: number;
        exerciseId: string;
        ts: number;
        rhythmErrorMs: number;
    }>, "many">>;
    snapshots: z.ZodDefault<z.ZodArray<z.ZodObject<{
        userId: z.ZodString;
        window: z.ZodEnum<["7d", "30d", "all"]>;
        aggregates: z.ZodObject<{
            intonation: z.ZodNumber;
            rhythm: z.ZodNumber;
            overall: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            intonation: number;
            rhythm: number;
            overall: number;
        }, {
            intonation: number;
            rhythm: number;
            overall: number;
        }>;
        lastSessionId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        window: "7d" | "30d" | "all";
        aggregates: {
            intonation: number;
            rhythm: number;
            overall: number;
        };
        lastSessionId: string;
    }, {
        userId: string;
        window: "7d" | "30d" | "all";
        aggregates: {
            intonation: number;
            rhythm: number;
            overall: number;
        };
        lastSessionId: string;
    }>, "many">>;
    eventCounter: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    exerciseStats: Record<string, {
        exerciseId: string;
        fastestCompletionMs: number;
        lastPracticedMs: number;
        timesCompleted: number;
        bestAccuracy: number;
        averageAccuracy: number;
    }>;
    schemaVersion: 1;
    totalPracticeSessions: number;
    totalPracticeTime: number;
    exercisesCompleted: string[];
    currentStreak: number;
    longestStreak: number;
    intonationSkill: number;
    rhythmSkill: number;
    overallSkill: number;
    eventBuffer: {
        accuracy: number;
        exerciseId: string;
        ts: number;
        rhythmErrorMs: number;
    }[];
    snapshots: {
        userId: string;
        window: "7d" | "30d" | "all";
        aggregates: {
            intonation: number;
            rhythm: number;
            overall: number;
        };
        lastSessionId: string;
    }[];
    eventCounter: number;
}, {
    exerciseStats: Record<string, {
        exerciseId: string;
        fastestCompletionMs: number;
        lastPracticedMs: number;
        timesCompleted: number;
        bestAccuracy: number;
        averageAccuracy: number;
    }>;
    totalPracticeSessions: number;
    totalPracticeTime: number;
    exercisesCompleted: string[];
    currentStreak: number;
    longestStreak: number;
    intonationSkill: number;
    rhythmSkill: number;
    overallSkill: number;
    schemaVersion?: 1 | undefined;
    eventBuffer?: {
        accuracy: number;
        exerciseId: string;
        ts: number;
        rhythmErrorMs: number;
    }[] | undefined;
    snapshots?: {
        userId: string;
        window: "7d" | "30d" | "all";
        aggregates: {
            intonation: number;
            rhythm: number;
            overall: number;
        };
        lastSessionId: string;
    }[] | undefined;
    eventCounter?: number | undefined;
}>;
/**
 * Zod schema for a single user achievement milestone.
 *
 * @public
 */
export declare const AchievementSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    icon: z.ZodString;
    unlockedAtMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    unlockedAtMs: number;
    icon: string;
    description: string;
    name: string;
}, {
    id: string;
    unlockedAtMs: number;
    icon: string;
    description: string;
    name: string;
}>;
export declare const AchievementsStateSchema: z.ZodObject<{
    schemaVersion: z.ZodDefault<z.ZodLiteral<1>>;
    unlocked: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        icon: z.ZodString;
        unlockedAtMs: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        unlockedAtMs: number;
        icon: string;
        description: string;
        name: string;
    }, {
        id: string;
        unlockedAtMs: number;
        icon: string;
        description: string;
        name: string;
    }>, "many">;
    pending: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        icon: z.ZodString;
        unlockedAtMs: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        unlockedAtMs: number;
        icon: string;
        description: string;
        name: string;
    }, {
        id: string;
        unlockedAtMs: number;
        icon: string;
        description: string;
        name: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    schemaVersion: 1;
    unlocked: {
        id: string;
        unlockedAtMs: number;
        icon: string;
        description: string;
        name: string;
    }[];
    pending: {
        id: string;
        unlockedAtMs: number;
        icon: string;
        description: string;
        name: string;
    }[];
}, {
    unlocked: {
        id: string;
        unlockedAtMs: number;
        icon: string;
        description: string;
        name: string;
    }[];
    pending: {
        id: string;
        unlockedAtMs: number;
        icon: string;
        description: string;
        name: string;
    }[];
    schemaVersion?: 1 | undefined;
}>;
export declare const SessionHistoryStateSchema: z.ZodObject<{
    sessions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        startTimeMs: z.ZodNumber;
        endTimeMs: z.ZodNumber;
        durationMs: z.ZodNumber;
        exerciseId: z.ZodString;
        exerciseName: z.ZodString;
        mode: z.ZodEnum<["tuner", "practice"]>;
        noteResults: z.ZodArray<z.ZodObject<{
            noteIndex: z.ZodNumber;
            targetPitch: z.ZodString;
            attempts: z.ZodNumber;
            timeToCompleteMs: z.ZodOptional<z.ZodNumber>;
            averageCents: z.ZodNumber;
            wasInTune: z.ZodBoolean;
            technique: z.ZodOptional<z.ZodObject<{
                vibrato: z.ZodObject<{
                    present: z.ZodBoolean;
                    rateHz: z.ZodNumber;
                    widthCents: z.ZodNumber;
                    regularity: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                }, {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                }>;
                pitchStability: z.ZodObject<{
                    settlingStdCents: z.ZodNumber;
                    globalStdCents: z.ZodNumber;
                    driftCentsPerSec: z.ZodNumber;
                    inTuneRatio: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                }, {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                }>;
                rhythm: z.ZodObject<{
                    onsetErrorMs: z.ZodOptional<z.ZodNumber>;
                    durationErrorMs: z.ZodOptional<z.ZodNumber>;
                }, "strip", z.ZodTypeAny, {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                }, {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                }>;
            }, "strip", z.ZodTypeAny, {
                vibrato: {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                };
                rhythm: {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                };
                pitchStability: {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                };
            }, {
                vibrato: {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                };
                rhythm: {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                };
                pitchStability: {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                };
            }>>;
        }, "strip", z.ZodTypeAny, {
            noteIndex: number;
            targetPitch: string;
            wasInTune: boolean;
            attempts: number;
            averageCents: number;
            timeToCompleteMs?: number | undefined;
            technique?: {
                vibrato: {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                };
                rhythm: {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                };
                pitchStability: {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                };
            } | undefined;
        }, {
            noteIndex: number;
            targetPitch: string;
            wasInTune: boolean;
            attempts: number;
            averageCents: number;
            timeToCompleteMs?: number | undefined;
            technique?: {
                vibrato: {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                };
                rhythm: {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                };
                pitchStability: {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                };
            } | undefined;
        }>, "many">;
        notesAttempted: z.ZodNumber;
        notesCompleted: z.ZodNumber;
        accuracy: z.ZodNumber;
        averageCents: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        durationMs: number;
        accuracy: number;
        id: string;
        exerciseId: string;
        exerciseName: string;
        mode: "tuner" | "practice";
        noteResults: {
            noteIndex: number;
            targetPitch: string;
            wasInTune: boolean;
            attempts: number;
            averageCents: number;
            timeToCompleteMs?: number | undefined;
            technique?: {
                vibrato: {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                };
                rhythm: {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                };
                pitchStability: {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                };
            } | undefined;
        }[];
        endTimeMs: number;
        startTimeMs: number;
        averageCents: number;
        notesAttempted: number;
        notesCompleted: number;
    }, {
        durationMs: number;
        accuracy: number;
        id: string;
        exerciseId: string;
        exerciseName: string;
        mode: "tuner" | "practice";
        noteResults: {
            noteIndex: number;
            targetPitch: string;
            wasInTune: boolean;
            attempts: number;
            averageCents: number;
            timeToCompleteMs?: number | undefined;
            technique?: {
                vibrato: {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                };
                rhythm: {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                };
                pitchStability: {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                };
            } | undefined;
        }[];
        endTimeMs: number;
        startTimeMs: number;
        averageCents: number;
        notesAttempted: number;
        notesCompleted: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    sessions: {
        durationMs: number;
        accuracy: number;
        id: string;
        exerciseId: string;
        exerciseName: string;
        mode: "tuner" | "practice";
        noteResults: {
            noteIndex: number;
            targetPitch: string;
            wasInTune: boolean;
            attempts: number;
            averageCents: number;
            timeToCompleteMs?: number | undefined;
            technique?: {
                vibrato: {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                };
                rhythm: {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                };
                pitchStability: {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                };
            } | undefined;
        }[];
        endTimeMs: number;
        startTimeMs: number;
        averageCents: number;
        notesAttempted: number;
        notesCompleted: number;
    }[];
}, {
    sessions: {
        durationMs: number;
        accuracy: number;
        id: string;
        exerciseId: string;
        exerciseName: string;
        mode: "tuner" | "practice";
        noteResults: {
            noteIndex: number;
            targetPitch: string;
            wasInTune: boolean;
            attempts: number;
            averageCents: number;
            timeToCompleteMs?: number | undefined;
            technique?: {
                vibrato: {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                };
                rhythm: {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                };
                pitchStability: {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                };
            } | undefined;
        }[];
        endTimeMs: number;
        startTimeMs: number;
        averageCents: number;
        notesAttempted: number;
        notesCompleted: number;
    }[];
}>;
/**
 * Zod schema for validating persistent user preferences.
 *
 * @public
 */
export declare const PreferencesStateSchema: z.ZodObject<{
    schemaVersion: z.ZodDefault<z.ZodLiteral<1>>;
    feedbackLevel: z.ZodEnum<["beginner", "intermediate", "advanced"]>;
    showTechnicalDetails: z.ZodBoolean;
    enableCelebrations: z.ZodBoolean;
    enableHaptics: z.ZodBoolean;
    soundFeedbackEnabled: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    schemaVersion: 1;
    feedbackLevel: "beginner" | "intermediate" | "advanced";
    showTechnicalDetails: boolean;
    enableCelebrations: boolean;
    enableHaptics: boolean;
    soundFeedbackEnabled: boolean;
}, {
    feedbackLevel: "beginner" | "intermediate" | "advanced";
    showTechnicalDetails: boolean;
    enableCelebrations: boolean;
    enableHaptics: boolean;
    soundFeedbackEnabled: boolean;
    schemaVersion?: 1 | undefined;
}>;

// ===== types-docs/lib/storage/storage-monitor.d.ts =====

/**
 * Utility to monitor localStorage usage.
 */
/**
 * Estimates the percentage of localStorage being used.
 *
 * @remarks
 * Most browsers have a limit of ~5MB per origin.
 *
 * @returns Usage percentage (0-100).
 */
export declare function estimateLocalStorageUsagePercent(): number;

// ===== types-docs/lib/technique-analysis-agent.d.ts =====

import { TechniqueFrame, NoteSegment, NoteTechnique, Observation, AnalysisOptions } from './technique-types';
/**
 * A stateful agent that analyzes note segments to provide detailed technical feedback.
 */
export declare class TechniqueAnalysisAgent {
    private options;
    constructor(options?: AnalysisOptions);
    /**
     * Analyzes a `NoteSegment` and computes a comprehensive set of technique metrics.
     */
    analyzeSegment(params: {
        segment: NoteSegment;
        gapFrames?: ReadonlyArray<TechniqueFrame>;
        prevSegment?: NoteSegment;
    }): NoteTechnique;
    /**
     * Generates a set of user-facing observations from the technique metrics.
     */
    generateObservations(technique: NoteTechnique): Observation[];
    private buildTechniqueObject;
    private collectObservations;
    private prioritizeObservations;
    private calculateStability;
    private computeStabilityMetrics;
    private calculateSettlingStd;
    private calculateInTuneRatio;
    private createEmptyStability;
    private calculateVibrato;
    private assembleVibratoResult;
    private computeVibratoMetrics;
    private executeVibratoAnalysis;
    private calculateVibratoRate;
    private isVibratoCandidate;
    private isVibratoValid;
    private calculateAttackRelease;
    private executeAttackReleaseAnalysis;
    private createEmptyAttackRelease;
    private analyzeAttackPhase;
    private calculateAttackTime;
    private calculateStableRms;
    private calculatePitchScoop;
    private analyzeReleasePhase;
    private calculateResonance;
    private computeResonanceMetrics;
    private createEmptyResonance;
    private calculateLowConfRatio;
    private calculateRmsBeatingScore;
    private detectWolfTone;
    private calculateRhythm;
    private calculateTransition;
    private calculateTransitionTime;
    private calculateGlissAmount;
    private calculateLandingErrorMetric;
    private calculateCorrectionMetric;
    private calculateGlissando;
    private calculateLandingError;
    private calculateCorrectionCount;
    private generateStabilityObservations;
    private generateVibratoObservations;
    private analyzePresentVibrato;
    private checkSlowVibrato;
    private assembleSlowVibratoObservation;
    private checkWideVibrato;
    private assembleWideVibratoObservation;
    private analyzeInconsistentVibrato;
    private isCandidateForInconsistency;
    private assembleInconsistentVibratoObservation;
    private generateAttackObservations;
    private analyzeSlowAttack;
    private analyzePitchScoop;
    private generateTransitionObservations;
    private analyzeAudibleGlissando;
    private assembleGlissandoObservation;
    private analyzeLandingError;
    private generateResonanceObservations;
    private assembleResonanceObservation;
    private generateRhythmObservations;
    private calculateStdDev;
    private performLinearRegression;
    private calculateRegressionSums;
    private detrend;
    private findPeriod;
    private evaluatePeriod;
    private calculateAutocorrelation;
}

// ===== types-docs/lib/technique-analysis-agent.test.d.ts =====

export {};

// ===== types-docs/lib/technique-types.d.ts =====

/**
 * Types and interfaces for advanced violin technique analysis.
 */
/** Nominal type for a timestamp in milliseconds. */
export type TimestampMs = number & {
    readonly __unit: 'ms';
};
/** Nominal type for frequency in Hertz. */
export type Hz = number & {
    readonly __unit: 'Hz';
};
/** Nominal type for pitch deviation in cents. */
export type Cents = number & {
    readonly __unit: 'cents';
};
/** Nominal type for a ratio between 0 and 1. */
export type Ratio01 = number & {
    readonly __unit: '01';
};
/**
 * Valid musical note name in scientific pitch notation.
 * @example "A4", "C#5", "Bb3"
 */
export type NoteLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
export type Accidental = '' | '#' | 'b' | '##' | 'bb';
export type Octave = number;
export type MusicalNoteName = `${NoteLetter}${Accidental}${number}`;
/**
 * A single frame of analysis from the audio pipeline.
 * Use a discriminated union to distinguish between frames with valid pitch and without.
 */
export type TechniqueFrame = PitchedFrame | UnpitchedFrame;
interface BaseFrame {
    /** The timestamp of the frame. */
    readonly timestamp: TimestampMs;
    /** The Root Mean Square (volume) of the frame. */
    readonly rms: number;
    /** The confidence of the pitch detection algorithm (0-1). */
    readonly confidence: number;
}
export interface PitchedFrame extends BaseFrame {
    readonly kind: 'pitched';
    /** The detected fundamental frequency. */
    readonly pitchHz: Hz;
    /** The pitch deviation in cents from the nearest note. */
    readonly cents: Cents;
    /** The name of the detected note. */
    readonly noteName: MusicalNoteName;
}
export interface UnpitchedFrame extends BaseFrame {
    readonly kind: 'unpitched';
}
/**
 * Metrics related to the quality and characteristics of vibrato.
 */
export interface VibratoMetrics {
    /** `true` if vibrato is detected in the note segment. */
    readonly present: boolean;
    /** Vibrato rate in Hz (typical range: 4-8 Hz) */
    readonly rateHz?: Hz;
    /** Vibrato width in cents (typical range: 10-50 cents) */
    readonly widthCents?: Cents;
    /**
     * Vibrato regularity score.
     *
     * @range 0.0 to 1.0
     * @remarks
     * - 0.0: Completely irregular/random oscillation
     * - 0.5: Moderately regular
     * - 1.0: Perfect sinusoidal regularity
     */
    readonly regularity?: Ratio01;
}
/**
 * Metrics related to pitch stability and intonation control.
 */
export interface PitchStability {
    /** The standard deviation of pitch (in cents) after the initial note attack. */
    readonly settlingStdCents: Cents;
    /** The overall standard deviation of pitch (in cents) for the entire note. */
    readonly globalStdCents: Cents;
    /** The rate of pitch change over time (cents per second). */
    readonly driftCentsPerSec: number;
    /** The proportion of frames (0-1) within target intonation tolerance. */
    readonly inTuneRatio: Ratio01;
}
/**
 * Metrics related to the beginning (attack) and end (release) of a note.
 */
export interface AttackReleaseMetrics {
    /** Time from onset to stable volume. */
    readonly attackTimeMs: TimestampMs;
    /** Pitch difference between start and stable pitch ("scoop"). */
    readonly pitchScoopCents: Cents;
    /** Standard deviation of pitch in the final milliseconds. */
    readonly releaseStability: Cents;
}
/**
 * Metrics related to the tonal quality and resonance of the note.
 */
export interface ResonanceMetrics {
    readonly suspectedWolf: boolean;
    /** Score indicating volume fluctuations (beating). */
    readonly rmsBeatingScore: Ratio01;
    /** Score indicating chaotic pitch fluctuations. */
    readonly pitchChaosScore: number;
    /** Proportion of high-volume frames with low confidence. */
    readonly lowConfRatio: Ratio01;
}
/**
 * Metrics related to the transition between two notes.
 */
export interface TransitionMetrics {
    /** Duration of silence or glissando between notes. */
    readonly transitionTimeMs: TimestampMs;
    /** Total pitch change during an audible slide. */
    readonly glissAmountCents: Cents;
    /** Average pitch error at the beginning of the new note. */
    readonly landingErrorCents: Cents;
    /** Number of times pitch crosses the center line at the start. */
    readonly correctionCount: number;
}
/**
 * Configuration options for the technique analysis agent.
 */
export interface AnalysisOptions {
    /**
     * Time to wait for pitch to settle after note onset.
     *
     * @range 50-500 ms
     * @default 150
     */
    settlingTimeMs?: TimestampMs;
    /**
     * Maximum pitch deviation to consider "in tune".
     *
     * @range 5-50 cents
     * @default 25
     */
    inTuneThresholdCents?: Cents;
    /**
     * Minimum vibrato rate to detect.
     *
     * @range 3-6 Hz
     * @default 4
     */
    vibratoMinRateHz?: Hz;
    /**
     * Maximum vibrato rate to detect.
     *
     * @range 6-10 Hz
     * @default 8
     */
    vibratoMaxRateHz?: Hz;
    /**
     * Minimum vibrato width to consider present.
     *
     * @range 5-20 cents
     * @default 10
     */
    vibratoMinWidthCents?: Cents;
    /**
     * Minimum regularity score to classify as intentional vibrato.
     *
     * @range 0.3-0.8
     * @default 0.5
     */
    vibratoMinRegularity?: Ratio01;
    /**
     * Threshold for the proportion of low-confidence frames to trigger wolf tone detection.
     * @default 0.3
     */
    wolfLowConfRatioThreshold?: number;
    /**
     * Threshold for RMS beating score to trigger wolf tone detection.
     * @default 0.4
     */
    wolfRmsBeatingThreshold?: number;
    /**
     * Multiplier applied to the RMS beating threshold for chaos-based detection.
     * @default 1.5
     */
    wolfChaosMultiplier?: number;
    /**
     * Threshold for pitch chaos score to trigger wolf tone detection.
     * @default 20
     */
    wolfPitchChaosThreshold?: number;
}
/**
 * Metrics related to rhythmic accuracy.
 */
export interface RhythmMetrics {
    /** Timing error of the note's start (ms). */
    readonly onsetErrorMs: number;
    /** Error of the note's total duration (ms). */
    readonly durationErrorMs?: number;
}
/**
 * A comprehensive collection of all technique metrics.
 */
export interface NoteTechnique {
    readonly vibrato: VibratoMetrics;
    readonly pitchStability: PitchStability;
    readonly attackRelease: AttackReleaseMetrics;
    readonly resonance: ResonanceMetrics;
    readonly rhythm: RhythmMetrics;
    readonly transition: TransitionMetrics;
}
/**
 * Represents a completed musical note segment.
 */
export interface NoteSegment {
    /** Unique identifier for the segment. */
    readonly segmentId: string;
    /** The zero-based index of the note within the exercise. */
    readonly noteIndex: number;
    /** The target pitch for the note. */
    readonly targetPitch: MusicalNoteName;
    /** The timestamp of the note's start (onset). */
    readonly startTime: TimestampMs;
    /** The timestamp of the note's end (offset). */
    readonly endTime: TimestampMs;
    /** Duration calculated from end - start. */
    readonly durationMs: TimestampMs;
    /** The expected start time for rhythm analysis. */
    readonly expectedStartTime?: TimestampMs;
    /** The expected duration for rhythm analysis. */
    readonly expectedDuration?: TimestampMs;
    /** Readonly array of frames that comprise the note. */
    readonly frames: ReadonlyArray<TechniqueFrame>;
}
/**
 * Represents a piece of pedagogical feedback.
 */
export interface Observation {
    /** The category of the technical observation. */
    readonly type: 'intonation' | 'vibrato' | 'rhythm' | 'attack' | 'stability' | 'resonance' | 'transition';
    /**
     * Severity level of the technical issue.
     *
     * @remarks
     * - 1: Minor issue (cosmetic, does not affect musicality)
     * - 2: Moderate issue (noticeable, affects quality)
     * - 3: Critical issue (fundamental flaw, requires immediate attention)
     */
    readonly severity: 1 | 2 | 3;
    /**
     * Confidence in this observation.
     *
     * @range 0.0 to 1.0
     * @remarks
     * - `< 0.5`: Low confidence (speculative, may be noise)
     * - `0.5-0.8`: Moderate confidence (likely accurate)
     * - `> 0.8`: High confidence (very reliable)
     */
    readonly confidence: Ratio01;
    /** User-facing description of the issue. */
    readonly message: string;
    /** Actionable pedagogical advice. */
    readonly tip: string;
    /** Optional raw data supporting this observation (for debugging). */
    readonly evidence?: Record<string, unknown>;
}
export {};

// ===== types-docs/lib/testing/mock-types.d.ts =====

import type { HTMLAttributes, ReactNode, SVGAttributes } from 'react';
import type { Exercise } from '@/lib/exercises/types';
import type { TechniqueFrame } from '@/lib/technique-types';
/** Versión parcial de Exercise para uso en tests unitarios. */
export type MockExercise = Pick<Exercise, 'id' | 'name' | 'notes'> & Partial<Exercise>;
/** AudioResources parcial para mocks en tests, evitando instanciar AudioContext real. */
export type MockAudioResources = {
    context: Pick<AudioContext, 'sampleRate'>;
    analyser: Pick<AnalyserNode, 'fftSize'> & {
        context: Pick<AudioContext, 'sampleRate'>;
    };
    stream: Pick<MediaStream, 'getTracks'>;
};
export interface MotionDivProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
}
export interface MotionCircleProps extends SVGAttributes<SVGCircleElement> {
    className?: string;
}
export interface AnimatePresenceProps {
    children?: ReactNode;
}
export interface GlobalThisWithCrypto {
    crypto: Crypto & {
        randomUUID?: () => string;
    };
}
/** Versión mutable de TechniqueFrame para construcción en tests. */
export type MutableTechniqueFrame = {
    -readonly [K in keyof TechniqueFrame]: TechniqueFrame[K];
};

// ===== types-docs/lib/ui-utils.d.ts =====

/**
 * Clamps a number between min and max values.
 * Refactored for range validation and positional argument limit.
 *
 * @param params - The clamp parameters `{ value, min, max }`.
 * @returns The clamped value.
 * @throws AppError - CODE: DATA_VALIDATION_ERROR if `min > max`.
 *
 * @example
 * ```ts
 * clamp({ value: 5, min: 0, max: 10 });   // 5
 * clamp({ value: -5, min: 0, max: 10 });  // 0
 * clamp({ value: 15, min: 0, max: 10 });  // 10
 * ```
 */
export declare function clamp(params: {
    value: number;
    min: number;
    max: number;
}): number;

// ===== types-docs/lib/ui-utils.test.d.ts =====

export {};

// ===== types-docs/lib/user-preferences.d.ts =====

/**
 * Sistema de niveles de feedback que adapta la complejidad visual
 * según la experiencia del usuario
 */
export type FeedbackLevel = 'beginner' | 'intermediate' | 'advanced';
export interface UserPreferences {
    feedbackLevel: FeedbackLevel;
    showTechnicalDetails: boolean;
    enableCelebrations: boolean;
    enableHaptics: boolean;
    soundFeedbackEnabled: boolean;
}
export declare const FEEDBACK_CONFIGS: Record<FeedbackLevel, {
    showCents: boolean;
    centsTolerance: number;
    showConfidence: boolean;
    visualStyle: 'emoji' | 'technical' | 'hybrid';
    celebrationIntensity: 'subtle' | 'moderate' | 'enthusiastic';
}>;

// ===== types-docs/lib/utils.d.ts =====

/**
 * Utils
 * General purpose utility functions for the application.
 */
import { type ClassValue } from 'clsx';
/**
 * Merges multiple Tailwind CSS classes and resolves conflicts.
 *
 * @param inputs - A list of class names, arrays, or objects to be merged.
 * @returns A single string of merged class names.
 *
 * @remarks
 * This utility combines `clsx` for conditional logic and `tailwind-merge`
 * to ensure that the last conflicting Tailwind class wins.
 *
 * @example
 * ```ts
 * cn('px-2 py-1', isPrimary && 'bg-blue-500', className)
 * ```
 */
export declare function cn(...inputs: ClassValue[]): string;

// ===== types-docs/playwright.config.d.ts =====

declare const _default: import("playwright/test").PlaywrightTestConfig<{}, {}>;
export default _default;

// ===== types-docs/public/workers/audio-processor.worker.d.ts =====

/**
 * Audio Processor Worker Skeleton
 *
 * This worker will eventually handle the YIN pitch detection algorithm
 * to offload the main thread during 60Hz audio analysis.
 */

// ===== types-docs/stores/achievements.store.d.ts =====

import type { AchievementCheckStats } from '@/lib/achievements/achievement-definitions';
/**
 * Represents a musical achievement or milestone unlocked by the user.
 *
 * @remarks
 * This model is used to reward consistency, accuracy, and technical growth.
 *
 * @public
 */
export interface Achievement {
    /**
     * Unique identifier for the achievement (e.g., 'first-perfect-scale').
     * Used as a key for translations and UI rendering.
     */
    id: string;
    /** Human-readable display name. */
    name: string;
    /** Detailed description of the accomplishment required to unlock this achievement. */
    description: string;
    /** Icon or emoji representation for visual feedback. */
    icon: string;
    /** Unix timestamp of the exact moment the achievement was first unlocked. */
    unlockedAtMs: number;
}
/**
 * State structure for the achievements store.
 *
 * @internal
 */
interface AchievementsState {
    /** Version of the persistence schema for automated migrations. */
    schemaVersion: 1;
    /** List of all permanently unlocked achievements in the user's history. */
    unlocked: Achievement[];
    /** Queue of achievements that have been unlocked but not yet acknowledged (toasted) in the UI. */
    pending: Achievement[];
}
/**
 * Actions for managing the achievement lifecycle and state transitions.
 *
 * @public
 */
interface AchievementsActions {
    /**
     * Checks current practice metrics against the global achievement library.
     *
     * @remarks
     * **Workflow**:
     * 1. **Evaluation**: Delegates to the pure `checkAchievements` domain logic
     *    to identify milestones met by the provided `stats`.
     * 2. **Deduplication**: Filters out milestones that have already been unlocked
     *    in previous sessions.
     * 3. **Persistence**: Updates the `unlocked` list with the new achievements.
     * 4. **Notification**: Adds the new achievements to the `pending` queue to
     *    ensure they are toasted in the UI.
     *
     * @param stats - Current practice performance and long-term progress metrics.
     * @returns Array of newly unlocked achievements in this specific check cycle.
     */
    check: (stats: AchievementCheckStats) => Achievement[];
    /**
     * Removes an achievement from the `pending` queue.
     *
     * @remarks
     * **UI Synchronization**:
     * This method should be called once the UI (e.g., a `sonner` toast or
     * `canvas-confetti` animation) has successfully acknowledged the achievement.
     * It prevents the same milestone from being announced multiple times
     * upon app reload or navigation.
     *
     * @param id - The unique ID of the achievement to acknowledge.
     */
    markShown: (id: string) => void;
}
/**
 * Zustand store for managing the persistent achievement system.
 *
 * @remarks
 * This store handles the "Gamification" layer of the application. It is decoupled
 * from the core practice engine to ensure that achievement logic doesn't block
 * the audio processing pipeline.
 *
 * **Architecture**:
 * - **Validation**: Uses Zod-based persistence (`validatedPersist`) to ensure
 *   milestone data is never corrupted.
 * - **Notification Queue**: Implements a `pending` queue to ensure that no
 *   achievement notification is missed, even if multiple are unlocked simultaneously.
 * - **Domain Delegation**: Delegates the actual "Check" logic to the pure
 *   `achievement-checker` module for better testability.
 *
 * @example
 * ```ts
 * const { unlocked, check } = useAchievementsStore();
 * ```
 *
 * @public
 */
export declare const useAchievementsStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AchievementsState & AchievementsActions>>;
export {};

// ===== types-docs/stores/analytics-facade.d.ts =====

import { PracticeSession } from '@/lib/domain/practice-session';
import { ProgressState } from './progress.store';
import { Achievement } from './achievements.store';
import { NoteTechnique } from '@/lib/technique-types';
interface AnalyticsFacadePartialState {
    progress?: Partial<ProgressState> & {
        achievements?: Achievement[];
    };
    sessions?: PracticeSession[];
    currentSession?: PracticeSession | undefined;
    currentPerfectStreak?: number;
}
/**
 * Temporary facade to maintain backward compatibility with the legacy analytics API.
 *
 * @remarks
 * This object aggregates multiple stores (Session, Progress, Achievements, History)
 * into a single interface. New code should prefer using the individual stores directly.
 *
 * @deprecated Use individual stores (e.g., `useSessionStore`, `useProgressStore`) directly.
 * @public
 */
export declare const useAnalyticsStore: (() => {
    /** The current active session, if any. */
    currentSession: PracticeSession | undefined;
    /** History of completed sessions. */
    sessions: PracticeSession[];
    /** Aggregated user progress. */
    progress: {
        achievements: Achievement[];
        schemaVersion: 1;
        totalPracticeSessions: number;
        totalPracticeTime: number;
        exercisesCompleted: string[];
        currentStreak: number;
        longestStreak: number;
        intonationSkill: number;
        rhythmSkill: number;
        overallSkill: number;
        exerciseStats: Record<string, import("./progress.store").ExerciseStats>;
        eventBuffer: import("./progress.store").ProgressEvent[];
        snapshots: import("./progress.store").ProgressSnapshot[];
        eventCounter: number;
        addSession: (session: PracticeSession) => void;
        updateSkills: (sessions: PracticeSession[]) => void;
    };
    /** Current streak of perfect notes. */
    currentPerfectStreak: number;
    /** Starts a new session. */
    startSession: (exerciseId: string, exerciseName: string, mode?: "tuner" | "practice") => void;
    /** Ends the current session and updates related stores. */
    endSession: () => PracticeSession | undefined;
    /** Records an attempt at a note. */
    recordNoteAttempt: (params: {
        noteIndex: number;
        pitch: string;
        cents: number;
        inTune: boolean;
    }) => void;
    /** Records a completed note and checks for achievements. */
    recordNoteCompletion: (params: {
        noteIndex: number;
        timeMs: number;
        technique?: NoteTechnique;
    }) => void;
    /** Manually triggers an achievement check. */
    checkAndUnlockAchievements: () => Achievement[];
    /** Retrieves filtered session history. */
    getSessionHistory: (days?: number) => PracticeSession[];
    /** Gets stats for a specific exercise. */
    getExerciseStats: (exerciseId: string) => import("./progress.store").ExerciseStats;
    /** Returns summary stats for the current day. */
    getTodayStats: () => {
        duration: number;
        accuracy: number;
        sessionsCount: number;
    };
    /** Returns streak information. */
    getStreakInfo: () => {
        current: number;
        longest: number;
    };
}) & {
    /** Imperative access to the facade's state. */
    getState: () => {
        currentSession: PracticeSession | undefined;
        sessions: PracticeSession[];
        progress: {
            achievements: Achievement[];
            schemaVersion: 1;
            totalPracticeSessions: number;
            totalPracticeTime: number;
            exercisesCompleted: string[];
            currentStreak: number;
            longestStreak: number;
            intonationSkill: number;
            rhythmSkill: number;
            overallSkill: number;
            exerciseStats: Record<string, import("./progress.store").ExerciseStats>;
            eventBuffer: import("./progress.store").ProgressEvent[];
            snapshots: import("./progress.store").ProgressSnapshot[];
            eventCounter: number;
            addSession: (session: PracticeSession) => void;
            updateSkills: (sessions: PracticeSession[]) => void;
        };
        currentPerfectStreak: number;
        startSession: (exerciseId: string, exerciseName: string, mode?: "tuner" | "practice") => void;
        recordNoteAttempt: (params: {
            noteIndex: number;
            pitch: string;
            cents: number;
            inTune: boolean;
        }) => void;
        recordNoteCompletion: (params: {
            noteIndex: number;
            timeMs: number;
            technique?: NoteTechnique;
        }) => void;
        endSession: () => PracticeSession | undefined;
        checkAndUnlockAchievements: () => never[];
    };
    /** Imperative state update (for compatibility). */
    setState: (partial: AnalyticsFacadePartialState) => void;
    /** Persistence options for the facade (migrated from legacy). */
    persist: {
        getOptions: () => {
            migrate: (persisted: unknown, version: number) => unknown;
        };
    };
};
export {};

// ===== types-docs/stores/analytics-store.d.ts =====

import { NoteTechnique } from '../lib/technique-types';
import { PracticeSession } from '@/lib/domain/practice-session';
import type { Exercise } from '@/lib/domain/musical-types';
/**
 * Long-term progress and skill model for the user.
 */
export interface UserProgress {
    userId: string;
    totalPracticeSessions: number;
    totalPracticeTime: number;
    exercisesCompleted: Exercise['id'][];
    currentStreak: number;
    longestStreak: number;
    intonationSkill: number;
    rhythmSkill: number;
    overallSkill: number;
    achievements: Achievement[];
    exerciseStats: Record<string, ExerciseStats>;
}
/** @internal */
export interface ExerciseStats {
    exerciseId: string;
    timesCompleted: number;
    bestAccuracy: number;
    averageAccuracy: number;
    fastestCompletionMs: number;
    lastPracticedMs: number;
}
/**
 * Represents a musical achievement or milestone earned by the user.
 */
export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAtMs: number;
}
/** Parameters for recording a note attempt. */
export interface RecordAttemptParams {
    noteIndex: number;
    targetPitch: string;
    cents: number;
    wasInTune: boolean;
}
/** Parameters for recording a note completion. */
export interface RecordCompletionParams {
    noteIndex: number;
    timeToCompleteMs?: number;
    technique?: NoteTechnique;
}
/**
 * Interface for the Analytics Store, managing long-term progress and session history.
 */
export interface AnalyticsStore {
    currentSession: PracticeSession | undefined;
    cleanOldSessions: (count?: number) => void;
    sessions: PracticeSession[];
    progress: UserProgress;
    onAchievementUnlocked?: (achievement: Achievement) => void;
    currentPerfectStreak: number;
    startSession: (params: {
        exerciseId: string;
        exerciseName: string;
        mode: 'tuner' | 'practice';
    }) => void;
    endSession: () => void;
    recordNoteAttempt: (params: RecordAttemptParams) => void;
    recordNoteCompletion: (params: RecordCompletionParams) => void;
    checkAndUnlockAchievements: () => void;
    getSessionHistory: (days?: number) => PracticeSession[];
    getExerciseStats: (exerciseId: string) => ExerciseStats | undefined;
    getTodayStats: () => {
        duration: number;
        accuracy: number;
        sessionsCount: number;
    };
    getStreakInfo: () => {
        current: number;
        longest: number;
    };
}
/**
 * Zustand store for persistent analytics and progress tracking.
 */
export declare const useAnalyticsStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<AnalyticsStore>, "setState" | "persist"> & {
    setState(partial: AnalyticsStore | Partial<AnalyticsStore> | ((state: AnalyticsStore) => AnalyticsStore | Partial<AnalyticsStore>), replace?: false | undefined): unknown;
    setState(state: AnalyticsStore | ((state: AnalyticsStore) => AnalyticsStore), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<AnalyticsStore, Pick<AnalyticsStore, "sessions" | "progress">, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: AnalyticsStore) => void) => () => void;
        onFinishHydration: (fn: (state: AnalyticsStore) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<AnalyticsStore, Pick<AnalyticsStore, "sessions" | "progress">, unknown>>;
    };
}>;

// ===== types-docs/stores/analytics-store.test.d.ts =====

export {};

// ===== types-docs/stores/persistence/validated-persist-middleware.d.ts =====

import { StateCreator } from 'zustand';
import { PersistOptions } from 'zustand/middleware';
import { z } from 'zod';
/**
 * Wrapper for Zustand's persist middleware that adds Zod validation.
 *
 * @remarks
 * Uses internal type casting for the state creator to handle complex mutator
 * array types from Zustand's middleware.
 */
export declare const validatedPersist: <T>(schema: z.ZodType<any>, config: StateCreator<T, [], []>, options: PersistOptions<T, unknown>) => StateCreator<T, [], []>;

// ===== types-docs/stores/practice-store-helpers.d.ts =====

/**
 * Helper functions for the PracticeStore to keep the main store file clean.
 */
import { type PracticeState, type PracticeEvent } from '@/lib/practice-core';
import { ReadyState, PracticeStoreState } from '@/lib/practice/practice-states';
import type { Exercise } from '@/lib/exercises/types';
import { Observation } from '@/lib/technique-types';
import { PracticeStore } from './practice-store';
/**
 * Returns the initial domain state for a new practice session.
 */
export declare function getInitialPracticeState(exercise: Exercise): PracticeState;
/**
 * Extracts live observations from the current practice state.
 */
export declare function getUpdatedLiveObservations(state: PracticeState): Observation[];
/**
 * Orchestrates domain state updates using the pure practice reducer.
 */
export declare function updatePracticeState(state: PracticeState | undefined, event: PracticeEvent): PracticeState | undefined;
/**
 * Ensures the store is in a 'ready' state, initializing audio if necessary.
 */
export declare function ensureReadyState(params: {
    getState: () => {
        state: PracticeStoreState;
    };
    initializeAudio: () => Promise<void>;
}): Promise<ReadyState | undefined>;
/**
 * Handles terminal failures in the session runner.
 */
export declare function handleRunnerFailure(params: {
    set: (fn: (s: PracticeStore) => Partial<PracticeStore>) => void;
    get: () => {
        state: PracticeStoreState;
    };
    err: unknown;
    exercise: Exercise;
}): void;

// ===== types-docs/stores/practice-store.d.ts =====

/**
 * PracticeStore
 *
 * Orchestrates a violin practice session, managing the lifecycle from exercise
 * selection to completion. It coordinates audio resources, real-time analysis,
 * and persistent progress tracking.
 */
import { type PracticeState, type PracticeEvent } from '@/lib/practice-core';
import { AppError } from '@/lib/errors/app-error';
import { AudioLoopPort, PitchDetectionPort } from '@/lib/ports/audio.port';
import { PracticeStoreState } from '@/lib/practice/practice-states';
import type { Exercise } from '@/lib/exercises/types';
import { Observation } from '@/lib/technique-types';
/**
 * Main store for managing the practice mode lifecycle and real-time audio pipeline.
 */
export interface PracticeStore {
    state: PracticeStoreState;
    practiceState: PracticeState | undefined;
    error: AppError | undefined;
    liveObservations: Observation[];
    autoStartEnabled: boolean;
    analyser: AnalyserNode | undefined;
    audioLoop: AudioLoopPort | undefined;
    detector: PitchDetectionPort | undefined;
    isStarting: boolean;
    isInitializing: boolean;
    sessionToken: string | undefined;
    sessionId: number;
    lastLoadedAt: number;
    loadExercise: (exercise: Exercise) => Promise<void>;
    setAutoStart: (enabled: boolean) => void;
    setNoteIndex: (index: number) => void;
    initializeAudio: () => Promise<void>;
    start: () => Promise<void>;
    stop: () => Promise<void>;
    reset: () => Promise<void>;
    consumePipelineEvents: (pipeline: AsyncIterable<PracticeEvent>) => Promise<void>;
}
type SafeUpdate = Pick<PracticeStore, 'practiceState' | 'liveObservations' | 'error'>;
type SafePartial = SafeUpdate | Partial<SafeUpdate> | ((s: PracticeStore) => Partial<SafeUpdate>);
export declare const usePracticeStore: import("zustand").UseBoundStore<import("zustand").StoreApi<PracticeStore>>;
/**
 * Creates a safe state update function for the practice session.
 * @internal
 */
export declare function createSafeSet(params: {
    set: (fn: (s: PracticeStore) => Partial<PracticeStore>) => void;
    get: () => PracticeStore;
    currentToken: string;
}): (partial: SafePartial) => void;
/** @internal */
export declare function calculateCentsTolerance(): number;
export {};

// ===== types-docs/stores/preferences-store.d.ts =====

import { UserPreferences, FeedbackLevel } from '@/lib/user-preferences';
/**
 * Interface for the Preferences Store, extending base {@link UserPreferences}.
 *
 * @remarks
 * This store manages the persistent configuration for the application's
 * behavior and UI.
 *
 * @public
 */
interface PreferencesStore extends UserPreferences {
    /**
     * Persistence schema version.
     *
     * @remarks
     * Used by the migrator to handle state structure changes across versions.
     */
    schemaVersion: 1;
    /**
     * Sets the pedagogical feedback level.
     *
     * @remarks
     * This level affects how many observations and what kind of technical
     * details are shown to the user during practice.
     *
     * @param level - The new feedback level (e.g., 'beginner', 'advanced').
     */
    setFeedbackLevel: (level: FeedbackLevel) => void;
    /**
     * Toggles visibility of technical cents/hertz details in the UI.
     *
     * @remarks
     * When disabled, the UI provides simplified pedagogical feedback (e.g.,
     * "Too High", "Good!"). When enabled, it reveals raw intonation metrics
     * (e.g., "+12 cents", "441.2 Hz").
     */
    toggleTechnicalDetails: () => void;
    /**
     * Toggles celebratory UI effects (e.g., confetti) on exercise completion.
     *
     * @remarks
     * Aimed at increasing student motivation upon mastering an exercise.
     */
    toggleCelebrations: () => void;
    /**
     * Toggles haptic feedback for mobile devices.
     *
     * @remarks
     * Provides tactile pulses when a note is successfully held for the required
     * duration. Requires a device that supports the Vibration API.
     */
    toggleHaptics: () => void;
    /**
     * Toggles audio-based feedback cues (beeps/tones) for correctness.
     *
     * @remarks
     * Useful for blind or low-vision users, or when the screen is not directly
     * visible during practice.
     */
    toggleSoundFeedback: () => void;
    /**
     * Resets all preferences to their initial factory default values.
     */
    resetToDefaults: () => void;
}
/**
 * Zustand store for managing persistent user preferences.
 *
 * @remarks
 * This store handles UI and pedagogical settings that customize the user experience.
 *
 * **Persistence Layer**:
 * It uses `validatedPersist` to ensure that data stored in `localStorage` remains
 * compliant with the `PreferencesStateSchema`. This prevents crashes due to corrupted
 * or outdated local storage data.
 *
 * **Telemetry**:
 * All critical preference changes are automatically tracked via the `analytics` service
 * to understand user engagement with different features.
 *
 * @example
 * ```ts
 * const { feedbackLevel, setFeedbackLevel } = usePreferencesStore();
 * ```
 *
 * **Persistence Strategy**:
 * Uses Zod validation on load to prevent corrupt local storage data from
 * crashing the application. Includes an incremental migrator for schema updates.
 *
 * @public
 */
export declare const usePreferencesStore: import("zustand").UseBoundStore<import("zustand").StoreApi<PreferencesStore>>;
export {};

// ===== types-docs/stores/progress.store.d.ts =====

import { PracticeSession } from '@/lib/domain/practice-session';
/**
 * Event representing a completed exercise within the progress history.
 *
 * @remarks
 * Used in the high-density circular buffer to track historical trends.
 *
 * @public
 */
export interface ProgressEvent {
    /** Unix timestamp of when the session ended. */
    ts: number;
    /** ID of the exercise practiced. */
    exerciseId: string;
    /** Accuracy achieved during the session (0-100). */
    accuracy: number;
    /** Average rhythmic error in milliseconds for the session. */
    rhythmErrorMs: number;
}
/**
 * Aggregated skill metrics across multiple technical domains.
 *
 * @public
 */
export interface SkillAggregates {
    /** Intonation accuracy score (0-100). Higher is better. */
    intonation: number;
    /** Rhythmic precision score (0-100). Based on onset timing error. */
    rhythm: number;
    /** Overall combined skill level based on pedagogical heuristics. */
    overall: number;
}
/**
 * A snapshot of the user's progress at a specific point in time.
 *
 * @remarks
 * Snapshots provide a historical record of technical growth, allowing the UI
 * to render progress charts over different time windows (7d, 30d).
 *
 * @public
 */
export interface ProgressSnapshot {
    /** The user identifier (defaults to 'anonymous' in standalone mode). */
    userId: string;
    /** The time window covered by this snapshot. */
    window: '7d' | '30d' | 'all';
    /** Aggregated skill levels captured at the time of snapshot creation. */
    aggregates: SkillAggregates;
    /** ID of the practice session that triggered this snapshot. */
    lastSessionId: string;
}
/**
 * Lifetime statistics for an individual exercise.
 *
 * @remarks
 * These metrics are used by the `ExerciseRecommender` to determine mastery
 * and suggest review cycles.
 *
 * @public
 */
export interface ExerciseStats {
    /** ID of the exercise. */
    exerciseId: string;
    /** Total number of times this exercise was successfully completed. */
    timesCompleted: number;
    /** Highest accuracy percentage ever recorded for this exercise. */
    bestAccuracy: number;
    /** Rolling average of accuracy across all historical attempts. */
    averageAccuracy: number;
    /** Fastest completion time ever recorded (ms). */
    fastestCompletionMs: number;
    /** Unix timestamp of the most recent practice attempt. */
    lastPracticedMs: number;
}
/**
 * State structure for the Progress Store.
 *
 * @remarks
 * This interface defines the shape of the user's persistent technical profile.
 *
 * @public
 */
export interface ProgressState {
    /** Version of the persistence schema for handling automated migrations. */
    schemaVersion: 1;
    /** Lifetime count of all started practice sessions. */
    totalPracticeSessions: number;
    /** Total lifetime practice time in seconds. */
    totalPracticeTime: number;
    /** IDs of unique exercises that have been completed at least once. */
    exercisesCompleted: string[];
    /** Current daily practice streak (number of consecutive days). */
    currentStreak: number;
    /** Highest daily streak recorded since account creation. */
    longestStreak: number;
    /** Current calculated intonation skill level (0-100). */
    intonationSkill: number;
    /** Current calculated rhythm skill level (0-100). */
    rhythmSkill: number;
    /** Combined overall skill level (0-100). */
    overallSkill: number;
    /** Map of exercise IDs to their detailed lifetime statistics. */
    exerciseStats: Record<string, ExerciseStats>;
    /** Circular buffer of recent progress events (maximum 1000 items). */
    eventBuffer: ProgressEvent[];
    /** Historical snapshots used for long-term trend analysis and charting. */
    snapshots: ProgressSnapshot[];
    /** Internal counter of sessions processed since last snapshot. */
    eventCounter: number;
}
/**
 * Actions available in the Progress Store for updating user performance.
 *
 * @public
 */
interface ProgressActions {
    /**
     * Integrates a completed session into the long-term progress history.
     *
     * @remarks
     * **Side Effects & Logic**:
     * 1. **Aggregation**: Updates lifetime session count and total practice time in seconds.
     * 2. **Mastery Stats**: Recalculates `ExerciseStats` for the given ID, including
     *    `bestAccuracy` and `fastestCompletionMs`.
     * 3. **Circular Buffer**: Pushes a new {@link ProgressEvent} to the `eventBuffer`.
     *    The buffer is capped at 1000 items to balance historical depth with memory usage.
     * 4. **Incremental Snapshots**: Automatically triggers a {@link ProgressSnapshot}
     *    every 50 events. This ensures long-term trends are preserved even if the
     *    buffer is pruned.
     * 5. **TTL Pruning**: Removes any events from the buffer that are older than
     *    90 days to comply with data retention best practices.
     *
     * @param session - The completed session data to persist and analyze.
     */
    addSession: (session: PracticeSession) => void;
    /**
     * Re-calculates domain-specific skill levels (intonation, rhythm).
     *
     * @remarks
     * Skill levels are calculated using weighted heuristics that prioritize recent
     * session performance over historical data.
     *
     * @param sessions - Recent session history to analyze.
     */
    updateSkills: (sessions: PracticeSession[]) => void;
}
/**
 * Zustand store for high-density, persistent progress tracking.
 *
 * @remarks
 * This store is the "Brain" of the user's progress. It is optimized for
 * durability and efficient historical analysis.
 *
 * **Architecture**:
 * - **Persistence**: Uses `validatedPersist` to ensure `localStorage` data remains
 *   valid according to the `ProgressStateSchema`.
 * - **Data Lifecycle**: Implements automatic pruning of old high-frequency data (90-day TTL)
 *   while preserving long-term aggregates in `snapshots`.
 * - **Skill Engine**: Encapsulates heuristics for determining violin mastery levels.
 *
 * @example
 * ```ts
 * const { overallSkill, addSession } = useProgressStore();
 * ```
 *
 * @public
 */
export declare const useProgressStore: import("zustand").UseBoundStore<import("zustand").StoreApi<ProgressState & ProgressActions>>;
export {};

// ===== types-docs/stores/progress.store.test.d.ts =====

export {};

// ===== types-docs/stores/session-history.store.d.ts =====

import { PracticeSession } from '@/lib/domain/practice-session';
/**
 * Internal state for the session history store.
 */
interface SessionHistoryState {
    /** Array of completed practice sessions, capped at 100. */
    sessions: PracticeSession[];
}
/**
 * Actions for managing session history.
 */
interface SessionHistoryActions {
    /**
     * Adds a completed session to the history.
     *
     * @param session - The session to add.
     */
    addSession: (session: PracticeSession) => void;
    /**
     * Retrieves sessions filtered by age.
     *
     * @param days - Number of days to look back.
     * @returns Filtered array of {@link PracticeSession}.
     */
    getHistory: (days?: number) => PracticeSession[];
}
/**
 * Zustand store for persisting and retrieving practice session history.
 *
 * @remarks
 * This store provides a simple persistent log of recent practice activity.
 * It uses `validatedPersist` to ensure data integrity.
 *
 * @public
 */
export declare const useSessionHistoryStore: import("zustand").UseBoundStore<import("zustand").StoreApi<SessionHistoryState & SessionHistoryActions>>;
export {};

// ===== types-docs/stores/session.store.d.ts =====

import { NoteTechnique } from '../lib/technique-types';
import { PracticeSession } from '@/lib/domain/practice-session';
/**
 * Internal state of the session store.
 *
 * @internal
 */
interface SessionState {
    /** The current active session data, or undefined if no session is active. */
    current: PracticeSession | undefined;
    /** Whether a session is currently being recorded. */
    isActive: boolean;
    /** Current streak of notes played with high accuracy (`< 5` cents). */
    perfectNoteStreak: number;
}
/**
 * Actions for managing practice sessions and recording real-time metrics.
 *
 * @public
 */
interface SessionActions {
    /**
     * Starts a new practice session recording.
     *
     * @remarks
     * Resets the `current` session state with initial metadata.
     *
     * @param exerciseId - Unique ID of the exercise.
     * @param exerciseName - Display name of the exercise.
     * @param mode - The session mode. Defaults to 'practice'.
     */
    start: (exerciseId: string, exerciseName: string, mode?: 'tuner' | 'practice') => void;
    /**
     * Ends the current session, calculates final metrics, and returns the data.
     *
     * @remarks
     * This method calculates the final accuracy and duration before clearing the active session.
     *
     * @returns The completed {@link PracticeSession} or undefined if no session was active.
     */
    end: () => PracticeSession | undefined;
    /**
     * Records a single attempt (audio frame) at a specific note.
     *
     * @remarks
     * This method updates the rolling average of cents deviation for the note using
     * the formula: `nextAvg = (currentAvg * count + newCents) / (count + 1)`.
     *
     * @param params - Parameters for the note attempt.
     */
    recordAttempt: (params: {
        noteIndex: number;
        pitch: string;
        cents: number;
        inTune: boolean;
    }) => void;
    /**
     * Records the successful completion of a note.
     *
     * @remarks
     * Updates the session progress and technical metrics.
     *
     * @param params - Parameters for the note completion.
     */
    recordCompletion: (params: {
        noteIndex: number;
        timeMs: number;
        technique?: NoteTechnique;
    }) => void;
}
/**
 * Zustand store for tracking real-time practice session metrics and history.
 *
 * @remarks
 * This store serves as a high-frequency accumulator for session data. It is
 * decoupled from the long-term `ProgressStore` and `AnalyticsStore` to ensure
 * that real-time updates don't trigger expensive persistence logic or
 * heavy recalculations on every audio frame.
 *
 * **Concurrency**: Updates are performed using Zustand's functional set state,
 * which is safe for high-frequency calls from the audio processing loop.
 *
 * **Metric Calculation**:
 * - Accuracy is calculated as the ratio of `notesCompleted` to `notesAttempted`.
 * - Average Cents uses a rolling mean to incorporate every detected frame.
 *
 * @public
 */
export declare const useSessionStore: import("zustand").UseBoundStore<import("zustand").StoreApi<SessionState & SessionActions>>;
export {};

// ===== types-docs/stores/tuner-store.d.ts =====

/**
 * TunerStore
 *
 * This module provides a Zustand store for the violin tuner.
 * It manages the audio pipeline for real-time pitch detection, microphone permissions,
 * and device selection.
 */
import type { TunerStore } from '@/lib/domain/musical-types';
/**
 * Zustand hook for accessing the TunerStore.
 *
 * @remarks
 * The TunerStore manages the state of the standalone violin tuner. It is designed
 * for high-frequency updates and robust hardware orchestration.
 *
 * **Core Responsibilities**:
 * - **Permission Lifecycle**: Tracks and triggers microphone authorization states.
 * - **Signal Analysis**: Interfaces with `PitchDetector` to extract note and deviation.
 * - **Device Management**: Allows selection and enumeration of audio input hardware.
 * - **Gain Control**: Adjusts sensitivity to match different environments (quiet rooms vs. loud studios).
 *
 * **Concurrency & Safety**:
 * It uses an internal `initToken` pattern to handle race conditions during asynchronous
 * initialization. If `initialize()` is called multiple times, only the result of the
 * latest call is applied to the store.
 *
 * @example
 * ```ts
 * const { state, initialize, updatePitch } = useTunerStore();
 * ```
 *
 * @public
 */
export declare const useTunerStore: import("zustand").UseBoundStore<import("zustand").StoreApi<TunerStore>>;

// ===== types-docs/vitest.config.d.ts =====

declare const _default: import("vite").UserConfig;
export default _default;

// ===== types-docs/vitest.setup.d.ts =====

export {};
