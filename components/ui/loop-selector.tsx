'use client'

import React from 'react'
import { usePracticeStore } from '@/stores/practice-store'
import { Button } from '@/components/ui/button'
import { Repeat, Target, Flame } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export function LoopSelector() {
  const { practiceState, setLoopRegion, loopRegion } = usePracticeStore()

  if (!practiceState) return null

  const toggleLoop = () => {
    if (loopRegion?.isEnabled) {
      setLoopRegion(undefined)
    } else {
      // Default loop for demonstration: first 4 notes
      setLoopRegion({
        startNoteIndex: 0,
        endNoteIndex: 3,
        isEnabled: true,
        tempoMultiplier: 1.0,
        history: [],
      })
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={loopRegion?.isEnabled ? 'default' : 'outline'}
        size="sm"
        onClick={toggleLoop}
        className="relative"
      >
        <Repeat className="mr-2 h-4 w-4" />
        {loopRegion?.isEnabled ? 'Looping' : 'Loop'}
      </Button>

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
