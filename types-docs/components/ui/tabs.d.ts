import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
/**
 * El contenedor raíz para un conjunto de pestañas, basado en `Radix UI Tabs`.
 */
declare function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>): import("react/jsx-runtime").JSX.Element;
/**
 * La lista que contiene los disparadores de las pestañas (`TabsTrigger`).
 */
declare function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>): import("react/jsx-runtime").JSX.Element;
/**
 * El botón que activa una pestaña para mostrar su contenido.
 */
declare function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>): import("react/jsx-runtime").JSX.Element;
/**
 * El contenedor para el contenido de una pestaña.
 */
declare function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>): import("react/jsx-runtime").JSX.Element;
export { Tabs, TabsList, TabsTrigger, TabsContent };
