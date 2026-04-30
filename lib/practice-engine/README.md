# Practice Engine

Este directorio contiene el motor central de orquestación para las sesiones de práctica de violín.

## Responsabilidad
El `PracticeEngine` actúa como el "cerebro" asíncrono que conecta el flujo de audio con la lógica de progresión de la partitura. Su función es consumir frames de audio, detectar cuándo una nota ha sido completada con éxito y gestionar la transición a la siguiente nota.

## Componentes Clave
- **`engine.ts`**: El orquestador principal que maneja el loop asíncrono.
- **`engine.reducer.ts`**: Lógica de transición de estados pura e inmutable.
- **`engine.state.ts`**: Definición del modelo de datos reactivo del motor.

## Flujo de Datos
1. Recibe frames de un `AudioLoopPort`.
2. Procesa mediante el `PitchDetectorPort`.
3. Valida contra la partitura activa.
4. Emite eventos (`NOTE_DETECTED`, `NOTE_MATCHED`, `SESSION_COMPLETED`) que la UI consume para actualizarse.
