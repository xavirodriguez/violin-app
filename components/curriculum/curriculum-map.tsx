'use client'

import React from 'react'
import { useCurriculumStore } from '@/stores/curriculum-store'
import { Lesson, CurriculumUnit } from '@/lib/domain/curriculum'
import { usePracticeStore } from '@/stores/practice-store'
import { allExercises } from '@/lib/exercises'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ChevronRight, Target, CheckCircle } from 'lucide-react'

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
    <div className="mx-auto max-w-5xl space-y-12 py-8">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Your Learning Roadmap</h1>
        <p className="text-muted-foreground text-lg">
          Master technical milestones through structured progression.
        </p>
      </div>

      <div className="relative space-y-16 px-4">
        {/* Connecting line for the roadmap */}
        <div className="bg-border absolute bottom-0 left-8 top-0 w-1 md:left-1/2 md:-ml-0.5" />

        {units.map((unit, idx) => (
          <UnitSection
            key={unit.id}
            unit={unit}
            index={idx}
            onStartLesson={handleStartLesson}
          />
        ))}
      </div>
    </div>
  )
}

function UnitSection({
  unit,
  index,
  onStartLesson
}: {
  unit: CurriculumUnit;
  index: number;
  onStartLesson: (l: Lesson) => void
}) {
  const completedCount = unit.lessons.filter(l => l.isCompleted).length
  const progress = (completedCount / unit.lessons.length) * 100
  const isEven = index % 2 === 0

  return (
    <section className={`relative flex flex-col items-center md:flex-row ${isEven ? 'md:flex-row-reverse' : ''}`}>
      <div className="z-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:absolute md:left-1/2 md:-ml-6">
        {unit.isCompleted ? <CheckCircle className="h-6 w-6" /> : <span className="font-bold">{index + 1}</span>}
      </div>

      <div className={`mt-4 w-full md:mt-0 md:w-[45%] ${isEven ? 'md:pl-12' : 'md:pr-12'}`}>
        <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-amber-500 border-amber-500/30">
              Level {unit.level}
            </Badge>
            <span className="text-sm font-medium text-muted-foreground">
              {completedCount}/{unit.lessons.length} Lessons
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold">{unit.title}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{unit.description}</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Mastery</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid grid-cols-1 gap-3 pt-2">
            {unit.lessons.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => lesson.isUnlocked && onStartLesson(lesson)}
                className={`flex items-center justify-between rounded-lg border p-3 text-left transition-all ${
                  lesson.isUnlocked
                    ? 'hover:bg-accent border-border cursor-pointer'
                    : 'opacity-50 grayscale cursor-not-allowed border-dashed'
                } ${lesson.isCompleted ? 'bg-primary/5 border-primary/20' : 'bg-background'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${lesson.isCompleted ? 'bg-green-500/20 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                    {lesson.isCompleted ? <CheckCircle className="h-4 w-4" /> : <Target className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="text-sm font-bold">{lesson.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{lesson.description}</div>
                  </div>
                </div>
                {lesson.isUnlocked && !lesson.isCompleted && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </button>
            ))}
          </div>

          {unit.learningObjectives.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Learning Objectives</h4>
              <ul className="grid grid-cols-1 gap-1">
                {unit.learningObjectives.map(obj => (
                  <li key={obj.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-1 w-1 rounded-full bg-amber-500" />
                    {obj.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
