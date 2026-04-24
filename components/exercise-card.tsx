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

/**
 * Visual card representing a violin exercise with OSMD preview.
 */
export function ExerciseCard(props: ExerciseCardProps) {
  const { exercise, isRecommended, lastAttempt, onClick, isSelected } = props
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useOsmdPreview({ containerRef, musicXML: exercise.musicXML, setIsLoaded })

  return (
    <Card
      className={cn(
        'group relative flex cursor-pointer flex-col overflow-hidden transition-all hover:shadow-lg',
        isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-border',
        isRecommended && !isSelected ? 'border-yellow-500 ring-2 ring-yellow-500/20' : '',
      )}
      onClick={onClick}
    >
      <RecommendedBadge isRecommended={isRecommended} />
      <ExercisePreview containerRef={containerRef} isLoaded={isLoaded} />
      <ExerciseCardContent exercise={exercise} lastAttempt={lastAttempt} />
    </Card>
  )
}

function useOsmdPreview(params: {
  containerRef: React.RefObject<HTMLDivElement | null>
  musicXML: string
  setIsLoaded: (loaded: boolean) => void
}) {
  const { containerRef, musicXML, setIsLoaded } = params

  useEffect(() => {
    let isMounted = true
    const initOSMD = async () => {
      const container = containerRef.current
      if (!container) return
      const osmd = createOsmdInstance(container)
      await renderOsmdPreview({ osmd, musicXML, isMounted, setIsLoaded })
    }
    initOSMD()
    return () => {
      isMounted = false
    }
  }, [musicXML, containerRef, setIsLoaded])
}

function createOsmdInstance(container: HTMLElement): OpenSheetMusicDisplay {
  return new OpenSheetMusicDisplay(container, {
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
}

async function renderOsmdPreview(params: {
  osmd: OpenSheetMusicDisplay
  musicXML: string
  isMounted: boolean
  setIsLoaded: (loaded: boolean) => void
}) {
  const { osmd, musicXML, isMounted, setIsLoaded } = params
  try {
    await osmd.load(musicXML)
    if (!isMounted) return
    osmd.render()
    setIsLoaded(true)
  } catch (e) {
    console.error('Error rendering OSMD preview', e)
  }
}

function RecommendedBadge({ isRecommended }: { isRecommended?: boolean }) {
  if (!isRecommended) return <></>
  return (
    <div className="absolute top-2 right-2 z-10">
      <Badge variant="default" className="border-none bg-yellow-500 text-white shadow-sm">
        Recommended
      </Badge>
    </div>
  )
}

function ExercisePreview({
  containerRef,
  isLoaded,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
  isLoaded: boolean
}) {
  return (
    <div className="relative h-32 w-full overflow-hidden border-b bg-white">
      {!isLoaded && <PreviewLoadingIndicator />}
      <div
        ref={containerRef}
        className="w-full origin-top-left scale-75 transform p-2"
        style={{ width: '133.33%' }}
      />
    </div>
  )
}

function PreviewLoadingIndicator() {
  return (
    <div className="bg-muted/10 absolute inset-0 flex items-center justify-center">
      <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
    </div>
  )
}

function ExerciseCardContent({
  exercise,
  lastAttempt,
}: {
  exercise: Exercise
  lastAttempt?: { accuracy: number; timestamp: number }
}) {
  return (
    <div className="space-y-3 p-4">
      <ExerciseCardHeader name={exercise.name} description={exercise.description} />
      <ExerciseCardBadges exercise={exercise} />
      <LastAttemptStats lastAttempt={lastAttempt} />
    </div>
  )
}

function ExerciseCardHeader({ name, description }: { name: string; description: string }) {
  return (
    <div>
      <h3 className="line-clamp-1 text-lg leading-tight font-bold">{name}</h3>
      <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{description}</p>
    </div>
  )
}

function ExerciseCardBadges({ exercise }: { exercise: Exercise }) {
  return (
    <div className="flex flex-wrap gap-2">
      <DifficultyBadge difficulty={exercise.difficulty} />
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3" />
        {exercise.estimatedDuration}
      </Badge>
      <Badge variant="outline" className="gap-1">
        <Zap className="h-3 w-3" />
        {exercise.technicalTechnique}
      </Badge>
    </div>
  )
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const styles = getDifficultyStyles(difficulty)
  return (
    <Badge className={cn('gap-1', styles.badge)}>
      <Star className={cn('h-3 w-3', styles.icon)} />
      {difficulty}
    </Badge>
  )
}

function getDifficultyStyles(difficulty: string) {
  if (difficulty === 'Beginner') {
    return { badge: 'bg-green-100 text-green-700 hover:bg-green-200', icon: 'fill-green-500 text-green-500' }
  }
  if (difficulty === 'Intermediate') {
    return { badge: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200', icon: 'fill-yellow-500 text-yellow-500' }
  }
  return { badge: 'bg-red-100 text-red-700 hover:bg-red-200', icon: 'fill-red-500 text-red-500' }
}

function LastAttemptStats({ lastAttempt }: { lastAttempt?: { accuracy: number } }) {
  if (!lastAttempt) return <></>

  const { accuracy } = lastAttempt
  const colorClass = accuracy > 90 ? 'bg-green-500' : accuracy > 70 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="mt-auto border-t pt-2">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Best Accuracy</span>
        <span className="font-bold">{accuracy.toFixed(0)}%</span>
      </div>
      <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
        <div className={cn('h-full transition-all', colorClass)} style={{ width: `${accuracy}%` }} />
      </div>
    </div>
  )
}
