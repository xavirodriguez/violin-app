import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
/**
 * El contenedor raíz para un menú de selección, basado en `Radix UI Select`.
 */
declare function Select({ ...props }: React.ComponentProps<typeof SelectPrimitive.Root>): import("react/jsx-runtime").JSX.Element;
/**
 * Agrupa opciones dentro de un `Select`.
 */
declare function SelectGroup({ ...props }: React.ComponentProps<typeof SelectPrimitive.Group>): import("react/jsx-runtime").JSX.Element;
/**
 * Muestra el valor seleccionado de un `Select` cuando está cerrado.
 */
declare function SelectValue({ ...props }: React.ComponentProps<typeof SelectPrimitive.Value>): import("react/jsx-runtime").JSX.Element;
/**
 * El botón que abre y cierra el menú de selección.
 */
declare function SelectTrigger({ className, size, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
    size?: 'sm' | 'default';
}): import("react/jsx-runtime").JSX.Element;
/**
 * El contenedor de las opciones del menú de selección.
 */
declare function SelectContent({ className, children, position, align, ...props }: React.ComponentProps<typeof SelectPrimitive.Content>): import("react/jsx-runtime").JSX.Element;
/**
 * Una etiqueta para un grupo de opciones de `Select`.
 */
declare function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>): import("react/jsx-runtime").JSX.Element;
/**
 * Una opción individual dentro de un `Select`.
 */
declare function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>): import("react/jsx-runtime").JSX.Element;
/**
 * Un separador visual para agrupar opciones en un `Select`.
 */
declare function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>): import("react/jsx-runtime").JSX.Element;
/**
 * Un botón para desplazarse hacia arriba en la lista de opciones.
 */
declare function SelectScrollUpButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>): import("react/jsx-runtime").JSX.Element;
/**
 * Un botón para desplazarse hacia abajo en la lista de opciones.
 */
declare function SelectScrollDownButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>): import("react/jsx-runtime").JSX.Element;
export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue, };
