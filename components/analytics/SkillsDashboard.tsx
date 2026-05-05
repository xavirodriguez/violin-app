'use client'

import React from 'react'
import { useMasteryStore } from '@/stores/mastery-store'
import { useCurriculumStore } from '@/stores/curriculum-store'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react'

export function SkillsDashboard() {
  const { objectiveMastery } = useMasteryStore()
  const { units } = useCurriculumStore()

  // Flatten all objectives with their mastery data
  const skills = units.flatMap(unit =>
    unit.learningObjectives.map(obj => {
      const masteryData = objectiveMastery[obj.id]
      return {
        ...obj,
        unitTitle: unit.title,
        mastery: masteryData?.mastery ?? 0,
        trend: masteryData?.trend ?? 'stable',
        lastPracticed: masteryData?.lastPracticedMs ?? 0
      }
    })
  )

  if (skills.length === 0) return null

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-xl font-bold">Skills & Learning Objectives</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.map(skill => (
          <SkillCard key={skill.id} skill={skill} />
        ))}
      </div>
    </div>
  )
}

function SkillCard({ skill }: { skill: any }) {
  const percentage = Math.round(skill.mastery * 100)
  const lastDate = skill.lastPracticed
    ? new Date(skill.lastPracticed).toLocaleDateString()
    : 'Never'

  return (
    <Card className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
            {skill.unitTitle}
          </div>
          <h3 className="font-bold text-sm">{skill.label}</h3>
        </div>
        <TrendIcon trend={skill.trend} />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>Mastery</span>
          <span className="font-bold">{percentage}%</span>
        </div>
        <Progress value={percentage} className="h-1.5" />
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span>Last practiced: {lastDate}</span>
      </div>
    </Card>
  )
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />
  return <Minus className="h-4 w-4 text-muted-foreground" />
}
