import type React from 'react';
import type { Metadata } from 'next';
import './globals.css';
export declare const metadata: Metadata;
/**
 * El diseño raíz de la aplicación.
 * @remarks Este componente envuelve a todas las páginas y establece los elementos
 * base del `<html>` y `<body>`, incluyendo las fuentes y los análisis de Vercel.
 */
export default function RootLayout({ children, }: Readonly<{
    children: React.ReactNode;
}>): import("react/jsx-runtime").JSX.Element;
