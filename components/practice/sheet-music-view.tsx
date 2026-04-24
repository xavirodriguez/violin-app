'use client'

import { Card } from '@/components/ui/card'
import { SheetMusic } from '@/components/sheet-music'
import { ErrorBoundary } from '@/components/error-boundary'

/**
 * Display for musical notation using OpenSheetMusicDisplay.
 */
export function SheetMusicView({
  musicXML,
  isReady,
  error,
  containerRef,
}: {
  musicXML?: string
  isReady: boolean
  error: string | undefined
  containerRef: React.RefObject<HTMLDivElement | null>
}) {
  if (!musicXML) return <></>

  return (
    <Card className="p-6">
      <ErrorBoundary fallback={<div>Failed to load sheet music</div>}>
        <SheetMusic containerRef={containerRef} isReady={isReady} error={error} />
      </ErrorBoundary>
    </Card>
  )
}
