
// ===== types-docs/.next/dev/types/validator.d.ts =====

export {};

// ===== types-docs/.next/types/validator.d.ts =====

export {};

// ===== types-docs/__tests__/practice-flow.test.d.ts =====

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

// ===== types-docs/components/analytics-dashboard.d.ts =====

/**
 * AnalyticsDashboard
 * Provides a comprehensive view of the user's practice history, skill levels, and achievements.
 */
/**
 * Main dashboard component that aggregates various analytics visualizations.
 *
 * @returns A JSX element with key metrics, skill bars, a practice time chart, and achievements.
 *
 * @remarks
 * Data Flow:
 * - Subscribes to `useAnalyticsStore` for the user's progress data.
 * - Uses internal utility functions to format data for the `recharts` components.
 */
export declare function AnalyticsDashboard(): import("react/jsx-runtime").JSX.Element;

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
    error: Error | null;
}
/**
 * A class-based component that catches JavaScript errors anywhere in its child component tree.
 *
 * @remarks
 * This boundary:
 * 1. Logs errors to the centralized `logger` with structured metadata.
 * 2. Provides a "Retry" button in its default fallback UI.
 * 3. Supports a custom `fallback` prop for tailored error states.
 *
 * Note: Error boundaries do not catch errors for event handlers, asynchronous code (e.g. `setTimeout`),
 * or server-side rendering.
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
}
export {};

// ===== types-docs/components/practice-feedback.d.ts =====

/**
 * PracticeFeedback
 * Provides visual feedback to the student during an interactive practice session.
 */
import { Observation } from '@/lib/technique-types';
/**
 * Props for the PracticeFeedback component.
 */
interface PracticeFeedbackProps {
    /** The full name of the note the student should play (e.g., "G3"). */
    targetNote: string | null;
    /** The name of the note currently being detected by the system. */
    detectedPitchName: string | null;
    /** The deviation from the ideal frequency in cents. */
    centsOff: number | null;
    /** Current status of the practice session (e.g., 'listening', 'validating', 'correct'). */
    status: string;
    /** Current duration the note has been held steadily (in ms). */
    holdDuration?: number;
    /** Total duration the note must be held to be considered correct (in ms). */
    requiredHoldTime?: number;
    /** Technical observations for feedback. */
    observations?: Observation[];
}
/**
 * Renders feedback during the practice loop.
 */
export declare function PracticeFeedback({ targetNote, detectedPitchName, centsOff, status, holdDuration, requiredHoldTime, observations, }: PracticeFeedbackProps): import("react/jsx-runtime").JSX.Element;
export {};

// ===== types-docs/components/practice-feedback.test.d.ts =====

export {};

// ===== types-docs/components/practice-mode.d.ts =====

/**
 * PracticeMode
 * The main container component for the interactive practice session.
 * It orchestrates exercise selection, audio processing, sheet music rendering,
 * and real-time feedback.
 */
/**
 * Renders the practice interface and manages its complex lifecycle.
 *
 * @remarks
 * State flow:
 * - `idle`: Shows exercise selector and "Start" button.
 * - `listening`: Audio loop is active, providing real-time feedback.
 * - `completed`: Shows success state and option to restart.
 */
export declare function PracticeMode(): import("react/jsx-runtime").JSX.Element;

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
 *
 * @remarks
 * Side Effects:
 * - Triggers `loadDevices()` from `useTunerStore` whenever the dialog is opened to ensure
 *   the list of microphones is up to date.
 *
 * Interactions:
 * - Direct connection to `useTunerStore` for reading and writing audio settings.
 */
declare const SettingsDialog: FC<SettingsDialogProps>;
export default SettingsDialog;

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
     * This should be the `containerRef` returned by `useOSMDSafe`.
     */
    containerRef: React.RefObject<HTMLDivElement | null>;
    /** Indicates if the sheet music has finished rendering. */
    isReady: boolean;
    /** Error message to display if rendering fails. */
    error: string | null;
}
/**
 * Renders the visual container and loading/error states for sheet music.
 *
 * @param props - Component properties.
 * @returns A JSX element with styled loading, error, and score regions.
 *
 * @remarks
 * This component is decoupled from the OSMD logic and focuses on the UI
 * representation. It uses absolute positioning for the loading spinner to
 * prevent layout shifts when the score is ready.
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
    note: string | null;
    /** The deviation from the ideal frequency in cents. */
    cents: number | null;
    /** The confidence level of the pitch detection (0-1). */
    confidence: number;
}
/**
 * Renders the tuner's main visual feedback.
 *
 * @param props - Component properties.
 * @returns A JSX element containing the note name, cents deviation, and a meter.
 *
 * @remarks
 * Features:
 * - Real-time needle movement based on `cents`.
 * - Color-coded zones (green for in-tune, yellow for close, red for far).
 * - Accessibility: Includes a screen-reader-only live region for pitch updates.
 */
export declare function TunerDisplay({ note, cents, confidence }: TunerDisplayProps): import("react/jsx-runtime").JSX.Element;
export {};

// ===== types-docs/components/tuner-mode.d.ts =====

/**
 * TunerMode
 * Provides the user interface for the violin tuner.
 * Handles the audio analysis loop and visualizes pitch detection results.
 */
/**
 * Main component for the Tuner mode.
 */
export declare function TunerMode(): import("react/jsx-runtime").JSX.Element;

// ===== types-docs/components/ui/button.d.ts =====

