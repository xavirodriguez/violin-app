'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useAllDebugEvents } from './useDebugPanel'
import { DebugEvent } from '@/lib/debug/debug-types'
import { cn } from '@/lib/utils'

export default function DebugPanel() {
  const [isVisible, setIsVisible] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<'audio' | 'pipeline' | 'state' | 'segmenter'>('audio')
  const events = useAllDebugEvents()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsVisible((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!isVisible) return null

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-[9999] flex flex-col overflow-hidden rounded-lg border border-green-900/50 bg-black/90 font-mono text-xs text-green-400 shadow-2xl transition-all duration-300',
        isCollapsed ? 'h-10 w-48' : 'h-[600px] w-[500px]'
      )}
    >
      {/* Header */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-green-900/30 px-3">
        <span className="font-bold tracking-wider">DEBUG_CONSOLE v1.0</span>
        <div className="flex gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hover:text-white"
          >
            {isCollapsed ? '[+]' : '[-]'}
          </button>
          <button onClick={() => setIsVisible(false)} className="hover:text-white">
            [X]
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Tabs */}
          <div className="flex shrink-0 border-b border-green-900/20 bg-black/40">
            {(['audio', 'pipeline', 'state', 'segmenter'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-3 py-2 uppercase tracking-tighter transition-colors',
                  activeTab === tab
                    ? 'bg-green-900/30 text-green-300 shadow-[inset_0_-2px_0_0_#4ade80]'
                    : 'text-green-800 hover:bg-green-900/10 hover:text-green-600'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'audio' && <AudioStreamTab events={events} />}
            {activeTab === 'pipeline' && <PipelineEventsTab events={events} />}
            {activeTab === 'state' && <StateMachineTab events={events} />}
            {activeTab === 'segmenter' && <SegmenterTab events={events} />}
          </div>
        </>
      )}
    </div>
  )
}

