/**
 * @file Defines a standardized application error structure to ensure consistent
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
export type ErrorSeverity = 'fatal' | 'error' | 'warning'

/**
 * A standardized dictionary of error codes.
 * @remarks Using codes instead of raw messages allows for easier error tracking,
 * localization, and prevents sensitive information from leaking into logs or UI.
 */
export const ERROR_CODES = {
  // --- Core & System ---
  UNKNOWN: 'UNKNOWN', // An unspecified or unexpected error.
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED', // A feature that is not yet implemented.

  // --- Audio Subsystem ---
  AUDIO_CONTEXT_FAILED: 'AUDIO_CONTEXT_FAILED', // Failed to create or resume AudioContext.
  MIC_PERMISSION_DENIED: 'MIC_PERMISSION_DENIED', // User denied microphone access.
  MIC_NOT_FOUND: 'MIC_NOT_FOUND', // No microphone device was found.
  MIC_IN_USE: 'MIC_IN_USE', // Microphone is already in use by another application.
  MIC_GENERIC_ERROR: 'MIC_GENERIC_ERROR', // Other `getUserMedia` or device errors.

  // --- Data & State ---
  STATE_INVALID_TRANSITION: 'STATE_INVALID_TRANSITION', // An illegal state transition was attempted.
  DATA_VALIDATION_ERROR: 'DATA_VALIDATION_ERROR', // Input data failed validation.
  NOTE_PARSING_FAILED: 'NOTE_PARSING_FAILED', // Failed to parse a musical note from a string.

  // --- Rendering & UI ---
  OSMD_INIT_FAILED: 'OSMD_INIT_FAILED', // OpenSheetMusicDisplay failed to initialize.
  OSMD_RENDER_FAILED: 'OSMD_RENDER_FAILED', // OSMD failed to render a score.
  COMPONENT_RENDER_ERROR: 'COMPONENT_RENDER_ERROR', // A React component failed to render.
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

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
export class AppError extends Error {
  public readonly id: string
  public readonly code: ErrorCode
  public readonly severity: ErrorSeverity
  public readonly context?: Record<string, unknown>
  public readonly cause?: unknown // The original error

  constructor(params: {
    message: string
    code?: ErrorCode
    severity?: ErrorSeverity
    context?: Record<string, unknown>
    cause?: unknown
  }) {
    super(params.message)
    this.name = 'AppError'
    this.id = `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    this.code = params.code || ERROR_CODES.UNKNOWN
    this.severity = params.severity || 'error'
    this.context = params.context
    this.cause = params.cause

    // This is necessary to ensure `instanceof AppError` works correctly.
    Object.setPrototypeOf(this, AppError.prototype)
  }
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
export function toAppError(
  err: unknown,
  fallbackCode: ErrorCode = ERROR_CODES.UNKNOWN,
  context: Record<string, unknown> = {},
): AppError {
  if (err instanceof AppError) {
    // If context is provided, merge it with the existing error's context.
    if (Object.keys(context).length > 0) {
      return new AppError({
        ...err,
        context: { ...err.context, ...context },
      })
    }
    return err
  }

  if (err instanceof Error) {
    let code = fallbackCode
    let message = err.message

    // --- DOMException Mapping ---
    // UserMedia errors have specific names we can map to our codes.
    if (err.name === 'NotAllowedError') {
      code = ERROR_CODES.MIC_PERMISSION_DENIED
      message = 'Microphone access was denied. Please grant permission in your browser settings.'
    } else if (err.name === 'NotFoundError') {
      code = ERROR_CODES.MIC_NOT_FOUND
      message = 'No microphone was found. Please ensure one is connected and enabled.'
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      code = ERROR_CODES.MIC_IN_USE
      message = 'Your microphone is already in use by another application or browser tab.'
    } else if (err.name === 'OverconstrainedError') {
      code = ERROR_CODES.MIC_GENERIC_ERROR
      message = 'The specified microphone is not supported.'
    } else if (err.name === 'TypeError') {
      // This can happen if no device is selected.
      code = ERROR_CODES.MIC_NOT_FOUND
      message = 'No microphone selected or the device is unavailable.'
    }

    return new AppError({
      message,
      code,
      cause: err,
      context,
    })
  }

  // Handle non-Error values like strings or numbers.
  const message =
    typeof err === 'string'
      ? err
      : `An unknown error occurred: ${JSON.stringify(err) || 'undefined'}`

  return new AppError({
    message,
    code: fallbackCode,
    context,
    cause: err,
  })
}
