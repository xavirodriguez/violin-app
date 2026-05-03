'use client';

import React from 'react';
import { Lesson } from '@/lib/domain/curriculum';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, CheckCircle, PlayCircle } from 'lucide-react';

interface LessonViewProps {
  lesson: Lesson;
  onStart: (lesson: Lesson) => void;
}

export function LessonView({ lesson, onStart }: LessonViewProps) {
  return (
    <Card className={`relative ${!lesson.isUnlocked ? 'opacity-60' : ''}`}>
      {!lesson.isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-[1px] z-10 rounded-lg">
          <Lock className="h-8 w-8 text-muted-foreground" />
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
          <div className="p-3 bg-muted rounded-md text-sm italic">
            {lesson.conceptExplanation}
          </div>
        )}
        <Button
          className="w-full"
          disabled={!lesson.isUnlocked}
          onClick={() => onStart(lesson)}
        >
          <PlayCircle className="h-4 w-4 mr-2" />
          {lesson.isCompleted ? 'Review Lesson' : 'Start Lesson'}
        </Button>
      </CardContent>
    </Card>
  );
}
