'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Smile, Meh, Frown, PartyPopper, Target } from 'lucide-react'
import { usePreferencesStore } from '@/stores/preferences-store'
import { FEEDBACK_CONFIGS } from '@/lib/user-preferences'

interface EmotionalFeedbackProps {
  centsOff: number | null
  isInTune: boolean
  noteMatches: boolean
  status: string
}

/**
 * Componente que proporciona feedback emocional visual
 * adaptado al nivel de experiencia del usuario
 */
export function EmotionalFeedback({
  centsOff,
  isInTune,
  noteMatches,
  status
}: EmotionalFeedbackProps) {
  const { feedbackLevel, enableCelebrations } = usePreferencesStore()
  const config = FEEDBACK_CONFIGS[feedbackLevel]

  // Determinar estado emocional
  const emotionalState = getEmotionalState(centsOff, isInTune, noteMatches, status)

  if (config.visualStyle === 'emoji') {
    return <EmojiBasedFeedback state={emotionalState} showCelebration={enableCelebrations} />
  }

  if (config.visualStyle === 'technical') {
    return <TechnicalFeedback centsOff={centsOff} isInTune={isInTune} />
  }

  return <HybridFeedback state={emotionalState} centsOff={centsOff} isInTune={isInTune} />
}

type EmotionalState = 'perfect' | 'great' | 'close' | 'offTrack' | 'wrongNote' | 'listening'

function getEmotionalState(
  centsOff: number | null,
  isInTune: boolean,
  noteMatches: boolean,
  status: string
): EmotionalState {
  if (status === 'correct') return 'perfect'
  if (status === 'listening' && centsOff === null) return 'listening'
  if (!noteMatches) return 'wrongNote'
  if (isInTune) return 'great'
  if (centsOff !== null && Math.abs(centsOff) < 15) return 'close'
  return 'offTrack'
}

function EmojiBasedFeedback({
  state,
  showCelebration
}: {
  state: EmotionalState
  showCelebration: boolean
}) {
  const EMOJI_MAP: Record<EmotionalState, { emoji: string; message: string; color: string }> = {
    perfect: { emoji: '🎉', message: 'Perfect!', color: 'text-green-500' },
    great: { emoji: '😊', message: 'Great!', color: 'text-green-400' },
    close: { emoji: '😐', message: 'Close...', color: 'text-yellow-500' },
    offTrack: { emoji: '😕', message: 'Adjust a bit', color: 'text-orange-500' },
    wrongNote: { emoji: '🤔', message: 'Wrong note', color: 'text-red-500' },
    listening: { emoji: '👂', message: 'Listening...', color: 'text-muted-foreground' }
  }

  const feedback = EMOJI_MAP[state]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3, type: 'spring' }}
        className="text-center"
      >
        <motion.div
          animate={state === 'perfect' && showCelebration ? {
            rotate: [0, -10, 10, -10, 10, 0],
            scale: [1, 1.2, 1, 1.2, 1]
          } : {}}
          transition={{ duration: 0.6 }}
          className="text-7xl mb-2"
        >
          {feedback.emoji}
        </motion.div>
        <p className={`text-xl font-semibold ${feedback.color}`}>
          {feedback.message}
        </p>
      </motion.div>
    </AnimatePresence>
  )
}

function TechnicalFeedback({
  centsOff,
  isInTune
}: {
  centsOff: number | null
  isInTune: boolean
}) {
  if (centsOff === null) {
    return (
      <div className="text-center text-muted-foreground">
        <Target className="h-12 w-12 mx-auto mb-2" />
        <p>Esperando detección...</p>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className={`text-5xl font-bold ${
        isInTune ? 'text-green-500' :
        Math.abs(centsOff) < 15 ? 'text-yellow-500' :
        'text-red-500'
      }`}>
        {centsOff > 0 ? '+' : ''}{centsOff.toFixed(1)}¢
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        {isInTune ? 'In Tune' :
         centsOff > 0 ? 'Too Sharp' :
         'Too Flat'}
      </p>
    </div>
  )
}

function HybridFeedback({
  state,
  centsOff,
  isInTune
}: {
  state: EmotionalState
  centsOff: number | null
  isInTune: boolean
}) {
  const getIcon = () => {
    switch(state) {
      case 'perfect': return <PartyPopper className="h-12 w-12 text-green-500" />
      case 'great': return <Smile className="h-12 w-12 text-green-400" />
      case 'close': return <Meh className="h-12 w-12 text-yellow-500" />
      default: return <Frown className="h-12 w-12 text-red-500" />
    }
  }

  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="text-center space-y-3"
    >
      <div className="flex justify-center">
        {getIcon()}
      </div>
      {centsOff !== null && (
        <p className="text-2xl font-semibold">
          {centsOff > 0 ? '+' : ''}{centsOff.toFixed(1)}¢
        </p>
      )}
    </motion.div>
  )
}
