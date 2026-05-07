import type React from 'react';
import type { Metadata } from 'next';
import './globals.css';
export declare const metadata: Metadata;
/**
 * The root layout for the application.
 * @remarks This component wraps all pages and sets up the base `<html>` and `<body>`
 * elements, including fonts and Vercel analytics.
 */
export default function RootLayout({ children, }: Readonly<{
    children: React.ReactNode;
}>): import("react/jsx-runtime").JSX.Element;
