/**
 * ViewToggleButton
 *
 * Allows toggling between focused and full views of the sheet music.
 */

'use client'

import { Button } from '@/components/ui/button'
import { Maximize2, Minimize2 } from 'lucide-react'

export function ViewToggleButton({
  view,
  onToggle,
}: {
  view: 'focused' | 'full'
  onToggle: () => void
}) {
  const isFocused = view === 'focused'
  const icon = isFocused ? (
    <Maximize2 className="mr-2 h-4 w-4" />
  ) : (
    <Minimize2 className="mr-2 h-4 w-4" />
  )
  const label = isFocused ? 'Full View' : 'Focused View'

  return (
    <div className="absolute top-4 right-4 z-10 flex gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={onToggle}
        className="bg-background/80 shadow-sm backdrop-blur-sm"
      >
        {icon}
        {label}
      </Button>
    </div>
  )
}
