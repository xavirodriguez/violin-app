import { create } from 'zustand'
import { validatedPersist } from '@/stores/persistence/validated-persist-middleware'
import { z } from 'zod'

interface CalibrationState {
  noiseFloor: number
  lastCalibratedAt: number | undefined
  isCalibrated: boolean

  setCalibration: (noiseFloor: number) => void
  reset: () => void
}

const CalibrationSchema = z.object({
  noiseFloor: z.number().default(0.01),
  lastCalibratedAt: z.number().optional(),
  isCalibrated: z.boolean().default(false),
})

export const useCalibrationStore = create<CalibrationState>()(
  validatedPersist<CalibrationState>(
    CalibrationSchema,
    (set) => ({
      noiseFloor: 0.01,
      lastCalibratedAt: undefined,
      isCalibrated: false,

      setCalibration: (noiseFloor) => set({
        noiseFloor,
        lastCalibratedAt: Date.now(),
        isCalibrated: true,
      }),

      reset: () => set({
        noiseFloor: 0.01,
        lastCalibratedAt: undefined,
        isCalibrated: false,
      }),
    }),
    {
      name: 'violin-mentor-calibration',
    }
  )
)
