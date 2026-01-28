import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
/**
 * El contenedor raíz para un cuadro de diálogo, basado en `Radix UI Dialog`.
 */
declare function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>): import("react/jsx-runtime").JSX.Element;
/**
 * El botón o elemento que abre el cuadro de diálogo.
 */
declare function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>): import("react/jsx-runtime").JSX.Element;
/**
 * Renderiza el contenido del diálogo en un portal, fuera de la jerarquía DOM principal.
 */
declare function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>): import("react/jsx-runtime").JSX.Element;
/**
 * Un botón o elemento que cierra el cuadro de diálogo.
 */
declare function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>): import("react/jsx-runtime").JSX.Element;
/**
 * El fondo semitransparente que se muestra detrás del cuadro de diálogo.
 */
declare function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>): import("react/jsx-runtime").JSX.Element;
/**
 * El contenedor principal del contenido del cuadro de diálogo.
 */
declare function DialogContent({ className, children, showCloseButton, ...props }: React.ComponentProps<typeof DialogPrimitive.Content> & {
    /** Muestra u oculta el botón de cierre por defecto. */
    showCloseButton?: boolean;
}): import("react/jsx-runtime").JSX.Element;
/**
 * La cabecera del cuadro de diálogo, ideal para `DialogTitle` y `DialogDescription`.
 */
declare function DialogHeader({ className, ...props }: React.ComponentProps<'div'>): import("react/jsx-runtime").JSX.Element;
/**
 * El pie de página del cuadro de diálogo, útil para botones de acción.
 */
declare function DialogFooter({ className, ...props }: React.ComponentProps<'div'>): import("react/jsx-runtime").JSX.Element;
/**
 * El título del cuadro de diálogo, para ser usado dentro de `DialogHeader`.
 */
declare function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>): import("react/jsx-runtime").JSX.Element;
/**
 * La descripción del cuadro de diálogo, para ser usada dentro de `DialogHeader`.
 */
declare function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>): import("react/jsx-runtime").JSX.Element;
export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger, };
