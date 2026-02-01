/**
 * SettingsDialog
 * A dialog component for managing application-wide settings like audio input and sensitivity.
 */

'use client'

import { FC, useEffect } from 'react'
import { useTunerStore } from '@/stores/tuner-store'
import { usePreferencesStore } from '@/stores/preferences-store'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

/**
 * Props for the SettingsDialog component.
 */
interface SettingsDialogProps {
  /** Controls whether the dialog is visible. */
  isOpen: boolean
  /** Callback function to close the dialog. */
  onClose: () => void
}

/**
 * Renders a settings modal that allows users to configure their audio environment.
 *
 * @param props - Component properties.
 * @returns A JSX element containing the dialog with device and sensitivity controls.
 */
const SettingsDialog: FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const { devices, deviceId, sensitivity, loadDevices, setDeviceId, setSensitivity } =
    useTunerStore()

  const {
    feedbackLevel,
    showTechnicalDetails,
    enableCelebrations,
    soundFeedbackEnabled,
    setFeedbackLevel,
    toggleTechnicalDetails,
    toggleCelebrations,
    toggleSoundFeedback
  } = usePreferencesStore()

  useEffect(() => {
    if (isOpen) {
      loadDevices()
    }
  }, [isOpen, loadDevices])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Settings</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Manage your microphone and practice experience.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Audio Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold border-b pb-2">Audio Input</h3>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mic-select" className="text-right">
                Microphone
              </Label>
              <Select onValueChange={setDeviceId} value={deviceId ?? ''}>
                <SelectTrigger id="mic-select" className="col-span-3">
                  <SelectValue placeholder="Select a device" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Microphone ${devices.indexOf(device) + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sensitivity" className="text-right">
                Sensitivity
              </Label>
              <Slider
                id="sensitivity"
                value={[sensitivity]}
                onValueChange={(value) => setSensitivity(value[0])}
                max={100}
                step={1}
                className="col-span-3"
              />
            </div>
          </div>

          {/* Feedback Preferences */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold border-b pb-2">Feedback Preferences</h3>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="feedback-level" className="text-right">
                Level
              </Label>
              <Select
                value={feedbackLevel}
                onValueChange={(v) => setFeedbackLevel(v as any)}
              >
                <SelectTrigger id="feedback-level" className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">
                    🌱 Beginner (simple visual)
                  </SelectItem>
                  <SelectItem value="intermediate">
                    🎯 Intermediate (hybrid)
                  </SelectItem>
                  <SelectItem value="advanced">
                    🏆 Advanced (technical)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="technical-details">Show technical details</Label>
              <Switch
                id="technical-details"
                checked={showTechnicalDetails}
                onCheckedChange={toggleTechnicalDetails}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="celebrations">Animated celebrations</Label>
              <Switch
                id="celebrations"
                checked={enableCelebrations}
                onCheckedChange={toggleCelebrations}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="sound-feedback">Confirmation sound</Label>
              <Switch
                id="sound-feedback"
                checked={soundFeedbackEnabled}
                onCheckedChange={toggleSoundFeedback}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="default">
              Done
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SettingsDialog
