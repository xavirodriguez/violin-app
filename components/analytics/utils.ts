import { PracticeSession } from '@/stores/analytics-store'

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
  const results = lastSession?.noteResults ?? []
  const mapper = (r: any) => ({
    noteIndex: r.noteIndex,
    targetPitch: r.targetPitch,
    accuracy: r.wasInTune ? 100 : Math.max(0, 100 - Math.abs(r.averageCents)),
    cents: r.averageCents,
  })

  const heatmapData = results.map(mapper)
  return heatmapData
}
