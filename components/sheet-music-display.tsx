/**
 * SheetMusicDisplay
 * A high-level component for displaying sheet music with configurable options.
 */

'use client'

import { useState } from 'react'
import { IOSMDOptions } from 'opensheetmusicdisplay'
import { useOSMDSafe } from '@/hooks/use-osmd-safe'
import { Button } from '@/components/ui/button'

/**
 * Props for the SheetMusicDisplay component.
 */
interface SheetMusicDisplayProps {
  /** The MusicXML string to be rendered. */
  musicXML: string
  /** Initial configuration options for OSMD. */
  initialOptions?: IOSMDOptions
}

/**
 * Renders a sheet music display with a toggle for dark mode.
 *
 * @param props - Component properties.
 * @returns A JSX element containing the sheet music and controls.
 *
 * @remarks
 * This component demonstrates how to use the `useOSMDSafe` hook and
 * provides a simple UI to interact with OSMD options.
 */
export function SheetMusicDisplay({ musicXML, initialOptions }: SheetMusicDisplayProps) {
  /** Local state for OSMD options, allowing dynamic updates like dark mode. */
  const [options, setOptions] = useState<IOSMDOptions>(initialOptions || {})

  /** Initialize OSMD via the safe hook. */
  const { containerRef, isReady, error } = useOSMDSafe(musicXML, options)

  /** Toggles the dark mode setting in OSMD options. */
  const toggleDarkMode = () => {
    setOptions((prev) => ({
      ...prev,
      darkMode: !prev.darkMode,
    }))
  }

  return (
    <div>
      <div className="flex justify-end p-2">
        <Button onClick={toggleDarkMode} variant="outline">
          Toggle Dark Mode
        </Button>
      </div>
      {error && <div className="text-red-500">Error: {error}</div>}
      {!isReady && !error && <div>Loading Sheet Music...</div>}
      <div ref={containerRef} />
    </div>
  )
}
