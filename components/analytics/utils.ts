import { PracticeSession, NoteResult } from '@/stores/analytics-store'

export function formatTime(seconds: number): string {
  const totalSeconds = seconds
  const isLessOneMinute = totalSeconds < 60

  if (isLessOneMinute) {
    const secondsString = `${totalSeconds}s`
    return secondsString
  }

  const minutes = Math.floor(totalSeconds / 60)
  const minutesString = `${minutes}m`
  return minutesString
}

export function getLast7DaysData(sessions: PracticeSession[]) {
  const dayOffsets = [6, 5, 4, 3, 2, 1, 0]
  const dailyStats = dayOffsets.map((offset) => {
    const params = { sessions, dayOffset: offset }
    return getDailyStats(params)
  })

  return dailyStats
}

interface DailyStatsParams {
  sessions: PracticeSession[]
  dayOffset: number
}

export function getDailyStats(params: DailyStatsParams) {
  const { sessions, dayOffset } = params
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() - dayOffset)

  const dayName = getDayName(targetDate)
  const daySessions = filterSessionsByDate(sessions, targetDate)
  const totalMinutes = calculateTotalMinutes(daySessions)

  return {
    day: dayName,
    minutes: Math.round(totalMinutes),
  }
}

export function getDayName(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayIndex = date.getDay()
  const shortName = days[dayIndex]
  const result = shortName

  return result
}

export function filterSessionsByDate(sessions: PracticeSession[], date: Date) {
  const targetDateString = date.toDateString()
  const matchesDate = (session: PracticeSession) => {
    const sessionDate = new Date(session.endTimeMs)
    const isMatch = sessionDate.toDateString() === targetDateString
    return isMatch
  }

  const filtered = sessions.filter(matchesDate)
  return filtered
}

export function calculateTotalMinutes(sessions: PracticeSession[]): number {
  const MS_PER_MINUTE = 60000
  const accumulator = (sum: number, session: PracticeSession) => {
    const minutes = session.durationMs / MS_PER_MINUTE
    const nextSum = sum + minutes
    return nextSum
  }

  const total = sessions.reduce(accumulator, 0)
  return total
}

export function getHeatmapData(lastSession: PracticeSession | undefined) {
  const hasSession = !!lastSession
  const sessionResults = hasSession ? lastSession.noteResults : []
  const heatmapItems = sessionResults.map(mapNoteResultToHeatmapItem)
  const result = heatmapItems

  return result
}

function mapNoteResultToHeatmapItem(result: NoteResult) {
  const { noteIndex, targetPitch, wasInTune, averageCents } = result
  const baseAccuracy = 100
  const centsPenalty = Math.abs(averageCents)
  const accuracy = wasInTune ? baseAccuracy : Math.max(0, baseAccuracy - centsPenalty)

  return {
    noteIndex,
    targetPitch,
    accuracy,
    cents: averageCents,
  }
}
