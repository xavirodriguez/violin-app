'use client'

import React, { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Star, RotateCcw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { type CompletedPracticeSession } from '@/lib/domain/practice'
import confetti from 'canvas-confetti'
import { cn } from '@/lib/utils'

interface PracticeCompletionProps {
  onRestart: () => void
  onDone: () => void
  sessionData?: CompletedPracticeSession
}

export function PracticeCompletion({ onRestart, onDone, sessionData }: PracticeCompletionProps) {
  const stars = useMemo(() => {
    if (!sessionData) return 1
    const { accuracy } = sessionData
    if (accuracy >= 90) return 3
    if (accuracy >= 70) return 2
    return 1
  }, [sessionData])

  useEffect(() => {
    if (stars === 3) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
    }
  }, [stars])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl space-y-8 pb-12"
    >
      <Card className="bg-primary/5 border-primary/20 relative p-8 text-center shadow-xl">
        <Trophy className="text-primary mx-auto mb-6 h-24 w-24 animate-bounce" />
        <h3 className="mb-2 text-3xl font-bold">¡Ejercicio Completado!</h3>
        <p className="text-muted-foreground mb-8">Gran trabajo practicando.</p>

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

        {sessionData && (
            <div className="bg-white/50 rounded-lg p-4 mb-8">
                <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider">Precisión Media</p>
                <p className="text-4xl font-black text-primary">{Math.round(sessionData.accuracy)}%</p>
            </div>
        )}

        <div className="flex gap-4">
            <Button variant="outline" size="lg" className="flex-1 gap-2" onClick={onDone}>
                <Home className="h-5 w-5" />
                Inicio
            </Button>
            <Button size="lg" className="flex-1 gap-2 font-bold" onClick={onRestart}>
                <RotateCcw className="h-5 w-5" />
                Repetir
            </Button>
        </div>
      </Card>
    </motion.div>
  )
}
