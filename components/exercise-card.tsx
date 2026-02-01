'use client'

import React, { useEffect, useRef, useState } from 'react'
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, Clock, Zap } from 'lucide-react'
import type { Exercise } from '@/lib/domain/musical-types'
import { cn } from '@/lib/utils'

interface ExerciseCardProps {
  exercise: Exercise
  isRecommended?: boolean
  lastAttempt?: { accuracy: number; timestamp: number }
  onClick: () => void
  isSelected: boolean
}

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
        autoResize: false, backend: 'svg', drawTitle: false, drawSubtitle: false,
        drawComposer: false, drawLyricist: false, drawPartNames: false,
        drawMeasureNumbers: false, drawFingerings: false,
      })
      try {
        await osmd.load(exercise.musicXML)
        if (!isMounted) return
        osmd.render()
        if (isMounted) setIsLoaded(true)
      } catch (e) { console.error('Error rendering OSMD preview', e) }
    }
    initOSMD()
    return () => { isMounted = false }
  }, [exercise.musicXML])

  return (
    <Card
      className={cn(
        'group relative flex flex-col overflow-hidden transition-all hover:shadow-lg cursor-pointer',
        isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-border',
        isRecommended && !isSelected ? 'border-yellow-500 ring-2 ring-yellow-500/20' : ''
      )}
      onClick={onClick}
    >
      {isRecommended && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="default" className="bg-yellow-500 text-white border-none shadow-sm">
            Recommended
          </Badge>
        </div>
      )}
      <div className="relative h-32 w-full bg-white overflow-hidden border-b">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/10">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        <div ref={containerRef} className="w-full transform scale-75 origin-top-left p-2" style={{ width: '133.33%' }} />
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-lg leading-tight line-clamp-1">{exercise.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{exercise.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
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
          <div className="pt-2 border-t mt-auto">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Best Accuracy</span>
              <span className="font-bold">{lastAttempt.accuracy.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all",
                  lastAttempt.accuracy > 90 ? "bg-green-500" : lastAttempt.accuracy > 70 ? "bg-yellow-500" : "bg-red-500"
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
