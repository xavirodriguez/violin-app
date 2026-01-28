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
