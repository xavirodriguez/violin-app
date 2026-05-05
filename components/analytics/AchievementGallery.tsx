'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { useAnalyticsStore } from '@/stores/analytics-store'
import { ACHIEVEMENT_DEFINITIONS, AchievementDefinition } from '@/lib/achievements/achievement-definitions'
import { Trophy, Lock, Star, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export function AchievementGallery() {
  const { progress } = useAnalyticsStore()
  const unlockedIds = new Set(progress.achievements.map(a => a.id))

  const categories = ['streak', 'accuracy', 'practice', 'mastery', 'exploration']

  return (
    <div className="mt-12 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-amber-500" />
          <h2 className="text-2xl font-bold">Achievement Gallery</h2>
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          {unlockedIds.size} / {ACHIEVEMENT_DEFINITIONS.length} Unlocked
        </div>
      </div>

      <div className="space-y-10">
        {categories.map(cat => {
          const items = ACHIEVEMENT_DEFINITIONS.filter(d => d.category === cat)
          if (items.length === 0) return null

          return (
            <div key={cat} className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b pb-2 flex items-center justify-between">
                <span>{cat} Achievements</span>
                <Badge variant="outline" className="text-[10px]">
                   {items.filter(i => unlockedIds.has(i.id)).length} / {items.length}
                </Badge>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(def => (
                  <AchievementCard
                    key={def.id}
                    definition={def}
                    isUnlocked={unlockedIds.has(def.id)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AchievementCard({
  definition,
  isUnlocked
}: {
  definition: AchievementDefinition,
  isUnlocked: boolean
}) {
  return (
    <Card className={cn(
      "p-5 flex gap-4 transition-all duration-300 relative overflow-hidden group",
      isUnlocked
        ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50"
        : "opacity-60 grayscale border-dashed border-slate-200"
    )}>
      <div className={cn(
        "flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-sm transition-transform group-hover:scale-110",
        isUnlocked ? "bg-amber-100" : "bg-slate-100"
      )}>
        {isUnlocked ? definition.icon : <Lock className="h-6 w-6 text-slate-400" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-bold text-sm truncate">{definition.name}</h4>
          {isUnlocked && <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {definition.description}
        </p>

        <div className="mt-2 flex items-center gap-2">
           <Badge className={cn(
             "text-[9px] uppercase font-black px-1.5 py-0",
             getRarityStyles(definition.rarity)
           )}>
             {definition.rarity}
           </Badge>
        </div>
      </div>

      {/* Decorative corner for legendary */}
      {isUnlocked && definition.rarity === 'legendary' && (
        <div className="absolute -top-1 -right-1">
          <Star className="h-8 w-8 text-amber-500 fill-amber-500 opacity-20 rotate-12" />
        </div>
      )}
    </Card>
  )
}

function getRarityStyles(rarity: AchievementDefinition['rarity']) {
  switch (rarity) {
    case 'legendary': return 'bg-purple-500 text-white'
    case 'epic': return 'bg-orange-500 text-white'
    case 'rare': return 'bg-blue-500 text-white'
    default: return 'bg-slate-500 text-white'
  }
}
