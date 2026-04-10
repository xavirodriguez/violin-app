/**
 * SheetMusic
 * A presentation component for rendering the OSMD sheet music container.
 */

'use client'

import React from 'react'

/**
 * Props for the SheetMusic component.
 */
interface SheetMusicProps {
  /**
   * A ref to the div element where OSMD will render the score.
   */
  containerRef: React.RefObject<HTMLDivElement | null>
  /** Indicates if the sheet music has finished rendering. */
  isReady: boolean
  /** Error message to display if rendering fails. */
  error: string | undefined
}

/**
 * Renders the visual container and loading/error states for sheet music.
 */
export function SheetMusic({ containerRef, isReady, error }: SheetMusicProps) {
  if (error) {
    return <SheetMusicError error={error} />
  }

  return (
    <div className="relative min-h-[200px] w-full rounded-lg bg-white shadow-md">
      {!isReady && <SheetMusicLoading />}
      <SheetMusicCanvas containerRef={containerRef} isReady={isReady} />
    </div>
  )
}

function SheetMusicError({ error }: { error: string }) {
  return (
    <div className="relative flex min-h-[200px] w-full items-center justify-center rounded-lg bg-white shadow-md">
      <div className="text-red-500">
        <p>Failed to load sheet music</p>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    </div>
  )
}

function SheetMusicLoading() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex items-center gap-2">
        <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
        <span className="text-muted-foreground">Loading Sheet Music...</span>
      </div>
    </div>
  )
}

function SheetMusicCanvas({
  containerRef,
  isReady,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
  isReady: boolean
}) {
  const opacityClass = isReady ? 'opacity-100' : 'opacity-0'
  const combinedClasses = `sheet-music transition-opacity duration-500 ${opacityClass}`

  return <div ref={containerRef} className={combinedClasses} />
}
