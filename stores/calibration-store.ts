import { create } from 'zustand'
import { validatedPersist } from '@/stores/persistence/validated-persist-middleware'
import { z } from 'zod'
import { audioManager } from '@/lib/infrastructure/audio-manager'
import { logger } from '@/lib/observability/logger'

interface CalibrationState {
  noiseFloor: number
  lastCalibratedAt: number | undefined
  isCalibrated: boolean

  setCalibration: (noiseFloor: number) => void
  calibrate: () => Promise<void>
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
    (set, get) => ({
      noiseFloor: 0.01,
      lastCalibratedAt: undefined,
      isCalibrated: false,

      setCalibration: (noiseFloor) => set({
        noiseFloor,
        lastCalibratedAt: Date.now(),
        isCalibrated: true,
      }),

      calibrate: async () => {
        try {
          const wasActive = audioManager.isActive()
          if (!wasActive) {
            await audioManager.initialize()
          }

          const measuredNoise = await audioManager.calibrateNoiseFloor(2000)
          // Floor it at 1e-12 to avoid log10 errors, but keep it realistic
          const noiseFloor = Math.max(1e-12, measuredNoise)

          get().setCalibration(noiseFloor)

          if (!wasActive) {
            await audioManager.cleanup()
          }
        } catch (err) {
          logger.error({ msg: 'Calibration failed', err })
          throw err
        }
      },

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
