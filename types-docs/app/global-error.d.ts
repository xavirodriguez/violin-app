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
