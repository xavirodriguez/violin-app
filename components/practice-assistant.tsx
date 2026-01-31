/**
 * PracticeAssistant
 * A command-palette style assistant for quick navigation and exercise selection.
 * Uses the `cmdk` library for a high-performance, accessible search experience.
 */

'use client'

import React, { useEffect, useState } from 'react'
import { Command } from 'cmdk'
import { Search, Music, Sparkles, X } from 'lucide-react'
import { usePracticeStore } from '@/stores/practice-store'
import { allExercises } from '@/lib/exercises'
import { useFeatureFlag } from '@/lib/feature-flags'

/**
 * PracticeAssistant component.
 *
 * @remarks
 * This component remains hidden until the user triggers it via `Meta+K` or `Ctrl+K`.
 * It provides a searchable interface for all available exercises.
 */
export function PracticeAssistant() {
  const [open, setOpen] = useState(false)
  const isEnabled = useFeatureFlag('FEATURE_PRACTICE_ASSISTANT')
  const { loadExercise } = usePracticeStore()

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  if (!isEnabled) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center pt-[10vh] transition-opacity duration-200 ${
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      <Command
        label="Practice Assistant"
        className="relative w-full max-w-2xl overflow-hidden rounded-xl border bg-white shadow-2xl dark:bg-zinc-900"
      >
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Command.Input
            placeholder="Search exercises (e.g., 'G Major Scale', 'Open Strings')..."
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            onClick={() => setOpen(false)}
            className="ml-2 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-zinc-100 data-[state=open]:text-zinc-500 dark:ring-offset-zinc-950 dark:focus:ring-zinc-300 dark:data-[state=open]:bg-zinc-800 dark:data-[state=open]:text-zinc-400"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <Command.List className="max-h-[300px] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm">No exercises found.</Command.Empty>

          <Command.Group heading="All Exercises" className="px-2 py-3 text-xs font-medium text-zinc-500">
            {allExercises.map((exercise) => (
              <Command.Item
                key={exercise.id}
                onSelect={() => {
                  loadExercise(exercise)
                  setOpen(false)
                }}
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-zinc-100 aria-selected:text-zinc-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:aria-selected:bg-zinc-800 dark:aria-selected:text-zinc-50"
              >
                <Music className="mr-2 h-4 w-4" />
                <span>{exercise.name}</span>
                <span className="ml-auto text-xs text-zinc-500">{exercise.difficulty}</span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Quick Actions" className="px-2 py-3 text-xs font-medium text-zinc-500">
             <Command.Item
                onSelect={() => {
                  // In a real app, this could open the tuner or settings
                  setOpen(false)
                }}
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-zinc-100 aria-selected:text-zinc-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:aria-selected:bg-zinc-800 dark:aria-selected:text-zinc-50"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                <span>Daily Practice Goal</span>
              </Command.Item>
          </Command.Group>
        </Command.List>

        <div className="flex items-center border-t bg-zinc-50/50 px-3 py-2 text-[10px] text-zinc-500 dark:bg-zinc-800/50">
          <span>Press</span>
          <kbd className="mx-1 rounded bg-zinc-200 px-1 font-sans text-[10px] font-medium dark:bg-zinc-700">
            ↵
          </kbd>
          <span>to select</span>
          <span className="mx-2">•</span>
          <span>Press</span>
          <kbd className="mx-1 rounded bg-zinc-200 px-1 font-sans text-[10px] font-medium dark:bg-zinc-700">
            ESC
          </kbd>
          <span>to close</span>
        </div>
      </Command>
    </div>
  )
}
