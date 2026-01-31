'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Confetti from 'react-confetti'
import { X } from 'lucide-react'
import { Button } from './ui/button'
import { useAnalyticsStore, type Achievement } from '@/stores/analytics-store'
import { getAchievementDefinition } from '@/lib/achievements/achievement-checker'
import { useWindowSize } from '@/hooks/use-window-size'

interface AchievementToastProps {
  achievement: Achievement
  onDismiss: () => void
  autoHideDuration?: number // ms
}

/**
 * Notificación animada que celebra logros desbloqueados
 */
export function AchievementToast({
  achievement,
  onDismiss,
  autoHideDuration = 5000,
}: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const { width, height } = useWindowSize()
  const definition = getAchievementDefinition(achievement.id)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onDismiss, 300) // Wait for exit animation
    }, autoHideDuration)

    return () => clearTimeout(timer)
  }, [autoHideDuration, onDismiss])

  const rarityColors = {
    common: 'from-gray-600 to-gray-700',
    rare: 'from-blue-600 to-blue-700',
    epic: 'from-purple-600 to-purple-700',
    legendary: 'from-amber-500 to-orange-600',
  }

  const gradient = definition ? rarityColors[definition.rarity] : rarityColors.common

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Confetti effect for special achievements */}
          {definition?.reward?.confetti && (
            <Confetti
              width={width}
              height={height}
              recycle={false}
              numberOfPieces={200}
              gravity={0.3}
            />
          )}

          {/* Toast notification */}
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm"
          >
            <div
              className={`
              bg-gradient-to-r ${gradient}
              rounded-lg shadow-2xl overflow-hidden
              border-2 border-white/20
            `}
            >
              <div className="flex items-start gap-4 p-4">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="flex-shrink-0 text-5xl"
                >
                  {achievement.icon}
                </motion.div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/80">
                      ¡Logro Desbloqueado!
                    </p>
                    <h3 className="mb-1 text-lg font-bold text-white">{achievement.name}</h3>
                    <p className="text-sm leading-snug text-white/90">{achievement.description}</p>

                    {definition?.reward?.message && (
                      <p className="mt-2 text-xs italic text-white/70">
                        "{definition.reward.message}"
                      </p>
                    )}
                  </motion.div>
                </div>

                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 text-white/60 hover:bg-white/10 hover:text-white"
                  onClick={() => setIsVisible(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Rarity indicator bar */}
              <div className="h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/**
 * Manager component para manejar cola de notificaciones de logros
 */
export function AchievementNotificationManager() {
  const [queue, setQueue] = useState<Achievement[]>([])
  const [current, setCurrent] = useState<Achievement | null>(null)

  // Conectar con analytics store
  useEffect(() => {
    // Suscribirse a cambios en el store para recibir notificaciones
    // Usamos el callback onAchievementUnlocked definido en el store
    useAnalyticsStore.setState({
      onAchievementUnlocked: (achievement) => {
        setQueue((prev) => [...prev, achievement])
      },
    })
  }, [])

  // Procesar cola
  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0])
      setQueue((prev) => prev.slice(1))
    }
  }, [current, queue])

  if (!current) return null

  return <AchievementToast achievement={current} onDismiss={() => setCurrent(null)} />
}
