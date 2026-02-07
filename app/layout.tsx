import type React from 'react'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { PracticeAssistant } from '@/components/practice-assistant'
import { featureFlags } from '@/lib/feature-flags'
import './globals.css'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Violin Mentor - Interactive Scale Practice',
  description: 'Practice violin scales with real-time pitch detection and interactive sheet music',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

/**
 * The root layout for the application.
 * @remarks This component wraps all pages and sets up the base `<html>` and `<body>`
 * elements, including fonts and Vercel analytics.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        {featureFlags.isEnabled('FEATURE_PRACTICE_ASSISTANT') && <PracticeAssistant />}
        <Analytics />
      </body>
    </html>
  )
}
