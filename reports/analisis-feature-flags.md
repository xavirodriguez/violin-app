# Análisis de Feature Flags y Recomendaciones de Arquitectura

## ⚠️ Advertencias y Riesgos

### 1. Riesgo Alto: Procesamiento de Audio en Web Worker (`FEATURE_AUDIO_WEB_WORKER`)

- **Riesgo**: Mover el pipeline de audio a un Web Worker es un cambio arquitectónico mayor. Introduce posibles condiciones de carrera entre el hilo principal y el worker, y requiere una sincronización cuidadosa del estado del `AnalyserNode`.
- **Estado Actual**: Marcador de posición definido en metadatos, pero no se encontró implementación en `lib/pitch-detector.ts` o `lib/note-stream.ts`. Habilitar este flag sin implementación no tendrá efecto pero podría causar confusión a los desarrolladores.

### 2. Riesgo Medio: Motor de Dificultad Adaptativa (`FEATURE_PRACTICE_ADAPTIVE_DIFFICULTY`)

- **Riesgo**: Modificar el núcleo pedagógico puede impactar significativamente la experiencia del usuario. Si no se calibra correctamente, podría frustrar a los estudiantes al establecer metas imposibles o hacer la aplicación demasiado indulgente.
- **Estado Actual**: Lógica definida pero aún no integrada en el reductor central o el corredor de sesiones.

### 3. Riesgo Bajo: Mapas de Calor de Entonación (`FEATURE_UI_INTONATION_HEATMAPS`)

- **Riesgo**: Principalmente regresiones relacionadas con la UI o impactos en el rendimiento al renderizar superposiciones complejas de SVG/Canvas durante la detección en tiempo real.
- **Estado Actual**: Solo marcador de posición.

### 4. Riesgo de Integración: Telemetría de Precisión (`FEATURE_TELEMETRY_ACCURACY`)

- **Riesgo**: Impacto en el rendimiento del registro continuo y posibles preocupaciones de privacidad si no es estrictamente anónimo.
- **Estado Actual**: Registro activo implementado en `lib/practice/session-runner.ts`.

---

## 🏗️ Recomendaciones de Arquitectura

### 1. Registro Unificado de Feature Flags

Actualmente, los flags se definen en `lib/feature-flags.ts` y se mapean manualmente en `getClientValue`.

- **Recomendación**: Usar un enfoque más automatizado para generar el mapeo del lado del cliente o asegurar que todos los flags en `FEATURE_FLAGS_METADATA` se verifiquen automáticamente para los prefijos `NEXT_PUBLIC_` sin casos `switch` manuales.

### 2. Migración de Features Implícitos

Funcionalidades como `ZEN_MODE` y `AUTO_START` están implementadas actualmente como lógica personalizada en componentes o almacenes.

- **Recomendación**: Migrar estos al `FeatureFlagsManager` central. Esto permite un panel/configuración unificado donde todos los interruptores de comportamiento pueden ser gestionados y auditados.

### 3. Validación Automatizada de Flags

- **Recomendación**: Implementar una verificación de CI que asegure que:
  - Todos los flags usados en el código estén definidos en `FEATURE_FLAGS_METADATA`.
  - Todos los flags en `FEATURE_FLAGS_METADATA` se usen realmente en el código.
  - Los flags que han sido "promocionados" (estables) se purguen completamente de la base de código (sin ramas condicionales muertas).

### 4. Gestión de Dependencias entre Flags

Algunos features podrían depender de otros (ej., la `Dificultad Adaptativa` podría requerir `Telemetría de Precisión` para los datos).

- **Recomendación**: Agregar un campo `dependencies` a `FeatureFlagMetadata` para evitar configuraciones inválidas.

### 5. Acceso al Entorno Tipado

- **Recomendación**: Usar una herramienta como `t3-env` o un esquema Zod personalizado para validar las variables de entorno en el momento de la construcción, asegurando que los flags sean siempre `true`, `false`, o un valor predeterminado válido.
