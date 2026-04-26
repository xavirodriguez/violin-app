import { describe, it, expect } from 'vitest'
import { exportSessionsToCSV } from '@/lib/export/progress-exporter'
import { PracticeSession } from '@/stores/analytics-store'

describe('exportSessionsToCSV', () => {
  it('should generate a CSV with headers and data', () => {
    const sessions: Partial<PracticeSession>[] = [
      {
        endTimeMs: new Date('2023-10-27T10:00:00Z').getTime(),
        exerciseName: 'Scale C Major',
        durationMs: 120000, // 2 min
        accuracy: 85.5,
        notesCompleted: 20,
        notesAttempted: 24,
      },
      {
        endTimeMs: new Date('2023-10-28T11:00:00Z').getTime(),
        exerciseName: 'The "Happy" Song',
        durationMs: 300000, // 5 min
        accuracy: 92.0,
        notesCompleted: 50,
        notesAttempted: 52,
      },
    ]

    const csv = exportSessionsToCSV(sessions as PracticeSession[])
    const lines = csv.split('\n')

    expect(lines[0]).toBe(
      'Date,Exercise Name,Duration (min),Accuracy (%),Notes Completed,Notes Attempted',
    )
    expect(lines[1]).toBe('2023-10-27,"Scale C Major",2.00,85.5,20,24')
    expect(lines[2]).toBe('2023-10-28,"The ""Happy"" Song",5.00,92.0,50,52')
  })

  it('should handle an empty list of sessions', () => {
    const csv = exportSessionsToCSV([])
    expect(csv).toBe(
      'Date,Exercise Name,Duration (min),Accuracy (%),Notes Completed,Notes Attempted',
    )
  })
})
