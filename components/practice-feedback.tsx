'use client'

import { useEffect } from 'react'
import { CheckCircle2, AlertTriangle, Info, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Observation } from '@/lib/technique-types'
import { PitchAccuracyMeter } from '@/components/ui/pitch-accuracy-meter'
import { cn } from '@/lib/utils'

interface PracticeFeedbackProps {
  targetNote: string
  detectedPitchName?: string
  centsOff?: number | null
  status: string
  liveObservations?: Observation[]
  /** Current duration the note has been held. */
  holdDuration?: number
  /** Required duration to hold the note. */
  requiredHoldTime?: number
  /** Number of consecutive perfect notes. */
  perfectNoteStreak?: number
}

function ListeningStatus({ targetNote }: { targetNote: string }) {
  return (
    <div className="text-center">
      <div className="text-6xl mb-4" role="img" aria-label="violin">🎻</div>
      <div className="text-2xl text-muted-foreground font-medium">
        Play {targetNote}
      </div>
    </div>
  )
}

function PerfectStatus() {
  return (
    <div className="text-center">
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1.1, opacity: 1 }} transition={{ duration: 0.3, type: "spring" }}>
        <CheckCircle2 className="w-32 h-32 text-[var(--pitch-perfect)] mx-auto mb-4" />
      </motion.div>
      <div className="text-4xl font-bold text-[var(--pitch-perfect)]">Perfect!</div>
    </div>
  )
}

