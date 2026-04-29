import { PracticeSession } from '@/lib/domain/practice-session'

/**
 * Generates a CSV string from an array of practice sessions.
 *
 * @param sessions - The list of practice sessions to export.
 * @returns A formatted CSV string with headers.
 */
export function exportSessionsToCSV(sessions: PracticeSession[]): string {
  const headers = generateCSVHeader()
  const rows = formatSessionRows(sessions)
  const result = [headers, ...rows].join('\n')

  return result
}

function generateCSVHeader(): string {
  const headers = [
    'Date',
    'Exercise Name',
    'Duration (min)',
    'Accuracy (%)',
    'Notes Completed',
    'Notes Attempted',
  ]
  const result = headers.join(',')

  return result
}

function formatSessionRows(sessions: PracticeSession[]): string[] {
  const rows = sessions.map((s) => {
    return formatSingleSessionRow(s)
  })

  return rows
}

function formatSingleSessionRow(s: PracticeSession): string {
  const date = new Date(s.endTimeMs).toISOString().split('T')[0]
  const durationMin = (s.durationMs / (60 * 1000)).toFixed(2)
  const accuracy = s.accuracy.toFixed(1)
  const escapedName = `"${s.exerciseName.replace(/"/g, '""')}"`

  return [date, escapedName, durationMin, accuracy, s.notesCompleted, s.notesAttempted].join(',')
}

/**
 * Triggers a browser download for the provided CSV content.
 *
 * @param content - The CSV string to download.
 * @param filename - The desired name of the file (e.g., "progress.csv").
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
