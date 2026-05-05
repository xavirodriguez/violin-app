import { CurriculumUnit } from '../domain/curriculum'

export const INITIAL_CURRICULUM: CurriculumUnit[] = [
  {
    id: 'unit-0-foundations',
    title: 'Foundations: Open Strings',
    description: 'Establish correct posture and bow control by practicing on open strings.',
    level: 0,
    order: 1,
    isCompleted: false,
    prerequisites: [],
    learningObjectives: [
      { id: 'steady-bow', label: 'Steady Bow Stroke', metrics: ['pitchStability'], masteryThreshold: 0.8 },
      { id: 'string-identification', label: 'String Identification', metrics: ['accuracy'], masteryThreshold: 0.9 }
    ],
    whyThisMatters: {
      title: 'The Foundation of Sound',
      description: 'Open strings allow you to focus entirely on your bow hand. A beautiful violin sound starts here.',
      tips: [
        'Keep the bow parallel to the bridge.',
        'Use the middle of the bow for best control.',
        'Listen for a clear, ringing tone without scratching.'
      ]
    },
    lessons: [
      {
        id: 'lesson-g-string',
        title: 'The G String',
        description: 'Deep and resonant lowest string.',
        exerciseId: 'open-g-string',
        isUnlocked: true,
        isCompleted: false,
        order: 1
      },
      {
        id: 'lesson-d-string',
        title: 'The D String',
        description: 'Warm middle-low string.',
        exerciseId: 'open-d-string',
        isUnlocked: true,
        isCompleted: false,
        order: 2
      },
      {
        id: 'lesson-a-string',
        title: 'The A String',
        description: 'Brilliant middle-high string.',
        exerciseId: 'open-a-string',
        isUnlocked: true,
        isCompleted: false,
        order: 3
      },
      {
        id: 'lesson-e-string',
        title: 'The E String',
        description: 'The highest, brightest string.',
        exerciseId: 'open-e-string',
        isUnlocked: true,
        isCompleted: false,
        order: 4
      }
    ]
  },
  {
    id: 'unit-1-tetrachords',
    title: 'First Steps: Tetrachords',
    description: 'Introduction to left-hand finger placement using the major tetrachord pattern.',
    level: 1,
    order: 2,
    isCompleted: false,
    prerequisites: ['unit-0-foundations'],
    learningObjectives: [
      { id: 'finger-spacing', label: 'Finger Spacing (0-1-2-3)', metrics: ['intonation'], masteryThreshold: 0.8 },
      { id: 'left-hand-stability', label: 'Left Hand Stability', metrics: ['pitchStability'], masteryThreshold: 0.75 }
    ],
    whyThisMatters: {
      title: 'Mapping the Fingerboard',
      description: 'Tetrachords are the building blocks of scales. Mastering this 4-note pattern unlocks the whole instrument.',
      tips: [
        'Keep your fingers curved and tall.',
        'Place the tip of the finger, not the pad.',
        'Ensure your thumb is relaxed behind the neck.'
      ]
    },
    lessons: [
      {
        id: 'lesson-g-tetrachord',
        title: 'G Major Tetrachord',
        description: 'Foundation on the D string.',
        exerciseId: 'g-major-tetrachord-lower',
        isUnlocked: true,
        isCompleted: false,
        order: 1
      },
      {
        id: 'lesson-d-tetrachord',
        title: 'D Major Tetrachord',
        description: 'Higher range on the A string.',
        exerciseId: 'd-major-tetrachord-lower',
        isUnlocked: true,
        isCompleted: false,
        order: 2
      }
    ]
  },
  {
    id: 'unit-2-scales-basic',
    title: 'Connecting Notes: Full Scales',
    description: 'Combine tetrachords to play complete one-octave scales.',
    level: 1,
    order: 3,
    isCompleted: false,
    prerequisites: ['unit-1-tetrachords'],
    learningObjectives: [
      { id: 'string-crossing', label: 'Smooth String Crossings', metrics: ['transitionQuality'], masteryThreshold: 0.7 },
      { id: 'scale-fluency', label: 'Scale Fluency', metrics: ['rhythm'], masteryThreshold: 0.8 }
    ],
    whyThisMatters: {
      title: 'The Secret to Virtuosity',
      description: 'Every great violinist practices scales daily. They build the technical vocabulary needed for any piece of music.',
      tips: [
        'Prepare the bow for the next string in advance.',
        'Listen for the octave to be perfectly in tune.',
        'Keep a steady tempo throughout.'
      ]
    },
    lessons: [
      {
        id: 'lesson-g-scale',
        title: 'G Major Scale',
        description: 'First full octave scale.',
        exerciseId: 'g-major-scale-one-octave',
        isUnlocked: true,
        isCompleted: false,
        order: 1
      },
      {
        id: 'lesson-d-scale',
        title: 'D Major Scale',
        description: 'Brilliant D major octave.',
        exerciseId: 'd-major-scale-one-octave',
        isUnlocked: true,
        isCompleted: false,
        order: 2
      }
    ]
  },
  {
    id: 'unit-3-musicality',
    title: 'Musical Expression: Phrasing',
    description: 'Learn to group notes into meaningful musical phrases.',
    level: 2,
    order: 4,
    isCompleted: false,
    prerequisites: ['unit-2-scales-basic'],
    learningObjectives: [
      { id: 'phrase-shaping', label: 'Dynamic Shaping', metrics: ['volume'], masteryThreshold: 0.7 },
      { id: 'intonation-context', label: 'Contextual Intonation', metrics: ['intonation'], masteryThreshold: 0.85 }
    ],
    whyThisMatters: {
      title: 'Speaking Through Your Instrument',
      description: 'Music is a language. Phrasing is how we add punctuation and emotion to our playing.',
      tips: [
        'Think of a phrase like a spoken sentence.',
        'Use slightly more bow speed for the peak of the phrase.',
        'Taper the volume at the end of musical thoughts.'
      ]
    },
    lessons: [
      {
        id: 'lesson-simple-melody',
        title: 'Simple Melodic Phrases',
        description: 'Applying phrasing to basic melodies.',
        exerciseId: 'simple-melody-phrasing',
        isUnlocked: true,
        isCompleted: false,
        order: 1
      }
    ]
  },
  {
    id: 'unit-4-vibrato-intro',
    title: 'Warmth and Color: Intro to Vibrato',
    description: 'Begin the journey of developing a beautiful vibrato.',
    level: 3,
    order: 5,
    isCompleted: false,
    prerequisites: ['unit-3-musicality'],
    learningObjectives: [
      { id: 'vibrato-oscillation', label: 'Even Oscillation', metrics: ['vibrato'], masteryThreshold: 0.6 },
      { id: 'vibrato-freedom', label: 'Left Hand Freedom', metrics: ['pitchStability'], masteryThreshold: 0.7 }
    ],
    whyThisMatters: {
      title: 'Adding Soul to the Sound',
      description: 'Vibrato is one of the most distinctive elements of a violinists voice. It requires a relaxed and flexible hand.',
      tips: [
        'Ensure your thumb is not gripping the neck.',
        'Start with slow, wide movements.',
        'Practice the oscillation without the bow first.'
      ]
    },
    lessons: [
      {
        id: 'lesson-vibrato-base',
        title: 'Vibrato Development',
        description: 'First vibrato exercises.',
        exerciseId: 'vibrato-foundation-exercise',
        isUnlocked: true,
        isCompleted: false,
        order: 1
      }
    ]
  }
]
