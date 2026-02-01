interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp: number
}

class AnalyticsTracker {
  private events: AnalyticsEvent[] = []

  track(name: string, properties?: Record<string, any>) {
    this.events.push({
      name,
      properties,
      timestamp: Date.now()
    })

    // In production: send to analytics service (Amplitude, Mixpanel, etc.)
    console.log('[Analytics]', name, properties)
  }

  getEvents() {
    return this.events
  }
}

export const analytics = new AnalyticsTracker()
