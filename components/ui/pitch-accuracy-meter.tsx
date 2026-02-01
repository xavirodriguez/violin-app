'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PitchAccuracyMeterProps {
  centsOff: number | null
  isInTune: boolean
  showNumericValue?: boolean
}

export function PitchAccuracyMeter({
  centsOff,
  isInTune,
  showNumericValue = true,
}: PitchAccuracyMeterProps) {
  const displayCents = centsOff === null ? 0 : Math.max(-50, Math.min(50, centsOff))
  const positionPercent = ((displayCents + 50) / 100) * 100

  return (
    <div className="w-full space-y-2">
      <div className="relative h-12 w-full overflow-hidden rounded-lg bg-muted/30 border border-border">
        <div className="absolute inset-0 flex">
          <div className="h-full w-[25%] bg-red-500/20" />
          <div className="h-full w-[15%] bg-yellow-500/20" />
          <div className="h-full w-[20%] bg-green-500/40" />
          <div className="h-full w-[15%] bg-yellow-500/20" />
          <div className="h-full w-[25%] bg-red-500/20" />
        </div>
        <div className="absolute left-1/2 top-0 h-full w-0.5 bg-foreground/30 -translate-x-1/2" />
        <div className="absolute inset-x-0 bottom-0 flex justify-between px-1 text-[10px] text-muted-foreground">
          <span>-50</span>
          <span>-25</span>
          <span className="font-bold">0</span>
          <span>+25</span>
          <span>+50</span>
        </div>
        {centsOff !== null && (
          <motion.div
            className="absolute top-0 bottom-0 w-1 bg-foreground z-10"
            initial={false}
            animate={{ left: `${positionPercent}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ translateX: '-50%' }}
          >
            <div className={cn(
              "absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full shadow-md",
              isInTune ? "bg-green-500" : Math.abs(centsOff) < 25 ? "bg-yellow-500" : "bg-red-500"
            )} />
          </motion.div>
        )}
      </div>
      {showNumericValue && centsOff !== null && (
        <div className="text-center text-sm font-mono font-medium">
          <span className={cn(
            isInTune ? "text-green-500" : Math.abs(centsOff) < 25 ? "text-yellow-500" : "text-red-500"
          )}>
            {centsOff > 0 ? '+' : ''}{centsOff.toFixed(1)}¢
          </span>
        </div>
      )}
    </div>
  )
}
