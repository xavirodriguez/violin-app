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
      <div className="relative h-[60px] w-full overflow-hidden rounded-lg bg-muted/30 border border-border">
        {/* Background segments with CSS variables */}
        <div className="absolute inset-0 flex">
          <div className="h-full w-[25%]" style={{ backgroundColor: 'var(--pitch-very-flat)', opacity: 0.2 }} />
          <div className="h-full w-[15%]" style={{ backgroundColor: 'var(--pitch-close-flat)', opacity: 0.2 }} />
          <div className="h-full w-[20%]" style={{ backgroundColor: 'var(--pitch-perfect)', opacity: 0.4 }} />
          <div className="h-full w-[15%]" style={{ backgroundColor: 'var(--pitch-close-flat)', opacity: 0.2 }} />
          <div className="h-full w-[25%]" style={{ backgroundColor: 'var(--pitch-very-flat)', opacity: 0.2 }} />
        </div>

        {/* Central marker */}
        <div className="absolute left-1/2 top-0 h-full w-0.5 bg-foreground/30 -translate-x-1/2 shadow-[0_0_8px_rgba(255,255,255,0.5)]" />

        {/* Labels */}
        <div className="absolute inset-x-0 bottom-1 flex justify-between px-2 text-[10px] text-muted-foreground font-mono">
          <span>-50</span>
          <span>-25</span>
          <span className="font-bold text-foreground">0</span>
          <span>+25</span>
          <span>+50</span>
        </div>

        {/* Animated indicator */}
        {centsOff !== null && (
          <motion.div
            className="absolute top-0 bottom-0 w-1 bg-foreground z-10"
            initial={false}
            animate={{ left: `${positionPercent}%` }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            style={{ translateX: '-50%' }}
          >
            {/* Value display ABOVE the indicator */}
            {showNumericValue && (
              <div className={cn(
                "absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-mono font-bold whitespace-nowrap",
                isInTune ? "text-[var(--pitch-perfect)]" : Math.abs(centsOff) < 25 ? "text-[var(--pitch-close-flat)]" : "text-[var(--pitch-very-flat)]"
              )}>
                {centsOff > 0 ? '+' : ''}{centsOff.toFixed(1)}¢
              </div>
            )}

            {/* Indicator dot/needle */}
            <div className={cn(
              "absolute top-0 left-1/2 -translate-x-1/2 w-4 h-full opacity-50",
              isInTune ? "bg-[var(--pitch-perfect)]" : Math.abs(centsOff) < 25 ? "bg-[var(--pitch-close-flat)]" : "bg-[var(--pitch-very-flat)]"
            )} />
            <div className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-lg border-2 border-white",
              isInTune ? "bg-[var(--pitch-perfect)]" : Math.abs(centsOff) < 25 ? "bg-[var(--pitch-close-flat)]" : "bg-[var(--pitch-very-flat)]"
            )} />
          </motion.div>
        )}
      </div>
    </div>
  )
}
