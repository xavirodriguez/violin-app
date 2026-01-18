'use client'

import { FC, useEffect } from 'react'
import { useTunerStore } from '@/lib/stores/tuner-store'
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

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

const SettingsDialog: FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const { devices, deviceId, sensitivity, loadDevices, setDeviceId, setSensitivity } =
    useTunerStore()

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
