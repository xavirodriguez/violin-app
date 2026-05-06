'use client'

import React, { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'

interface AudioInputMeterProps {
  analyser?: AnalyserNode
  className?: string
  label?: string
}

/**
 * A real-time visual meter for audio input level.
 */
export function AudioInputMeter({ analyser, className, label }: AudioInputMeterProps) {
  const [level, setLevel] = useState(0)
  const animationFrameRef = useRef<number>(undefined)
  const dataArrayRef = useRef<Float32Array>(undefined)

  useEffect(() => {
    if (!analyser) {
      setLevel(0)
      return
    }

    const bufferLength = analyser.fftSize
    const dataArray = new Float32Array(bufferLength)
    dataArrayRef.current = dataArray

    const updateMeter = () => {
      analyser.getFloatTimeDomainData(dataArray)

      // Calculate RMS
      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i]
      }
      const rms = Math.sqrt(sum / dataArray.length)

      // Map RMS to a 0-100 scale (logarithmic-ish for better visualization)
      // 0.01 is our typical threshold
      const normalizedLevel = Math.min(100, Math.max(0, (Math.log10(rms + 1e-12) + 6) * 20))

      setLevel(normalizedLevel)
      animationFrameRef.current = requestAnimationFrame(updateMeter)
    }

    updateMeter()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [analyser])

  // Color based on level
  const getColor = (val: number) => {
    if (val < 20) return 'bg-slate-300' // Too quiet
    if (val < 80) return 'bg-green-500' // Good
    return 'bg-amber-500' // Loud
  }

  return (
    <div className={cn("flex flex-col gap-1.5 w-full", className)}>
      {label && <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>}
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
        <div
          className={cn("h-full transition-all duration-75 ease-out", getColor(level))}
          style={{ width: `${level}%` }}
        />
        {/* Threshold indicator at -40dB approx */}
        <div className="absolute left-[40%] top-0 bottom-0 w-0.5 bg-slate-400 opacity-50" />
      </div>
    </div>
  )
}
