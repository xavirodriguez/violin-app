import * as React from 'react';
/**
 * Un contenedor de contenido flexible para agrupar información relacionada.
 */
declare function Card({ className, ...props }: React.ComponentProps<'div'>): import("react/jsx-runtime").JSX.Element;
/**
 * La sección de cabecera de un `Card`, ideal para `CardTitle` y `CardDescription`.
 */
declare function CardHeader({ className, ...props }: React.ComponentProps<'div'>): import("react/jsx-runtime").JSX.Element;
/**
 * El título de un `Card`, para ser usado dentro de `CardHeader`.
 */
declare function CardTitle({ className, ...props }: React.ComponentProps<'div'>): import("react/jsx-runtime").JSX.Element;
/**
 * La descripción de un `Card`, para ser usada dentro de `CardHeader`.
 */
declare function CardDescription({ className, ...props }: React.ComponentProps<'div'>): import("react/jsx-runtime").JSX.Element;
/**
 * Un contenedor para acciones (ej. un botón) dentro de `CardHeader`.
 */
declare function CardAction({ className, ...props }: React.ComponentProps<'div'>): import("react/jsx-runtime").JSX.Element;
/**
 * La sección principal de contenido de un `Card`.
 */
declare function CardContent({ className, ...props }: React.ComponentProps<'div'>): import("react/jsx-runtime").JSX.Element;
/**
 * La sección de pie de página de un `Card`.
 */
declare function CardFooter({ className, ...props }: React.ComponentProps<'div'>): import("react/jsx-runtime").JSX.Element;
export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
