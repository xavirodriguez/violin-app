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
  const appError: AppError | undefined = err ? toAppError(err) : undefined
  const logParams = { msg, level, appError, context, code }

  if (isProduction) {
    logProduction(logParams)
    return
  }

  logDevelopment(logParams)
}

interface InternalLogParams {
  msg: string
  level: LogLevel
  appError: AppError | undefined
  context: Record<string, unknown> | undefined
  code: (typeof ERROR_CODES)[keyof typeof ERROR_CODES] | undefined
}

function logProduction(params: InternalLogParams): void {
  const { msg, level, appError, context, code } = params
  const timestamp = new Date().toISOString()
  const payload = JSON.stringify({
    timestamp,
    level,
    msg,
    code: appError?.code || code || 'NONE',
    err: appError ? serializeError(appError) : undefined,
    context: { ...appError?.context, ...context },
  })

  console[level](payload)
}

function serializeError(err: AppError) {
  return {
    id: err.id,
    name: err.name,
    message: err.message,
    stack: err.stack,
    cause: err.cause,
  }
}

function logDevelopment(params: InternalLogParams): void {
  const { msg, level, appError, context, code } = params
  const colors = getLevelColors()
  const levelColor = colors[level]
  const resetColor = '\x1b[0m'
  const timestamp = new Date().toISOString()

  console[level](`${levelColor}[${level.toUpperCase()}]${resetColor} ${msg}`, {
    Code: appError?.code || code,
    Timestamp: timestamp,
    'Error Obj': appError,
    Context: { ...appError?.context, ...context },
  })
}

function getLevelColors(): Record<LogLevel, string> {
  return {
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m', // Green
    warn: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
  }
}

/**
 * A simple, structured logger instance.
 * @remarks It provides methods for different log levels (`debug`, `info`, `warn`, `error`).
 * The `error` method is specifically designed to work with `AppError`, ensuring
 * all caught exceptions are logged in a standardized format.
 */
export const logger = {
  debug: (msg: string, context?: Record<string, unknown>) => {
    const level: LogLevel = 'debug'
    const payload = { msg, level, context }

    log(payload)
  },
  info: (msg: string, context?: Record<string, unknown>) => {
    const level: LogLevel = 'info'
    const payload = { msg, level, context }

    log(payload)
  },
  warn: (msg: string, context?: Record<string, unknown>) => {
    const level: LogLevel = 'warn'
    const payload = { msg, level, context }

    log(payload)
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
    const input = payload
    const isString = typeof input === 'string'
    const logPayload = isString
      ? { msg: input, level: 'error' as const }
      : { ...input, level: 'error' as const }

    log(logPayload)
  },
}
