'use client'

import { useState } from 'react'
import { TunerMode } from '@/components/tuner-mode'
import { PracticeMode } from '@/components/practice-mode'
import { useTranslation } from '@/lib/i18n'
import { usePreferencesStore } from '@/stores/preferences-store'
import { Music, Target } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

/**
 * The main component for the home page.
 * Simplified for MVP.
 */
export default function Home() {
  const [mode, setMode] = useState<'tuner' | 'practice'>('tuner')
  const language = usePreferencesStore((s) => s.language)
  const t = useTranslation(language)

  return (
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
                <Tabs
                    value={mode}
                    onValueChange={(value) => setMode(value as 'tuner' | 'practice')}
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
                </TabsList>
                </Tabs>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {mode === 'tuner' && <TunerMode />}
        {mode === 'practice' && <PracticeMode />}
      </main>

      {/* Footer */}
      <footer className="border-border text-muted-foreground border-t py-4 text-center text-sm">
        Violin Mentor MVP • Built for Simplicity
      </footer>
    </div>
  )
}
