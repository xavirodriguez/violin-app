/**
 * Sistema de logros basado en milestones de práctica
 */

export interface AchievementDefinition {
  id: string
  name: string
  description: string
  icon: string
  category: 'practice' | 'accuracy' | 'streak' | 'mastery' | 'exploration'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  condition: (stats: AchievementCheckStats) => boolean
  reward?: {
    message: string
    confetti?: boolean
    sound?: string
  }
}

export interface AchievementCheckStats {
  // Stats de sesión actual
  currentSession: {
    correctNotes: number
    perfectNoteStreak: number
    accuracy: number
    durationMs: number
    exerciseId: string
  }

  // Stats históricos
  totalSessions: number
  totalPracticeDays: number
  currentStreak: number
  longestStreak: number
  exercisesCompleted: string[]
  totalPracticeTimeMs: number
  averageAccuracy: number
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // === STREAK ACHIEVEMENTS ===
  {
    id: 'first-perfect-note',
    name: 'First Perfect Note!',
    description: 'Play your first note with perfect intonation',
    icon: '🎯',
    category: 'accuracy',
    rarity: 'common',
    condition: (stats) => stats.currentSession.correctNotes >= 1,
    reward: {
      message: 'Great start! Perfect notes are always special.',
      confetti: true
    }
  },

  {
    id: 'hot-streak-5',
    name: 'Hot Streak!',
    description: 'Play 5 perfect notes in a row',
    icon: '🔥',
    category: 'streak',
    rarity: 'common',
    condition: (stats) => stats.currentSession.perfectNoteStreak >= 5,
    reward: {
      message: "You're on fire! Keep it up.",
      confetti: false
    }
  },

  {
    id: 'hot-streak-10',
    name: 'Unstoppable!',
    description: 'Play 10 perfect notes in a row',
    icon: '🔥🔥',
    category: 'streak',
    rarity: 'rare',
    condition: (stats) => stats.currentSession.perfectNoteStreak >= 10,
    reward: {
      message: 'Incredible precision! Your ear is very tuned.',
      confetti: true
    }
  },

  {
    id: 'hot-streak-20',
    name: 'Master of Precision!',
    description: 'Play 20 perfect notes in a row',
    icon: '🔥🔥🔥',
    category: 'streak',
    rarity: 'epic',
    condition: (stats) => stats.currentSession.perfectNoteStreak >= 20,
    reward: {
      message: 'Amazing! Few achieve this level of consistency.',
      confetti: true,
      sound: 'epic-win'
    }
  },

  // === PRACTICE CONSISTENCY ===
  {
    id: 'daily-dedication',
    name: 'Daily Dedication',
    description: 'Practice 3 days in a row',
    icon: '📅',
    category: 'streak',
    rarity: 'common',
    condition: (stats) => stats.currentStreak >= 3,
    reward: {
      message: 'Consistency is key. Keep practicing!',
      confetti: false
    }
  },

  {
    id: 'weekly-warrior',
    name: 'Weekly Warrior',
    description: 'Practice 7 days in a row',
    icon: '🏅',
    category: 'streak',
    rarity: 'rare',
    condition: (stats) => stats.currentStreak >= 7,
    reward: {
      message: 'A full week! Your discipline is admirable.',
      confetti: true
    }
  },

  {
    id: 'month-master',
    name: 'Month Master',
    description: 'Practice 30 days in a row',
    icon: '👑',
    category: 'streak',
    rarity: 'legendary',
    condition: (stats) => stats.currentStreak >= 30,
    reward: {
      message: 'LEGENDARY! A month of daily practice is extraordinary.',
      confetti: true,
      sound: 'legendary-win'
    }
  },

  // === SESSION MILESTONES ===
  {
    id: 'marathon-session',
    name: 'Marathon Session',
    description: 'Practice for 30 minutes straight',
    icon: '⏰',
    category: 'practice',
    rarity: 'rare',
    condition: (stats) => stats.currentSession.durationMs >= 30 * 60 * 1000,
    reward: {
      message: '30 minutes of focused practice! Your endurance is improving.',
      confetti: true
    }
  },

  {
    id: 'perfect-exercise',
    name: 'Impeccable Execution',
    description: 'Complete an exercise with 100% accuracy',
    icon: '💯',
    category: 'accuracy',
    rarity: 'epic',
    condition: (stats) => stats.currentSession.accuracy >= 100,
    reward: {
      message: 'PERFECT! You didn\'t miss a single note.',
      confetti: true,
      sound: 'perfect-score'
    }
  },

  {
    id: 'first-hundred-sessions',
    name: 'Centurión',
    description: 'Complete 100 practice sessions',
    icon: '💪',
    category: 'practice',
    rarity: 'epic',
    condition: (stats) => stats.totalSessions >= 100,
    reward: {
      message: '100 sessions! Your dedication is inspiring.',
      confetti: true
    }
  },

  // === EXPLORATION ===
  {
    id: 'explorer',
    name: 'Musical Explorer',
    description: 'Complete 5 different exercises',
    icon: '🗺️',
    category: 'exploration',
    rarity: 'common',
    condition: (stats) => stats.exercisesCompleted.length >= 5,
    reward: {
      message: 'Variety is the spice of practice. Keep exploring!',
      confetti: false
    }
  },

  {
    id: 'completionist',
    name: 'Completionist',
    description: 'Complete all available exercises',
    icon: '🏆',
    category: 'exploration',
    rarity: 'legendary',
    condition: (stats) => stats.exercisesCompleted.length >= 10,
    reward: {
      message: 'You have mastered all exercises! You are a true master.',
      confetti: true,
      sound: 'legendary-win'
    }
  }
]
