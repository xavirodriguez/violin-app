import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
/**
 * Un control deslizante que permite al usuario seleccionar un valor de un rango.
 * @remarks Se basa en `Radix UI Slider` para una mayor accesibilidad y se integra
 * con el sistema de diseño para una apariencia consistente.
 */
declare function Slider({ className, defaultValue, value, min, max, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>): import("react/jsx-runtime").JSX.Element;
export { Slider };
