'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PitchAccuracyMeterProps {
  centsOff: number | undefined
  isInTune: boolean
  showNumericValue?: boolean
}

export function PitchAccuracyMeter({
  centsOff,
  isInTune,
  showNumericValue = true,
}: PitchAccuracyMeterProps) {
  const displayCents = centsOff === undefined ? 0 : Math.max(-50, Math.min(50, centsOff))
  const positionPercent = ((displayCents + 50) / 100) * 100

  return (
    <div className="w-full space-y-2">
      <div className="bg-muted/30 border-border relative h-[60px] w-full overflow-hidden rounded-lg border">
        <MeterBackground />
        <MeterLabels />

        {centsOff !== undefined && (
          <MeterIndicator
            centsOff={centsOff}
            isInTune={isInTune}
            positionPercent={positionPercent}
            showNumericValue={showNumericValue}
          />
        )}
      </div>
    </div>
  )
}

function MeterBackground() {
  return (
    <>
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
      <div className="bg-foreground/30 absolute top-0 left-1/2 h-full w-0.5 -translate-x-1/2 shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
    </>
  )
}

function MeterLabels() {
  return (
    <div className="text-muted-foreground absolute inset-x-0 bottom-1 flex justify-between px-2 font-mono text-[10px]">
      <span>-50</span>
      <span>-25</span>
      <span className="text-foreground font-bold">0</span>
      <span>+25</span>
      <span>+50</span>
    </div>
  )
}

function MeterIndicator({
  centsOff,
  isInTune,
  positionPercent,
  showNumericValue,
}: {
  centsOff: number
  isInTune: boolean
  positionPercent: number
  showNumericValue: boolean
}) {
  return (
    <motion.div
      className="bg-foreground absolute top-0 bottom-0 z-10 w-1"
      initial={false}
      animate={{ left: `${positionPercent}%` }}
      transition={{ duration: 0.1, ease: 'easeOut' }}
      style={{ translateX: '-50%' }}
    >
      {showNumericValue && <NumericValue centsOff={centsOff} isInTune={isInTune} />}
      <IndicatorDot isInTune={isInTune} centsOff={centsOff} />
    </motion.div>
  )
}

function NumericValue({ centsOff, isInTune }: { centsOff: number; isInTune: boolean }) {
  const colorClass = isInTune
    ? 'text-[var(--pitch-perfect)]'
    : Math.abs(centsOff) < 25
      ? 'text-[var(--pitch-close-flat)]'
      : 'text-[var(--pitch-very-flat)]'

  return (
    <div
      className={cn(
        'absolute -top-6 left-1/2 -translate-x-1/2 font-mono text-xs font-bold whitespace-nowrap',
        colorClass,
      )}
    >
      {centsOff > 0 ? '+' : ''}
      {centsOff.toFixed(1)}¢
    </div>
  )
}

function IndicatorDot({ isInTune, centsOff }: { isInTune: boolean; centsOff: number }) {
  const colorClass = isInTune
    ? 'bg-[var(--pitch-perfect)]'
    : Math.abs(centsOff) < 25
      ? 'bg-[var(--pitch-close-flat)]'
      : 'bg-[var(--pitch-very-flat)]'

  return (
    <>
      <div
        className={cn('absolute top-0 left-1/2 h-full w-4 -translate-x-1/2 opacity-50', colorClass)}
      />
      <div
        className={cn(
          'absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg',
          colorClass,
        )}
      />
    </>
  )
}
