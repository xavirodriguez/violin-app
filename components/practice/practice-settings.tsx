'use client'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface PracticeSettingsProps {
  autoStartEnabled: boolean
  onAutoStartChange: (enabled: boolean) => void
  listenImitateEnabled?: boolean
  onListenImitateChange?: (enabled: boolean) => void
}

/**
 * UI component for practice-specific settings like auto-start.
 */
export function PracticeSettings({
  autoStartEnabled,
  onAutoStartChange,
  listenImitateEnabled,
  onListenImitateChange
}: PracticeSettingsProps) {
  return (
    <div className="bg-muted/20 flex flex-wrap items-center justify-end gap-6 rounded-xl border p-4">
      <div className="flex items-center gap-2">
        <Switch id="auto-start" checked={autoStartEnabled} onCheckedChange={onAutoStartChange} />
        <Label htmlFor="auto-start" className="cursor-pointer">
          Auto-start
        </Label>
      </div>
      <div className="flex items-center gap-2 border-l pl-6">
        <Switch
          id="listen-imitate"
          checked={listenImitateEnabled}
          onCheckedChange={onListenImitateChange}
        />
        <Label htmlFor="listen-imitate" className="cursor-pointer">
          Modo Escucha → Imita
        </Label>
      </div>
    </div>
  )
}
