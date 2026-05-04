import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CurriculumUnit } from '@/lib/domain/curriculum';

interface CurriculumStore {
  units: CurriculumUnit[];

  unlockLesson: (unitId: string, lessonId: string) => void;
  completeLesson: (unitId: string, lessonId: string) => void;
  initializeCurriculum: (units: CurriculumUnit[]) => void;
}

export const useCurriculumStore = create<CurriculumStore>()(
  persist(
    (set) => ({
      units: [],

      initializeCurriculum: (units) => set({ units }),

      unlockLesson: (unitId, lessonId) => set((state) => ({
        units: state.units.map(unit =>
          unit.id === unitId
            ? {
                ...unit,
                lessons: unit.lessons.map(lesson =>
                  lesson.id === lessonId ? { ...lesson, isUnlocked: true } : lesson
                )
              }
            : unit
        )
      })),

      completeLesson: (unitId, lessonId) => set((state) => {
        const newUnits = state.units.map(unit => {
          if (unit.id !== unitId) return unit;

          const lessonIndex = unit.lessons.findIndex(l => l.id === lessonId);
          const newLessons = unit.lessons.map((lesson, idx) => {
            if (idx === lessonIndex) return { ...lesson, isCompleted: true };
            // Unlock next lesson
            if (idx === lessonIndex + 1) return { ...lesson, isUnlocked: true };
            return lesson;
          });

          const isUnitCompleted = newLessons.every(l => l.isCompleted);
          return { ...unit, lessons: newLessons, isCompleted: isUnitCompleted };
        });

        return { units: newUnits };
      }),
    }),
    {
      name: 'curriculum-storage',
    }
  )
);
