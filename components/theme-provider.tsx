'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes'

/**
 * A client-side component that provides theme management for the application.
 *
 * @remarks
 * This component is a simple wrapper around the `ThemeProvider` from the `next-themes`
 * library. It should be used at the root of the application layout to enable
 * light/dark mode functionality and persistence across sessions.
 *
 * @param props - The props are passed directly to the `next-themes` provider.
 * This includes `children` and other configuration options like `attribute`,
 * `defaultTheme`, etc.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
