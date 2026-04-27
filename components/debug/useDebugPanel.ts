'use client'

import { useSyncExternalStore } from 'react'
import { debugBus } from '@/lib/debug/debug-event-bus'
import { DebugEvent } from '@/lib/debug/debug-types'

/**
 * Custom hook that subscribes to the debug event bus.
 * Uses useSyncExternalStore for React 19 compatibility.
 * Returns the last N events from the history.
 */
export function useDebugEvents(limit: number = 100): DebugEvent[] {
  const events = useSyncExternalStore(
    (callback) => debugBus.subscribe(callback),
    () => debugBus.getHistory(),
    () => [], // Server-side fallback
  )

  const result = events.slice(-limit).reverse()
  return result
}

export function useAllDebugEvents(): DebugEvent[] {
  const events = useSyncExternalStore(
    (callback) => debugBus.subscribe(callback),
    () => debugBus.getHistory(),
    () => [], // Server-side fallback
  )

  return events
}
