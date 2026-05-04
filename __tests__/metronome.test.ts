import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MetronomeEngine } from '../lib/infrastructure/metronome-engine';
import { audioManager } from '../lib/infrastructure/audio-manager';

// Mock audioManager
vi.mock('../lib/infrastructure/audio-manager', () => ({
  audioManager: {
    getContext: vi.fn(),
  },
}));

describe('MetronomeEngine', () => {
  let metronome: MetronomeEngine;
  let mockContext: {
    currentTime: number;
    createOscillator: ReturnType<typeof vi.fn>;
    createGain: ReturnType<typeof vi.fn>;
    destination: object;
  };
  const onTick = vi.fn();

  beforeEach(() => {
    mockContext = {
      currentTime: 0,
      createOscillator: vi.fn().mockReturnValue({
        frequency: { value: 0 },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }),
      createGain: vi.fn().mockReturnValue({
        gain: {
          value: 0,
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      }),
      destination: {},
    };
    vi.mocked(audioManager.getContext).mockReturnValue(mockContext as unknown as AudioContext);
    metronome = new MetronomeEngine(onTick);
  });

  afterEach(() => {
    metronome.stop();
    vi.clearAllMocks();
  });

  it('should start and schedule ticks', () => {
    vi.useFakeTimers();
    metronome.start(60);

    // Fast-forward time
    vi.advanceTimersByTime(100);

    expect(onTick).toHaveBeenCalled();
    expect(mockContext.createOscillator).toHaveBeenCalled();
  });

  it('should stop and clear timers', () => {
    vi.useFakeTimers();
    metronome.start(60);
    metronome.stop();

    const tickCount = onTick.mock.calls.length;
    vi.advanceTimersByTime(1000);

    expect(onTick.mock.calls.length).toBe(tickCount);
  });
});
