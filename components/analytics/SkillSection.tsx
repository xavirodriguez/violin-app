'use client'

import React from 'react'

interface SkillSectionProps {
  intonation: number
  rhythm: number
  overall: number
}

export function SkillSection(props: SkillSectionProps) {
  const { intonation, rhythm, overall } = props

  return (
    <div className="bg-card border-border mb-6 rounded-lg border p-4">
      <h2 className="mb-4 text-xl font-bold">Skill Levels</h2>
      <SkillBar label="Intonation" value={intonation} />
      <SkillBar label="Rhythm" value={rhythm} />
      <SkillBar label="Overall" value={overall} />
    </div>
  )
}

function SkillBar({ label, value }: { label: string; value: number }) {
  const roundedValue = Math.round(value)
  const barStyle = { width: `${value}%` }

  const labelElement = <div className="text-muted-foreground w-24">{label}:</div>
  const barWrapper = (
    <div className="bg-muted h-4 flex-1 overflow-hidden rounded-full">
      <div className="bg-primary h-full" style={barStyle} />
    </div>
  )
  const percentElement = <div className="font-bold">{roundedValue}%</div>

  return (
    <div className="mb-2 flex items-center gap-4">
      {labelElement}
      {barWrapper}
      {percentElement}
    </div>
  )
}
