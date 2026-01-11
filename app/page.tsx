"use client"

import { useState } from "react"
import { TunerMode } from "@/components/tuner-mode"
import { PracticeMode } from "@/components/practice-mode"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { Music, Target, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [mode, setMode] = useState<"tuner" | "practice" | "dashboard">("tuner")

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Violin Mentor</h1>
            </div>

            {/* Mode Switcher */}
            <div className="flex gap-2">
              <Button
                variant={mode === "tuner" ? "default" : "outline"}
                onClick={() => setMode("tuner")}
                className="gap-2"
              >
                <Target className="w-4 h-4" />
                Tuner
              </Button>
              <Button
                variant={mode === "practice" ? "default" : "outline"}
                onClick={() => setMode("practice")}
                className="gap-2"
              >
                <Music className="w-4 h-4" />
                Practice
              </Button>
              <Button
                variant={mode === "dashboard" ? "default" : "outline"}
                onClick={() => setMode("dashboard")}
                className="gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {mode === "tuner" && <TunerMode />}
        {mode === "practice" && <PracticeMode />}
        {mode === "dashboard" && <AnalyticsDashboard />}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center text-sm text-muted-foreground">
        Interactive Violin Training • Built with v0
      </footer>
    </div>
  )
}
