import { type ThemeProviderProps } from 'next-themes';
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
export declare function ThemeProvider({ children, ...props }: ThemeProviderProps): import("react/jsx-runtime").JSX.Element;
