'use client'

import React from 'react'

interface SheetMusicProps {
  containerRef: React.RefObject<HTMLDivElement>
  isReady: boolean
  error: string | null
}

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
