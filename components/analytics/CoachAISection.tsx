'use client'

import React, { useMemo } from 'react'
import { useAnalyticsStore } from '@/stores/analytics-store'
import { useMasteryStore } from '@/stores/mastery-store'
import { CoachAIService, CoachInsight } from '@/lib/curriculum/coach-ai'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, TrendingUp, AlertCircle, Quote, MessageSquare } from 'lucide-react'

export function CoachAISection() {
  const { progress } = useAnalyticsStore()
  const { objectiveMastery } = useMasteryStore()

  const insights = useMemo(() =>
    CoachAIService.getInsights(progress, objectiveMastery),
    [progress, objectiveMastery]
  )

  return (
    <div className="mt-12 space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-500" />
        <h2 className="text-2xl font-bold">Mentor's Corner</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map((insight, idx) => (
          <InsightCard key={idx} insight={insight} />
        ))}
      </div>
    </div>
  )
}

function InsightCard({ insight }: { insight: CoachInsight }) {
  const styles = getInsightStyles(insight.type)
  const Icon = styles.icon

  return (
    <Card className={`relative overflow-hidden border-l-4 ${styles.border} ${styles.bg} p-6`}>
      <div className="flex items-start gap-4">
        <div className={`rounded-full p-2 ${styles.iconBg} ${styles.iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">{insight.title}</h3>
            <Badge variant="outline" className={`text-[10px] uppercase ${styles.badge}`}>
              {insight.persona}
            </Badge>
          </div>
          <p className="text-muted-foreground leading-relaxed italic">
            <Quote className="h-3 w-3 inline mr-1 opacity-50 rotate-180" />
            {insight.message}
          </p>
        </div>
      </div>

      {/* Decorative background element */}
      <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
        <MessageSquare className="h-24 w-24" />
      </div>
    </Card>
  )
}

function getInsightStyles(type: CoachInsight['type']) {
  switch (type) {
    case 'celebration':
      return {
        border: 'border-green-500',
        bg: 'bg-green-500/5',
        icon: Sparkles,
        iconBg: 'bg-green-500/10',
        iconColor: 'text-green-600',
        badge: 'text-green-600 border-green-600/30',
      }
    case 'warning':
      return {
        border: 'border-amber-500',
        bg: 'bg-amber-500/5',
        icon: AlertCircle,
        iconBg: 'bg-amber-500/10',
        iconColor: 'text-amber-600',
        badge: 'text-amber-600 border-amber-600/30',
      }
    case 'tip':
      return {
        border: 'border-blue-500',
        bg: 'bg-blue-500/5',
        icon: TrendingUp,
        iconBg: 'bg-blue-500/10',
        iconColor: 'text-blue-600',
        badge: 'text-blue-600 border-blue-600/30',
      }
    default:
      return {
        border: 'border-muted',
        bg: 'bg-muted/5',
        icon: MessageSquare,
        iconBg: 'bg-muted/10',
        iconColor: 'text-muted-foreground',
        badge: 'text-muted-foreground border-muted-foreground/30',
      }
  }
}
