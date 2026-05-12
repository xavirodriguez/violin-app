'use client'

import React, { useState } from 'react'
import { useAnalyticsStore } from '@/stores/analytics-store'
import { useMasteryStore } from '@/stores/mastery-store'
import { ReportingService, StudentReport } from '@/lib/curriculum/reporting'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Printer,
  Share2,
  ClipboardCheck,
  History,
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

export function ProgressReportsSection() {
  const [isOpen, setIsOpen] = useState(false)
  const { progress, sessions } = useAnalyticsStore()
  const { objectiveMastery } = useMasteryStore()

  const report = ReportingService.generateReport(progress, objectiveMastery, sessions)

  return (
    <div className="mt-12 space-y-4">
      <div
        className="flex items-center justify-between cursor-pointer group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-500" />
          <h2 className="text-2xl font-bold">Parent & Teacher Reports</h2>
        </div>
        <Button variant="ghost" size="sm">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {isOpen && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-muted-foreground text-sm max-w-2xl">
            Generate pedagogical summaries to share with your private teacher or family.
            These reports provide a professional overview of technical growth beyond simple scores.
          </p>

          <ReportPreview report={report} />

          <div className="flex gap-3">
            <Button variant="default" className="gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print Report
            </Button>
            <Button variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share Link
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ReportPreview({ report }: { report: StudentReport }) {
  return (
    <Card className="p-8 bg-white border-2 print:border-none print:shadow-none shadow-sm space-y-8">
      {/* Report Header */}
      <div className="flex justify-between items-start border-b pb-6">
        <div>
          <h3 className="text-3xl font-black text-slate-900">STUDENT PROGRESS REPORT</h3>
          <p className="text-slate-500 font-mono text-sm mt-1 uppercase tracking-tighter">
            Violin Mentor Pedagogical System v1.0
          </p>
        </div>
        <div className="text-right">
          <div className="font-bold text-slate-900">{report.studentName}</div>
          <div className="text-slate-500 text-xs">Generated: {new Date(report.generationDate).toLocaleDateString()}</div>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricBox label="Practice Time" value={`${report.summary.totalPracticeMinutes}m`} sub="Total cumulative" />
        <MetricBox label="Sessions" value={report.summary.sessionsCount} sub="Completed" />
        <MetricBox label="Avg Accuracy" value={`${report.summary.averageAccuracy}%`} sub="Last 30 days" />
        <MetricBox label="Active Streak" value={`${report.summary.activeStreak}d`} sub="Consistency" />
      </div>

      {/* Skills Overview */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold border-b pb-2">
          <Award className="h-4 w-4" />
          <h4>Technical Skills Mastery</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.skillsOverview.map((skill, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border">
              <div>
                <div className="font-bold text-slate-800 text-sm">{skill.label}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest">{skill.status}</div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-slate-900">{Math.round(skill.mastery * 100)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent History */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold border-b pb-2">
          <History className="h-4 w-4" />
          <h4>Recent Activity Log</h4>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 border-b">
              <th className="text-left py-2 font-medium">Date</th>
              <th className="text-left py-2 font-medium">Exercise</th>
              <th className="text-center py-2 font-medium">Accuracy</th>
              <th className="text-right py-2 font-medium">Duration</th>
            </tr>
          </thead>
          <tbody>
            {report.recentActivity.map((act, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="py-3 text-slate-600">{new Date(act.date).toLocaleDateString()}</td>
                <td className="py-3 font-bold text-slate-800">{act.exerciseName}</td>
                <td className="py-3 text-center">
                  <Badge variant="outline" className={act.accuracy > 80 ? 'text-green-600' : 'text-slate-600'}>
                    {Math.round(act.accuracy)}%
                  </Badge>
                </td>
                <td className="py-3 text-right text-slate-500 font-mono">{Math.round(act.durationMs / 1000)}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Teacher Notes */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
        <div className="flex items-center gap-2 text-amber-800 font-bold">
          <ClipboardCheck className="h-4 w-4" />
          <h4>Pedagogical Observations</h4>
        </div>
        <p className="text-amber-900 text-sm leading-relaxed italic">
          "{report.teacherNotes}"
        </p>
      </div>
    </Card>
  )
}

function MetricBox({ label, value, sub }: { label: string; value: string | number, sub: string }) {
  return (
    <div className="p-4 rounded-xl border bg-slate-50">
      <div className="text-xs text-slate-500 font-medium">{label}</div>
      <div className="text-2xl font-black text-slate-900 my-1">{value}</div>
      <div className="text-[10px] text-slate-400 uppercase tracking-tighter">{sub}</div>
    </div>
  )
}
