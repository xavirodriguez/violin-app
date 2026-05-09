'use client'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'

interface PracticeSettingsProps {
  autoStartEnabled: boolean
  onAutoStartChange: (enabled: boolean) => void
  listenImitateEnabled?: boolean
  onListenImitateChange?: (enabled: boolean) => void
  bpm: number
  onBpmChange: (bpm: number) => void
  indicatedBpm?: number
}

/**
 * UI component for practice-specific settings like auto-start.
 */
export function PracticeSettings({
  autoStartEnabled,
  onAutoStartChange,
  listenImitateEnabled,
  onListenImitateChange,
  bpm,
  onBpmChange,
  indicatedBpm = 60,
}: PracticeSettingsProps) {
  return (
    <div className="bg-muted/20 flex flex-wrap items-center justify-end gap-6 rounded-xl border p-4">
      <div className="flex flex-1 items-center gap-4 min-w-[300px]">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tempo (BPM)</Label>
        <Slider
          value={[bpm]}
          min={40}
          max={200}
          step={1}
          onValueChange={([val]) => onBpmChange(val)}
          className="w-48"
        />
        <span className="w-12 text-sm font-mono font-bold">{bpm}</span>
        <div className="flex gap-1">
          {[0.5, 0.75, 1.0].map((scale) => (
            <Button
              key={scale}
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[10px]"
              onClick={() => onBpmChange(Math.round(indicatedBpm * scale))}
            >
              {scale * 100}%
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 border-l pl-6">
        <Switch id="auto-start" checked={autoStartEnabled} onCheckedChange={onAutoStartChange} />
        <Label htmlFor="auto-start" className="cursor-pointer text-sm">
          Auto-start
        </Label>
      </div>
      <div className="flex items-center gap-2 border-l pl-6">
        <Switch
          id="listen-imitate"
          checked={listenImitateEnabled}
          onCheckedChange={onListenImitateChange}
        />
        <Label htmlFor="listen-imitate" className="cursor-pointer text-sm">
          Escucha → Imita
        </Label>
      </div>
    </div>
  )
}
