'use client'

import React from 'react'
import { usePracticeStore } from '@/stores/practice-store'
import { Button } from '@/components/ui/button'
import { Repeat, Target, Flame } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function LoopSelector() {
  const { practiceState, setLoopRegion, loopRegion } = usePracticeStore()

  if (!practiceState) return null

  const toggleLoop = () => {
    if (loopRegion?.isEnabled) {
      setLoopRegion(undefined)
    } else {
      // Default loop for demonstration: current note + next 3
      const start = practiceState.currentIndex
      const end = Math.min(start + 3, practiceState.exercise.notes.length - 1)
      setLoopRegion({
        startNoteIndex: start,
        endNoteIndex: end,
        isEnabled: true,
        tempoMultiplier: 1.0,
        history: [],
        drillTarget: {
          precisionGoal: 0.85,
          consecutiveRequired: 2,
          currentStreak: 0,
        },
      })
    }
  }

  const setPrecisionGoal = (goal: number) => {
    if (loopRegion) {
      setLoopRegion({
        ...loopRegion,
        drillTarget: {
          ...(loopRegion.drillTarget || { consecutiveRequired: 2, currentStreak: 0 }),
          precisionGoal: goal,
        },
      })
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex rounded-lg border overflow-hidden">
        <Button
          variant={loopRegion?.isEnabled ? 'default' : 'ghost'}
          size="sm"
          onClick={toggleLoop}
          className="rounded-none border-0 h-9"
        >
          <Repeat className="mr-2 h-4 w-4" />
          {loopRegion?.isEnabled ? 'Looping' : 'Loop'}
        </Button>

        {loopRegion?.isEnabled && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button variant="ghost" size="sm" className="px-2 border-l rounded-none h-9">
                 <Target className="h-3.5 w-3.5" />
               </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Objetivo de Precisión</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={loopRegion.drillTarget?.precisionGoal.toString()}
                onValueChange={(v) => setPrecisionGoal(parseFloat(v))}
              >
                <DropdownMenuRadioItem value="0.7">Relajado (70%)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="0.8">Sólido (80%)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="0.85">Estándar (85%)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="0.9">Preciso (90%)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="0.95">Maestro (95%)</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {loopRegion?.isEnabled && loopRegion.drillTarget && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full px-2 py-1 cursor-default">
                <Target className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[10px] font-bold text-amber-600">
                  {Math.round(loopRegion.drillTarget.precisionGoal * 100)}% Goal
                </span>
                <div className="h-3 w-[1px] bg-amber-500/30 mx-0.5" />
                <Flame className={`h-3.5 w-3.5 ${loopRegion.drillTarget.currentStreak > 0 ? 'text-orange-500 animate-pulse' : 'text-slate-300'}`} />
                <span className="text-[10px] font-bold text-slate-600">
                  {loopRegion.drillTarget.currentStreak} / {loopRegion.drillTarget.consecutiveRequired}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                <b>Drill Mode Active</b><br/>
                Complete {loopRegion.drillTarget.consecutiveRequired} times with {Math.round(loopRegion.drillTarget.precisionGoal * 100)}% accuracy to master this section.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
