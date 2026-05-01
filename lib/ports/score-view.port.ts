/**
 * Port for managing the visual representation of a musical score.
 *
 * @remarks
 * This interface abstracts the underlying sheet music rendering engine (e.g., OSMD, VexFlow, SVG),
 * allowing the application logic to control the visual state without being coupled to a specific
 * library's API or DOM structure.
 *
 * @public
 */
export interface ScoreViewPort {
  /**
   * Indicates if the score view is initialized and ready for interaction.
   */
  readonly isReady: boolean

  /**
   * Synchronizes the visual state of the score (cursor, highlights, scroll) with the current practice note.
   *
   * @param noteIndex - The index of the note in the exercise to highlight/focus.
   *
   * @remarks
   * This method should encapsulate:
   * 1. Moving the visual cursor to the correct position.
   * 2. Highlighting the current note.
   * 3. Ensuring the current note is visible in the viewport (scrolling).
   */
  sync(noteIndex: number): void

  /**
   * Resets the visual state to the beginning of the score.
   */
  reset(): void

  /**
   * Retrieves the current visual position of the cursor relative to the score container.
   *
   * @returns The \{x, y\} coordinates or undefined if not available.
   */
  getCursorPosition(): { x: number; y: number } | undefined
}

/**
 * Narrow interface for UI components that only need to display the score.
 */
export interface ScoreViewDisplay {
  readonly containerRef: import('react').RefObject<HTMLDivElement | null>
  readonly isReady: boolean
  readonly error: string | undefined
}
