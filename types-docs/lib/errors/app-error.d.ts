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
/**
 * Normalizes any caught value into an `AppError`.
 *
 * @remarks
 * This utility is a cornerstone of the error handling strategy. It ensures that
 * regardless of what is thrown—a standard `Error`, a `DOMException` from a browser
 * API, a plain string, or an `AppError` itself—we always end up with a consistent,
 * structured `AppError` object. This simplifies error processing in stores,
 * loggers, and UI boundaries.
 *
 * @param err - The value that was caught in a `try...catch` block.
 * @param fallbackCode - The `ErrorCode` to use if the error is not already an `AppError`.
 * @param context - Additional key-value pairs to attach for debugging.
 * @returns A standardized `AppError` instance.
 */
export declare function toAppError(err: unknown, fallbackCode?: ErrorCode, context?: Record<string, unknown>): AppError;
