/**
 * SettingsDialog
 * A dialog component for managing application-wide settings like audio input and sensitivity.
 */

'use client'

import { FC, useEffect, useState, useRef } from 'react'
import { useTunerStore } from '@/stores/tuner-store'
import { usePreferencesStore } from '@/stores/preferences-store'
import { useAnalyticsStore } from '@/stores/analytics-store'
import { useCalibrationStore } from '@/stores/calibration-store'
import { exportSessionsToCSV, downloadCSV } from '@/lib/export/progress-exporter'
import { useTranslation } from '@/lib/i18n'
import { FeedbackLevel } from '@/lib/user-preferences'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
  const { sessions } = useAnalyticsStore()
  const { noiseFloor, lastCalibratedAt, calibrate, reset: _resetCalibration } = useCalibrationStore()

  const {
    language,
    feedbackLevel,
    showTechnicalDetails,
    enableCelebrations,
    soundFeedbackEnabled,
    setLanguage,
    setFeedbackLevel,
    toggleTechnicalDetails,
    toggleCelebrations,
    toggleSoundFeedback,
  } = usePreferencesStore()

  const t = useTranslation(language)
  const [isCalibrating, setIsCalibrated] = useState(false)

  const { initialize, reset } = useTunerStore()
  const permissionState = useTunerStore((s) => s.permissionState)
  const tunerState = useTunerStore((s) => s.state)
  const warmUpRef = useRef(false)

  useEffect(() => {
    const warmUpDevices = async () => {
      if (isOpen && !warmUpRef.current) {
        warmUpRef.current = true
        if (permissionState === 'PROMPT' && tunerState.kind === 'IDLE') {
          await initialize()
          await reset()
        }
        await loadDevices()
      } else if (isOpen) {
        // Just refresh labels if already warmed up
        await loadDevices()
      }
    }
    warmUpDevices()
  }, [isOpen, loadDevices, permissionState, tunerState.kind, initialize, reset])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">{t.settings.title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t.settings.description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Audio Settings */}
          <div className="space-y-4">
            <h3 className="border-b pb-2 text-sm font-semibold">{t.settings.audioInput}</h3>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mic-select" className="text-right">
                {t.settings.microphone}
              </Label>
              <Select onValueChange={setDeviceId} value={deviceId ?? ''}>
                <SelectTrigger id="mic-select" className="col-span-3">
                  <SelectValue placeholder={t.settings.selectDevice} />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `${t.settings.microphone} ${devices.indexOf(device) + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sensitivity" className="text-right">
                {t.settings.sensitivity}
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
            <h3 className="border-b pb-2 text-sm font-semibold">{t.settings.feedbackPrefs}</h3>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="language-select" className="text-right">
                {t.settings.language}
              </Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as 'en' | 'es')}>
                <SelectTrigger id="language-select" className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="feedback-level" className="text-right">
                {t.settings.level}
              </Label>
              <Select
                value={feedbackLevel}
                onValueChange={(v) => setFeedbackLevel(v as FeedbackLevel)}
              >
                <SelectTrigger id="feedback-level" className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">🌱 {t.onboarding.beginner}</SelectItem>
                  <SelectItem value="intermediate">🎯 {t.onboarding.intermediate}</SelectItem>
                  <SelectItem value="advanced">🏆 {t.onboarding.advanced}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="technical-details">{t.settings.techDetails}</Label>
              <Switch
                id="technical-details"
                checked={showTechnicalDetails}
                onCheckedChange={toggleTechnicalDetails}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="celebrations">{t.settings.celebrations}</Label>
              <Switch
                id="celebrations"
                checked={enableCelebrations}
                onCheckedChange={toggleCelebrations}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="sound-feedback">{t.settings.confirmationSound}</Label>
              <Switch
                id="sound-feedback"
                checked={soundFeedbackEnabled}
                onCheckedChange={toggleSoundFeedback}
              />
            </div>
          </div>

          {/* Audio Calibration */}
          <div className="space-y-4">
            <h3 className="border-b pb-2 text-sm font-semibold">Environment Calibration</h3>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-800">Background Noise</div>
                <div className="text-[10px] text-slate-500 uppercase">
                  {lastCalibratedAt ? `Last: ${new Date(lastCalibratedAt).toLocaleDateString()}` : 'Never Calibrated'}
                </div>
              </div>
              <div className="text-right">
                 <div className="font-mono font-bold text-sm">{(noiseFloor * 1000).toFixed(2)} units</div>
                 <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-[10px] disabled:opacity-50"
                    disabled={isCalibrating}
                    onClick={async () => {
                      setIsCalibrated(true)
                      try {
                        await calibrate()
                      } finally {
                        setIsCalibrated(false)
                      }
                    }}
                  >
                   {isCalibrating ? 'Calibrating...' : 'Recalibrate'}
                 </Button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground px-1 italic">
              Calibration helps the engine distinguish your violin from background noise.
              Make sure your room is silent before clicking Recalibrate.
            </p>
          </div>

          {/* Data Export */}
          <div className="space-y-4">
            <h3 className="border-b pb-2 text-sm font-semibold">Data Management</h3>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                const csv = exportSessionsToCSV(sessions)
                downloadCSV(csv, `violin-mentor-export-${new Date().toISOString().split('T')[0]}.csv`)
              }}
            >
              Export Practice History (CSV)
            </Button>
          </div>

          {/* Reset Data */}
          <div className="space-y-4">
            <h3 className="border-b pb-2 text-sm font-semibold text-red-500">
              {t.common.dangerZone}
            </h3>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  {t.common.reset}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t.common.reset}</AlertDialogTitle>
                  <AlertDialogDescription>{t.common.confirmReset}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      localStorage.clear()
                      window.location.reload()
                    }}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    {t.common.reset}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="default">
              {t.settings.done}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SettingsDialog
