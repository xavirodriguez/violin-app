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
