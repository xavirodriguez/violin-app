'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { usePreferencesStore } from '@/stores/preferences-store'
import type { FeedbackLevel } from '@/lib/user-preferences'

interface OnboardingStep {
  id: string
  title: string
  description: string
  component: React.ComponentType<OnboardingStepProps>
}

interface OnboardingStepProps {
  onNext: () => void
  onBack: () => void
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido a Violin Mentor!',
    description: 'Vamos a personalizar tu experiencia de aprendizaje',
    component: WelcomeStep,
  },
  {
    id: 'skill-level',
    title: '¿Cuál es tu nivel de experiencia?',
    description: 'Esto nos ayudará a ajustar la complejidad del feedback',
    component: SkillLevelStep,
  },
  {
    id: 'audio-test',
    title: 'Prueba de Audio',
    description: 'Vamos a verificar que tu micrófono funcione correctamente',
    component: AudioTestStep,
  },
  {
    id: 'ready',
    title: '¡Todo listo!',
    description: 'Estás preparado para comenzar a practicar',
    component: ReadyStep,
  },
]

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const currentStep = ONBOARDING_STEPS[currentStepIndex]
  const StepComponent = currentStep.component

  const handleNext = () => {
    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1)
    } else {
      onComplete()
    }
  }

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }

  return (
    <div className="bg-background/95 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <Card className="w-full max-w-2xl p-8">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            {ONBOARDING_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`mx-1 h-2 flex-1 rounded-full transition-colors ${
                  index <= currentStepIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-muted-foreground text-center text-sm">
            Paso {currentStepIndex + 1} de {ONBOARDING_STEPS.length}
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
            <h2 className="text-2xl font-bold mb-2">{currentStep.title}</h2>
            <p className="text-muted-foreground mb-6">{currentStep.description}</p>

            <StepComponent onNext={handleNext} onBack={handleBack} />
          </motion.div>
        </AnimatePresence>
      </Card>
    </div>
  )
}

function WelcomeStep({ onNext }: OnboardingStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="text-8xl"
        >
          🎻
        </motion.div>
      </div>

      <div className="space-y-3 text-center">
        <p>
          Violin Mentor te ayudará a mejorar tu afinación y técnica mediante detección de pitch en
          tiempo real.
        </p>
        <p className="text-muted-foreground text-sm">
          Solo te tomará 2 minutos configurar tu experiencia perfecta.
        </p>
      </div>

      <Button onClick={onNext} size="lg" className="w-full">
        Comenzar
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
      title: 'Principiante',
      description: 'Recién empiezo con el violín o llevo menos de 1 año',
    },
    {
      value: 'intermediate' as const,
      icon: '🎯',
      title: 'Intermedio',
      description: 'Llevo 1-3 años tocando y conozco escalas básicas',
    },
    {
      value: 'advanced' as const,
      icon: '🏆',
      title: 'Avanzado',
      description: 'Más de 3 años de experiencia y domino técnicas avanzadas',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {levels.map((level) => (
          <motion.button
            key={level.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelected(level.value)}
            className={`
              rounded-lg border-2 p-4 text-left transition-all
              ${
                selected === level.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }
            `}
          >
            <div className="flex items-start gap-4">
              <span className="text-4xl">{level.icon}</span>
              <div>
                <h3 className="mb-1 font-semibold">{level.title}</h3>
                <p className="text-muted-foreground text-sm">{level.description}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="flex gap-2">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Atrás
        </Button>
        <Button
          onClick={() => {
            setFeedbackLevel(selected)
            onNext()
          }}
          className="flex-1"
        >
          Continuar
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
    if (isTesting) {
      // Simulación de prueba de audio (en producción usar Web Audio API)
      interval = setInterval(() => {
        setAudioLevel(Math.random() * 100)
      }, 100)

      setTimeout(() => {
        setMicStatus('success')
        setIsTesting(false)
      }, 3000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTesting])

  return (
    <div className="space-y-6">
      <Card className="bg-muted/50 p-6">
        <div className="space-y-4 text-center">
          {micStatus === 'idle' && (
            <>
              <div className="text-6xl">🎤</div>
              <p>Vamos a probar tu micrófono para asegurar una detección precisa.</p>
              <Button
                onClick={() => {
                  setIsTesting(true)
                  setMicStatus('testing')
                }}
              >
                Probar Micrófono
              </Button>
            </>
          )}

          {micStatus === 'testing' && (
            <>
              <div className="animate-pulse text-6xl">🎤</div>
              <p>Toca una cuerda de tu violín...</p>
              <div className="bg-muted h-4 overflow-hidden rounded-full">
                <motion.div
                  className="bg-primary h-full"
                  animate={{ width: `${audioLevel}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </>
          )}

          {micStatus === 'success' && (
            <>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl">
                ✅
              </motion.div>
              <p className="font-semibold text-green-600">¡Micrófono funcionando correctamente!</p>
            </>
          )}
        </div>
      </Card>

      <div className="flex gap-2">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Atrás
        </Button>
        <Button onClick={onNext} disabled={micStatus !== 'success'} className="flex-1">
          Continuar
        </Button>
      </div>
    </div>
  )
}

function ReadyStep({ onNext }: OnboardingStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="text-8xl"
        >
          🎉
        </motion.div>
      </div>

      <div className="space-y-4 text-center">
        <h3 className="text-xl font-semibold">¡Estás listo para comenzar!</h3>
        <p className="text-muted-foreground">
          Recuerda: la práctica constante es la clave del progreso. Te recomendamos practicar al
          menos 10 minutos diarios.
        </p>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="mb-2 text-3xl">🎯</div>
            <p className="text-sm font-semibold">Afinador</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="mb-2 text-3xl">🎵</div>
            <p className="text-sm font-semibold">Práctica</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="mb-2 text-3xl">📊</div>
            <p className="text-sm font-semibold">Progreso</p>
          </Card>
        </div>
      </div>

      <Button onClick={onNext} size="lg" className="w-full">
        ¡Empezar a Practicar!
      </Button>
    </div>
  )
}