function ValidatingFeedback({ holdDuration = 0, requiredHoldTime = 1000 }: { holdDuration?: number; requiredHoldTime?: number }) {
  const progress = Math.min(100, (holdDuration / requiredHoldTime) * 100)
  const isHalfway = holdDuration > requiredHoldTime * 0.5
  useEffect(() => { if (holdDuration >= requiredHoldTime && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(200) }, [holdDuration, requiredHoldTime])

  return (
    <div className="text-center relative">
      <div className="relative w-48 h-48 mx-auto mb-4 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-muted/20" />
          <motion.circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={2 * Math.PI * 80} animate={{ strokeDashoffset: 2 * Math.PI * 80 * (1 - progress / 100) }} className="text-[var(--pitch-perfect)]" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
           <AnimatePresence mode="wait">
             {isHalfway ? (
               <motion.div key="pulse" initial={{ scale: 0.8 }} animate={{ scale: [0.8, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="bg-[var(--pitch-perfect)]/20 rounded-full w-32 h-32 flex items-center justify-center">
                 <Check className="w-16 h-16 text-[var(--pitch-perfect)]" />
               </motion.div>
             ) : (
               <motion.div key="text" className="text-2xl font-bold">HOLD...</motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
      <div className="text-2xl font-semibold text-[var(--pitch-perfect)]">Keep it steady!</div>
    </div>
  )
}

function AdjustStatus({ centsOff }: { centsOff: number }) {
  const color = Math.abs(centsOff) < 15 ? '#F59E0B' : '#EF4444'
  return (
    <div className="text-center">
      <div className="text-8xl font-bold mb-4" style={{ color }}>
        {centsOff > 0 ? '↑' : '↓'}
      </div>
      <div className="text-3xl font-semibold" style={{ color }}>
        {Math.abs(centsOff) < 15 ? 'Almost!' : 'Adjust'}
      </div>
      <div className="text-xl text-muted-foreground mt-2">
        {centsOff > 0 ? 'Move finger down' : 'Move finger up'}
      </div>
    </div>
  )
}

function WrongNoteStatus({ detectedPitchName, targetNote }: { detectedPitchName?: string, targetNote: string }) {
  return (
    <div className="text-center">
      <AlertTriangle className="w-24 h-24 text-yellow-500 mx-auto mb-4" />
      <div className="text-3xl font-bold text-yellow-500 mb-2">
        Wrong Note
      </div>
      <div className="text-xl text-muted-foreground">
        Playing: <span className="font-mono">{detectedPitchName}</span>
      </div>
      <div className="text-xl text-muted-foreground">
        Need: <span className="font-mono">{targetNote}</span>
      </div>
    </div>
  )
}

interface Level1Props {
  status: string
  targetNote: string
  isPlaying: boolean
  isCorrectNote: boolean
  isInTune: boolean
  centsOff?: number | null
  detectedPitchName?: string
}

interface Level1Props extends Level1PropsBase { holdDuration?: number; requiredHoldTime?: number; }
interface Level1PropsBase { status: string; targetNote: string; isPlaying: boolean; isCorrectNote: boolean; isInTune: boolean; centsOff?: number | null; detectedPitchName?: string; }

function Level1Status({ status, targetNote, isPlaying, isCorrectNote, isInTune, centsOff, detectedPitchName, holdDuration, requiredHoldTime }: Level1Props) {
  if (status === 'listening' && !isPlaying) return <ListeningStatus targetNote={targetNote} />
  if (status === 'validating' || (isPlaying && isCorrectNote && isInTune)) {
    if (status === 'validating') return <ValidatingFeedback holdDuration={holdDuration} requiredHoldTime={requiredHoldTime} />
    return <PerfectStatus />
  }
  if (isPlaying && isCorrectNote && !isInTune) return <AdjustStatus centsOff={centsOff ?? 0} />
  if (isPlaying && !isCorrectNote) return <WrongNoteStatus detectedPitchName={detectedPitchName} targetNote={targetNote} />
  return null
}

function Level2TechnicalDetails({ isPlaying, centsOff }: { isPlaying: boolean, centsOff?: number | null }) {
  if (!isPlaying || centsOff === null || centsOff === undefined) return null

  return (
    <details className="text-center">
      <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
        Show Technical Details
      </summary>
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-center gap-8">
          <div>
            <div className="text-muted-foreground">Deviation</div>
            <div className="font-mono text-lg">
              {centsOff > 0 ? '+' : ''}{centsOff.toFixed(1)}¢
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Tolerance</div>
            <div className="font-mono text-lg">±10¢</div>
          </div>
        </div>
      </div>
    </details>
  )
}

function Level3LiveFeedback({ liveObservations }: { liveObservations: Observation[] }) {
  if (liveObservations.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        <Info className="h-4 w-4" />
        <span>Live Feedback</span>
      </div>
      {liveObservations.slice(0, 2).map((obs, idx) => (
        <div
          key={idx}
          className={`rounded-lg border p-3 transition-all ${
            obs.severity === 3
              ? 'bg-red-500/10 border-red-500/20'
              : obs.severity === 2
                ? 'bg-yellow-500/10 border-yellow-500/20'
                : 'bg-blue-500/10 border-blue-500/20'
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={`h-5 w-5 flex-shrink-0 ${
                obs.severity === 3 ? 'text-red-500' : 'text-yellow-500'
              }`}
            />
            <div className="flex-1">
              <div className="text-sm font-bold">{obs.message}</div>
              <div className="text-xs text-muted-foreground">{obs.tip}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const playSuccessSound = () => {
  if (typeof window === 'undefined') return
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  oscillator.connect(gainNode); gainNode.connect(audioContext.destination)
  oscillator.frequency.value = 800
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
  oscillator.start(); oscillator.stop(audioContext.currentTime + 0.1)
}

export function PracticeFeedback({ targetNote, detectedPitchName, centsOff, status, liveObservations = [], holdDuration = 0, requiredHoldTime = 1000, perfectNoteStreak = 0 }: PracticeFeedbackProps) {
  const isInTune = centsOff !== null && centsOff !== undefined && Math.abs(centsOff) < 10
  const isPlaying = !!(detectedPitchName && detectedPitchName !== '')
  const isCorrectNote = detectedPitchName === targetNote

  useEffect(() => { if (status === 'correct') playSuccessSound() }, [status])

  return (
    <div className="space-y-8 relative">
      <AnimatePresence>
        {perfectNoteStreak >= 3 && (
          <motion.div initial={{ scale: 0, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="absolute -top-12 right-0 bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-1 rounded-full font-bold shadow-lg flex items-center gap-2 z-20">
            <span className="text-lg">🔥</span><span>{perfectNoteStreak} Streak</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detectedPitchName && detectedPitchName !== targetNote && status === 'listening' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="absolute top-0 right-0 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 backdrop-blur-md z-10 max-w-[150px]">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-yellow-600 uppercase tracking-tighter">Note Mismatch</span>
              <span className="text-sm font-mono">{detectedPitchName}</span>
              <span className="text-[10px] text-muted-foreground">Try playing {targetNote}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center min-h-[240px]">
        <AnimatePresence mode="wait">
          <motion.div key={status + (isCorrectNote ? 'correct' : 'wrong') + (isInTune ? 'intune' : 'out')} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.2 }}>
            <Level1Status status={status} targetNote={targetNote} isPlaying={isPlaying} isCorrectNote={isCorrectNote} isInTune={isInTune} centsOff={centsOff} detectedPitchName={detectedPitchName} holdDuration={holdDuration} requiredHoldTime={requiredHoldTime} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="max-w-md mx-auto">
        <PitchAccuracyMeter centsOff={centsOff ?? null} isInTune={isInTune} />
      </div>

      <Level2TechnicalDetails isPlaying={isPlaying} centsOff={centsOff} />
      <Level3LiveFeedback liveObservations={liveObservations} />
    </div>
  )
}
