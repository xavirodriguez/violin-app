'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LessonContent } from '@/lib/domain/curriculum'
import { Lightbulb, PlayCircle } from 'lucide-react'

interface WhyThisMattersModalProps {
  content: LessonContent
  isOpen: boolean
  onClose: () => void
}

export function WhyThisMattersModal({ content, isOpen, onClose }: WhyThisMattersModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <Lightbulb className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Pedagogía Musical</span>
          </div>
          <DialogTitle className="text-2xl">{content.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <p className="text-muted-foreground leading-relaxed">{content.description}</p>

          {content.videoUrl && (
            <div className="aspect-video bg-muted rounded-xl flex items-center justify-center relative overflow-hidden group">
               <img
                 src={`https://img.youtube.com/vi/${content.videoUrl}/0.jpg`}
                 className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 transition-all"
                 alt="Preview"
               />
               <PlayCircle className="h-12 w-12 text-white relative z-10" />
            </div>
          )}

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 space-y-3">
             <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
               Tips de Mentores
             </h4>
             <ul className="space-y-2">
               {content.tips.map((tip, idx) => (
                 <li key={idx} className="text-sm text-amber-800 flex items-start gap-2">
                   <span className="mt-1.5 h-1 w-1 rounded-full bg-amber-400 shrink-0" />
                   {tip}
                 </li>
               ))}
             </ul>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full sm:w-auto px-8">
            Entendido, ¡a practicar!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
