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
   * This should be the `containerRef` returned by `useOSMDSafe`.
   */
  containerRef: React.RefObject<HTMLDivElement | null>
  /** Indicates if the sheet music has finished rendering. */
  isReady: boolean
  /** Error message to display if rendering fails. */
  error: string | null
}

/**
 * Renders the visual container and loading/error states for sheet music.
 *
 * @param props - Component properties.
 * @returns A JSX element with styled loading, error, and score regions.
 *
 * @remarks
 * This component is decoupled from the OSMD logic and focuses on the UI
 * representation. It uses absolute positioning for the loading spinner to
 * prevent layout shifts when the score is ready.
 */
export function SheetMusic({ containerRef, isReady, error }: SheetMusicProps) {
  if (error) {
    return (
      <div className="relative flex min-h-[200px] w-full items-center justify-center rounded-lg bg-white shadow-md">
        <div className="text-red-500">
          <p>Failed to load sheet music</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-[200px] w-full rounded-lg bg-white shadow-md">
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
            <span className="text-muted-foreground">Loading Sheet Music...</span>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className={`sheet-music transition-opacity duration-500 ${isReady ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}
