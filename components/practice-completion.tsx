'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Star, Share2, RotateCcw, Calendar, TrendingUp, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PracticeSummaryChart } from './practice-summary-chart'
import { useAnalyticsStore, type PracticeSession } from '@/stores/analytics-store'
import { generateAchievementImage } from '@/lib/achievement-image-generator'
import confetti from 'canvas-confetti'
import { cn } from '@/lib/utils'

interface PracticeCompletionProps { onRestart: () => void; sessionData: PracticeSession | null; }

export function PracticeCompletion({ onRestart, sessionData }: PracticeCompletionProps) {
  const { getSessionHistory } = useAnalyticsStore()
  const [isSharing, setIsSharing] = useState(false)
  const stars = useMemo(() => {
    if (!sessionData) return 1
    const { accuracy, averageCents } = sessionData
    if (accuracy >= 95 && Math.abs(averageCents) < 5) return 3
    if (accuracy >= 85 && Math.abs(averageCents) < 15) return 2
    return 1
  }, [sessionData])

  useEffect(() => {
    if (stars === 3) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
    }
  }, [stars])

  const weekStats = useMemo(() => {
    const history = getSessionHistory(7); const sessions = history.length
    const totalMinutes = Math.floor(history.reduce((sum, s) => sum + s.durationMs, 0) / 60000)
    const avgAccuracy = sessions > 0 ? history.reduce((sum, s) => sum + s.accuracy, 0) / sessions : 0
    return { sessions, totalMinutes, avgAccuracy }
  }, [getSessionHistory])

  const handleShare = async () => {
    if (!sessionData) return
    setIsSharing(true)
    try {
      const blob = await generateAchievementImage(sessionData, stars)
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'achievement.png'; a.click()
    } catch (err) { console.error(err) } finally { setIsSharing(false) }
  }

  if (!sessionData) return null

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-2xl mx-auto pb-12">
      <Card className="p-8 text-center bg-primary/5 border-primary/20 shadow-xl relative">
        <Trophy className="text-primary mx-auto mb-6 h-24 w-24 animate-bounce" />
        <h3 className="mb-2 text-3xl font-bold">🎉 Exercise Complete!</h3>
        <p className="text-muted-foreground mb-8">Excellent work on "{sessionData.exerciseName}"</p>
        <div className="flex justify-center gap-4 mb-10">
          {[1, 2, 3].map((i) => (
            <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: i <= stars ? 1 : 0.4 }} transition={{ delay: i * 0.2, type: 'spring' }}>
              <Star className={cn('h-16 w-16', i <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-muted/30')} />
            </motion.div>
          ))}
        </div>
        <div className="text-left mt-8">
          <PracticeSummaryChart noteAttempts={sessionData.noteResults.map((nr) => ({ noteIndex: nr.noteIndex, targetPitch: nr.targetPitch, accuracy: nr.wasInTune ? 100 : Math.max(0, 100 - Math.abs(nr.averageCents)), cents: nr.averageCents }))} />
        </div>
      </Card>
      <Card className="p-6 bg-gradient-to-br from-card to-muted/30 border-primary/10">
        <div className="grid grid-cols-3 gap-6">
          <div><p className="text-xs text-muted-foreground">Sessions</p><p className="text-2xl font-bold">{weekStats.sessions}</p></div>
          <div><p className="text-xs text-muted-foreground">Practice</p><p className="text-2xl font-bold">{weekStats.totalMinutes}m</p></div>
          <div><p className="text-xs text-muted-foreground">Avg. Acc.</p><p className="text-2xl font-bold">{weekStats.avgAccuracy.toFixed(0)}%</p></div>
        </div>
      </Card>
      <div className="flex gap-4">
        <Button variant="outline" size="lg" className="flex-1 gap-2" onClick={handleShare} disabled={isSharing}><Share2 className="h-5 w-5" />Share</Button>
        <Button size="lg" className="flex-1 gap-2 font-bold" onClick={onRestart}><RotateCcw className="h-5 w-5" />Again</Button>
      </div>
    </motion.div>
  )
}
