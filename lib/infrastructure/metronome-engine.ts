import { audioManager } from './audio-manager'

export interface MetronomeEvent {
  beat: number
  time: number
}

export class MetronomeEngine {
  private nextTickTime: number = 0
  private bpm: number = 60
  private isRunning: boolean = false
  private timerId: number | null = null
  private beatCounter: number = 0
  private lookahead: number = 25.0 // ms
  private scheduleAheadTime: number = 0.1 // seconds
  private onTick: (event: MetronomeEvent) => void

  constructor(onTick: (event: MetronomeEvent) => void) {
    this.onTick = onTick
  }

  start(bpm: number): void {
    if (this.isRunning) return

    this.bpm = bpm
    this.isRunning = true
    this.beatCounter = 0

    const context = audioManager.getContext()
    if (!context) return

    this.nextTickTime = context.currentTime
    this.scheduler()
  }

  stop(): void {
    this.isRunning = false
    if (this.timerId) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
  }

  setTempo(bpm: number): void {
    this.bpm = bpm
  }

  private scheduler(): void {
    const context = audioManager.getContext()
    if (!context) return

    while (this.nextTickTime < context.currentTime + this.scheduleAheadTime) {
      this.scheduleTick(this.beatCounter, this.nextTickTime)
      this.advanceTick()
    }

    if (this.isRunning) {
      this.timerId = window.setTimeout(() => this.scheduler(), this.lookahead)
    }
  }

  private advanceTick(): void {
    const secondsPerBeat = 60.0 / this.bpm
    this.nextTickTime += secondsPerBeat
    this.beatCounter = (this.beatCounter + 1) % 4 // Assuming 4/4 for now
  }

  private scheduleTick(beat: number, time: number): void {
    this.onTick({ beat, time })

    const context = audioManager.getContext()
    if (!context) return

    const osc = context.createOscillator()
    const envelope = context.createGain()

    osc.frequency.value = beat === 0 ? 880 : 440
    envelope.gain.value = 1
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1)

    osc.connect(envelope)
    envelope.connect(context.destination)

    osc.start(time)
    osc.stop(time + 0.1)
  }
}
