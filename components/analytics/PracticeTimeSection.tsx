'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface PracticeTimeSectionProps {
  data: Array<{ day: string; minutes: number }>
}

export function PracticeTimeSection(props: PracticeTimeSectionProps) {
  const { data } = props

  return (
    <div className="bg-card border-border mb-6 rounded-lg border p-4">
      <h2 className="mb-4 text-xl font-bold">Practice Time (Last 7 Days)</h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="minutes" fill="#4ADE80" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
