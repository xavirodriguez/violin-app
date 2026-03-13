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
      <div className="bg-muted/30 border-border relative h-[60px] w-full overflow-hidden rounded-lg border">
        {/* Background segments with CSS variables */}
        <div className="absolute inset-0 flex">
          <div
            className="h-full w-[25%]"
            style={{ backgroundColor: 'var(--pitch-very-flat)', opacity: 0.2 }}
          />
          <div
            className="h-full w-[15%]"
            style={{ backgroundColor: 'var(--pitch-close-flat)', opacity: 0.2 }}
          />
          <div
            className="h-full w-[20%]"
            style={{ backgroundColor: 'var(--pitch-perfect)', opacity: 0.4 }}
          />
          <div
            className="h-full w-[15%]"
            style={{ backgroundColor: 'var(--pitch-close-flat)', opacity: 0.2 }}
          />
          <div
            className="h-full w-[25%]"
            style={{ backgroundColor: 'var(--pitch-very-flat)', opacity: 0.2 }}
          />
        </div>

        {/* Central marker */}
        <div className="bg-foreground/30 absolute top-0 left-1/2 h-full w-0.5 -translate-x-1/2 shadow-[0_0_8px_rgba(255,255,255,0.5)]" />

        {/* Labels */}
        <div className="text-muted-foreground absolute inset-x-0 bottom-1 flex justify-between px-2 font-mono text-[10px]">
          <span>-50</span>
          <span>-25</span>
          <span className="text-foreground font-bold">0</span>
          <span>+25</span>
          <span>+50</span>
        </div>

        {/* Animated indicator */}
        {centsOff !== null && (
          <motion.div
            className="bg-foreground absolute top-0 bottom-0 z-10 w-1"
            initial={false}
            animate={{ left: `${positionPercent}%` }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            style={{ translateX: '-50%' }}
          >
            {/* Value display ABOVE the indicator */}
            {showNumericValue && (
              <div
                className={cn(
                  'absolute -top-6 left-1/2 -translate-x-1/2 font-mono text-xs font-bold whitespace-nowrap',
                  isInTune
                    ? 'text-[var(--pitch-perfect)]'
                    : Math.abs(centsOff) < 25
                      ? 'text-[var(--pitch-close-flat)]'
                      : 'text-[var(--pitch-very-flat)]',
                )}
              >
                {centsOff > 0 ? '+' : ''}
                {centsOff.toFixed(1)}¢
              </div>
            )}

            {/* Indicator dot/needle */}
            <div
              className={cn(
                'absolute top-0 left-1/2 h-full w-4 -translate-x-1/2 opacity-50',
                isInTune
                  ? 'bg-[var(--pitch-perfect)]'
                  : Math.abs(centsOff) < 25
                    ? 'bg-[var(--pitch-close-flat)]'
                    : 'bg-[var(--pitch-very-flat)]',
              )}
            />
            <div
              className={cn(
                'absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg',
                isInTune
                  ? 'bg-[var(--pitch-perfect)]'
                  : Math.abs(centsOff) < 25
                    ? 'bg-[var(--pitch-close-flat)]'
                    : 'bg-[var(--pitch-very-flat)]',
              )}
            />
          </motion.div>
        )}
      </div>
    </div>
  )
}
