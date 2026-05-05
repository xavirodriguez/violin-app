'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { useAnalyticsStore } from '@/stores/analytics-store'
import { PersistedPracticeSession } from '@/lib/domain/practice'
import { Badge } from '@/components/ui/badge'
import { History, ChevronDown, ChevronUp, Clock, Target, Calendar } from 'lucide-react'
import { PracticeSummaryChart } from '../practice-summary-chart'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'
import { usePreferencesStore } from '@/stores/preferences-store'

export function PracticeHistoryList() {
  const { sessions } = useAnalyticsStore()
  const language = usePreferencesStore((s) => s.language)
  const t = useTranslation(language).analytics

  if (sessions.length === 0) return null

  return (
    <div className="mt-12 space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-slate-500" />
        <h2 className="text-2xl font-bold">{t.history}</h2>
      </div>

      <div className="space-y-3">
        {sessions.slice(0, 10).map((session) => (
          <HistoryItem key={session.id} session={session} />
        ))}
      </div>
    </div>
  )
}

function HistoryItem({ session }: { session: PersistedPracticeSession }) {
  const [isExpanded, setIsOpen] = useState(false)
  const date = new Date(session.endTimeMs).toLocaleDateString()
  const time = new Date(session.endTimeMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const duration = Math.round(session.durationMs / 1000)

  return (
    <Card className="overflow-hidden border-slate-200">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsOpen(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {date}
            </span>
            <h3 className="font-bold text-slate-800">{session.exerciseName}</h3>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2 text-slate-500">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">{duration}s</span>
          </div>

          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-slate-400" />
            <Badge variant={session.accuracy > 85 ? 'default' : 'outline'} className={cn(
              session.accuracy > 85 ? "bg-green-600" : ""
            )}>
              {Math.round(session.accuracy)}%
            </Badge>
          </div>

          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 bg-slate-50 border-t border-slate-100 animate-in fade-in duration-200">
          <div className="mb-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
            Detailed Note Accuracy
          </div>
          <PracticeSummaryChart
            noteAttempts={session.noteResults.map(nr => ({
              noteIndex: nr.noteIndex,
              targetPitch: nr.targetPitch,
              accuracy: nr.wasInTune ? 100 : Math.max(0, 100 - Math.abs(nr.averageCents)),
              cents: nr.averageCents
            }))}
          />

          <div className="mt-6 flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>Session ID: {session.id.slice(0, 8)}...</span>
            <span>Completed at {time}</span>
          </div>
        </div>
      )}
    </Card>
  )
}
