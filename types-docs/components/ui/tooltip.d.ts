import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
/**
 * El proveedor que engloba la aplicación o una parte de ella para habilitar los tooltips.
 */
declare function TooltipProvider({ delayDuration, ...props }: React.ComponentProps<typeof TooltipPrimitive.Provider>): import("react/jsx-runtime").JSX.Element;
declare const Tooltip: React.FC<TooltipPrimitive.TooltipProps>;
/**
 * El elemento que activa el tooltip al pasar el ratón sobre él.
 */
declare function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>): import("react/jsx-runtime").JSX.Element;
/**
 * El contenido del tooltip que se muestra al activarse.
 */
declare function TooltipContent({ className, sideOffset, children, ...props }: React.ComponentProps<typeof TooltipPrimitive.Content>): import("react/jsx-runtime").JSX.Element;
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
