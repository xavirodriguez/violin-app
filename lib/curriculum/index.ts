import { CurriculumUnit } from '@/lib/domain/curriculum';

export const initialCurriculum: CurriculumUnit[] = [
  {
    id: 'unit-1',
    title: 'Getting Started',
    description: 'Learn the basics of violin playing.',
    order: 1,
    isCompleted: false,
    level: 0,
    prerequisites: [],
    learningObjectives: [
      { id: 'intonation_basic', label: 'Afinación básica', metrics: ['centsDeviation'], masteryThreshold: 0.8 }
    ],
    whyThisMatters: {
      title: 'Los fundamentos del sonido',
      description: 'Dominar las cuerdas al aire es esencial para desarrollar un arco estable y una afinación sólida.',
      tips: ['Mantén el arco paralelo al puente', 'Escucha la resonancia de la caja']
    },
    lessons: [
      {
        id: 'lesson-1',
        title: 'Open Strings: G',
        description: 'Practice the G string.',
        exerciseId: 'open-strings-g',
        isUnlocked: true,
        isCompleted: false,
        order: 1,
        conceptExplanation: 'The G string is the lowest string on the violin.'
      },
      {
        id: 'lesson-2',
        title: 'Open Strings: D',
        description: 'Practice the D string.',
        exerciseId: 'open-strings-d',
        isUnlocked: false,
        isCompleted: false,
        order: 2,
        conceptExplanation: 'The D string is the second lowest string.'
      }
    ]
  }
];
