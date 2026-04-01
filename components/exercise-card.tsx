'use client'

import React, { useEffect, useRef, useState } from 'react'
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, Clock, Zap } from 'lucide-react'
import type { Exercise } from '@/lib/domain/musical-types'
import { cn } from '@/lib/utils'

/**
 * Returns Tailwind classes for difficulty badge coloring.
 *
 * @param difficulty - The exercise difficulty level.
 * @returns CSS class string for the badge.
 */
function getDifficultyBadgeClass(difficulty: string): string {
  switch (difficulty) {
    case 'Beginner':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
    case 'Intermediate':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
    case 'Advanced':
      return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    default:
      return ''
  }
}

interface ExerciseCardProps {
  exercise: Exercise
  isRecommended?: boolean
  lastAttempt?: { accuracy: number; timestamp: number }
  onClick: () => void
  isSelected: boolean
}

/**
 * Visual card representing a violin exercise with OSMD preview.
 */
export function ExerciseCard({
  exercise,
  isRecommended,
  lastAttempt,
  onClick,
  isSelected,
}: ExerciseCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let isMounted = true
    const initOSMD = async () => {
      if (!containerRef.current) return
      const osmd = new OpenSheetMusicDisplay(containerRef.current, {
        autoResize: false,
        backend: 'svg',
        drawTitle: false,
        drawSubtitle: false,
        drawComposer: false,
        drawLyricist: false,
        drawPartNames: false,
        drawMeasureNumbers: false,
        drawFingerings: false,
      })
      try {
        await osmd.load(exercise.musicXML)
        if (!isMounted) return
        osmd.render()
        if (isMounted) setIsLoaded(true)
      } catch (e) {
        console.error('Error rendering OSMD preview', e)
      }
    }
    initOSMD()
    return () => {
      isMounted = false
    }
  }, [exercise.musicXML])

  return (
    <Card
      className={cn(
        'group relative flex cursor-pointer flex-col overflow-hidden transition-all hover:shadow-lg',
        isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-border',
        isRecommended && !isSelected ? 'border-yellow-500 ring-2 ring-yellow-500/20' : '',
      )}
      onClick={onClick}
    >
      {isRecommended && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="default" className="border-none bg-yellow-500 text-white shadow-sm">
            Recommended
          </Badge>
        </div>
      )}
      <div className="relative h-32 w-full overflow-hidden border-b bg-white">
        {!isLoaded && (
          <div className="bg-muted/10 absolute inset-0 flex items-center justify-center">
            <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        )}
        <div
          ref={containerRef}
          className="w-full origin-top-left scale-75 transform p-2"
          style={{ width: '133.33%' }}
        />
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-1 text-lg leading-tight font-bold">{exercise.name}</h3>
          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{exercise.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="secondary"
            className={cn(
              'gap-1',
              getDifficultyBadgeClass(exercise.difficulty),
            )}
          >
            <Star className="h-3 w-3 fill-current" />
            {exercise.difficulty}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {exercise.estimatedDuration}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            {exercise.technicalTechnique}
          </Badge>
        </div>
        {lastAttempt && (
          <div className="mt-auto border-t pt-2">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Best Accuracy</span>
              <span className="font-bold">{lastAttempt.accuracy.toFixed(0)}%</span>
            </div>
            <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
              <div
                className={cn(
                  'h-full transition-all',
                  lastAttempt.accuracy > 90
                    ? 'bg-green-500'
                    : lastAttempt.accuracy > 70
                      ? 'bg-yellow-500'
                      : 'bg-red-500',
                )}
                style={{ width: `${lastAttempt.accuracy}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
