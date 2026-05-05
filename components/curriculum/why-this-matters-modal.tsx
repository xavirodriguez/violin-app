'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LessonContent } from '@/lib/domain/curriculum'
import { Lightbulb, CheckCircle2 } from 'lucide-react'
import { highlightTerms } from './GlossaryTooltip'

interface WhyThisMattersModalProps {
  content: LessonContent
  isOpen: boolean
  onClose: () => void
}

export function WhyThisMattersModal({ content, isOpen, onClose }: WhyThisMattersModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Lightbulb className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">{content.title}</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground pt-2 leading-relaxed">
            {highlightTerms(content.description)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Expert Tips</h4>
          <div className="space-y-3">
            {content.tips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                <p className="text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Understood, Let's Practice!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
