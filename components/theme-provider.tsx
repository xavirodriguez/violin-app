'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes'

/**
 * A wrapper around `next-themes`'s `ThemeProvider` to integrate with the Next.js App Router.
 *
 * @remarks
 * This component is marked with "use client" and is responsible for providing theme context
 * to all client-side components in the application. It accepts all the props of the
 * original `ThemeProvider` from `next-themes`.
 *
 * @param props - The properties for the theme provider, including children.
 * @returns A JSX element that provides theme context to its children.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
