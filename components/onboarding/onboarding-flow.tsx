'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { usePreferencesStore } from '@/stores/preferences-store'
import { useCalibrationStore } from '@/stores/calibration-store'
import { useTranslation, type TranslationSchema } from '@/lib/i18n'
import type { FeedbackLevel } from '@/lib/user-preferences'
import { audioManager } from '@/lib/infrastructure/audio-manager'
import { PitchDetector } from '@/lib/pitch-detector'
import { MusicalNote } from '@/lib/domain/practice'

interface OnboardingStepProps {
  onNext: () => void
  onBack: () => void
  language: 'en' | 'es'
  t: TranslationSchema['onboarding']
}

interface OnboardingStep {
  id: string
  component: React.ComponentType<OnboardingStepProps>
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    component: WelcomeStep,
  },
  {
    id: 'skill-level',
    component: SkillLevelStep,
  },
  {
    id: 'audio-test',
    component: AudioTestStep,
  },
  {
    id: 'calibration',
    component: CalibrationStep,
  },
  {
    id: 'ready',
    component: ReadyStep,
  },
]

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const language = usePreferencesStore((s) => s.language)
  const setLanguage = usePreferencesStore((s) => s.setLanguage)
  const t = useTranslation(language).onboarding
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
    <div className="bg-background/95 fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
      <Card className="border-primary/20 w-full max-w-2xl p-8 shadow-2xl">
        {/* Language selector and Skip button */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={language === 'en' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLanguage('en')}
            >
              EN
            </Button>
            <Button
              variant={language === 'es' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLanguage('es')}
            >
              ES
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onComplete}
            className="text-muted-foreground hover:text-foreground"
          >
            {t.skip}
          </Button>
        </div>

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
          <p className="text-muted-foreground text-center text-xs font-semibold tracking-widest uppercase">
            {t.step} {currentStepIndex + 1} {t.of} {ONBOARDING_STEPS.length}
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
            <StepComponent onNext={handleNext} onBack={handleBack} language={language} t={t} />
          </motion.div>
        </AnimatePresence>
      </Card>
    </div>
  )
}

function WelcomeStep({ onNext, t }: OnboardingStepProps) {
  return (
    <div className="space-y-8">
      <h2 className="mb-2 text-3xl font-bold">{t.welcome}</h2>
      <p className="text-muted-foreground mb-8">{t.personalized}</p>

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

      <div className="space-y-4 text-center">
        <p className="text-lg">{t.description}</p>
        <p className="text-muted-foreground text-sm">{t.timeSetup}</p>
      </div>

      <Button onClick={onNext} size="lg" className="h-14 w-full text-lg">
        {t.getStarted}
      </Button>
    </div>
  )
}

