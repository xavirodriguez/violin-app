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
    <div className="flex items-center justify-end gap-4 p-4 bg-muted/20 rounded-xl border">
      <div className="flex items-center gap-2">
        <Switch
          id="auto-start"
          checked={autoStartEnabled}
          onCheckedChange={onAutoStartChange}
        />
        <Label htmlFor="auto-start" className="cursor-pointer">
          Always Listening (Auto-start)
        </Label>
      </div>
    </div>
  )
}
