'use client'

import React from 'react'
import { RotateCcw, SkipForward, Play, Pause, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface PracticeQuickActionsProps {
  status: string; onRepeatNote: () => void; onRepeatMeasure: () => void; onContinue: () => void; onTogglePause: () => void; onToggleZen: () => void; isZen: boolean;
}

export function PracticeQuickActions({ status, onRepeatNote, onRepeatMeasure, onContinue, onTogglePause, onToggleZen, isZen }: PracticeQuickActionsProps) {
  return (
    <div className="fixed bottom-8 right-8 flex flex-col gap-3 z-50">
      <TooltipProvider>
        <div className="flex flex-col gap-3">
          <Tooltip>
            <TooltipTrigger asChild><Button variant="outline" size="icon" className="rounded-full shadow-lg bg-background/80" onClick={onToggleZen}>{isZen ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</Button></TooltipTrigger>
            <TooltipContent side="left">Zen Mode (Z)</TooltipContent>
          </Tooltip>
          <div className={cn("flex flex-col gap-3 transition-all duration-300", isZen ? "opacity-0 translate-y-10 pointer-events-none" : "opacity-100")}>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="outline" size="icon" className="rounded-full shadow-lg bg-background/80" onClick={onRepeatNote}><RotateCcw className="h-4 w-4" /></Button></TooltipTrigger>
              <TooltipContent side="left">Repeat Note (R)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="outline" size="icon" className="rounded-full shadow-lg bg-background/80" onClick={onContinue}><SkipForward className="h-4 w-4" /></Button></TooltipTrigger>
              <TooltipContent side="left">Skip Note (C)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="default" size="icon" className="rounded-full shadow-lg h-12 w-12" onClick={onTogglePause}>{status === 'listening' ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}</Button></TooltipTrigger>
              <TooltipContent side="left">{status === 'listening' ? 'Pause' : 'Resume'} (Space)</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    </div>
  )
}