function SkillLevelStep({ onNext, onBack, t }: OnboardingStepProps) {
  const { feedbackLevel, setFeedbackLevel } = usePreferencesStore()
  const [selected, setSelected] = useState<FeedbackLevel>(feedbackLevel)

  const levels = [
    {
      value: 'beginner' as const,
      icon: '🌱',
      title: t.beginner,
      description: t.beginnerDesc,
    },
    {
      value: 'intermediate' as const,
      icon: '🎯',
      title: t.intermediate,
      description: t.intermediateDesc,
    },
    {
      value: 'advanced' as const,
      icon: '🏆',
      title: t.advanced,
      description: t.advancedDesc,
    },
  ]

  return (
    <div className="space-y-6">
      <h2 className="mb-2 text-3xl font-bold">{t.skillTitle}</h2>
      <p className="text-muted-foreground mb-8">{t.skillDesc}</p>

      <div className="grid gap-4">
        {levels.map((level) => (
          <motion.button
            key={level.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelected(level.value)}
            className={`rounded-xl border-2 p-5 text-left transition-all ${
              selected === level.value
                ? 'border-primary bg-primary/5 ring-primary ring-1'
                : 'border-border hover:border-primary/50'
            } `}
          >
            <div className="flex items-center gap-5">
              <span className="text-5xl">{level.icon}</span>
              <div>
                <h3 className="mb-1 text-lg font-bold">{level.title}</h3>
                <p className="text-muted-foreground text-sm leading-snug">{level.description}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="flex gap-4 pt-4">
        <Button onClick={onBack} variant="outline" className="h-12 flex-1">
          {t.back}
        </Button>
        <Button
          onClick={() => {
            setFeedbackLevel(selected)
            onNext()
          }}
          className="h-12 flex-1"
        >
          {t.continue}
        </Button>
      </div>
    </div>
  )
}

function AudioTestStep({ onNext, onBack, t }: OnboardingStepProps) {
  const [audioLevel, setAudioLevel] = useState(0)
  const [micStatus, setMicStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const { setCalibration } = useCalibrationStore()

  const rafRef = useRef<number>(0)
  const samplesRef = useRef<number[]>([])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      audioManager.cleanup()
    }
  }, [])

  const startTest = async () => {
    setMicStatus('testing')
    samplesRef.current = []

    try {
      const { analyser } = await audioManager.initialize()
      const dataArray = new Float32Array(analyser.fftSize)

      const update = () => {
        analyser.getFloatTimeDomainData(dataArray)
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i]
        }
        const rms = Math.sqrt(sum / dataArray.length)
        setAudioLevel(Math.min(rms * 500, 100)) // Scaled for visualization
        samplesRef.current.push(rms)

        rafRef.current = requestAnimationFrame(update)
      }
      update()

      setTimeout(() => {
        cancelAnimationFrame(rafRef.current)
        const allSamples = samplesRef.current
        const maxRms = Math.max(...allSamples)

        // If the user didn't play anything (max RMS is too low), consider it an error
        if (maxRms < 0.001) {
          setMicStatus('error')
        } else {
          // Use the 10th percentile as noise floor (rough estimate of background noise)
          const sorted = [...allSamples].sort((a, b) => a - b)
          const noiseFloor = sorted[Math.floor(allSamples.length * 0.1)] || 0.01
          setCalibration(noiseFloor)
          setMicStatus('success')
        }
      }, 3000)
    } catch (_err) {
      setMicStatus('error')
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="mb-2 text-3xl font-bold">{t.audioTestTitle}</h2>
      <p className="text-muted-foreground mb-8">{t.audioTestDesc}</p>

      <Card className="bg-muted/30 border-2 border-dashed p-8">
        <div className="space-y-6 text-center">
          {micStatus === 'idle' && (
            <>
              <div className="text-7xl">🎤</div>
              <p className="text-lg">{t.micInstruction}</p>
              <Button onClick={startTest} size="lg">
                {t.testMic}
              </Button>
            </>
          )}

          {micStatus === 'testing' && (
            <>
              <div className="animate-pulse text-7xl">🎤</div>
              <p className="text-lg font-medium">{t.playingInstruction}</p>
              <div className="bg-muted h-6 overflow-hidden rounded-full border">
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
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-7xl">
                ✅
              </motion.div>
              <p className="text-xl font-bold text-green-600">{t.micSuccess}</p>
            </>
          )}

          {micStatus === 'error' && (
            <>
              <div className="text-7xl">❌</div>
              <p className="text-xl font-bold text-red-600">Error</p>
              <Button onClick={startTest} variant="outline">
                {t.retry}
              </Button>
            </>
          )}
        </div>
      </Card>

      <div className="flex gap-4">
        <Button onClick={onBack} variant="outline" className="h-12 flex-1">
          {t.back}
        </Button>
        <Button onClick={onNext} disabled={micStatus !== 'success'} className="h-12 flex-1">
          {t.continue}
        </Button>
      </div>
    </div>
  )
}

