import { Achievement } from '@/stores/analytics-store';
interface AchievementsSectionProps {
    achievements: Achievement[];
}
/**
 * Displays recent achievements and locked achievements with progress bars.
 *
 * @param props - Contains the list of unlocked achievements.
 */
export declare function AchievementsSection(props: AchievementsSectionProps): import("react/jsx-runtime").JSX.Element;
export {};
/**
 * Renders a locked achievement with a progress bar showing completion percentage.
 */
