/**
 * Curriculum Domain
 *
 * Defines types for the educational curriculum and progression.
 */


/**
 * Represents a single lesson in the curriculum.
 */
export interface Lesson {
  id: string;
  title: string;
  description: string;
  exerciseId: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  conceptExplanation?: string;
  order: number;
}

/**
 * Represents a unit of lessons in the curriculum.
 */
export interface CurriculumUnit {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  isCompleted: boolean;
  order: number;
  level: 0 | 1 | 2 | 3;
  prerequisites: string[];         // IDs de unidades previas
  learningObjectives: LearningObjective[];
  whyThisMatters: LessonContent;
}

export interface LearningObjective {
  id: string;                       // e.g. "vibrato_basic"
  label: string;                      // "Vibrato básico"
  metrics: string[];               // ["vibratoRate", "vibratoDepth"]
  masteryThreshold: number;         // 0.0 – 1.0
}

export interface LessonContent {
  title: string;
  description: string;
  videoUrl?: string;
  tips: string[];
}

/**
 * Represents an event triggered by user performance to provide feedback.
 */
export interface FeedbackEvent {
  type: 'success' | 'warning' | 'info';
  message: string;
  context: 'intonation' | 'rhythm' | 'technique';
  timestamp: number;
}
