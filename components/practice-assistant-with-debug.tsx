'use client'

import type React from 'react'
import { PracticeAssistant } from '@/components/practice-assistant'
import dynamic from 'next/dynamic'

const DebugPanel = dynamic(() => import('@/components/debug/DebugPanel'), {
  ssr: false,
})

export function PracticeAssistantWithDebug() {
  return (
    <>
      <PracticeAssistant />
      {process.env.NODE_ENV === 'development' && <DebugPanel />}
    </>
  )
}
