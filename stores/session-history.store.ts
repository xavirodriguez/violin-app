import { create } from 'zustand'
import { PracticeSession } from './session.store'
import { validatedPersist } from '@/lib/persistence/validated-persist'
import { SessionHistoryStateSchema } from '@/lib/schemas/persistence.schema'

interface SessionHistoryState {
  sessions: PracticeSession[]
}

interface SessionHistoryActions {
  addSession: (session: PracticeSession) => void
  getHistory: (days?: number) => PracticeSession[]
}

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
