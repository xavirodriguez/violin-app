'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Star, Share2, RotateCcw, TrendingUp, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PracticeSummaryChart } from './practice-summary-chart'
import { useAnalyticsStore } from '@/stores/analytics-store'
import { type CompletedPracticeSession } from '@/lib/domain/practice'
import { AchievementImageService } from '@/lib/export/achievement-image'
import confetti from 'canvas-confetti'
import { cn } from '@/lib/utils'

interface PracticeCompletionProps {
  onRestart: () => void
  sessionData: CompletedPracticeSession | undefined
}

export function PracticeCompletion({ onRestart, sessionData }: PracticeCompletionProps) {
  const { getSessionHistory } = useAnalyticsStore()
  const [isSharing, setIsSharing] = useState(false)
  const stars = useMemo(() => {
    if (!sessionData) return 1
    const { accuracy, averageCents } = sessionData
    if (accuracy >= 95 && Math.abs(averageCents) < 5) return 3
    if (accuracy >= 85 && Math.abs(averageCents) < 10) return 2
    return 1
  }, [sessionData])

  useEffect(() => {
    if (stars === 3) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
    }
  }, [stars])

  const weekStats = useMemo(() => {
    const history = getSessionHistory(7)
    const sessions = history.length
    const totalMinutes = Math.floor(history.reduce((sum, s) => sum + s.durationMs, 0) / 60000)
    const avgAccuracy =
      sessions > 0 ? history.reduce((sum, s) => sum + s.accuracy, 0) / sessions : 0
    return { sessions, totalMinutes, avgAccuracy }
  }, [getSessionHistory])

  const handleShare = async () => {
    if (!sessionData) return
    setIsSharing(true)
    try {
      await AchievementImageService.share(sessionData, stars)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSharing(false)
    }
  }

  if (!sessionData) return <></>

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl space-y-8 pb-12"
    >
      <Card className="bg-primary/5 border-primary/20 relative p-8 text-center shadow-xl">
        <Trophy className="text-primary mx-auto mb-6 h-24 w-24 animate-bounce" />
        <h3 className="mb-2 text-3xl font-bold">🎉 Exercise Complete!</h3>
        <p className="text-muted-foreground mb-8">Excellent work on "{sessionData.exerciseName}"</p>
        <div className="mb-10 flex justify-center gap-4">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: i <= stars ? 1 : 0.4 }}
              transition={{ delay: i * 0.2, type: 'spring' }}
            >
              <Star
                className={cn(
                  'h-16 w-16',
                  i <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-muted/30',
                )}
              />
            </motion.div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 mb-4">
          <Card className="p-4 bg-green-50 border-green-100 flex items-center gap-3">
             <div className="p-2 rounded-full bg-green-100 text-green-600">
               <TrendingUp className="h-4 w-4" />
             </div>
             <div className="text-left">
               <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Best Note</p>
               <p className="text-lg font-black text-green-800">{sessionData.bestNote || '--'}</p>
             </div>
          </Card>

          <Card className="p-4 bg-amber-50 border-amber-100 flex items-center gap-3">
             <div className="p-2 rounded-full bg-amber-100 text-amber-600">
               <AlertCircle className="h-4 w-4" />
             </div>
             <div className="text-left">
               <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Focus Area</p>
               <p className="text-lg font-black text-amber-800">{sessionData.weakestNote || '--'}</p>
             </div>
          </Card>
        </div>

        <div className="mt-8 text-left">
          <PracticeSummaryChart
            noteAttempts={sessionData.noteResults.map((nr) => ({
              noteIndex: nr.noteIndex,
              targetPitch: nr.targetPitch,
              accuracy: nr.wasInTune ? 100 : Math.max(0, 100 - Math.abs(nr.averageCents)),
              cents: nr.averageCents,
            }))}
          />
        </div>
      </Card>
      <Card className="from-card to-muted/30 border-primary/10 bg-gradient-to-br p-6">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-muted-foreground text-xs">Sessions</p>
            <p className="text-2xl font-bold">{weekStats.sessions}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Practice</p>
            <p className="text-2xl font-bold">{weekStats.totalMinutes}m</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Avg. Acc.</p>
            <p className="text-2xl font-bold">{weekStats.avgAccuracy.toFixed(0)}%</p>
          </div>
        </div>
      </Card>
      <div className="flex gap-4">
        <Button
          variant="outline"
          size="lg"
          className="flex-1 gap-2"
          onClick={handleShare}
          disabled={isSharing}
        >
          <Share2 className="h-5 w-5" />
          Share
        </Button>
        <Button size="lg" className="flex-1 gap-2 font-bold" onClick={onRestart}>
          <RotateCcw className="h-5 w-5" />
          Again
        </Button>
      </div>
    </motion.div>
  )
}
