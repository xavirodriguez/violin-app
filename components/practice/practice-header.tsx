'use client'

/**
 * Header component for the practice mode, displaying the exercise name.
 */
export function PracticeHeader({ exerciseName }: { exerciseName?: string }) {
  return (
    <div className="text-center">
      <h2 className="text-foreground mb-2 text-3xl font-bold">{exerciseName}</h2>
      <p className="text-muted-foreground">Play each note in tune to advance.</p>
    </div>
  )
}
