'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/observability/logger'
import { Button } from '@/components/ui/button'
import { toAppError, ERROR_CODES } from '@/lib/errors/app-error'
import './globals.css' // Import global styles to ensure fallback UI is styled.

/**
 * Implements the Next.js global error boundary for the entire application.
 * @remarks This component catches errors that occur in the root layout and
 * provides a full-page fallback UI. It is a last-resort error handler.
 * It MUST define its own `<html>` and `<body>` tags.
 * See: https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-errors-in-root-layouts
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error({
      msg: 'Caught fatal error in global boundary',
      err: error,
      code: ERROR_CODES.COMPONENT_RENDER_ERROR,
      context: { digest: error.digest, scope: 'global' },
    })
  }, [error])

  const appError = toAppError(error)

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center">
          <div className="bg-destructive/10 text-destructive rounded-lg p-6">
            <h1 className="text-3xl font-bold">Application Error</h1>
          </div>
          <p className="text-muted-foreground max-w-md">
            A critical error occurred and the application cannot continue. Please try again. If the
            problem persists, contact support.
          </p>
          <p className="text-muted-foreground/80 text-sm">
            Error Code: <code className="font-mono">{appError.code}</code>
            <br />
            Error ID: <code className="font-mono">{appError.id}</code>
          </p>
          <Button onClick={() => reset()} size="lg" variant="destructive">
            Try to Recover
          </Button>
        </div>
      </body>
    </html>
  )
}
