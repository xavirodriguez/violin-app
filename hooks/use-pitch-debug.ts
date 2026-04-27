import { useEffect, useState } from 'react'
import { pitchDebugBus, type PitchDebugEvent } from '@/lib/observability/pitch-debug'

/**
 * Hook to subscribe to pitch debug events.
 * Maintains a history of the last N events.
 *
 * @param maxEvents - Maximum number of events to keep in history.
 * @returns An array of PitchDebugEvent objects.
 */
export function usePitchDebug(maxEvents = 50): PitchDebugEvent[] {
  const [events, setEvents] = useState<PitchDebugEvent[]>([])

  useEffect(() => {
    const unsubscribe = pitchDebugBus.subscribe((event) => {
      setEvents((prev) => {
        const next = [...prev, event]
        if (next.length > maxEvents) {
          return next.slice(-maxEvents)
        }
        return next
      })
    })

    return unsubscribe
  }, [maxEvents])

  return events
}
