Actúa como senior TypeScript engineer especializado en audio real-time, state machines y testing.

Necesito que implementes una serie de mejoras en el pipeline de detección/práctica musical. Trabaja con especial cuidado porque hay interacción entre `note-stream.ts`, `note-segmenter.ts` y `practice-core.ts`.

Objetivo general:
Corregir incoherencias entre detección de nota, segmentación técnica y estado de práctica. El sistema actualmente puede emitir `NO_NOTE_DETECTED` para un frame y, al mismo tiempo, enviarlo al `NoteSegmenter` como frame pitched. Además, un dropout momentáneo puede borrar el historial de detecciones, y el match de una nota depende solo del último frame del segmento.

Archivos principales a revisar:

- `lib/note-stream.ts`
- `lib/practice-core.ts`
- `lib/note-segmenter.ts`
- `lib/pitch-detector.ts`
- Tests relacionados, especialmente:
  - `lib/practice-core.test.ts`
  - `lib/note-segmenter.test.ts`
  - cualquier test existente de `note-stream`

Implementa los cambios en PRs o commits lógicos si puedes, pero puedes hacerlo en una sola rama.

---

## 1. Unificar el criterio de calidad de detección en `note-stream.ts`

Problema:
En `executeEventAnalysis`, primero se llama a:

```ts
yield * validateAndEmitDetections({ raw, noteName, cents, options })
```

Esta validación usa `isDetectionHighQuality`, que comprueba:

- `raw.rms >= options.minRms`
- `raw.confidence >= options.minConfidence`
- `!!noteName`
- `Math.abs(cents) <= 50`

Pero después el mismo frame se convierte con:

```ts
const frame = convertToTechniqueFrame({ raw, noteName, cents })
```

y `convertToTechniqueFrame` actualmente considera pitched cualquier frame con:

```ts
noteName && raw.confidence > 0.1
```

Esto genera una contradicción: un frame puede emitir `NO_NOTE_DETECTED` y aun así entrar al `NoteSegmenter` como pitched.

Cambio requerido:

- Modifica `convertToTechniqueFrame` para que reciba `options: NoteStreamOptions`.
- Haz que use exactamente el mismo criterio que `isDetectionHighQuality`.
- Reutiliza `isDetectionHighQuality` en vez de duplicar lógica.
- Cambia la llamada en `executeEventAnalysis` a:

```ts
const frame = convertToTechniqueFrame({ raw, noteName, cents, options })
```

Además:

- Extrae el valor mágico `50` a una constante con nombre claro, por ejemplo:

```ts
const DETECTION_PREFILTER_CENTS_TOLERANCE = 50
```

- No cambies el comportamiento del umbral de 50 cents todavía; solo nómbralo.

Resultado esperado:

- Si un frame no pasa `isDetectionHighQuality`, debe emitirse `NO_NOTE_DETECTED` y también debe convertirse en un frame unpitched para el `NoteSegmenter`.
- Si un frame sí pasa `isDetectionHighQuality`, debe emitirse `NOTE_DETECTED` y convertirse en pitched.

Tests requeridos:
Añade o actualiza tests para cubrir:

1. Frame con `confidence` inferior a `options.minConfidence`, pero superior a `0.1`:
   - Debe emitir `NO_NOTE_DETECTED`.
   - Debe tratarse como unpitched para segmentación.
   - No debe disparar `ONSET`.

2. Frame con `rms` inferior a `options.minRms`:
   - Debe emitir `NO_NOTE_DETECTED`.
   - Debe tratarse como unpitched para segmentación.

3. Frame con cents fuera del prefiltro de 50:
   - Debe emitir `NO_NOTE_DETECTED`.
   - Debe tratarse como unpitched.

---

## 2. Corregir `handleNoNoteDetected` en `practice-core.ts`

Problema:
Actualmente `handleNoNoteDetected` borra `detectionHistory`, pone `status` en `'listening'` y resetea `holdDuration`.

Eso es demasiado agresivo porque `NO_NOTE_DETECTED` representa un frame individual sin señal confiable, no necesariamente el final real de una nota. El `NoteSegmenter` ya tiene tolerancia a dropouts mediante `pitchDropoutToleranceMs`.

Cambio requerido:

- `NO_NOTE_DETECTED` no debe borrar `detectionHistory`.
- No debe degradar cualquier estado a `'listening'`.
- Debe ser conservador con la máquina de estados.

Implementación recomendada:

```ts
function handleNoNoteDetected(state: PracticeState): PracticeState {
  if (state.status !== 'validating') {
    return state
  }

  return {
    ...state,
    status: 'listening',
    holdDuration: 0,
  }
}
```

