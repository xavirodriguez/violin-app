/**
 * High-precision metronome service using the Web Audio API scheduler.
 */
export class Metronome {
  private context: AudioContext
  private bpm: number = 60
  private isRunning: boolean = false
  private nextNoteTime: number = 0
  private timerID: number | undefined
  private lookahead: number = 25.0 // How frequently to call scheduling function (in milliseconds)
  private scheduleAheadTime: number = 0.1 // How far ahead to schedule audio (in seconds)
  private onBeat: (() => void) | undefined

  constructor(context: AudioContext, onBeat?: () => void) {
    this.context = context
    this.onBeat = onBeat
  }

  setBpm(bpm: number): void {
    this.bpm = bpm
  }

  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.nextNoteTime = this.context.currentTime
    this.scheduler()
  }

  stop(): void {
    this.isRunning = false
    if (this.timerID) {
      clearTimeout(this.timerID)
    }
  }

  private scheduler(): void {
    while (this.nextNoteTime < this.context.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.nextNoteTime)

      // Visual feedback timing (approximate)
      const delay = (this.nextNoteTime - this.context.currentTime) * 1000
      setTimeout(
        () => {
          if (this.isRunning) this.onBeat?.()
        },
        Math.max(0, delay),
      )

      this.advanceNote()
    }
    this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead)
  }

  private scheduleNote(time: number): void {
    const osc = this.context.createOscillator()
    const envelope = this.context.createGain()

    osc.frequency.value = 1000
    envelope.gain.value = 1
    envelope.gain.exponentialRampToValueAtTime(1, time + 0.001)
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.02)

    osc.connect(envelope)
    envelope.connect(this.context.destination)

    osc.start(time)
    osc.stop(time + 0.03)
  }

  private advanceNote(): void {
    const secondsPerBeat = 60.0 / this.bpm
    this.nextNoteTime += secondsPerBeat
  }

  getBpm(): number {
    return this.bpm
  }

  isActive(): boolean {
    return this.isRunning
  }
}