function CalibrationStep({ onNext, onBack, t }: OnboardingStepProps) {
  const [status, setStatus] = useState<'idle' | 'calibrating' | 'success'>('idle')
  const [progress, setProgress] = useState(0)
  const [detectedNote, setDetectedNote] = useState<string | null>(null)
  const rafRef = useRef<number>(0)

  const startCalibration = async () => {
    setStatus('calibrating')
    setProgress(0)

    try {
      const { context, analyser } = await audioManager.initialize()
      const detector = new PitchDetector(context.sampleRate)
      const dataArray = new Float32Array(analyser.fftSize)
      let stableFrames = 0
      const REQUIRED_STABLE_FRAMES = 30

      const update = () => {
        analyser.getFloatTimeDomainData(dataArray)
        // Use adaptive mode to help with weak signals during calibration
        const result = detector.detectPitchWithValidation(dataArray, 0.01, true)

        if (result.pitchHz > 0 && result.confidence > 0.8) {
          try {
            const note = MusicalNote.fromFrequency(result.pitchHz)
            setDetectedNote(note.nameWithOctave)

            if (note.nameWithOctave === 'A4') {
              stableFrames++
              setProgress(Math.min((stableFrames / REQUIRED_STABLE_FRAMES) * 100, 100))
            } else {
              stableFrames = Math.max(0, stableFrames - 1)
              setProgress((stableFrames / REQUIRED_STABLE_FRAMES) * 100)
            }
          } catch (_e) {
            setDetectedNote(null)
          }
        } else {
          setDetectedNote(null)
        }

        if (stableFrames >= REQUIRED_STABLE_FRAMES) {
          setStatus('success')
          return
        }

        rafRef.current = requestAnimationFrame(update)
      }
      update()
    } catch (_err) {
      setStatus('idle')
    }
  }

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      audioManager.cleanup()
    }
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="mb-2 text-3xl font-bold">{t.calibrationTitle}</h2>
      <p className="text-muted-foreground mb-8">{t.calibrationDesc}</p>

      <Card className="bg-muted/30 border-2 border-dashed p-8 text-center">
        {status === 'idle' && (
          <Button onClick={startCalibration} size="lg">
            {t.startCalibration}
          </Button>
        )}

        {status === 'calibrating' && (
          <div className="space-y-4">
            <div className="text-6xl font-bold">{detectedNote || '-'}</div>
            <div className="bg-muted h-6 overflow-hidden rounded-full border">
              <motion.div
                className="bg-primary h-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <p className="text-sm">
              {detectedNote === 'A4' ? t.holdNote : t.playOpenA}
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="text-7xl">🎻✅</div>
            <p className="text-xl font-bold text-green-600">{t.calibrationSuccess}</p>
          </div>
        )}
      </Card>

      <div className="flex gap-4">
        <Button onClick={onBack} variant="outline" className="h-12 flex-1">
          {t.back}
        </Button>
        <Button onClick={onNext} disabled={status !== 'success'} className="h-12 flex-1">
          {t.continue}
        </Button>
      </div>
    </div>
  )
}

function ReadyStep({ onNext, t }: OnboardingStepProps) {
  return (
    <div className="space-y-8">
      <h2 className="mb-2 text-3xl font-bold">{t.readyTitle}</h2>
      <p className="text-muted-foreground mb-8">{t.readyDesc}</p>

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

      <div className="space-y-4 text-center">
        <h3 className="text-2xl font-bold">{t.readyTitle}</h3>
        <p className="text-muted-foreground text-lg">{t.readyAdvice}</p>

        <div className="mt-8 grid grid-cols-3 gap-4">
          <Card className="border-primary/10 p-4 text-center">
            <div className="mb-2 text-4xl">🎯</div>
            <p className="text-sm font-bold">Tuner</p>
          </Card>
          <Card className="border-primary/10 p-4 text-center">
            <div className="mb-2 text-4xl">🎵</div>
            <p className="text-sm font-bold">Practice</p>
          </Card>
          <Card className="border-primary/10 p-4 text-center">
            <div className="mb-2 text-4xl">📊</div>
            <p className="text-sm font-bold">Progress</p>
          </Card>
        </div>
      </div>

      <Button onClick={onNext} size="lg" className="h-14 w-full text-xl font-bold">
        {t.startPracticing}
      </Button>
    </div>
  )
}
