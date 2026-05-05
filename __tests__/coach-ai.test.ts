import { describe, it, expect } from 'vitest'
import { CoachAIService } from '../lib/curriculum/coach-ai'
import { UserProgress } from '../stores/analytics-store'
import { ObjectiveMastery } from '../stores/mastery-store'

describe('CoachAIService', () => {
  const mockProgress: UserProgress = {
    userId: 'test',
    totalPracticeSessions: 10,
    totalPracticeTime: 600,
    exercisesCompleted: [],
    currentStreak: 3,
    longestStreak: 5,
    intonationSkill: 80,
    rhythmSkill: 60,
    overallSkill: 70,
    achievements: [],
    exerciseStats: {}
  }

  const mockMastery: Record<string, ObjectiveMastery> = {
    'steady-bow': {
      objectiveId: 'steady-bow',
      mastery: 0.8,
      trend: 'stable',
      lastPracticedMs: Date.now()
    }
  }

  it('generates a celebration for a 3-day streak', () => {
    const insights = CoachAIService.getInsights(mockProgress, mockMastery)
    const streakInsight = insights.find(i => i.type === 'celebration')
    expect(streakInsight).toBeDefined()
    expect(streakInsight?.title).toContain('3-Day Streak')
  })

  it('generates a tip for intonation/rhythm imbalance', () => {
    const insights = CoachAIService.getInsights(mockProgress, mockMastery)
    const imbalanceInsight = insights.find(i => i.persona === 'The Technical Sage')
    expect(imbalanceInsight).toBeDefined()
    expect(imbalanceInsight?.title).toBe('Focus on the Pulse')
  })

  it('generates a warning for declining skills', () => {
    const decliningMastery = {
      ...mockMastery,
      'steady-bow': { ...mockMastery['steady-bow'], trend: 'down' as const }
    }
    const insights = CoachAIService.getInsights(mockProgress, decliningMastery)
    const warning = insights.find(i => i.type === 'warning')
    expect(warning).toBeDefined()
    expect(warning?.title).toBe('Refreshing Foundations')
  })
})
