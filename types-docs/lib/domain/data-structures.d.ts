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
 * Refactored for better type safety and immutability.
 * T - The type of elements in the buffer.
 * N - The maximum size of the buffer.
 */
export declare class FixedRingBuffer<T, N extends number> {
    readonly maxSize: N;
    private items;
    /**
     * @param maxSize - The maximum number of elements the buffer can hold.
     */
    constructor(maxSize: N);
    /**
     * Adds one or more items to the front of the buffer, displacing the oldest.
     *
     * @param items - The items to add.
     */
    push(...items: T[]): void;
    /**
     * Returns a read-only snapshot of the current buffer contents.
     *
     * @returns A readonly array of items. Mutations will not affect the buffer.
     */
    toArray(): readonly T[];
    /**
     * Clears all items from the buffer.
     */
    clear(): void;
    /**
     * Returns the number of items currently in the buffer.
     */
    get length(): number;
}
