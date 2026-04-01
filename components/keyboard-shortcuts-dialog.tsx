'use client'

import { useEffect, useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

/** A single keyboard shortcut entry. */
interface ShortcutEntry {
  keys: string[]
  description: string
}

/** All keyboard shortcuts available in practice mode. */
const SHORTCUTS: ShortcutEntry[] = [
  { keys: ['Space'], description: 'Start / Stop practice' },
  { keys: ['Z'], description: 'Toggle Zen Mode' },
  { keys: ['⌘', 'K'], description: 'Practice Assistant' },
  { keys: ['Ctrl', 'K'], description: 'Practice Assistant' },
  { keys: ['Escape'], description: 'Reset session' },
  { keys: ['?'], description: 'Show this help' },
]

/**
 * Renders a styled keyboard key.
 *
 * @param props - The key label to display.
 * @returns A `<kbd>` element styled with Tailwind.
 */
function Kbd({ children }: { children: string }) {
  return (
    <kbd className="bg-muted text-muted-foreground inline-flex min-w-[1.5rem] items-center justify-center rounded border px-1.5 py-0.5 text-xs font-medium shadow-sm">
      {children}
    </kbd>
  )
}

/**
 * Dialog component that displays available keyboard shortcuts in practice mode.
 *
 * @remarks
 * Can be opened via the `?` key or by clicking the help button.
 * Uses Radix UI Dialog for accessibility.
 */
export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
      if (isInput) return

      if (e.key === '?') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed right-4 bottom-4 z-50 rounded-full shadow-lg"
        onClick={() => setOpen(true)}
        aria-label="Keyboard shortcuts"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>
              Available shortcuts during practice sessions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {SHORTCUTS.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{shortcut.description}</span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, keyIndex) => (
                    <span key={keyIndex} className="flex items-center gap-1">
                      {keyIndex > 0 && (
                        <span className="text-muted-foreground text-xs">+</span>
                      )}
                      <Kbd>{key}</Kbd>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
