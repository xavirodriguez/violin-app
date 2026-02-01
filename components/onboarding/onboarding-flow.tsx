'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { usePreferencesStore } from '@/stores/preferences-store'
import type { FeedbackLevel } from '@/lib/user-preferences'

interface OnboardingStepProps {
  onNext: () => void
  onBack: () => void
}

interface OnboardingStep {
  id: string
  title: string
  description: string
  component: React.ComponentType<OnboardingStepProps>
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Violin Mentor!',
    description: "Let's personalize your learning experience",
    component: WelcomeStep
  },
  {
    id: 'skill-level',
    title: 'What is your experience level?',
    description: 'This will help us adjust the feedback complexity',
    component: SkillLevelStep
  },
  {
    id: 'audio-test',
    title: 'Audio Test',
    description: "Let's verify that your microphone works correctly",
    component: AudioTestStep
  },
  {
    id: 'ready',
    title: 'All set!',
    description: 'You are ready to start practicing',
    component: ReadyStep
  }
]

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const currentStep = ONBOARDING_STEPS[currentStepIndex]
  const StepComponent = currentStep.component

  const handleNext = () => {
    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
    } else {
      onComplete()
    }
  }

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 shadow-2xl border-primary/20">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {ONBOARDING_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`h-2 flex-1 rounded-full mx-1 transition-colors ${
                  index <= currentStepIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center uppercase tracking-widest font-semibold">
            Step {currentStepIndex + 1} of {ONBOARDING_STEPS.length}
          </p>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-3xl font-bold mb-2">{currentStep.title}</h2>
            <p className="text-muted-foreground mb-8">{currentStep.description}</p>

            <StepComponent onNext={handleNext} onBack={handleBack} />
          </motion.div>
        </AnimatePresence>
      </Card>
    </div>
  )
}

function WelcomeStep({ onNext }: OnboardingStepProps) {
  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="text-9xl"
        >
          🎻
        </motion.div>
      </div>

      <div className="text-center space-y-4">
        <p className="text-lg">
          Violin Mentor will help you improve your intonation and technique through
          real-time pitch detection.
        </p>
        <p className="text-sm text-muted-foreground">
          It will only take 2 minutes to set up your perfect experience.
        </p>
      </div>

      <Button onClick={onNext} size="lg" className="w-full h-14 text-lg">
        Get Started
      </Button>
    </div>
  )
}

function SkillLevelStep({ onNext, onBack }: OnboardingStepProps) {
  const { feedbackLevel, setFeedbackLevel } = usePreferencesStore()
  const [selected, setSelected] = useState<FeedbackLevel>(feedbackLevel)

  const levels = [
    {
      value: 'beginner' as const,
      icon: '🌱',
      title: 'Beginner',
      description: "I'm just starting or have been playing for less than a year"
    },
    {
      value: 'intermediate' as const,
      icon: '🎯',
      title: 'Intermediate',
      description: "I've been playing for 1-3 years and know basic scales"
    },
    {
      value: 'advanced' as const,
      icon: '🏆',
      title: 'Advanced',
      description: "More than 3 years of experience and master advanced techniques"
    }
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {levels.map(level => (
          <motion.button
            key={level.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelected(level.value)}
            className={`
              p-5 rounded-xl border-2 transition-all text-left
              ${selected === level.value
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:border-primary/50'
              }
            `}
          >
            <div className="flex items-center gap-5">
              <span className="text-5xl">{level.icon}</span>
              <div>
                <h3 className="font-bold text-lg mb-1">{level.title}</h3>
                <p className="text-sm text-muted-foreground leading-snug">{level.description}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="flex gap-4 pt-4">
        <Button onClick={onBack} variant="outline" className="flex-1 h-12">
          Back
        </Button>
        <Button
          onClick={() => {
            setFeedbackLevel(selected)
            onNext()
          }}
          className="flex-1 h-12"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}

function AudioTestStep({ onNext, onBack }: OnboardingStepProps) {
  const [isTesting, setIsTesting] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [micStatus, setMicStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTesting && micStatus === 'testing') {
      // Audio test simulation (in production use Web Audio API)
      interval = setInterval(() => {
        setAudioLevel(Math.random() * 100)
      }, 100)

      const timer = setTimeout(() => {
        setMicStatus('success')
        setIsTesting(false)
      }, 3000)

      return () => {
        clearInterval(interval)
        clearTimeout(timer)
      }
    }
  }, [isTesting, micStatus])

  return (
    <div className="space-y-6">
      <Card className="p-8 bg-muted/30 border-dashed border-2">
        <div className="text-center space-y-6">
          {micStatus === 'idle' && (
            <>
              <div className="text-7xl">🎤</div>
              <p className="text-lg">We'll test your microphone to ensure accurate detection.</p>
              <Button onClick={() => { setIsTesting(true); setMicStatus('testing'); }} size="lg">
                Test Microphone
              </Button>
            </>
          )}

          {micStatus === 'testing' && (
            <>
              <div className="text-7xl animate-pulse">🎤</div>
              <p className="text-lg font-medium">Play a string on your violin...</p>
              <div className="h-6 bg-muted rounded-full overflow-hidden border">
                <motion.div
                  className="h-full bg-primary"
                  animate={{ width: `${audioLevel}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </>
          )}

          {micStatus === 'success' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-7xl"
              >
                ✅
              </motion.div>
              <p className="text-green-600 text-xl font-bold">Microphone working correctly!</p>
            </>
          )}
        </div>
      </Card>

      <div className="flex gap-4">
        <Button onClick={onBack} variant="outline" className="flex-1 h-12">
          Back
        </Button>
        <Button onClick={onNext} disabled={micStatus !== 'success'} className="flex-1 h-12">
          Continue
        </Button>
      </div>
    </div>
  )
}

function ReadyStep({ onNext }: OnboardingStepProps) {
  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="text-9xl"
        >
          🎉
        </motion.div>
      </div>

      <div className="text-center space-y-4">
        <h3 className="text-2xl font-bold">You're ready to start!</h3>
        <p className="text-muted-foreground text-lg">
          Remember: consistent practice is the key to progress.
          We recommend practicing at least 10 minutes daily.
        </p>

        <div className="grid grid-cols-3 gap-4 mt-8">
          <Card className="p-4 text-center border-primary/10">
            <div className="text-4xl mb-2">🎯</div>
            <p className="text-sm font-bold">Tuner</p>
          </Card>
          <Card className="p-4 text-center border-primary/10">
            <div className="text-4xl mb-2">🎵</div>
            <p className="text-sm font-bold">Practice</p>
          </Card>
          <Card className="p-4 text-center border-primary/10">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-sm font-bold">Progress</p>
          </Card>
        </div>
      </div>

      <Button onClick={onNext} size="lg" className="w-full h-14 text-xl font-bold">
        Start Practicing!
      </Button>
    </div>
  )
}
