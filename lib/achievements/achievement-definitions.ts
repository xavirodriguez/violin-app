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
    name: '¡Primera Nota Perfecta!',
    description: 'Toca tu primera nota con afinación perfecta',
    icon: '🎯',
    category: 'accuracy',
    rarity: 'common',
    condition: (stats) => stats.currentSession.correctNotes >= 1,
    reward: {
      message: '¡Excelente comienzo! Las primeras notas perfectas siempre son especiales.',
      confetti: true,
    },
  },

  {
    id: 'hot-streak-5',
    name: '¡Racha Caliente!',
    description: 'Toca 5 notas perfectas consecutivas',
    icon: '🔥',
    category: 'streak',
    rarity: 'common',
    condition: (stats) => stats.currentSession.perfectNoteStreak >= 5,
    reward: {
      message: '¡Estás en llamas! Sigue así.',
      confetti: false,
    },
  },

  {
    id: 'hot-streak-10',
    name: '¡Imparable!',
    description: 'Toca 10 notas perfectas consecutivas',
    icon: '🔥🔥',
    category: 'streak',
    rarity: 'rare',
    condition: (stats) => stats.currentSession.perfectNoteStreak >= 10,
    reward: {
      message: '¡Increíble precisión! Tu oído está muy afinado.',
      confetti: true,
    },
  },

  {
    id: 'hot-streak-20',
    name: '¡Maestro de la Precisión!',
    description: 'Toca 20 notas perfectas consecutivas',
    icon: '🔥🔥🔥',
    category: 'streak',
    rarity: 'epic',
    condition: (stats) => stats.currentSession.perfectNoteStreak >= 20,
    reward: {
      message: '¡Asombroso! Pocas personas logran este nivel de consistencia.',
      confetti: true,
      sound: 'epic-win',
    },
  },

  // === PRACTICE CONSISTENCY ===
  {
    id: 'daily-dedication',
    name: 'Dedicación Diaria',
    description: 'Practica 3 días seguidos',
    icon: '📅',
    category: 'streak',
    rarity: 'common',
    condition: (stats) => stats.currentStreak >= 3,
    reward: {
      message: 'La constancia es clave. ¡Sigue practicando!',
      confetti: false,
    },
  },

  {
    id: 'weekly-warrior',
    name: 'Guerrero Semanal',
    description: 'Practica 7 días seguidos',
    icon: '🏅',
    category: 'streak',
    rarity: 'rare',
    condition: (stats) => stats.currentStreak >= 7,
    reward: {
      message: '¡Una semana completa! Tu disciplina es admirable.',
      confetti: true,
    },
  },

  {
    id: 'month-master',
    name: 'Maestro del Mes',
    description: 'Practica 30 días seguidos',
    icon: '👑',
    category: 'streak',
    rarity: 'legendary',
    condition: (stats) => stats.currentStreak >= 30,
    reward: {
      message: '¡LEGENDARIO! Un mes de práctica diaria es extraordinario.',
      confetti: true,
      sound: 'legendary-win',
    },
  },

  // === SESSION MILESTONES ===
  {
    id: 'marathon-session',
    name: 'Sesión Maratónica',
    description: 'Practica durante 30 minutos seguidos',
    icon: '⏰',
    category: 'practice',
    rarity: 'rare',
    condition: (stats) => stats.currentSession.durationMs >= 30 * 60 * 1000,
    reward: {
      message: '¡30 minutos de práctica concentrada! Tu resistencia mejora.',
      confetti: true,
    },
  },

  {
    id: 'perfect-exercise',
    name: 'Ejecución Impecable',
    description: 'Completa un ejercicio con 100% de precisión',
    icon: '💯',
    category: 'accuracy',
    rarity: 'epic',
    condition: (stats) => stats.currentSession.accuracy >= 100,
    reward: {
      message: '¡PERFECTO! No fallaste ni una sola nota.',
      confetti: true,
      sound: 'perfect-score',
    },
  },

  {
    id: 'first-hundred-sessions',
    name: 'Centurión',
    description: 'Completa 100 sesiones de práctica',
    icon: '💪',
    category: 'practice',
    rarity: 'epic',
    condition: (stats) => stats.totalSessions >= 100,
    reward: {
      message: '¡100 sesiones! Tu dedicación es inspiradora.',
      confetti: true,
    },
  },

  // === EXPLORATION ===
  {
    id: 'explorer',
    name: 'Explorador Musical',
    description: 'Completa 5 ejercicios diferentes',
    icon: '🗺️',
    category: 'exploration',
    rarity: 'common',
    condition: (stats) => stats.exercisesCompleted.length >= 5,
    reward: {
      message: 'La variedad es el condimento de la práctica. ¡Sigue explorando!',
      confetti: false,
    },
  },

  {
    id: 'completionist',
    name: 'Completista',
    description: 'Completa todos los ejercicios disponibles',
    icon: '🏆',
    category: 'exploration',
    rarity: 'legendary',
    condition: (stats) => stats.exercisesCompleted.length >= 10, // Ajustar según total de ejercicios
    reward: {
      message: '¡Has dominado todos los ejercicios! Eres un verdadero maestro.',
      confetti: true,
      sound: 'legendary-win',
    },
  },
]
