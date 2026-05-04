'use client';

import React from 'react';
import { useAudioStore } from '@/stores/audio-store';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause } from 'lucide-react';

export function MetronomeControl() {
  const { metronomeEnabled, bpm, setBpm, toggleMetronome, initialize } = useAudioStore();

  React.useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="flex items-center gap-4 p-4 bg-secondary rounded-lg shadow-sm">
      <Button
        variant={metronomeEnabled ? "default" : "outline"}
        size="icon"
        onClick={toggleMetronome}
        aria-label={metronomeEnabled ? "Disable metronome" : "Enable metronome"}
      >
        {metronomeEnabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>

      <div className="flex-1 space-y-1">
        <div className="flex justify-between text-sm font-medium">
          <span>Metronome</span>
          <span>{bpm} BPM</span>
        </div>
        <Slider
          value={[bpm]}
          min={40}
          max={220}
          step={1}
          onValueChange={(vals) => setBpm(vals[0])}
          aria-label="Set tempo in BPM"
        />
      </div>
    </div>
  );
}
