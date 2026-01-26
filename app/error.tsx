'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/observability/logger'
import { Button } from '@/components/ui/button'
import { toAppError, ERROR_CODES } from '@/lib/errors/app-error'

/**
 * Implements the Next.js error boundary for a specific route segment.
 * @remarks This component catches errors that occur during rendering of a
 * server or client component within its segment and provides a graceful
_fallback UI. It also logs the error for observability.
 * See: https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to our centralized logger.
    logger.error({
      msg: 'Caught rendering error in segment boundary',
      err: error,
      code: ERROR_CODES.COMPONENT_RENDER_ERROR,
      context: { digest: error.digest },
    })
  }, [error])

  const appError = toAppError(error)

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 p-4 text-center">
      <div className="rounded-lg bg-destructive/10 p-6 text-destructive">
        <h2 className="text-2xl font-bold">Oops! Something went wrong.</h2>
      </div>
      <p className="max-w-md text-muted-foreground">
        {appError.message || 'An unexpected error occurred while rendering this part of the application.'}
      </p>
      <p className="text-sm text-muted-foreground/80">
        Error Code: <code className="font-mono">{appError.code}</code>
        <br />
        Error ID: <code className="font-mono">{appError.id}</code>
      </p>

      <Button onClick={() => reset()} size="lg">
        Try Again
      </Button>
    </div>
  )
}
