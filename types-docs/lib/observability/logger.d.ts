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
