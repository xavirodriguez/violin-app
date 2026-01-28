 
/**
 * Provides a centralized logging service for the application.
 * @remarks This logger wraps the native `console` object, providing a consistent
 * interface for logging structured data. In a development environment, it enhances
 * readability by color-coding log levels. In production, this module can be
 * extended to send logs to a dedicated observability service (like Sentry,
 * Datadog, or an OpenTelemetry collector) without changing the code at the
 * call sites.
 */

import { AppError, toAppError, ERROR_CODES } from '@/lib/errors/app-error'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * The structured payload for a log entry.
 */
interface LogPayload {
  // --- Core Info ---
  msg: string // The primary log message.
  level?: LogLevel // The severity of the log.
  err?: unknown // The raw error object, if any.

  // --- Context & Metadata ---
  context?: Record<string, unknown> // Arbitrary key-value data for debugging.
  // A unique code for error-type logs, used for grouping and alerting.
  code?: (typeof ERROR_CODES)[keyof typeof ERROR_CODES]
}

/**
 * Checks if the current environment is production.
 */
const isProduction = process.env.NODE_ENV === 'production'

/**
 * The core logging function. It normalizes any error, formats the log, and
 * sends it to the appropriate `console` method.
 *
 * @param payload - The `LogPayload` containing all log information.
 */
function log(payload: LogPayload): void {
  const { msg, level = 'info', err, context, code } = payload
  const timestamp = new Date().toISOString()
  const appError: AppError | undefined = err ? toAppError(err) : undefined

  // In a real production scenario, you would add your observability hook here.
  // For example: `if (isProduction) { Sentry.capture(...) }`
  // For this project, we'll log structured JSON in production for potential collection.
  if (isProduction) {
    console[level](
      JSON.stringify({
        timestamp,
        level,
        msg,
        code: appError?.code || code || 'NONE',
        err: appError
          ? {
              id: appError.id,
              name: appError.name,
              message: appError.message,
              stack: appError.stack,
              cause: appError.cause,
            }
          : undefined,
        context: { ...appError?.context, ...context },
      }),
    )
    return
  }

  // --- Development Logging: Enhanced readability ---
  const levelColors: Record<LogLevel, string> = {
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m', // Green
    warn: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
  }
  const resetColor = '\x1b[0m'
  const levelColor = levelColors[level]

  console[level](
    `${levelColor}[${level.toUpperCase()}]${resetColor} ${msg}`,
    // Optional data is displayed in a collapsed group for cleaner logs.
    {
      Code: appError?.code || code,
      Timestamp: timestamp,
      'Error Obj': appError,
      Context: { ...appError?.context, ...context },
    },
  )
}

/**
 * A simple, structured logger instance.
 * @remarks It provides methods for different log levels (`debug`, `info`, `warn`, `error`).
 * The `error` method is specifically designed to work with `AppError`, ensuring
 * all caught exceptions are logged in a standardized format.
 */
export const logger = {
  debug: (msg: string, context?: Record<string, unknown>) => {
    log({ msg, level: 'debug', context })
  },
  info: (msg: string, context?: Record<string, unknown>) => {
    log({ msg, level: 'info', context })
  },
  warn: (msg: string, context?: Record<string, unknown>) => {
    log({ msg, level: 'warn', context })
  },
  /**
   * Logs a structured error.
   * @param payload - Can be a simple string, or a structured object containing
   * the error instance, a message, and additional context.
   */
  error: (
    payload:
      | string
      | {
          msg: string
          err: unknown
          code?: (typeof ERROR_CODES)[keyof typeof ERROR_CODES]
          context?: Record<string, unknown>
        },
  ) => {
    if (typeof payload === 'string') {
      log({ msg: payload, level: 'error' })
    } else {
      log({ ...payload, level: 'error' })
    }
  },
}