import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
declare const buttonVariants: (props?: ({
    variant?: "default" | "link" | "destructive" | "outline" | "secondary" | "ghost" | null | undefined;
    size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg" | null | undefined;
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

// ===== types-docs/components/ui/progress.d.ts =====

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
declare const Progress: React.ForwardRefExoticComponent<Omit<ProgressPrimitive.ProgressProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
export { Progress };

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
interface ViolinFingerboardProps {
    /** The note the student should be playing (e.g., "A4"). */
    targetNote: string | null;
    /** The note currently detected by the pitch tracker. */
    detectedPitchName: string | null;
    /** The deviation in cents from the ideal frequency. Used for visual offset. */
    centsDeviation: number | null;
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
export {};

// ===== types-docs/e2e/settings.spec.d.ts =====

export {};

// ===== types-docs/e2e/sheet-music-display.spec.d.ts =====

export {};

// ===== types-docs/hooks/use-osmd-safe.d.ts =====

/**
 * useOSMDSafe
 * A custom React hook for safely initializing and managing OpenSheetMusicDisplay (OSMD) instances.
 */
import { IOSMDOptions } from 'opensheetmusicdisplay';
/**
 * Hook for safely managing OpenSheetMusicDisplay instances.
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
 * **Lifecycle**:
 * - Mount: Creates OSMD instance when containerRef is available
 * - Update: Destroys and recreates on musicXML/options change
 * - Unmount: Cleans up OSMD resources automatically
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
    error: string | null;
    containerRef: import('react').RefObject<HTMLDivElement | null>;
    /** Safe to call anytime - no-op when !isReady */
    resetCursor: () => void;
    /** Safe to call anytime - no-op when !isReady */
    advanceCursor: () => void;
};

// ===== types-docs/hooks/use-osmd-safe.test.d.ts =====

export {};

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

// ===== types-docs/lib/domain/musical-domain.d.ts =====

/**
 * Musical Domain
 *
 * Defines the canonical types and normalization logic for musical concepts
 * shared across the application.
 */
/**
 * Represents a pitch alteration in a canonical numeric format.
 * -1: Flat (b)
 *  0: Natural
 *  1: Sharp (#)
 */
export type CanonicalAccidental = -1 | 0 | 1;
/**
 * Normalizes various accidental representations to canonical format.
 *
 * @param input - Accidental in any supported format:
 *   - Number: -1 (flat), 0 (natural), 1 (sharp)
 *   - String: "b"/"flat" (-1), "natural"/"" (0), "#"/"sharp" (1)
 *   - null/undefined: Treated as 0 (natural)
 *
 * @returns A CanonicalAccidental (-1, 0, or 1)
 * @throws Error - if input is invalid
 *
 * @example
 * normalizeAccidental(1);        // 1
 * normalizeAccidental("#");      // 1
 * normalizeAccidental("flat");   // -1
 * normalizeAccidental("X");      // ❌ Throws Error
 */
export declare function normalizeAccidental(input: number | string | null | undefined): CanonicalAccidental;

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
 * Exercise definitions for fundamental violin scales (G, D, A Major).
 *
 * @remarks
 * Scale practice is essential for developing muscle memory for finger
 * placements and improving intonation across different strings and hand positions.
 */
import type { ExerciseData } from '../types';
/**
 * List of beginner exercises for major scales.
 */
export declare const scalesExercises: ExerciseData[];

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

// ===== types-docs/lib/exercises/types.d.ts =====

/**
 * ExerciseTypes
 * Shared type definitions for violin exercises, covering musical properties,
 * score metadata, and exercise data structures.
 */
import type { CanonicalAccidental } from '@/lib/domain/musical-domain';
/** Represents the base name of a musical pitch. */
export type PitchName = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
/**
 * Represents a specific note on the musical staff.
 */
export interface Pitch {
    /** The letter name of the pitch. */
    step: PitchName;
    /** The octave number (e.g., 4 for Middle C). */
    octave: number;
    /**
     * The accidental for the pitch in canonical format.
     * @remarks -1 for flat, 0 for natural, 1 for sharp.
     */
    alter: CanonicalAccidental;
}
/**
 * Represents the rhythmic duration of a note in standard musical notation.
 * 1 = Whole, 2 = Half, 4 = Quarter, 8 = Eighth, 16 = 16th, 32 = 32nd.
 */
export type NoteDuration = 1 | 2 | 4 | 8 | 16 | 32;
/**
 * Represents a single musical note with its pitch and rhythmic duration.
 */
export interface Note {
    /** The pitch of the note. */
    pitch: Pitch;
    /** The duration of the note. */
    duration: NoteDuration;
}
/** Categories for grouping exercises. */
export type ExerciseCategory = 'Open Strings' | 'Scales' | 'Songs';
/** Difficulty levels for pedagogical progression. */
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
/**
 * Defines the attributes of a musical score.
 * Used for generating MusicXML headers.
 */
export interface ScoreMetadata {
    /** The clef used for the staff. Violin usually uses 'G'. */
    clef: 'G' | 'F' | 'C';
    /** The time signature of the piece. */
    timeSignature: {
        /** Number of beats per measure. */
        beats: number;
        /** The note value that represents one beat. */
        beatType: number;
    };
    /**
     * The key signature represented as the number of sharps (positive) or flats (negative).
     * Example: 2 for D Major, -1 for F Major, 0 for C Major.
     */
    keySignature: number;
}
/**
 * Interface for raw exercise data definitions.
 * This structure is used to define exercises in the category files.
 */
export interface ExerciseData {
    /** Unique identifier for the exercise. */
    id: string;
    /** Human-readable name of the exercise. */
    name: string;
    /** Brief description of the exercise's goal. */
    description: string;
    /** The pedagogical category. */
    category: ExerciseCategory;
    /** The intended difficulty level. */
    difficulty: Difficulty;
    /** Metadata required for score rendering. */
    scoreMetadata: ScoreMetadata;
    /** Ordered array of notes in the exercise. */
    notes: Note[];
}
/**
 * The processed exercise object consumed by the application.
 * Extends `ExerciseData` with the generated MusicXML string.
 */
export interface Exercise extends ExerciseData {
    /** The complete MusicXML representation of the exercise. */
    musicXML: string;
}

// ===== types-docs/lib/exercises/utils.d.ts =====

/**
 * Utility functions for handling exercise data.
 */
import type { NoteDuration, Pitch } from './types';
/**
 * Calculates the duration of a note in milliseconds based on BPM.
 */
export declare const getDurationMs: (duration: NoteDuration, bpm?: number) => number;
/**
 * Parses a pitch string (e.g., "G#4", "Bb3") into a Pitch object.
 */
export declare const parsePitch: (pitchString: string) => Pitch;

// ===== types-docs/lib/infrastructure/audio-manager.d.ts =====

/**
 * Audio Manager
 *
 * Infrastructure layer for managing Web Audio API resources.
 * Encapsulates the complexity of initialization, resource tracking, and cleanup.
 */
export interface AudioResources {
    context: AudioContext;
    stream: MediaStream;
    analyser: AnalyserNode;
    gainNode?: GainNode;
}
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
    getContext(): AudioContext | null;
    getStream(): MediaStream | null;
    getAnalyser(): AnalyserNode | null;
    setGain(value: number): void;
    isActive(): boolean;
}
/**
 * Singleton instance of the AudioManager to be used across the application.
 */
export declare const audioManager: AudioManager;

// ===== types-docs/lib/music-data.d.ts =====

/**
 * LegacyMusicData
 * Contains legacy exercise definitions and interfaces.
 *
 * @deprecated This module is maintained for backward compatibility.
 * Use the new exercise system in `lib/exercises/` for new features.
 */
import type { Exercise as ModernExercise } from './exercises/types';
/**
 * Represents a single musical note in the legacy system.
 * @internal
 */
interface Note {
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
 * @deprecated Use Exercise from `@/lib/exercises/types` instead.
 * This type will be removed in v2.0.
 */
export interface LegacyExercise {
    /** Unique identifier. */
    id: string;
    /** Human-readable name. */
    name: string;
    /** List of notes in the exercise. */
    notes: Note[];
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
export declare function adaptLegacyExercise(legacy: LegacyExercise): ModernExercise;
export {};

// ===== types-docs/lib/note-segmenter.d.ts =====

import { TechniqueFrame } from './technique-types';
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
}
/**
 * Represents the union of all possible events that can be emitted by the `NoteSegmenter`.
 * - `ONSET`: A new note has started.
 * - `OFFSET`: The current note has ended.
 * - `NOTE_CHANGE`: The pitch has changed mid-note without an intervening silence.
 */
export type SegmenterEvent = {
    type: 'ONSET';
    /** Timestamp when note attack was detected (ms) */
    timestamp: number;
    /** The detected note name (e.g., "A4") */
    noteName: string;
    /**
     * Frames captured during silence/transition before this note.
     * Used for analyzing attack quality and string crossing.
     */
    gapFrames: TechniqueFrame[];
} | {
    type: 'OFFSET';
    /** Timestamp when note release was detected (ms) */
    timestamp: number;
    /**
     * All frames captured during this note's sustain phase.
     * Used for intonation, vibrato, and stability analysis.
     */
    frames: TechniqueFrame[];
} | {
    type: 'NOTE_CHANGE';
    /** Timestamp of pitch change (ms) */
    timestamp: number;
    /** The new detected note name */
    noteName: string;
    /**
     * Frames captured during the pitch transition.
     * May indicate intentional glissando or unintentional sliding.
     */
    frames: TechniqueFrame[];
};
/**
 * A stateful class that processes a stream of `TechniqueFrame`s and emits events for note onsets, offsets, and changes.
 *
 * @remarks
 * This class implements a state machine (`SILENCE` or `NOTE`) with hysteresis and temporal debouncing
 * to robustly identify the start and end of musical notes from a real-time audio stream.
 * It aggregates frames for a completed note and provides them in the `OFFSET` event payload.
 *
 * The core logic is based on:
 * - RMS thresholds to distinguish signal from silence.
 * - Confidence scores from the pitch detector to filter noise.
 * - Debouncing timers to prevent spurious events from short fluctuations.
 */
export declare class NoteSegmenter {
    private options;
    private state;
    private currentNoteName;
    private frames;
    private gapFrames;
    private lastAboveThresholdTime;
    private lastBelowThresholdTime;
    private lastSignalTime;
    private pendingNoteName;
    private pendingSince;
    /**
     * Constructs a new `NoteSegmenter`.
     * @param options - Optional configuration to override the default segmentation parameters.
     */
    constructor(options?: Partial<SegmenterOptions>);
    /**
     * Processes a single `TechniqueFrame` and returns a `SegmenterEvent` if a note boundary is detected.
     *
     * @remarks
     * This method should be called for each new frame of audio analysis. It updates the internal state
     * and returns an event object (`ONSET`, `OFFSET`, `NOTE_CHANGE`) or `null` if no significant event occurred.
     *
     * @param frame - The `TechniqueFrame` to process.
     * @returns A `SegmenterEvent` or `null`.
     */
    processFrame(frame: TechniqueFrame): SegmenterEvent | null;
    private handleSilenceState;
    private handleNoteState;
    private checkNoteChange;
    /**
     * Resets the segmenter to its initial state.
     *
     * @remarks
     * This should be called when the audio stream is stopped or interrupted, ensuring that
     * the segmenter is ready for a new stream without carrying over any stale state.
     */
    reset(): void;
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
import type { PitchDetector } from '@/lib/pitch-detector';
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
    readonly targetNote: () => TargetNote | null;
    readonly getCurrentIndex: () => number;
}
/**
 * Creates an async iterable of raw pitch events from a Web Audio API AnalyserNode.
 */
export declare function createRawPitchStream(analyser: AnalyserNode, detector: PitchDetector, signal: AbortSignal): AsyncGenerator<RawPitchEvent>;
/**
 * Constructs the final practice event pipeline by connecting the raw pitch stream
 * to the technical analysis and note stability window.
 *
 * @remarks
 * This function serves as the main factory for creating a fully configured practice event stream.
 * It encapsulates the complexity of the underlying `iter-tools` pipeline and provides a simple
 * interface for the consumer.
 *
 * @param rawPitchStream - The source `AsyncIterable` of raw pitch events, typically from `createRawPitchStream`.
 * @param targetNote - A selector function that returns the current `TargetNote` to match against.
 * @param getCurrentIndex - A selector function to get the current note's index for rhythm analysis.
 * @param options - Optional configuration overrides for the pipeline.
 * @returns An `AsyncIterable` that yields `PracticeEvent` objects.
 */
export declare function createPracticeEventPipeline(rawPitchStream: AsyncIterable<RawPitchEvent>, targetNote: () => TargetNote | null, getCurrentIndex: () => number, options: Partial<NoteStreamOptions> & {
    exercise: Exercise;
    sessionStartTime: number;
}, signal: AbortSignal): AsyncIterable<PracticeEvent>;

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
    private readonly MIN_FREQUENCY;
    /**
     * The maximum frequency we care about (in Hz).
     * For violin, the highest common note is around E7 at ~2637 Hz.
     * We set this to 700 Hz by default to focus on the practical range for beginners.
     */
    private MAX_FREQUENCY;
    /**
     * The threshold for the YIN algorithm.
     * Lower values = more strict (fewer false positives, might miss quiet notes)
     * Higher values = more lenient (more detections, but less reliable)
     * 0.1 is a good balance for musical instruments.
     */
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
     * @throws Will throw an error if the sample rate is not a positive number.
     */
    constructor(sampleRate: number);
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
    /** Step 1: Difference function */
    private difference;
    /** Step 2: Cumulative mean normalized difference function */
    private cumulativeMeanNormalizedDifference;
    /** Step 3: Absolute threshold */
    private absoluteThreshold;
    /** Step 4: Parabolic interpolation */
    private parabolicInterpolation;
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

// ===== types-docs/lib/practice-core.d.ts =====

/**
 * This file contains the pure, side-effect-free core logic for the violin practice mode.
 * It defines the state, events, and a reducer function to handle state transitions in an immutable way.
 * This core is decoupled from React, Zustand, OSMD, and any browser-specific APIs.
 */
import { NoteTechnique, Observation } from './technique-types';
import type { Exercise, Note as TargetNote } from '@/lib/exercises/types';
export type { TargetNote };
/**
 * A valid note name in scientific pitch notation.
 *
 * @example "C4", "F#5", "Bb3"
 *
 * @remarks
 * Pattern: `^[A-G][#b]?(?:[0-8])$`
 */
export type NoteName = string & {
    readonly __brand: unique symbol;
};
/**
 * Type guard to validate note name format.
 *
 * @param name - The string to validate.
 * @throws Error - if the format is invalid.
 */
export declare function assertValidNoteName(name: string): asserts name is NoteName;
/**
 * Represents a musical note with properties derived from its frequency.
 * @remarks
 * The factory methods (`fromFrequency`, `fromMidi`, `fromName`) are strict and will
 * throw errors on invalid input, such as non-finite numbers or malformed note names.
 * This is intentional to catch data or programming errors early.
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
     * @throws Error - if format is invalid
     *
     * @example
     * MusicalNote.fromName("C#4" as NoteName); // ✅ OK
     * MusicalNote.fromName("H9" as NoteName);  // ❌ Throws Error
     */
    static fromName(fullName: NoteName): MusicalNote;
    get nameWithOctave(): NoteName;
}
/**
 * Defines the tolerance boundaries for matching a note.
 * Uses different values for entering and exiting the matched state
 * to prevent oscillation (hysteresis).
 */
export interface MatchHysteresis {
    /** Tolerance in cents to consider a note as "starting to match". */
    enter: number;
    /** Tolerance in cents to consider a note as "no longer matching". */
    exit: number;
}
/** Represents a note detected from the user's microphone input. */
export interface DetectedNote {
    pitch: string;
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
}
/** Events that can modify the practice state. */
export type PracticeEvent = {
    type: 'START';
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
    };
} | {
    type: 'NO_NOTE_DETECTED';
};
/**
 * Converts a `TargetNote`'s pitch into a standard, parsable note name string.
 *
 * @remarks
 * This function handles various `alter` formats, including numeric (`1`, `-1`) and
 * string-based (`"sharp"`, `"#"`), normalizing them into a format that `MusicalNote`
 * can parse (e.g., "C#4"). It will throw an error if the `alter` value is
 * unsupported, as this indicates a data validation issue upstream.
 *
 * @param pitch - The pitch object from a `TargetNote`.
 * @returns A standardized note name string like `"C#4"` or `"Bb3"`.
 */
export declare function formatPitchName(pitch: TargetNote['pitch']): NoteName;
/**
 * Checks if a detected note matches a target note within a specified tolerance.
 * Supports hysteresis to prevent rapid toggling near the tolerance boundary.
 *
 * @param target - The expected musical note.
 * @param detected - The note detected from audio.
 * @param tolerance - Either a fixed cent tolerance or a `MatchHysteresis` object.
 * @param isCurrentlyMatched - Whether the note was already matching in the previous frame.
 * @returns True if the detected note is considered a match.
 */
export declare function isMatch(target: TargetNote, detected: DetectedNote, tolerance?: number | MatchHysteresis, isCurrentlyMatched?: boolean): boolean;
/**
 * The core reducer for the practice mode, handling all state transitions.
 */
export declare function reducePracticeEvent(state: PracticeState, event: PracticeEvent): PracticeState;

// ===== types-docs/lib/practice-core.test.d.ts =====

export {};

// ===== types-docs/lib/practice/practice-event-sink.d.ts =====

import { type PracticeState, type PracticeEvent } from '@/lib/practice-core';
/**
 * A type representing the core state management functions of a Zustand store,
 * generic over the state type `T`.
 */
type StoreApi<T> = {
    getState: () => T;
    setState: (fn: (state: T) => T | Partial<T>) => void;
};
/**
 * Handles all state transitions and side effects for a given practice event.
 */
export declare const handlePracticeEvent: <T extends {
    practiceState: PracticeState | null;
}>(event: PracticeEvent, store: StoreApi<T>, onCompleted: () => void, analytics?: {
    endSession: () => void;
}) => void;
export {};

// ===== types-docs/lib/practice/session-runner.d.ts =====

import { type PracticeState } from '@/lib/practice-core';
import type { PitchDetector } from '@/lib/pitch-detector';
import type { Exercise } from '@/lib/exercises/types';
import { NoteTechnique } from '../technique-types';
interface SessionState {
    practiceState: PracticeState | null;
    analyser: AnalyserNode | null;
}
interface SessionRunnerDependencies {
    signal: AbortSignal;
    sessionId: number;
    store: {
        getState: () => SessionState;
        setState: (fn: (state: SessionState) => Partial<SessionState>) => void;
        stop: () => Promise<void>;
    };
    analytics: {
        recordNoteAttempt: (index: number, pitch: string, cents: number, inTune: boolean) => void;
        recordNoteCompletion: (index: number, time: number, technique?: NoteTechnique) => void;
        endSession: () => void;
    };
    detector: PitchDetector;
    exercise: Exercise;
    sessionStartTime: number;
}
/**
 * Runs the asynchronous practice loop, processing audio events and updating the store.
 *
 * @remarks
 * This function is decoupled from the Zustand store's internal structure,
 * relying instead on a minimal dependency interface. This allows for better
 * testability and prevents closure-related memory leaks or race conditions.
 */
export declare function runPracticeSession({ signal, sessionId, store, analytics, detector, exercise, sessionStartTime, }: SessionRunnerDependencies): Promise<void>;
export {};

// ===== types-docs/lib/stores/tuner-store.d.ts =====

/**
 * TunerStore
 *
 * This module provides a Zustand store for the violin tuner.
 * It manages the audio pipeline for real-time pitch detection, microphone permissions,
 * and device selection.
 */
import { PitchDetector } from '@/lib/pitch-detector';
import { AppError } from '@/lib/errors/app-error';
/** Possible states for the tuner state machine. */
type TunerState = 'IDLE' | 'INITIALIZING' | 'READY' | 'LISTENING' | 'DETECTED' | 'ERROR';
/** States for microphone permission handling. */
type PermissionState = 'PROMPT' | 'GRANTED' | 'DENIED';
/**
 * Interface representing the tuner store's state and actions.
 *
 * @remarks
 * State machine:
 * - `IDLE` -\> `INITIALIZING` -\> `READY` when `initialize()` is called.
 * - `READY` -\> `LISTENING` when `startListening()` is called.
 * - `LISTENING` to/from `DETECTED` based on whether a clear pitch is found.
 *
 * Error handling:
 * - Errors during initialization transition the state to `ERROR`.
 * - `retry()` can be used to attempt initialization again.
 */
interface TunerStore {
    /** The current high-level state of the tuner. */
    state: TunerState;
    /** Current microphone permission status. */
    permissionState: PermissionState;
    /** Detailed error object if the state is `ERROR`. */
    error: AppError | null;
    /** The detected frequency in Hz. */
    currentPitch: number | null;
    /** The musical name of the detected pitch (e.g., "A4"). */
    currentNote: string | null;
    /** Deviation from the ideal pitch in cents. */
    centsDeviation: number | null;
    /**
     * Confidence level of the pitch detection (0 to 1).
     * Typically \> 0.85 is considered a reliable signal.
     */
    confidence: number;
    /** The Web Audio API context. */
    audioContext: AudioContext | null;
    /** AnalyserNode for frequency analysis. */
    analyser: AnalyserNode | null;
    /** The media stream from the microphone. */
    mediaStream: MediaStream | null;
    /** The audio source node created from the media stream. */
    source: MediaStreamAudioSourceNode | null;
    /** The pitch detection algorithm instance. */
    detector: PitchDetector | null;
    /** Gain node to control input sensitivity. */
    gainNode: GainNode | null;
    /** List of available audio input devices. */
    devices: MediaDeviceInfo[];
    /** ID of the currently selected audio input device. */
    deviceId: string | null;
    /**
     * Input sensitivity (0 to 100).
     * Maps to gain: 0 -\> 0x, 50 -\> 1x, 100 -\> 2x.
     */
    sensitivity: number;
    /**
     * Initializes the audio pipeline and requests microphone access.
     * @remarks
     * Implements a session guard using a token to prevent race conditions
     * if multiple initializations are triggered.
     */
    initialize: () => Promise<void>;
    /** Resets the store and attempts to initialize again. */
    retry: () => Promise<void>;
    /** Stops all audio processing and releases resources. */
    reset: () => Promise<void>;
    /**
     * Updates the detected pitch and note based on new analysis results.
     * @param pitch - The detected frequency in Hz.
     * @param confidence - The confidence of the detection.
     */
    updatePitch: (pitch: number, confidence: number) => void;
    /** Transitions state to `LISTENING`. Only valid if state is `READY`. */
    startListening: () => void;
    /** Transitions state to `READY` and clears detection data. */
    stopListening: () => void;
    /**
     * Enumerates available audio input devices.
     * @remarks
     * If permission is 'PROMPT', it will trigger a brief initialization/reset cycle
     * to gain the necessary permissions to see device labels.
     */
    loadDevices: () => Promise<void>;
    /** Sets the active microphone device and re-initializes. */
    setDeviceId: (deviceId: string) => Promise<void>;
    /**
     * Sets the input sensitivity and updates the gain node immediately.
     * @param sensitivity - New sensitivity value (0-100).
     */
    setSensitivity: (sensitivity: number) => void;
}
/**
 * Hook for accessing the tuner store.
 */
export declare const useTunerStore: import("zustand").UseBoundStore<import("zustand").StoreApi<TunerStore>>;
export {};

// ===== types-docs/lib/technique-analysis-agent.d.ts =====

import { TechniqueFrame, NoteSegment, NoteTechnique, Observation } from './technique-types';
/**
 * A stateful agent that analyzes note segments to provide detailed technical feedback.
 *
 * @remarks
 * This class encapsulates the signal processing and heuristic logic for evaluating
 * various aspects of violin technique, such as vibrato, pitch stability, and rhythm.
 * It is designed to be instantiated once and reused for each note segment detected
 * in a practice session.
 *
 * The agent's workflow is typically:
 * 1.  `analyzeSegment` is called with a completed `NoteSegment`.
 * 2.  This produces a `NoteTechnique` object containing dozens of quantitative metrics.
 * 3.  `generateObservations` is called with the `NoteTechnique` object.
 * 4.  This produces an array of human-readable `Observation`s, which are prioritized
 *     and filtered pedagogical tips ready for display to the user.
 */
export declare class TechniqueAnalysisAgent {
    options: unknown;
    /**
     * Analyzes a `NoteSegment` and computes a comprehensive set of technique metrics.
     *
     * @param segment - The `NoteSegment` to analyze, containing all frames of the note.
     * @param gapFrames - Optional frames from the silence preceding the note, used for transition analysis.
     * @returns A `NoteTechnique` object with detailed metrics.
     */
    analyzeSegment(segment: NoteSegment, gapFrames?: TechniqueFrame[], prevSegment?: NoteSegment | null): NoteTechnique;
    private calculateStability;
    private calculateVibrato;
    private calculateAttackRelease;
    private calculateResonance;
    private calculateRhythm;
    private calculateTransition;
    calculateGlissando(gapFrames: TechniqueFrame[]): number;
    calculateLandingError(currentFrames: TechniqueFrame[], startTime: number): number;
    calculateCorrectionCount(currentFrames: TechniqueFrame[], startTime: number): number;
    /**
     * Generates a list of human-readable observations based on computed technique metrics.
     *
     * @remarks
     * This method acts as an "intelligent feedback motor". It applies a set of pedagogical rules
     * and heuristics to the quantitative data in the `NoteTechnique` object to produce
     * actionable, prioritized feedback for the user. The observations are sorted by
     * a combination of severity and confidence.
     *
     * @param technique - The `NoteTechnique` object produced by `analyzeSegment`.
     * @returns An array of `Observation` objects, ready for display.
     */
    generateObservations(technique: NoteTechnique): Observation[];
    private generateStabilityObservations;
    private generateVibratoObservations;
    private generateAttackObservations;
    private generateTransitionObservations;
    private generateResonanceObservations;
    private generateRhythmObservations;
    /** @internal */
    private calculateStdDev;
    /**
     * Calculates the pitch drift over a series of frames using linear regression.
     * @internal
     */
    private calculateDrift;
    /**
     * Removes the linear trend from a series of cents values.
     * @internal
     */
    private detrend;
    /**
     * Finds the dominant period in a signal using autocorrelation.
     * @internal
     */
    private findPeriod;
}

// ===== types-docs/lib/technique-analysis-agent.test.d.ts =====

export {};

// ===== types-docs/lib/technique-types.d.ts =====

/**
 * Types and interfaces for advanced violin technique analysis.
 */
/**
 * A single frame of analysis from the audio pipeline, enriched with technique-related data.
 */
export interface TechniqueFrame {
    /** The timestamp of the frame in milliseconds. */
    timestamp: number;
    /** The detected fundamental frequency in Hertz. */
    pitchHz: number;
    /** The pitch deviation in cents from the nearest note. */
    cents: number;
    /** The Root Mean Square (volume) of the frame. */
    rms: number;
    /** The confidence of the pitch detection algorithm (0-1). */
    confidence: number;
    /** The name of the detected note (e.g., "C#4"). */
    noteName: string;
}
/**
 * Metrics related to the quality and characteristics of vibrato.
 */
export interface VibratoMetrics {
    /** `true` if vibrato is detected in the note segment. */
    present: boolean;
    /** The speed of the vibrato in Hertz (oscillations per second). */
    rateHz: number;
    /** The average pitch modulation width of the vibrato in cents. */
    widthCents: number;
    /** A score from 0 to 1 indicating the consistency of the vibrato's rate and width. */
    regularity: number;
}
/**
 * Metrics related to pitch stability and intonation control.
 */
export interface PitchStability {
    /** The standard deviation of pitch (in cents) after the initial note attack (settling period). */
    settlingStdCents: number;
    /** The overall standard deviation of pitch (in cents) for the entire note. */
    globalStdCents: number;
    /** The rate of pitch change over time, calculated via linear regression, in cents per second. */
    driftCentsPerSec: number;
    /** The proportion of frames (0-1) that are within the target intonation tolerance. */
    inTuneRatio: number;
}
/**
 * Metrics related to the beginning (attack) and end (release) of a note.
 */
export interface AttackReleaseMetrics {
    /** The time in milliseconds from note onset to reaching 90% of the maximum volume (RMS). */
    attackTimeMs: number;
    /** The pitch difference in cents between the start of the note and its stable pitch, indicating a "scoop". */
    pitchScoopCents: number;
    /** The standard deviation of pitch (in cents) in the final milliseconds of the note, indicating release control. */
    releaseStability: number;
}
/**
 * Metrics related to the tonal quality and resonance of the note.
 */
export interface ResonanceMetrics {
    /** `true` if a "wolf tone" (a problematic, unstable resonance) is suspected. */
    suspectedWolf: boolean;
    /** A score indicating the presence of periodic volume fluctuations (beating). */
    rmsBeatingScore: number;
    /** A score indicating chaotic or unstable pitch fluctuations. */
    pitchChaosScore: number;
    /** The proportion of high-volume frames that have low pitch-detection confidence. */
    lowConfRatio: number;
}
/**
 * Metrics related to the transition between two notes.
 */
export interface TransitionMetrics {
    /** The duration in milliseconds of the silence or glissando between notes. */
    transitionTimeMs: number;
    /** The total pitch change in cents during an audible slide (glissando). */
    glissAmountCents: number;
    /** The average pitch error in cents at the very beginning of the new note. */
    landingErrorCents: number;
    /** The number of times the pitch crosses the center line during the note's start, indicating instability. */
    correctionCount: number;
}
/**
 * Metrics related to rhythmic accuracy.
 */
export interface RhythmMetrics {
    /** The timing error in milliseconds of the note's start (onset) compared to the expected time. */
    onsetErrorMs: number;
    /** The error in milliseconds of the note's total duration compared to the expected duration. */
    durationErrorMs?: number;
}
/**
 * A comprehensive collection of all technique metrics calculated for a single note.
 */
export interface NoteTechnique {
    vibrato: VibratoMetrics;
    pitchStability: PitchStability;
    attackRelease: AttackReleaseMetrics;
    resonance: ResonanceMetrics;
    rhythm: RhythmMetrics;
    transition: TransitionMetrics;
}
/**
 * Represents a completed musical note, containing all its analysis frames and metadata.
 */
export interface NoteSegment {
    /** The zero-based index of the note within the exercise. */
    noteIndex: number;
    /** The target pitch for the note (e.g., "A#4"). */
    targetPitch: string;
    /** The timestamp of the note's start (onset) in milliseconds. */
    startTime: number;
    /** The timestamp of the note's end (offset) in milliseconds. */
    endTime: number;
    /** The expected start time for rhythm analysis. */
    expectedStartTime?: number;
    /** The expected duration for rhythm analysis. */
    expectedDuration?: number;
    /** An array of all `TechniqueFrame`s that comprise the note. */
    frames: TechniqueFrame[];
}
/**
 * Represents a piece of human-readable pedagogical feedback.
 */
export interface Observation {
    /** The category of the observation. */
    type: 'intonation' | 'vibrato' | 'rhythm' | 'attack' | 'stability' | 'resonance' | 'transition';
    /**
     * Severity level of the technical issue.
     *
     * @remarks
     * - 1: Minor issue (cosmetic, does not affect musicality)
     * - 2: Moderate issue (noticeable, affects quality)
     * - 3: Critical issue (fundamental flaw, requires immediate attention)
     */
    severity: 1 | 2 | 3;
    /**
     * Confidence in this observation.
     *
     * @remarks
     * Range: 0.0 to 1.0.
     * - \< 0.5: Low confidence (speculative, may be noise)
     * - 0.5-0.8: Moderate confidence (likely accurate)
     * - \> 0.8: High confidence (very reliable)
     */
    confidence: number;
    /** User-facing description of the issue */
    message: string;
    /** Actionable pedagogical advice */
    tip: string;
    /** Optional raw data supporting this observation (for debugging) */
    evidence?: unknown;
}

// ===== types-docs/lib/ui-utils.d.ts =====

/**
 * Clamps a number between min and max values.
 *
 * @param value - The number to clamp
 * @param min - Minimum boundary
 * @param max - Maximum boundary
 * @returns The clamped value
 * @throws AppError - CODE: DATA_VALIDATION_ERROR if min \> max
 *
 * @example
 * clamp(5, 0, 10);   // 5
 * clamp(-5, 0, 10);  // 0
 * clamp(15, 0, 10);  // 10
 * clamp(5, 10, 0);   // ❌ Throws AppError
 */
export declare function clamp(value: number, min: number, max: number): number;

// ===== types-docs/lib/ui-utils.test.d.ts =====

export {};

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

declare const _default: import("@playwright/test").PlaywrightTestConfig<{}, {}>;
export default _default;

// ===== types-docs/stores/analytics-store.d.ts =====

import { NoteTechnique } from '../lib/technique-types';
interface Note {
    pitch: string;
    duration: string;
    measure: number;
}
interface Exercise {
    id: string;
    name: string;
    notes: Note[];
}
/** Represents a single, completed practice session. */
export interface PracticeSession {
    id: string;
    startTimeMs: number;
    endTimeMs: number;
    durationMs: number;
    exerciseId: string;
    exerciseName: string;
    mode: 'tuner' | 'practice';
    notesAttempted: number;
    notesCompleted: number;
    accuracy: number;
    averageCents: number;
    noteResults: NoteResult[];
}
/** Contains detailed metrics for a single note within a practice session. */
interface NoteResult {
    noteIndex: number;
    targetPitch: string;
    attempts: number;
    timeToCompleteMs: number;
    averageCents: number;
    wasInTune: boolean;
    technique?: NoteTechnique;
}
/** A comprehensive model of the user's long-term progress and stats. */
interface UserProgress {
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
/** Stores lifetime performance statistics for a specific exercise. */
interface ExerciseStats {
    exerciseId: string;
    timesCompleted: number;
    bestAccuracy: number;
    averageAccuracy: number;
    fastestCompletionMs: number;
    lastPracticedMs: number;
}
/** Represents a single unlockable achievement. */
export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAtMs: number;
}
/**
 * Defines the state and actions for the analytics Zustand store.
 */
export interface AnalyticsStore {
    currentSession: PracticeSession | null;
    sessions: PracticeSession[];
    progress: UserProgress;
    startSession: (exerciseId: string, exerciseName: string, mode: 'tuner' | 'practice') => void;
    endSession: () => void;
    recordNoteAttempt: (noteIndex: number, targetPitch: string, cents: number, wasInTune: boolean) => void;
    recordNoteCompletion: (noteIndex: number, timeToCompleteMs: number, technique?: NoteTechnique) => void;
    getSessionHistory: (days?: number) => PracticeSession[];
    getExerciseStats: (exerciseId: string) => ExerciseStats | null;
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
 * Zustand persistence middleware with typed storage.
 *
 * @remarks
 * The `any` in PersistOptions represents the serialized state type.
 * To enforce type safety on persisted data:
 * 1. All store properties must be JSON-serializable
 * 2. No functions, Dates, or class instances in state
 * 3. Use partialize option to exclude non-serializable fields
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
export {};

// ===== types-docs/stores/analytics-store.test.d.ts =====

export {};

// ===== types-docs/stores/practice-store.d.ts =====

/**
 * PracticeStore
 *
 * This module provides a Zustand store for managing the state of a violin practice session.
 * It handles exercise loading, audio resource management, and the real-time pitch detection loop.
 */
import { type PracticeState } from '@/lib/practice-core';
import { PitchDetector } from '@/lib/pitch-detector';
import { type AppError } from '@/lib/errors/app-error';
import type { Exercise } from '@/lib/exercises/types';
/**
 * Interface representing the state and actions of the practice store.
 */
interface PracticeStore {
    practiceState: PracticeState | null;
    error: AppError | null;
    analyser: AnalyserNode | null;
    detector: PitchDetector | null;
    isStarting: boolean;
    loadExercise: (exercise: Exercise) => Promise<void>;
    start: () => Promise<void>;
    stop: () => Promise<void>;
    reset: () => Promise<void>;
}
export declare const usePracticeStore: import("zustand").UseBoundStore<import("zustand").StoreApi<PracticeStore>>;
export {};

// ===== types-docs/stores/tuner-store.d.ts =====

/**
 * TunerStore
 *
 * This module provides a Zustand store for the violin tuner.
 * It manages the audio pipeline for real-time pitch detection, microphone permissions,
 * and device selection.
 */
import { PitchDetector } from '@/lib/pitch-detector';
import { AppError } from '@/lib/errors/app-error';
/**
 * Possible states for the tuner state machine.
 * @remarks Uses a Discriminated Union to ensure that properties like `pitch` or `error`
 * are only accessible when the state machine is in the appropriate phase.
 * Transitions: IDLE -\> INITIALIZING -\> READY -\> LISTENING \<-\> DETECTED
 */
type TunerState = {
    kind: 'IDLE';
} | {
    kind: 'INITIALIZING';
    readonly sessionToken: number;
} | {
    kind: 'READY';
    readonly sessionToken: number;
} | {
    kind: 'LISTENING';
    readonly sessionToken: number;
} | {
    kind: 'DETECTED';
    pitch: number;
    note: string;
    cents: number;
    confidence: number;
    readonly sessionToken: number;
} | {
    kind: 'ERROR';
    error: AppError;
};
/** States for microphone permission handling. */
type PermissionState = 'PROMPT' | 'GRANTED' | 'DENIED';
/**
 * Interface representing the tuner store's state and actions.
 */
interface TunerStore {
    /**
     * Current state with session tracking.
     *
     * @remarks
     * States with `sessionToken` prevent stale updates from previous sessions.
     * If you call `initialize()` twice, only the latest session updates state.
     */
    state: TunerState;
    /** Current microphone permission status. */
    permissionState: PermissionState;
    /** The pitch detection algorithm instance. */
    detector: PitchDetector | null;
    /** List of available audio input devices. */
    devices: MediaDeviceInfo[];
    /** ID of the currently selected audio input device. */
    deviceId: string | null;
    /**
     * Input sensitivity (0 to 100).
     * Maps to gain: 0 -\> 0x, 50 -\> 1x, 100 -\> 2x.
     */
    sensitivity: number;
    /** Derived getter for the current analyser. */
    analyser: AnalyserNode | null;
    /**
     * Initializes audio pipeline with automatic session management.
     *
     * @remarks
     * **Concurrency Safety**:
     * - Multiple calls are safe: previous sessions are automatically invalidated
     * - Uses internal token (exposed in state.sessionToken) to prevent race conditions
     * - If a previous initialization is pending, it will be cancelled
     *
     * **State Transitions**:
     * - IDLE → INITIALIZING → READY (success)
     * - IDLE → INITIALIZING → ERROR (failure)
     *
     * @throws Never throws - errors are captured in state.error
     */
    initialize: () => Promise<void>;
    /** Resets the store and attempts to initialize again. */
    retry: () => Promise<void>;
    /** Stops all audio processing and releases resources. */
    reset: () => Promise<void>;
    /**
     * Updates the detected pitch and note based on new analysis results.
     * @param pitch - The detected frequency in Hz.
     * @param confidence - The confidence of the detection.
     */
    updatePitch: (pitch: number, confidence: number) => void;
    /** Transitions state to `LISTENING`. Only valid if state is `READY`. */
    startListening: () => void;
    /** Transitions state to `READY` and clears detection data. */
    stopListening: () => void;
    /**
     * Enumerates available audio input devices.
     * @remarks
     * If permission is 'PROMPT', it will trigger a brief initialization/reset cycle
     * to gain the necessary permissions to see device labels.
     */
    loadDevices: () => Promise<void>;
    /** Sets the active microphone device and re-initializes. */
    setDeviceId: (deviceId: string) => Promise<void>;
    /**
     * Sets the input sensitivity and updates the gain node immediately.
     * @param sensitivity - New sensitivity value (0-100).
     */
    setSensitivity: (sensitivity: number) => void;
}
/**
 * Hook for accessing the tuner store.
 */
export declare const useTunerStore: import("zustand").UseBoundStore<import("zustand").StoreApi<TunerStore>>;
export {};

// ===== types-docs/vitest.config.d.ts =====

declare const _default: import("vite").UserConfig;
export default _default;
