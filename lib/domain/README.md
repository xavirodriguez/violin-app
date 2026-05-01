# Domain Layer

Este directorio contiene la lógica de negocio pura y los modelos de datos fundamentales de **Violin Mentor**.

## Responsabilidad
La capa de dominio es el núcleo del sistema y debe permanecer independiente de frameworks (React), librerías de UI o APIs del navegador. Contiene las "reglas de oro" de la música y la técnica del violín.

## Módulos Principales
- **`exercise.ts`**: Modelos para la definición de ejercicios y su progresión pedagógica.
- **`musical-types.ts`**: Tipos canónicos para notas, duraciones y afinaciones.
- **`musical-domain.ts`**: Lógica de normalización y validación musical.
- **`practice.ts`**: Modelos para resultados de sesiones, estadísticas y logros.

## Reglas de la Capa
1. **Pureza**: Las funciones aquí deben ser deterministas y sin efectos secundarios.
2. **Validación**: Los modelos deben usar tipos fuertes (Branded Types) para garantizar la integridad de los datos musicales (ej: asegurar que una nota tenga una octava válida).
