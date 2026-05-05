import { UserProgress } from '@/stores/analytics-store'
import { ObjectiveMastery } from '@/stores/mastery-store'

export interface CoachInsight {
  title: string
  message: string
  type: 'encouragement' | 'warning' | 'celebration' | 'tip'
  personaKey: 'encourager' | 'sage' | 'motivator'
}

/**
 * CoachAIService
 *
 * Analyzes historical performance data to generate pedagogical narrative feedback.
 */
export class CoachAIService {
  /**
   * Generates a collection of insights based on user progress and mastery.
   */
  static getInsights(progress: UserProgress, mastery: Record<string, ObjectiveMastery>): CoachInsight[] {
    const insights: CoachInsight[] = []

    // 1. Analyze Streak & Consistency
    if (progress.currentStreak >= 3) {
      insights.push({
        title: `${progress.currentStreak}-Day Streak!`,
        message: `You're building incredible momentum. Consistency is the secret to mastering the violin. Keep that bow moving every day!`,
        type: 'celebration',
        personaKey: 'motivator'
      })
    } else if (progress.currentStreak === 0 && progress.totalPracticeSessions > 0) {
      insights.push({
        title: 'Welcome Back!',
        message: `It's great to see you with the violin again. Don't worry about the break—let's start with some easy open strings to find your tone again.`,
        type: 'encouragement',
        personaKey: 'encourager'
      })
    }

    // 2. Technical Skill Analysis (Intonation vs Rhythm)
    if (progress.intonationSkill > progress.rhythmSkill + 15) {
      insights.push({
        title: 'Focus on the Pulse',
        message: `Your ears are sharp and your intonation is excellent! To reach the next level, try practicing with the metronome at 60 BPM to lock in your rhythm.`,
        type: 'tip',
        personaKey: 'sage'
      })
    } else if (progress.rhythmSkill > progress.intonationSkill + 15) {
      insights.push({
        title: 'Refining the Pitch',
        message: `Your sense of time is solid. You've got a great pulse! Let's focus on left-hand precision—maybe try a few extra minutes of Tetrachord practice today.`,
        type: 'tip',
        personaKey: 'sage'
      })
    }

    // 3. Mastery Trends
    const decliningSkills = Object.values(mastery).filter(m => m.trend === 'down')
    if (decliningSkills.length > 0) {
      const skillName = decliningSkills[0].objectiveId.replace(/-/g, ' ')
      insights.push({
        title: 'Refreshing Foundations',
        message: `It looks like your precision in "${skillName}" has slipped slightly. A quick 2-minute review today will bring it right back to 100%.`,
        type: 'warning',
        personaKey: 'sage'
      })
    }

    // 4. Overall Growth
    if (progress.overallSkill > 80) {
      insights.push({
        title: 'Rising Virtuoso',
        message: `Your overall precision is outstanding. You're ready for more expressive challenges. Have you explored the Phrasing unit yet?`,
        type: 'celebration',
        personaKey: 'motivator'
      })
    }

    // Default if no specific patterns found
    if (insights.length === 0) {
      insights.push({
        title: 'Ready for Practice',
        message: `Every session counts. Grab your violin, tune up, and let's make some beautiful music today!`,
        type: 'encouragement',
        personaKey: 'encourager'
      })
    }

    return insights
  }
}
