'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCurriculumStore } from '@/stores/curriculum-store'
import { usePracticeStore } from '@/stores/practice-store'
import { allExercises } from '@/lib/exercises'
import { CurriculumUnit, Lesson } from '@/lib/domain/curriculum'
import { CheckCircle2, Lock, PlayCircle, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CurriculumMap() {
  const { units } = useCurriculumStore()
  const loadExercise = usePracticeStore((s) => s.loadExercise)

  if (units.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Trophy className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
        <h3 className="mt-4 text-lg font-semibold">Tu currículo está siendo preparado</h3>
        <p className="text-muted-foreground">Pronto verás aquí tu mapa de aprendizaje personalizado.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-12 py-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Mi Progresión</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Domina cada unidad para desbloquear nuevos desafíos y técnicas.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        {units.map((unit) => (
          <UnitCard key={unit.id} unit={unit} onStartExercise={(exId) => {
            const exercise = allExercises.find(e => e.id === exId)
            if (exercise) loadExercise(exercise)
          }} />
        ))}
      </div>
    </div>
  )
}

function UnitCard({
  unit,
  onStartExercise,
}: {
  unit: CurriculumUnit
  onStartExercise: (id: string) => void
}) {
  return (
    <Card className={cn(
      "relative overflow-hidden border-2 transition-all duration-300",
      unit.isCompleted ? "border-green-500/50 bg-green-500/5" : "border-border"
    )}>
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1.5",
        unit.level === 0 ? "bg-amber-500" : unit.level === 1 ? "bg-orange-500" : "bg-red-500"
      )} />

      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
               <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
                 Nivel {unit.level}
               </Badge>
               {unit.isCompleted && <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">Completado</Badge>}
            </div>
            <h3 className="text-xl font-bold">{unit.title}</h3>
            <p className="text-sm text-muted-foreground">{unit.description}</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Lecciones</h4>
          <div className="grid gap-2">
            {unit.lessons.map((lesson: Lesson) => (
              <button
                key={lesson.id}
                disabled={!lesson.isUnlocked}
                onClick={() => onStartExercise(lesson.exerciseId)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border text-left transition-all",
                  lesson.isCompleted
                    ? "bg-green-50 border-green-200"
                    : lesson.isUnlocked
                      ? "bg-white hover:border-primary hover:shadow-sm"
                      : "bg-muted/50 opacity-60 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-3">
                  {lesson.isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : lesson.isUnlocked ? (
                    <PlayCircle className="h-5 w-5 text-primary" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <div className="text-sm font-bold">{lesson.title}</div>
                    <div className="text-[10px] text-muted-foreground">{lesson.description}</div>
                  </div>
                </div>
                {lesson.isUnlocked && !lesson.isCompleted && (
                  <span className="text-[10px] font-bold text-primary uppercase">Practicar</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Objetivos de Aprendizaje</span>
            <span className="text-xs font-bold">
              {Math.round(
                (unit.lessons.filter((l: Lesson) => l.isCompleted).length / unit.lessons.length) *
                  100,
              )}
              %
            </span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{
                width: `${(unit.lessons.filter((l: Lesson) => l.isCompleted).length / unit.lessons.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </Card>
  )
}
