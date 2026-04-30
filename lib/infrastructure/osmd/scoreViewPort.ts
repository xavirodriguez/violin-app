/**
 * Port for managing the visual representation of a musical score.
 */
export interface ScoreViewPort {
  readonly isReady: boolean
  sync(noteIndex: number): void
  reset(): void
}
