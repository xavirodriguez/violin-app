interface AnalyticsEvent {
    name: string;
    properties?: Record<string, any>;
    timestamp: number;
}
declare class AnalyticsTracker {
    private events;
    track(name: string, properties?: Record<string, any>): void;
    getEvents(): AnalyticsEvent[];
}
export declare const analytics: AnalyticsTracker;
export {};
