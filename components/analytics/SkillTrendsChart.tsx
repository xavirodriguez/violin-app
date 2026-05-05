'use client'

import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts'
import { Card } from '@/components/ui/card'
import { useProgressStore } from '@/stores/progress.store'
import { TrendingUp } from 'lucide-react'

export function SkillTrendsChart() {
  const { eventBuffer, snapshots } = useProgressStore()

  // Use eventBuffer to show recent granular trends if snapshots are few
  const data = eventBuffer.slice(0, 20).reverse().map((e, idx) => ({
    name: `S${idx + 1}`,
    intonation: Math.round(e.accuracy),
    // Rhythm error to score (heuristic: 100 - error/4)
    rhythm: Math.round(Math.max(0, 100 - Math.abs(e.rhythmErrorMs) / 4))
  }))

  if (data.length < 2) return null

  return (
    <div className="mt-12 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-emerald-500" />
        <h2 className="text-2xl font-bold">Skill Evolution</h2>
      </div>

      <Card className="p-6 h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Legend verticalAlign="top" align="right" iconType="circle" />
            <Line
              type="monotone"
              dataKey="intonation"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6 }}
              name="Intonation"
            />
            <Line
              type="monotone"
              dataKey="rhythm"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6 }}
              name="Rhythm"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest">
        Trend based on your last {data.length} practice sessions
      </p>
    </div>
  )
}
