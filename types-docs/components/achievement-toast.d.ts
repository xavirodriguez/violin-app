import type { Achievement } from '@/stores/analytics-store';
interface AchievementToastProps {
    achievement: Achievement;
    onDismiss: () => void;
    autoHideDuration?: number;
}
/**
 * Notificación animada que celebra logros desbloqueados
 */
export declare function AchievementToast({ achievement, onDismiss, autoHideDuration }: AchievementToastProps): import("react/jsx-runtime").JSX.Element;
/**
 * Manager component para manejar cola de notificaciones de logros
 */
export declare function AchievementNotificationManager(): import("react/jsx-runtime").JSX.Element | null;
export {};
