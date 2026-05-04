'use client'

import React from 'react'
import { Lesson } from '@/lib/domain/curriculum'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lock, CheckCircle, PlayCircle } from 'lucide-react'

interface LessonViewProps {
  lesson: Lesson
  onStart: (lesson: Lesson) => void
}

export function LessonView({ lesson, onStart }: LessonViewProps) {
  return (
    <Card className={`relative ${!lesson.isUnlocked ? 'opacity-60' : ''}`}>
      {!lesson.isUnlocked && (
        <div className="bg-background/20 absolute inset-0 z-10 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
          <Lock className="text-muted-foreground h-8 w-8" />
        </div>
      )}
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{lesson.title}</span>
          {lesson.isCompleted && <CheckCircle className="h-5 w-5 text-green-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{lesson.description}</p>
        {lesson.conceptExplanation && (
          <div className="bg-muted rounded-md p-3 text-sm italic">{lesson.conceptExplanation}</div>
        )}
        <Button className="w-full" disabled={!lesson.isUnlocked} onClick={() => onStart(lesson)}>
          <PlayCircle className="mr-2 h-4 w-4" />
          {lesson.isCompleted ? 'Review Lesson' : 'Start Lesson'}
        </Button>
      </CardContent>
    </Card>
  )
}
