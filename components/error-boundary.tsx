/**
 * ErrorBoundary
 * A classic React error boundary for catching client-side rendering errors.
 */

'use client'

import React from 'react'
import { logger } from '@/lib/observability/logger'
import { ERROR_CODES } from '@/lib/errors/app-error'

/**
 * Props for the ErrorBoundary component.
 */
interface Props {
  /** The children components to be wrapped and monitored for errors. */
  children: React.ReactNode
  /** An optional fallback UI to display when an error occurs. */
  fallback?: React.ReactNode
  /** An optional callback triggered when an error is caught. */
  onError?: (error: Error) => void
}

/**
 * Internal state for the ErrorBoundary.
 */
interface State {
  /** Whether an error has been caught in the current boundary. */
  hasError: boolean
  /** The error object that was caught, if any. */
  error: Error | undefined
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
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: undefined }
  }

  /** Updates state so the next render will show the fallback UI. */
  static getDerivedStateFromError(error: Error): State {
    const nextState = { hasError: true, error }
    return nextState
  }

  /**
   * Called after an error has been thrown by a descendant component.
   * Logs the error and its component stack trace.
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const context = { componentStack: errorInfo.componentStack }
    const logParams = {
      msg: 'ErrorBoundary caught an error',
      err: error,
      code: ERROR_CODES.COMPONENT_RENDER_ERROR,
      context,
    }

    logger.error(logParams)
    this.props.onError?.(error)
  }

  render() {
    const { hasError, error } = this.state
    const { children, fallback } = this.props

    if (hasError) {
      return fallback || this.renderDefaultFallback(error)
    }

    return children
  }

  private renderDefaultFallback(error: Error | undefined) {
    const handleRetry = () => {
      const resetState = { hasError: false, error: undefined }
      this.setState(resetState)
    }

    return (
      <div className="error-fallback">
        <h3>Something went wrong</h3>
        <p>{error?.message}</p>
        <button onClick={handleRetry}>Retry</button>
      </div>
    )
  }
}
