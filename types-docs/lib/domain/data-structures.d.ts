/**
 * Data Structures
 *
 * Provides specialized, type-safe data structures for domain-specific needs.
 */
/**
 * A fixed-size circular buffer that automatically discards the oldest elements.
 * Useful for tracking detection history without unbounded memory growth.
 *
 * @template T - The type of elements in the buffer.
 * @template N - The maximum size of the buffer.
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
     * Returns all items currently in the buffer.
     */
    toArray(): T[];
    /**
     * Clears all items from the buffer.
     */
    clear(): void;
    /**
     * Returns the number of items currently in the buffer.
     */
    get length(): number;
}
