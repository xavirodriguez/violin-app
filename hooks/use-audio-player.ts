'use client';

import { useEffect, useRef, useMemo } from 'react';
import { audioManager } from '@/lib/infrastructure/audio-manager';
import { WebAudioPlayerAdapter } from '@/lib/adapters/web-audio-player.adapter';
import { AudioPlayerPort } from '@/lib/ports/audio-player.port';

/**
 * Hook for accessing the audio player.
 */
export function useAudioPlayer() {
  const playerRef = useRef<AudioPlayerPort | undefined>(undefined);

  useEffect(() => {
    async function initPlayer() {
      // Ensure audio context is initialized
      // We might need to handle the case where it's not initialized yet
      // For now, if it doesn't exist, we can't create the player.
      const context = audioManager.getContext();
      if (context && !playerRef.current) {
        playerRef.current = new WebAudioPlayerAdapter(context);
      }
    }

    initPlayer();

    return () => {
      playerRef.current?.cleanup();
      playerRef.current = undefined;
    };
  }, []);

  const player = useMemo(() => {
    return {
      playNote: async (frequency: number, durationMs: number, volume?: number) => {
        // If context is not ready, try to initialize it
        if (!audioManager.isActive()) {
           try {
             await audioManager.initialize();
           } catch (e) {
             console.error('Failed to initialize audio for playback', e);
             return;
           }
        }

        const context = audioManager.getContext();
        if (context) {
          if (!playerRef.current) {
            playerRef.current = new WebAudioPlayerAdapter(context);
          }
          await audioManager.resume();
          await playerRef.current.playNote(frequency, durationMs, volume);
        }
      },
      stopAll: () => playerRef.current?.stopAll(),
      cleanup: async () => playerRef.current?.cleanup()
    };
  }, []);

  return player;
}
