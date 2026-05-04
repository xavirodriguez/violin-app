import { audioManager } from './audio-manager';
import { AudioSample, AudioReferenceMap } from '@/lib/domain/audio';
import { AppError, ERROR_CODES } from '@/lib/errors/app-error';

export class AudioReferenceService {
  private samples: AudioReferenceMap = {};
  private activeSources: Set<AudioBufferSourceNode> = new Set();

  async loadSamples(sampleUrls: Record<string, string[]>): Promise<void> {
    const context = audioManager.getContext();
    if (!context) {
      await audioManager.initialize();
    }
    const ctx = audioManager.getContext()!;

    for (const [noteId, urls] of Object.entries(sampleUrls)) {
      this.samples[noteId] = await Promise.all(
        urls.map(async (url) => {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = await ctx.decodeAudioData(arrayBuffer);

          // Simple heuristic for dynamic based on URL or metadata
          let dynamic: 'p' | 'mf' | 'f' = 'mf';
          if (url.includes('_p')) dynamic = 'p';
          if (url.includes('_f')) dynamic = 'f';

          return {
            id: `${noteId}_${dynamic}`,
            buffer,
            noteId,
            dynamic,
          };
        })
      );
    }
  }

  playNote(noteId: string, dynamic: 'p' | 'mf' | 'f' = 'mf'): void {
    const ctx = audioManager.getContext();
    if (!ctx || !this.samples[noteId]) return;

    const sample = this.samples[noteId].find(s => s.dynamic === dynamic) || this.samples[noteId][0];
    if (!sample) return;

    const source = ctx.createBufferSource();
    source.buffer = sample.buffer;

    const gainNode = ctx.createGain();
    // Simple dynamic scaling if we don't have all samples
    const gainValue = dynamic === 'p' ? 0.5 : dynamic === 'f' ? 1.2 : 1.0;
    gainNode.gain.value = gainValue;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start();
    this.activeSources.add(source);

    source.onended = () => {
      this.activeSources.delete(source);
    };
  }

  async playPassage(url: string): Promise<void> {
    const ctx = audioManager.getContext();
    if (!ctx) return;

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await ctx.decodeAudioData(arrayBuffer);

    return new Promise((resolve) => {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
      this.activeSources.add(source);

      source.onended = () => {
        this.activeSources.delete(source);
        resolve();
      };
    });
  }

  stop(): void {
    this.activeSources.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    });
    this.activeSources.clear();
  }
}

export const audioReferenceService = new AudioReferenceService();