function AudioStreamTab({ events }: { events: DebugEvent[] }) {
  const lastQuality = useMemo(() => {
    return (events.filter((e) => e.type === 'DETECTION_QUALITY') as any[]).slice(-1)[0]
  }, [events])

  const rmsHistory = useMemo(() => {
    return (events.filter((e) => e.type === 'DETECTION_QUALITY') as any[]).slice(-20)
  }, [events])

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 border-b border-green-900/30 pb-1 text-[10px] uppercase text-green-700">
          Signal Metrics
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>RMS Level</span>
              <span className={cn(lastQuality?.rms < 0.015 ? 'text-red-500' : 'text-green-400')}>
                {lastQuality?.rms?.toFixed(4) || '0.0000'}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-green-900/20">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${Math.min(100, (lastQuality?.rms || 0) * 500)}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-green-900">
              <span>0.000</span>
              <span>THRESHOLD: 0.015</span>
              <span>0.200</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Confidence</span>
              <span className={cn(lastQuality?.confidence < 0.8 ? 'text-red-500' : 'text-green-400')}>
                {lastQuality?.confidence?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-green-900/20">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${(lastQuality?.confidence || 0) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-green-900">
              <span>0.0</span>
              <span>THRESHOLD: 0.80</span>
              <span>1.0</span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-2 border-b border-green-900/30 pb-1 text-[10px] uppercase text-green-700">
          Pitch Analysis
        </h3>
        {lastQuality ? (
          <div className="rounded border border-green-900/20 bg-black/40 p-3">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {lastQuality.pitchHz > 0 ? `${lastQuality.pitchHz.toFixed(1)} Hz` : '---'}
              </div>
              <div
                className={cn(
                  'text-lg font-bold',
                  Math.abs(lastQuality.cents) < 20
                    ? 'text-green-400'
                    : Math.abs(lastQuality.cents) < 40
                      ? 'text-yellow-500'
                      : 'text-red-500'
                )}
              >
                {lastQuality.cents > 0 ? '+' : ''}
                {lastQuality.cents.toFixed(1)}c
              </div>
            </div>
            {lastQuality.pitchHz > 650 && (
              <div className="mt-2 animate-pulse text-[10px] font-bold text-red-500">
                !! WARNING: FREQUENCY NEAR 700Hz LIMIT !!
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-center text-green-900">Waiting for signal...</div>
        )}
      </section>
    </div>
  )
}

function PipelineEventsTab({ events }: { events: DebugEvent[] }) {
  const filteredEvents = useMemo(() => {
    return events
      .filter((e) => ['PIPELINE_INSTANCE', 'DETECTION_QUALITY', 'SEGMENT_EVALUATED'].includes(e.type))
      .slice(-100)
      .reverse()
  }, [events])

  const activeInstances = useMemo(() => {
    const instances: Record<string, boolean> = { hook: false, runner: false }
    events.forEach((e) => {
      if (e.type === 'PIPELINE_INSTANCE') {
        instances[e.source] = e.action === 'created'
      }
    })
    return instances
  }, [events])

  const dualPipelineBug = activeInstances.hook && activeInstances.runner

  return (
    <div className="flex flex-col gap-4">
      {dualPipelineBug && (
        <div className="animate-pulse border-2 border-red-600 bg-red-900/20 p-2 text-center text-red-500">
          <div className="font-bold underline">CRITICAL ALERT: DUAL PIPELINE DETECTED</div>
          <div className="text-[10px]">Both Hook & Runner are active simultaneously!</div>
        </div>
      )}

      <div className="space-y-1">
        {filteredEvents.map((e, i) => (
          <div
            key={i}
            className={cn(
              'border-l-2 p-2 text-[10px]',
              e.type === 'PIPELINE_INSTANCE'
                ? 'border-blue-500 bg-blue-900/10'
                : e.type === 'SEGMENT_EVALUATED'
                  ? e.passed
                    ? 'border-green-500 bg-green-900/10'
                    : 'border-red-500 bg-red-900/10'
                  : 'border-green-900/30'
            )}
          >
            <div className="flex justify-between">
              <span className="font-bold opacity-60">[{new Date(e.timestamp).toLocaleTimeString()}] {e.type}</span>
              {e.type === 'PIPELINE_INSTANCE' && (
                <span className="font-bold uppercase">{e.source} {e.action}</span>
              )}
            </div>
            {e.type === 'DETECTION_QUALITY' && !e.passed && (
              <div className="text-red-400">REJECT: {e.reason}</div>
            )}
            {e.type === 'SEGMENT_EVALUATED' && (
              <div>
                <div className={e.passed ? 'text-green-400' : 'text-red-400'}>
                  {e.passed ? 'MATCHED' : 'REJECTED'}: {e.noteName}
                  {!e.passed && ` (${e.failReason})`}
                </div>
                <div className="opacity-50">
                  {e.durationMs}ms / {e.requiredHoldTime}ms | {e.centsDev.toFixed(1)}c (tol: {e.centsTolerance}c)
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function StateMachineTab({ events }: { events: DebugEvent[] }) {
  const practiceEvents = useMemo(() => {
    return (events.filter((e) => e.type === 'PRACTICE_EVENT') as any[]).slice(-10).reverse()
  }, [events])

  const lastEvent = practiceEvents[0]

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 border-b border-green-900/30 pb-1 text-[10px] uppercase text-green-700">
          Current State
        </h3>
        <div className="flex items-center justify-center gap-2 rounded border border-green-900/20 bg-black/40 p-4">
          {(['idle', 'listening', 'validating', 'correct', 'completed'] as const).map((s) => (
            <div key={s} className="flex flex-col items-center">
              <div
                className={cn(
                  'h-3 w-3 rounded-full border border-green-500/50',
                  lastEvent?.status === s ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' : 'bg-transparent'
                )}
              />
              <span
                className={cn(
                  'mt-1 text-[8px] uppercase',
                  lastEvent?.status === s ? 'text-blue-400 font-bold' : 'text-green-900'
                )}
              >
                {s}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 border-b border-green-900/30 pb-1 text-[10px] uppercase text-green-700">
          Event Log
        </h3>
        <div className="space-y-1">
          {practiceEvents.map((e, i) => (
            <div key={i} className="flex justify-between border-b border-green-900/10 py-1 text-[10px]">
              <span className="text-green-600 font-bold">{e.eventType}</span>
              <span className="opacity-50">Idx: {e.currentIndex}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function SegmenterTab({ events }: { events: DebugEvent[] }) {
  const segmenterEvents = useMemo(() => {
    return (events.filter((e) => e.type === 'SEGMENTER_STATE') as any[]).slice(-50).reverse()
  }, [events])

  const lastEvent = segmenterEvents[0]

  return (
    <div className="space-y-6">
       <section>
        <h3 className="mb-2 border-b border-green-900/30 pb-1 text-[10px] uppercase text-green-700">
          Internal State
        </h3>
        <div className="flex items-center gap-4 rounded border border-green-900/20 bg-black/40 p-4">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase opacity-50">State</span>
            <span className={cn(
              "text-lg font-bold",
              lastEvent?.state === 'NOTE' ? 'text-blue-400' : 'text-green-700'
            )}>
              {lastEvent?.state || 'UNKNOWN'}
            </span>
          </div>
          <div className="h-10 w-px bg-green-900/20" />
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase opacity-50">Last Event</span>
            <span className="text-lg font-bold text-yellow-500">
              {lastEvent?.event || 'NONE'}
            </span>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-2 border-b border-green-900/30 pb-1 text-[10px] uppercase text-green-700">
          Transition History
        </h3>
        <div className="space-y-1">
          {segmenterEvents.filter(e => e.event).map((e, i) => (
            <div key={i} className="flex justify-between border-b border-green-900/10 py-1 text-[10px]">
              <span className="font-bold text-yellow-600">{e.event}</span>
              <span className="opacity-40">{new Date(e.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
