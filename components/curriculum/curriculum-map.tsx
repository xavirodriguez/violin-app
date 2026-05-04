'use client'

import React from 'react'
import { useCurriculumStore } from '@/stores/curriculum-store'
import { LessonView } from './lesson-view'
import { Lesson } from '@/lib/domain/curriculum'
import { usePracticeStore } from '@/stores/practice-store'
import { allExercises } from '@/lib/exercises'

export function CurriculumMap() {
  const { units } = useCurriculumStore()
  const loadExercise = usePracticeStore((s) => s.loadExercise)

  const handleStartLesson = (lesson: Lesson) => {
    const exercise = allExercises.find((ex) => ex.id === lesson.exerciseId)
    if (exercise) {
      loadExercise(exercise)
    } else {
      console.error('Exercise not found:', lesson.exerciseId)
    }
  }

  return (
    <div className="space-y-8">
      {units.map((unit) => (
        <section key={unit.id} className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">{unit.title}</h2>
            <p className="text-muted-foreground">{unit.description}</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {unit.lessons.map((lesson) => (
              <LessonView key={lesson.id} lesson={lesson} onStart={handleStartLesson} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
