import { create } from 'zustand';
import { audioReferenceService } from '@/lib/infrastructure/audio-reference-service';
import { MetronomeEngine } from '@/lib/infrastructure/metronome-engine';

interface AudioStore {
  isPlaying: boolean;
  metronomeEnabled: boolean;
  bpm: number;
  volume: number;
  metronomeEngine: MetronomeEngine | null;

  toggleMetronome: () => void;
  setBpm: (bpm: number) => void;
  setVolume: (volume: number) => void;
  playReference: (noteId: string) => void;
  stopAll: () => void;
  initialize: () => void;
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  isPlaying: false,
  metronomeEnabled: false,
  bpm: 60,
  volume: 0.5,
  metronomeEngine: null,

  initialize: () => {
    if (get().metronomeEngine) return;

    const engine = new MetronomeEngine((event) => {
      // Visual sync event could be dispatched here
      // console.log('Tick:', event.beat);
    });
    set({ metronomeEngine: engine });
  },

  toggleMetronome: () => {
    const { metronomeEnabled, metronomeEngine, bpm } = get();
    if (!metronomeEngine) return;

    if (metronomeEnabled) {
      metronomeEngine.stop();
    } else {
      metronomeEngine.start(bpm);
    }
    set({ metronomeEnabled: !metronomeEnabled });
  },

  setBpm: (bpm: number) => {
    const { metronomeEngine } = get();
    if (metronomeEngine) {
      metronomeEngine.setTempo(bpm);
    }
    set({ bpm });
  },

  setVolume: (volume: number) => {
    set({ volume });
    // In a real implementation, we would connect this to a master gain node
  },

  playReference: (noteId: string) => {
    audioReferenceService.playNote(noteId);
  },

  stopAll: () => {
    audioReferenceService.stop();
    const { metronomeEngine } = get();
    if (metronomeEngine) {
      metronomeEngine.stop();
    }
    set({ metronomeEnabled: false, isPlaying: false });
  },
}));
