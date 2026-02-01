/**
 * Calcula observaciones técnicas en tiempo real basándose en el historial
 * de detecciones recientes (sin esperar a completar la nota).
 */
import { DetectedNote } from './practice-core';
import { Observation } from './technique-types';
/**
 * Calcula observaciones en vivo que el estudiante puede corregir
 * MIENTRAS está tocando.
 */
export declare function calculateLiveObservations(recentDetections: DetectedNote[], targetPitch: string): Observation[];
