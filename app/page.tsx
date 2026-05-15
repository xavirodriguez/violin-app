'use client'

import { useState, useEffect } from 'react'
import { allExercises } from '@/lib/exercises'
import { TunerMode } from '@/components/tuner-mode'
import { PracticeMode } from '@/components/practice-mode'
import { AnalyticsDashboard } from '@/components/analytics-dashboard'
import SettingsDialog from '@/components/settings-dialog'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'
import { analytics } from '@/lib/analytics-tracker'
import { useTranslation } from '@/lib/i18n'
import { usePreferencesStore } from '@/stores/preferences-store'
import { Music, Target, LayoutDashboard, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

/**
 * The main component for the home page.
 * @remarks Renders the header, footer, and main content, which dynamically
 * changes based on the selected mode (`Tuner`, `Practice`, or `Dashboard`).
 * It also manages the visibility of the settings dialog.
 */
export default function Home() {
  const [mode, setMode] = useState<'tuner' | 'practice' | 'dashboard'>('tuner')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const language = usePreferencesStore((s) => s.language)
  const t = useTranslation(language)

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('onboarding-completed')
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true)
      analytics.track('onboarding_started')
    }
  }, [])

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboarding-completed', 'true')
    setShowOnboarding(false)
    setMode('practice')
    // Open A is usually at index 2 in openStringsExercises
    const openA = allExercises.find((ex) => ex.id === 'open-a-string')
    if (openA) {
      import('@/stores/practice-store').then((m) => {
        m.usePracticeStore.getState().loadExercise(openA)
      })
    }
    analytics.track('onboarding_completed')
  }

  return (
    <>
      {showOnboarding && <OnboardingFlow onComplete={handleOnboardingComplete} />}

      <div className="bg-background flex min-h-screen flex-col">
        {/* Header */}
        <header className="border-border bg-card border-b">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="text-primary h-8 w-8" />
                <h1 className="text-foreground text-2xl font-bold">Violin Mentor</h1>
              </div>

              <div className="flex items-center gap-2">
                <TooltipProvider delayDuration={300}>
                  {/* Mode Switcher */}
                  <Tabs
                    value={mode}
                    onValueChange={(value) => setMode(value as 'tuner' | 'practice' | 'dashboard')}
                  >
                    <TabsList>
                      <TabsTrigger value="tuner" className="gap-2">
                        <Target className="h-4 w-4" />
                        {t.tuner.title}
                      </TabsTrigger>
                      <TabsTrigger value="practice" className="gap-2">
                        <Music className="h-4 w-4" />
                        {t.common.practice}
                      </TabsTrigger>
                      <TabsTrigger value="dashboard" className="gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* Settings Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSettingsOpen(true)}
                        aria-label={t.settings.title}
                      >
                        <Settings className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t.settings.title}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {mode === 'tuner' && <TunerMode />}
          {mode === 'practice' && <PracticeMode />}
          {mode === 'dashboard' && <AnalyticsDashboard />}
        </main>

        {/* Footer */}
        <footer className="border-border text-muted-foreground border-t py-4 text-center text-sm">
          Interactive Violin Training • Built with v0
        </footer>
      </div>

      {/* Settings Dialog */}
      <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  )
}
