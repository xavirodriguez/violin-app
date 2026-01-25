'use client'

import { useState } from 'react'
import { IOSMDOptions } from 'opensheetmusicdisplay'
import { useOSMDSafe } from '@/hooks/use-osmd-safe'
import { Button } from '@/components/ui/button'

interface SheetMusicDisplayProps {
  musicXML: string
  initialOptions?: IOSMDOptions
}

export function SheetMusicDisplay({ musicXML, initialOptions }: SheetMusicDisplayProps) {
  const [options, setOptions] = useState<IOSMDOptions>(initialOptions || {})
  const { containerRef, isReady, error } = useOSMDSafe(musicXML, options)

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
