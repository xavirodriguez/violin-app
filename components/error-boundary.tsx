'use client'

import React from 'react'
import { logger } from '@/lib/observability/logger'
import { ERROR_CODES } from '@/lib/errors/app-error'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error({
      msg: 'ErrorBoundary caught an error',
      err: error,
      code: ERROR_CODES.COMPONENT_RENDER_ERROR,
      context: { componentStack: errorInfo.componentStack },
    })
    this.props.onError?.(error)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-fallback">
            <h3>Something went wrong</h3>
            <p>{this.state.error?.message}</p>
            <button onClick={() => this.setState({ hasError: false, error: null })}>Retry</button>
          </div>
        )
      )
    }

    return this.props.children
  }
}