Si al revisar los tipos reales ves que `validating` no existe o el flujo usa otro estado equivalente para nota en progreso, adapta la condición al estado correcto. No fuerces `listening` desde estados terminales o de feedback como `correct`, `completed`, `idle`, etc.

Tests requeridos:
Actualiza el test existente que espera que `NO_NOTE_DETECTED` borre el historial.

Añade/corrige tests para verificar:

1. Si hay `detectionHistory` y llega `NO_NOTE_DETECTED`, el historial se conserva.
2. Si el estado representa validación activa, se resetea `holdDuration` y se vuelve a `listening`.
3. Si el estado es `correct`, `completed`, `idle` o cualquier estado no activo, `NO_NOTE_DETECTED` no debe degradarlo a `listening`.
4. Un dropout corto entre detecciones no debe destruir el historial útil.

---

## 3. Hacer `isValidMatch` robusto al último frame defectuoso

Problema:
En `note-stream.ts`, `isValidMatch` usa solo el último frame de `pitchedFrames`:

```ts
const lastFrame = pitchedFrames[pitchedFrames.length - 1]
...
cents: lastFrame.cents
```

Esto puede causar falsos negativos si el último frame tiene vibrato, ruido, release desafinado o dropout parcial, aunque la nota completa haya estado afinada.

Cambio requerido:

- Añade una función helper local para calcular la mediana:

```ts
function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}
```

- Cambia `isValidMatch` para usar la mediana de `pitchedFrames.map(frame => frame.cents)` como `cents` representativo.
- Mantén `lastFrame.pitchHz`, `lastFrame.confidence` y `segment.endTime` como metadatos representativos, salvo que encuentres una razón clara para hacer algo mejor.
- Añade una guard clause:

```ts
if (pitchedFrames.length === 0) return false
```

Implementación orientativa:

```ts
function isValidMatch(params: {
  target: TargetNote
  segment: NoteSegment
  pitchedFrames: PitchedFrame[]
  options: NoteStreamOptions
}): boolean {
  const { target, segment, pitchedFrames, options } = params

  if (pitchedFrames.length === 0) return false

  const lastFrame = pitchedFrames[pitchedFrames.length - 1]
  const representativeCents = median(pitchedFrames.map((frame) => frame.cents))

  const detected: DetectedNote = {
    pitch: segment.targetPitch,
    pitchHz: lastFrame.pitchHz,
    cents: representativeCents,
    timestamp: segment.endTime,
    confidence: lastFrame.confidence,
  }

  const isMatched = isMatch({
    target,
    detected,
    tolerance: options.centsTolerance,
  })

  const isDurationValid = segment.durationMs >= options.requiredHoldTime

  return isMatched && isDurationValid
}
```

Tests requeridos:
Añade tests para:

1. Último frame fuera de tolerancia, pero la mediana dentro:
   - Ejemplo cents: `[2, 3, 1, 4, 40]`, tolerancia `25`.
   - Debe matchear.

2. Mayoría/mediana fuera de tolerancia aunque el último frame esté bien:
   - Ejemplo cents: `[30, 32, 35, 28, 2]`, tolerancia `25`.
   - No debe matchear.

3. `pitchedFrames` vacío:
   - Debe devolver `false`.
   - No debe lanzar excepción.

---

## 4. Simplificar `updateDetectionHistory` en `practice-core.ts`

Problema:
Actualmente crea un `FixedRingBuffer` nuevo en cada frame, solo para conservar las últimas 10 detecciones. Es innecesario.

Además, el orden esperado por el resto del código es:

- `detectionHistory[0]` = detección más reciente.

Cambio requerido:
Reemplaza la implementación por:

```ts
function updateDetectionHistory(
  history: readonly DetectedNote[],
  payload: DetectedNote,
): readonly DetectedNote[] {
  return [payload, ...history].slice(0, 10)
}
```

No uses:

```ts
;[...history, payload].slice(-10)
```

porque invierte la semántica esperada.

Tests requeridos:
Añade o actualiza tests para verificar:

1. La detección nueva queda en `detectionHistory[0]`.
2. El historial conserva máximo 10 elementos.
3. El orden es más-reciente-primero.
4. `calculateNewStreak` sigue funcionando porque espera `detectionHistory[0]` como última detección.

---

## 5. Hacer determinista el `segmentId` en `note-segmenter.ts`

Problema:
Actualmente se usa `Date.now()`:

```ts
segmentId: `seg-${Date.now()}-${this.segmentCount++}`,
```

Esto complica tests y reproducibilidad.

Cambio requerido:
Sustituye por un ID determinista por instancia:

```ts
segmentId: `seg-${this.segmentCount++}`,
```

