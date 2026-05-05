'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { useAnalyticsStore } from '@/stores/analytics-store'
import { Target, CheckCircle2, TrendingUp, BarChart3 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { usePreferencesStore } from '@/stores/preferences-store'

export function NorthStarMetrics() {
  const { sessions, progress } = useAnalyticsStore()
  const language = usePreferencesStore((s) => s.language)
  const t = useTranslation(language).analytics

  // Calculate North Star: Sessions with > 50% notes completed and valid accuracy
  const validSessions = sessions.filter(s => s.notesCompleted > 0 && s.accuracy > 0)
  const northStarCount = validSessions.length

  // Onboarding Status
  const hasOnboarding = typeof window !== 'undefined' && localStorage.getItem('onboarding-completed') === 'true'

  return (
    <div className="mt-12 space-y-4">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-indigo-500" />
        <h2 className="text-2xl font-bold">{t.northStar}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricSummary
          icon={CheckCircle2}
          label={t.validSessions}
          value={northStarCount}
          description={t.sessionDesc}
          color="text-indigo-600"
        />
        <MetricSummary
          icon={TrendingUp}
          label={t.consistency}
          value={`${progress.currentStreak > 0 ? t.active : 'Idle'}`}
          description={`${progress.currentStreak} ${t.streak.toLowerCase()}`}
          color="text-emerald-600"
        />
        <MetricSummary
          icon={BarChart3}
          label={t.onboarding}
          value={hasOnboarding ? t.complete : t.pending}
          description="Activation sequence status"
          color="text-amber-600"
        />
      </div>

      <Card className="p-4 bg-indigo-50/50 border-indigo-100">
        <p className="text-xs text-indigo-700 leading-relaxed">
          <b>{t.insight}:</b> Our "North Star" measures meaningful practice. A valid session requires at least one note matched with real-time pitch detection.
        </p>
      </Card>
    </div>
  )
}

function MetricSummary({ icon: Icon, label, value, description, color }: {
  icon: any, label: string, value: string | number, description: string, color: string
}) {
  return (
    <Card className="p-6 space-y-2">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-slate-100 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">{label}</div>
      </div>
      <div className="text-3xl font-black text-slate-900">{value}</div>
      <p className="text-xs text-slate-500">{description}</p>
    </Card>
  )
}
