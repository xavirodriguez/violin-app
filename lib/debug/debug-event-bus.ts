import { DebugEvent } from './debug-types'

type Listener = (event: DebugEvent) => void

class DebugEventBus {
  private listeners = new Set<Listener>()
  private history: DebugEvent[] = []
  private readonly MAX_HISTORY = 500
  // Cache the array representation to ensure referential stability for useSyncExternalStore
  private cachedHistory: DebugEvent[] = []

  emit(event: DebugEvent): void {
    if (process.env.NODE_ENV !== 'development') return

    this.history.push(event)
    if (this.history.length > this.MAX_HISTORY) {
      this.history.shift()
    }

    // Update the cache whenever history changes
    this.cachedHistory = [...this.history]

    this.listeners.forEach((listener) => listener(event))
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getHistory(): DebugEvent[] {
    return this.cachedHistory
  }

  clearHistory(): void {
    this.history = []
    this.cachedHistory = []
  }
}

export const debugBus = new DebugEventBus()
