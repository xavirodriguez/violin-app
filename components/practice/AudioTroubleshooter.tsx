'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  MicOff,
  ShieldAlert,
  Settings,
  ExternalLink,
} from 'lucide-react'

interface AudioTroubleshooterProps {
  error?: string
  onRetry: () => void
}

export function AudioTroubleshooter({ error, onRetry }: AudioTroubleshooterProps) {
  const isPermissionDenied = error?.toLowerCase().includes('permission') || error?.toLowerCase().includes('notallowed')

  return (
    <Card className="p-8 max-w-2xl mx-auto space-y-8 border-2 border-amber-500/20 shadow-lg">
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600 animate-pulse">
          <MicOff className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-black text-slate-900">Audio Problem Detected</h2>
        <p className="text-slate-600">
          We can't hear your violin. This is usually easy to fix!
        </p>
      </div>

      <div className="space-y-6">
        <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-500" />
          Common Solutions
        </h3>

        <div className="grid gap-4">
          <SolutionItem
            icon={ShieldAlert}
            title={isPermissionDenied ? "Grant Microphone Access" : "Check Connections"}
            description={isPermissionDenied
              ? "Look for the lock icon in your browser address bar and ensure 'Microphone' is set to Allow."
              : "Make sure your microphone is plugged in and not being used by another app (like Zoom or Teams)."}
          />
          <SolutionItem
            icon={Settings}
            title="Check System Settings"
            description="Open your computer's Sound Settings and verify that your desired input device is active and receiving signal."
          />
          <SolutionItem
            icon={ExternalLink}
            title="Browser Guide"
            description="In Chrome: Go to Settings > Privacy and Security > Site Settings > Microphone."
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button onClick={onRetry} size="lg" className="w-full font-bold h-14 text-lg">
          I've fixed it, try again!
        </Button>
        <Button variant="ghost" className="text-muted-foreground text-xs" onClick={() => window.location.reload()}>
          Last resort: Reload application
        </Button>
      </div>
    </Card>
  )
}

function SolutionItem({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 transition-colors hover:border-amber-200">
      <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-amber-600">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="font-bold text-slate-900">{title}</div>
        <p className="text-sm text-slate-500 leading-relaxed mt-0.5">{description}</p>
      </div>
    </div>
  )
}
