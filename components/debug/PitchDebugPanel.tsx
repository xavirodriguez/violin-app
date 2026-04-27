'use client'

import React, { useMemo } from 'react'
import { usePitchDebug } from '@/hooks/use-pitch-debug'
import type { PitchDebugEvent } from '@/lib/observability/pitch-debug'

/**
 * Component to display real-time pitch detection diagnostics.
 */
export function PitchDebugPanel() {
  const events = usePitchDebug(100)

  const latestByGroup = useMemo(() => {
    const findLatest = (stages: PitchDebugEvent['stage'][]) => {
      for (let i = events.length - 1; i >= 0; i--) {
        if (stages.includes(events[i].stage)) {
          return events[i]
        }
      }
      return undefined
    }

    return {
      yin: findLatest(['yin_detected', 'yin_silent', 'yin_no_pitch', 'yin_out_of_range']),
      quality: findLatest(['quality_passed', 'quality_rejected']),
      segmenter: findLatest(['segmenter_frame']),
      segmenter_event: findLatest(['segmenter_event']),
      match: findLatest(['match_check']),
    }
  }, [events])

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex w-80 flex-col gap-2 rounded-lg border border-slate-700 bg-slate-900/95 p-3 text-[11px] font-mono text-slate-100 shadow-2xl backdrop-blur-md">
      <h3 className="mb-1 border-b border-slate-700 pb-1 font-bold text-slate-400">
        PITCH DETECTION PIPELINE
      </h3>

      <StageRow title="YIN DETECTOR" event={latestByGroup.yin} render={renderYin} />

      <StageRow title="QUALITY FILTER" event={latestByGroup.quality} render={renderQuality} />

      <StageRow title="SEGMENTER" event={latestByGroup.segmenter} render={renderSegmenter} />

      <StageRow
        title="SEGMENT EVENT"
        event={latestByGroup.segmenter_event}
        render={renderSegmentEvent}
      />

      <StageRow title="MATCH CHECK" event={latestByGroup.match} render={renderMatchCheck} />
    </div>
  )
}

function StageRow<T extends PitchDebugEvent>({
  title,
  event,
  render,
}: {
  title: string
  event?: T
  render: (event: T) => React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between text-[10px] text-slate-500 uppercase tracking-tighter">
        <span>{title}</span>
        {event && (
          <span className="text-[9px] opacity-50">
            {new Date(event.timestamp).toLocaleTimeString([], {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              fractionalSecondDigits: 2,
            })}
          </span>
        )}
      </div>
      <div className="min-h-[1.5rem] rounded border border-slate-800 bg-slate-950/50 p-1 px-1.5">
        {event ? render(event) : <span className="text-slate-700">Waiting for data...</span>}
      </div>
    </div>
  )
}

function renderYin(event: PitchDebugEvent) {
  if (event.stage === 'yin_silent') {
    return (
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-slate-500 italic">SILENT</span>
        <span className="text-slate-400">
          RMS {event.rms.toFixed(4)} <span className="text-[9px]">({event.threshold})</span>
        </span>
      </div>
    )
  }

  if (event.stage === 'yin_out_of_range') {
    return (
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-bold text-orange-400">OUT RANGE</span>
        <span className="text-slate-400">
          {event.pitchHz.toFixed(1)} Hz <span className="text-[9px]">({event.minHz}-{event.maxHz})</span>
        </span>
      </div>
    )
  }

  if (event.stage === 'yin_no_pitch') {
    return (
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-slate-500 italic">NO PITCH</span>
        <span className="text-slate-400">
          RMS {event.rms.toFixed(3)} Conf {event.confidence.toFixed(2)}
        </span>
      </div>
    )
  }

  if (event.stage === 'yin_detected') {
    return (
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-bold text-green-400">DETECTED</span>
        <span className="text-slate-300 font-bold">
          {event.pitchHz.toFixed(1)} Hz <span className="text-[9px] font-normal text-slate-500">C:{event.confidence.toFixed(2)}</span>
        </span>
      </div>
    )
  }

  return null
}

function renderQuality(event: PitchDebugEvent) {
  if (event.stage === 'quality_rejected') {
    return (
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-bold text-red-400">REJECTED</span>
        <span className="text-red-300/80 uppercase text-[9px]">{event.reason.replace('_', ' ')}</span>
        <span className="text-slate-500 ml-auto text-[9px]">
          R:{event.rms.toFixed(3)} C:{event.confidence.toFixed(2)}
        </span>
      </div>
    )
  }

  if (event.stage === 'quality_passed') {
    return (
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-bold text-green-400">PASSED</span>
        <span className="text-slate-300 font-bold">{event.noteName}</span>
        <span className={Math.abs(event.cents) > 10 ? 'text-orange-300' : 'text-green-300'}>
          {event.cents > 0 ? '+' : ''}{event.cents.toFixed(1)}c
        </span>
      </div>
    )
  }

  return null
}

function renderSegmenter(event: PitchDebugEvent) {
  if (event.stage === 'segmenter_frame') {
    const isError = !event.isSignal && event.segmenterState === 'NOTE'
    return (
      <div className="flex items-baseline justify-between gap-2">
        <span className={`font-bold ${event.segmenterState === 'NOTE' ? 'text-blue-400' : 'text-slate-500'}`}>
          {event.segmenterState}
        </span>
        <div className="flex gap-2">
          <Badge active={event.isSignal} color="green" label="SIG" />
          <Badge active={event.isSilence} color="slate" label="SIL" />
        </div>
      </div>
    )
  }
  return null
}

function Badge({ active, color, label }: { active: boolean; color: string; label: string }) {
  const colorMap: Record<string, string> = {
    green: active ? 'bg-green-500/30 text-green-400 border-green-500/50' : 'bg-slate-800 text-slate-600 border-slate-700',
    slate: active ? 'bg-slate-500/30 text-slate-200 border-slate-400' : 'bg-slate-800 text-slate-600 border-slate-700',
  }
  return (
    <span className={`rounded-sm border px-1 text-[8px] font-bold leading-none ${colorMap[color]}`}>
      {label}
    </span>
  )
}

function renderSegmentEvent(event: PitchDebugEvent) {
  if (event.stage === 'segmenter_event') {
    const colors = {
      ONSET: 'text-green-400',
      OFFSET: 'text-orange-400',
      NOTE_CHANGE: 'text-blue-400',
    }
    return (
      <div className="flex items-baseline justify-between gap-2">
        <span className={`font-bold ${colors[event.eventType]}`}>{event.eventType}</span>
        <span className="text-slate-300">{event.noteName}</span>
      </div>
    )
  }
  return null
}

function renderMatchCheck(event: PitchDebugEvent) {
  if (event.stage === 'match_check') {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between">
          <span className={`font-bold ${event.passed ? 'text-green-400' : 'text-red-400'}`}>
            {event.passed ? 'MATCHED' : 'FAILED'}
          </span>
          <span className="text-slate-300">
            {event.detectedNote} vs {typeof event.targetNote === 'string' ? event.targetNote : JSON.stringify(event.targetNote)}
          </span>
        </div>
        <div className="flex items-baseline justify-between text-[9px] opacity-70">
          <span className={Math.abs(event.cents) > event.centsTolerance ? 'text-red-300' : 'text-green-300'}>
            C: {event.cents.toFixed(1)} (tol {event.centsTolerance})
          </span>
          <span className={event.durationMs < event.requiredHoldTime ? 'text-red-300' : 'text-green-300'}>
            D: {Math.round(event.durationMs)}ms (req {event.requiredHoldTime})
          </span>
        </div>
      </div>
    )
  }
  return null
}
