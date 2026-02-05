import { create } from 'zustand'
import { PracticeSession } from './session.store'
import { validatedPersist } from '@/lib/persistence/validated-persist'
import { SessionHistoryStateSchema } from '@/lib/schemas/persistence.schema'

/**
 * Internal state for the session history store.
 */
interface SessionHistoryState {
  /** Array of completed practice sessions, capped at 100. */
  sessions: PracticeSession[]
}

/**
 * Actions for managing session history.
 */
interface SessionHistoryActions {
  /**
   * Adds a completed session to the history.
   *
   * @param session - The session to add.
   */
  addSession: (session: PracticeSession) => void

  /**
   * Retrieves sessions filtered by age.
   *
   * @param days - Number of days to look back.
   * @returns Filtered array of {@link PracticeSession}.
   */
  getHistory: (days?: number) => PracticeSession[]
}

/**
 * Zustand store for persisting and retrieving practice session history.
 *
 * @remarks
 * This store provides a simple persistent log of recent practice activity.
 * It uses `validatedPersist` to ensure data integrity.
 *
 * @public
 */
export const useSessionHistoryStore = create<SessionHistoryState & SessionHistoryActions>()(
  validatedPersist(
    SessionHistoryStateSchema as any,
    (set, get) => ({
      sessions: [],

      addSession: (session) => {
        set(state => ({
          sessions: [session, ...state.sessions].slice(0, 100)
        }))
      },

      getHistory: (days = 7) => {
        const { sessions } = get()
        const cutoffMs = Date.now() - (days * 24 * 60 * 60 * 1000)
        return sessions.filter(s => s.endTimeMs >= cutoffMs)
      }
    }),
    {
      name: 'violin-session-history'
    }
  )
)
