/**
 * AnalyticsDashboard
 * Provides a comprehensive view of the user's practice history, skill levels, and achievements.
 */
/**
 * Main dashboard component that aggregates various analytics visualizations.
 *
 * @returns A JSX element with key metrics, skill bars, a practice time chart, and achievements.
 *
 * @remarks
 * Data Flow:
 * - Subscribes to `useAnalyticsStore` for the user's progress data.
 * - Uses internal utility functions to format data for the `recharts` components.
 */
export declare function AnalyticsDashboard(): import("react/jsx-runtime").JSX.Element;
