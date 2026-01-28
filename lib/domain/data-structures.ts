/**
 * Data Structures
 *
 * Provides specialized, type-safe data structures for domain-specific needs.
 */

/**
 * A fixed-size circular buffer that automatically discards the oldest elements.
 * Useful for tracking detection history without unbounded memory growth.
 *
 * @remarks
 * - T: The type of elements in the buffer.
 * - N: The maximum size of the buffer.
 */
export class FixedRingBuffer<T, N extends number> {
  private items: T[] = []

  /**
   * @param maxSize - The maximum number of elements the buffer can hold.
   */
  constructor(public readonly maxSize: N) {}

  /**
   * Adds one or more items to the front of the buffer, displacing the oldest.
   *
   * @param items - The items to add.
   */
  push(...items: T[]): void {
    // We add to the front to match the existing pattern in PracticeState
    this.items = [...items, ...this.items].slice(0, this.maxSize)
  }

  /**
   * Returns all items currently in the buffer.
   */
  toArray(): T[] {
    return [...this.items]
  }

  /**
   * Clears all items from the buffer.
   */
  clear(): void {
    this.items = []
  }

  /**
   * Returns the number of items currently in the buffer.
   */
  get length(): number {
    return this.items.length
  }
}
