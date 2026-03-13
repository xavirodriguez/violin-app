'use client'

import React from 'react'
import { RotateCcw, SkipForward, Play, Pause, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface PracticeQuickActionsProps {
  status: string
  onRepeatNote: () => void
  onRepeatMeasure: () => void
  onContinue: () => void
  onTogglePause: () => void
  onToggleZen: () => void
  isZen: boolean
}

export function PracticeQuickActions({
  status,
  onRepeatNote,
  onRepeatMeasure,
  onContinue,
  onTogglePause,
  onToggleZen,
  isZen,
}: PracticeQuickActionsProps) {
  return (
    <div className="fixed right-8 bottom-8 z-50 flex flex-col gap-3">
      <TooltipProvider>
        <div className="flex flex-col gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="bg-background/80 rounded-full shadow-lg"
                onClick={onToggleZen}
              >
                {isZen ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Zen Mode (Z)</TooltipContent>
          </Tooltip>
          <div
            className={cn(
              'flex flex-col gap-3 transition-all duration-300',
              isZen ? 'pointer-events-none translate-y-10 opacity-0' : 'opacity-100',
            )}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-background/80 rounded-full shadow-lg"
                  onClick={onRepeatNote}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Repeat Note (R)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-background/80 rounded-full shadow-lg"
                  onClick={onContinue}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Skip Note (C)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  className="h-12 w-12 rounded-full shadow-lg"
                  onClick={onTogglePause}
                >
                  {status === 'listening' ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {status === 'listening' ? 'Pause' : 'Resume'} (Space)
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    </div>
  )
}