Si al revisar el código ves que hay múltiples instancias de `NoteSegmenter` cuyos segmentos pueden mezclarse, usa una versión con `instanceId`:

```ts
private static nextInstanceId = 0
private readonly instanceId = NoteSegmenter.nextInstanceId++

segmentId: `seg-${this.instanceId}-${this.segmentCount++}`
```

Preferencia:

- Usa `seg-${this.segmentCount++}` si los segmentos solo viven dentro de una instancia/pipeline.
- Usa `seg-${this.instanceId}-${this.segmentCount++}` si hay riesgo real de colisión entre instancias.

Tests requeridos:
Actualiza tests que dependan indirectamente del formato del ID, si existen.
Añade un test básico si es sencillo:

- Primer segmento generado por una instancia debe tener ID determinista.
- Segundo segmento debe incrementar el contador.

No rompas tests existentes por un contador estático compartido entre tests. Si eliges la opción con `static nextInstanceId`, asegúrate de que los tests no dependan de valores globales frágiles.

---

## 6. Optimizar `calculateExpectedStartTime` solo si queda limpio

Problema:
`calculateExpectedStartTime` recalcula acumulados con un loop hasta `currentIndex` cada vez:

```ts
let startTime = firstOnsetTime
for (let i = 0; i < currentIndex; i++) {
  const note = options.exercise!.notes[i]
  startTime += getDurationMs(note.duration, options.bpm)
}
return startTime
```

Esto es O(n²) a lo largo de un ejercicio.

Cambio deseado, pero secundario:

- Precalcula `cumulativeStartTimes` una vez cuando se crea el pipeline o cuando se inicializan las opciones del ejercicio.
- Usa ese array para calcular:

```ts
return firstOnsetTime + cumulativeStartTimes[currentIndex]
```

Importante:

- No introduzcas una refactorización grande si el pipeline actual hace difícil pasar ese array.
- Si `bpm` puede cambiar durante una sesión, el array debe recalcularse cuando cambie `bpm`.
- Si el cambio ensucia demasiado el código, déjalo sin implementar y explícame por qué.

Tests recomendados:

- Verificar que los expected start times son iguales antes y después.
- Verificar diferentes duraciones de nota.
- Verificar que `currentIndex = 0` devuelve `firstOnsetTime`.

---

## 7. No tocar estos puntos salvo documentación o constantes

No cambies comportamiento en estos apartados:

### `MAX_FREQUENCY`

El código ya tiene:

```ts
private MAX_FREQUENCY = 3000
```

y presets por dificultad:

```ts
Beginner: 1320
Intermediate: 1760
Advanced: 3000
```

No cambies esto.

Si hay README o documentación que diga `700 Hz`, actualízala para reflejar el comportamiento real.

### `AudioContext` sin sampleRate explícito

No fuerces `sampleRate` en `AudioContext`.

El detector ya toma:

```ts
audioContext.sampleRate
```

y YIN usa ese sample rate real.

### Umbral de 50 cents

No cambies el valor por ahora.
Solo extrae el número mágico a una constante si estás tocando esa zona.

### `totalPracticeTimeMs`

No lo implementes ahora.
Eso requiere cambios en `ExerciseStats`, persistencia, agregación y migraciones. Como mucho, crea un TODO o nota técnica si el proyecto lo usa.

---

## 8. Criterios de calidad antes de terminar

Antes de entregar:

1. Ejecuta el formatter/linter del proyecto.
2. Ejecuta todos los tests relevantes.
3. Si hay tests fallando por expectativas antiguas, actualízalos solo si la expectativa anterior era incorrecta según esta especificación.
4. No cambies APIs públicas salvo que sea estrictamente necesario.
5. Mantén los cambios pequeños y localizados.
6. Evita refactors cosméticos no relacionados.
7. Asegúrate de que TypeScript compila sin errores.
8. Revisa que no haya thresholds duplicados inconsistentes.

---

## Resultado esperado final

Al terminar, el sistema debe cumplir:

- Un frame rechazado por calidad no puede entrar como pitched al `NoteSegmenter`.
- `NO_NOTE_DETECTED` no borra el historial útil por un dropout de un frame.
- El match de una nota sostenida no depende únicamente del último frame.
- El historial de detecciones mantiene orden más-reciente-primero sin crear un `FixedRingBuffer` por frame.
- Los IDs de segmentos son deterministas.
- Las optimizaciones de ritmo se implementan solo si no complican el diseño.
- Los tests cubren los casos de regresión principales.

Entrega un resumen final con:

- Archivos modificados.
- Tests añadidos o actualizados.
- Comandos ejecutados.
- Cualquier mejora que hayas decidido no implementar y el motivo.

```

```
