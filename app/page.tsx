'use client'

import { useState } from 'react'
import { TunerMode } from '@/components/tuner-mode'
import { PracticeMode } from '@/components/practice-mode'
import { AnalyticsDashboard } from '@/components/analytics-dashboard'
import SettingsDialog from '@/components/settings-dialog'
import { Music, Target, LayoutDashboard, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export default function Home() {
  const [mode, setMode] = useState<'tuner' | 'practice' | 'dashboard'>('tuner')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <>
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
                <TooltipProvider>
                  {/* Mode Switcher */}
                  <Tabs
                    value={mode}
                    onValueChange={(value) => setMode(value as 'tuner' | 'practice' | 'dashboard')}
                  >
                    <TabsList>
                      <TabsTrigger value="tuner" className="gap-2">
                        <Target className="h-4 w-4" />
                        Tuner
                      </TabsTrigger>
                      <TabsTrigger value="practice" className="gap-2">
                        <Music className="h-4 w-4" />
                        Practice
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
                        aria-label="Audio Settings"
                      >
                        <Settings className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Audio Settings</p>
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
