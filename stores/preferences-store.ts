import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const usePreferencesStore = create<any>()(
  persist(
    (set) => ({
      language: 'es',
      setLanguage: (language: string) => set({ language }),
    }),
    {
      name: 'violin-preferences-simplified',
    }
  )
)
