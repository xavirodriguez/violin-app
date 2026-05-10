import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useProgressStore = create<any>()(
  persist(
    (set) => ({
      intonationSkill: 0,
      overallSkill: 0,
      updateSkill: (intonation: number) => set({ intonationSkill: intonation, overallSkill: intonation }),
    }),
    { name: 'violin-progress-simplified' }
  )
)
