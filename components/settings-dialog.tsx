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
 *
 * @remarks
 * Side Effects:
 * - Triggers `loadDevices()` from `useTunerStore` whenever the dialog is opened to ensure
 *   the list of microphones is up to date.
 *
 * Interactions:
 * - Direct connection to `useTunerStore` for reading and writing audio settings.
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
    toggleSoundFeedback,
  } = usePreferencesStore()

  useEffect(() => {
    if (isOpen) {
      loadDevices()
    }
  }, [isOpen, loadDevices])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Audio Settings</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Manage your microphone and audio input settings.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Audio Settings</h3>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mic-select" className="text-foreground text-right">
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
              <Label htmlFor="sensitivity" className="text-foreground text-right">
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

          {/* NUEVA SECCIÓN: Feedback Preferences */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Preferencias de Retroalimentación</h3>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="feedback-level" className="text-right">
                Nivel
              </Label>
              <Select value={feedbackLevel} onValueChange={(v) => setFeedbackLevel(v as any)}>
                <SelectTrigger id="feedback-level" className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">🌱 Principiante (visual simple)</SelectItem>
                  <SelectItem value="intermediate">🎯 Intermedio (híbrido)</SelectItem>
                  <SelectItem value="advanced">🏆 Avanzado (técnico)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="technical-details">Mostrar detalles técnicos</Label>
              <Switch
                id="technical-details"
                checked={showTechnicalDetails}
                onCheckedChange={toggleTechnicalDetails}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="celebrations">Celebraciones animadas</Label>
              <Switch
                id="celebrations"
                checked={enableCelebrations}
                onCheckedChange={toggleCelebrations}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="sound-feedback">Sonido de confirmación</Label>
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
