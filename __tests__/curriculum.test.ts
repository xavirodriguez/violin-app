import { describe, it, expect, beforeEach } from 'vitest';
import { useCurriculumStore } from '../stores/curriculum-store';

describe('CurriculumStore', () => {
  const mockUnits = [
    {
      id: 'unit-1',
      title: 'Unit 1',
      description: 'Desc',
      order: 1,
      isCompleted: false,
      lessons: [
        {
          id: 'lesson-1',
          title: 'Lesson 1',
          description: 'Desc',
          exerciseId: 'ex-1',
          isUnlocked: true,
          isCompleted: false,
          order: 1,
        },
        {
          id: 'lesson-2',
          title: 'Lesson 2',
          description: 'Desc',
          exerciseId: 'ex-2',
          isUnlocked: false,
          isCompleted: false,
          order: 2,
        },
      ],
    },
  ];

  beforeEach(() => {
    useCurriculumStore.getState().initializeCurriculum(mockUnits);
  });

  it('should complete a lesson and unlock the next one', () => {
    useCurriculumStore.getState().completeLesson('unit-1', 'lesson-1');

    const units = useCurriculumStore.getState().units;
    expect(units[0].lessons[0].isCompleted).toBe(true);
    expect(units[0].lessons[1].isUnlocked).toBe(true);
  });

  it('should mark unit as completed when all lessons are done', () => {
    useCurriculumStore.getState().completeLesson('unit-1', 'lesson-1');
    useCurriculumStore.getState().completeLesson('unit-1', 'lesson-2');

    const units = useCurriculumStore.getState().units;
    expect(units[0].isCompleted).toBe(true);
  });
});
