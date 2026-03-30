'use client'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface PracticeSettingsProps {
  autoStartEnabled: boolean
  onAutoStartChange: (enabled: boolean) => void
}

/**
 * UI component for practice-specific settings like auto-start.
 */
export function PracticeSettings({ autoStartEnabled, onAutoStartChange }: PracticeSettingsProps) {
  return (
    <div className="bg-muted/20 flex items-center justify-end gap-4 rounded-xl border p-4">
      <div className="flex items-center gap-2">
        <Switch id="auto-start" checked={autoStartEnabled} onCheckedChange={onAutoStartChange} />
        <Label htmlFor="auto-start" className="cursor-pointer">
          Auto-start when playing
        </Label>
      </div>
    </div>
  )
}
