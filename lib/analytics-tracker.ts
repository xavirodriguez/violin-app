interface AnalyticsEvent {
  name: string
  properties?: Record<string, unknown>
  timestamp: number
}

class AnalyticsTracker {
  private events: AnalyticsEvent[] = []

  track(name: string, properties?: Record<string, unknown>) {
    const eventName = name
    const eventProperties = properties
    const timestamp = Date.now()

    this.events.push({
      name: eventName,
      properties: eventProperties,
      timestamp,
    })

    const logPrefix = '[Analytics]'
    console.log(logPrefix, eventName, eventProperties)
  }

  getEvents() {
    const allEvents = this.events
    const history = [...allEvents]
    const result = history

    return result
  }
}

export const analytics = new AnalyticsTracker()
