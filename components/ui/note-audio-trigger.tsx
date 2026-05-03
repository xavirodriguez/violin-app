'use client';

import React from 'react';
import { useAudioStore } from '@/stores/audio-store';

interface NoteAudioTriggerProps {
  noteId: string;
  children: React.ReactNode;
}

/**
 * Higher-order component to wrap any element and make it trigger an audio reference on click.
 */
export function NoteAudioTrigger({ noteId, children }: NoteAudioTriggerProps) {
  const { playReference } = useAudioStore();

  return (
    <div
      onClick={() => playReference(noteId)}
      className="cursor-pointer hover:opacity-80 transition-opacity"
      role="button"
      aria-label={`Play audio for note ${noteId}`}
    >
      {children}
    </div>
  );
}
