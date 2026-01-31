interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp: number
}

/**
 * Basic analytics tracker for monitoring user engagement.
 */
class AnalyticsTracker {
  private events: AnalyticsEvent[] = []

  /**
   * Track an event.
   * @param name - The name of the event.
   * @param properties - Optional properties associated with the event.
   */
  track(name: string, properties?: Record<string, any>) {
    this.events.push({
      name,
      properties,
      timestamp: Date.now(),
    })

    // En producción: enviar a servicio de analytics (Amplitude, Mixpanel, etc.)
    console.log('[Analytics]', name, properties)
  }

  /**
   * Get all tracked events.
   * @returns An array of tracked events.
   */
  getEvents() {
    return this.events
  }
}

export const analytics = new AnalyticsTracker()

// Eventos clave a trackear:
// - 'onboarding_started'
// - 'onboarding_completed'
// - 'achievement_unlocked'
// - 'feedback_level_changed'
// - 'practice_session_started'
// - 'practice_session_completed'
// - 'perfect_note_streak' (con propiedad 'streak_length')
