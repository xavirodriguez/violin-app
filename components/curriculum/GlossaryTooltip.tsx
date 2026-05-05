'use client'

import React from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { GLOSSARY } from '@/lib/curriculum/glossary'

interface GlossaryTooltipProps {
  termKey: string
  children: React.ReactNode
}

/**
 * A wrapper component that adds a pedagogical tooltip to technical terms.
 */
export function GlossaryTooltip({ termKey, children }: GlossaryTooltipProps) {
  const entry = GLOSSARY[termKey.toLowerCase()]

  if (!entry) return <>{children}</>

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help border-b border-dotted border-primary/50 hover:border-primary transition-colors">
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[250px] p-3">
          <div className="space-y-1">
            <div className="font-bold text-amber-500 text-[10px] uppercase tracking-wider">
              {entry.category.replace('-', ' ')}
            </div>
            <div className="font-bold text-sm underline decoration-amber-500/30 decoration-2 underline-offset-2">
              {entry.term}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {entry.definition}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Utility function to wrap terms in a text with GlossaryTooltips.
 */
export function highlightTerms(text: string) {
  // Simple regex matching for glossary terms
  // In a more robust version, we would use a more sophisticated NLP or multi-pass approach
  const terms = Object.keys(GLOSSARY)
  const regex = new RegExp(`\\b(${terms.join('|')})\\b`, 'gi')

  const parts = text.split(regex)

  return parts.map((part, i) => {
    const lowerPart = part.toLowerCase()
    if (GLOSSARY[lowerPart]) {
      return <GlossaryTooltip key={i} termKey={lowerPart}>{part}</GlossaryTooltip>
    }
    return part
  })
}
