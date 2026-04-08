/**
 * SelectionPrompt
 *
 * Encourages the user to select an exercise when none is active.
 */

'use client'

import { Card } from '@/components/ui/card'
import { Maximize2 } from 'lucide-react'

export function SelectionPrompt() {
  return (
    <Card className="flex flex-col items-center justify-center border-dashed p-12 text-center">
      <div className="bg-primary/10 mb-4 rounded-full p-4">
        <Maximize2 className="text-primary h-8 w-8" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">Select an exercise to begin</h3>
      <p className="text-muted-foreground max-w-sm">
        Choose from the library below to start your guided practice session with real-time feedback.
      </p>
    </Card>
  )
}
