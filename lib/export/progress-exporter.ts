import type { PracticeSession } from '@/stores/analytics-store'

const CSV_HEADERS = [
  'date',
  'exerciseName',
  'durationMin',
  'accuracy',
  'notesCompleted',
  'notesAttempted',
] as const

/**
 * Converts an array of practice sessions into a CSV string.
 *
 * @param sessions - The practice sessions to export.
 * @returns A CSV-formatted string with headers and one row per session.
 *
 * @example
 * ```ts
 * const csv = exportSessionsToCSV(sessions)
 * downloadCSV(csv, 'progress.csv')
 * ```
 */
export function exportSessionsToCSV(sessions: PracticeSession[]): string {
  const headerLine = CSV_HEADERS.join(',')
  const rows = sessions.map(formatSessionRow)
  return [headerLine, ...rows].join('\n')
}

/**
 * Formats a single session as a CSV row.
 * @internal
 */
function formatSessionRow(session: PracticeSession): string {
  const date = new Date(session.endTimeMs).toISOString().split('T')[0]
  const durationMin = (session.durationMs / 60_000).toFixed(1)
  const accuracy = session.accuracy.toFixed(1)

  return [
    date,
    escapeCSVField(session.exerciseName),
    durationMin,
    accuracy,
    session.notesCompleted,
    session.notesAttempted,
  ].join(',')
}

/**
 * Escapes a CSV field value by quoting it if it contains commas, quotes, or newlines.
 * @internal
 */
function escapeCSVField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Triggers a browser download of a CSV file.
 *
 * @param content - The CSV string content.
 * @param filename - The desired filename for the download.
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
