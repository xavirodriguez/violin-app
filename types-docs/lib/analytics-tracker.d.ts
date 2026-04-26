interface AnalyticsEvent {
    name: string;
    properties?: Record<string, unknown>;
    timestamp: number;
}
declare class AnalyticsTracker {
    private events;
    track(name: string, properties?: Record<string, unknown>): void;
    getEvents(): AnalyticsEvent[];
}
export declare const analytics: AnalyticsTracker;
export {};
