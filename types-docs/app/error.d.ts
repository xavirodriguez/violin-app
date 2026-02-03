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
