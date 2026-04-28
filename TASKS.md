Sí. El archivo ya está bastante bien orientado a producto, pero todavía mezcla **especificación, diagnóstico, roadmap, invariantes y riesgos** en un mismo documento. Para que una IA pueda ejecutarlo “hasta el final”, conviene fragmentarlo en **tareas atómicas**, cada una con: objetivo, archivos, criterios de aceptación, tests obligatorios, restricciones e instrucciones de entrega.

Abajo lo convierto en un backlog accionable de tipo **spec-driven development**, ordenado por dependencia y prioridad. Me baso en los gaps, criterios de aceptación y roadmap del documento, especialmente los cuatro gaps críticos: dificultad adaptativa desconectada, `technique!`, validación semántica de ejercicios y pausa de `requestAnimationFrame` en background. 

---

# 1. Principio de fragmentación

Cada tarea debe cumplir estas reglas:

1. **Debe ser ejecutable por una IA en una sola pasada.**
2. **Debe tener un resultado verificable.**
3. **Debe tocar pocos archivos.**
4. **Debe incluir tests o, si no aplica, una justificación.**
5. **Debe preservar invariantes críticos del sistema.**
6. **Debe evitar refactors cosméticos.**

El orden recomendado no es arbitrario. Primero van las tareas que evitan crashes o corrupción silenciosa; después las que conectan comportamiento funcional; finalmente robustez, documentación y mejoras avanzadas.

---

# 2. Backlog accionable priorizado

## Fase 0 — Preparación y seguridad

---

## TASK-00 — Crear mapa técnico inicial antes de modificar código

**Prioridad:** P0
**Tipo:** Análisis previo
**Objetivo:** Localizar las funciones, stores y tests afectados antes de aplicar cambios.

### Archivos a inspeccionar

* `lib/practice-engine/engine.ts`
* `lib/domain/type-guards.ts`
* `lib/exercises/`
* `stores/practice-store.ts`
* `lib/practice-core.ts`
* `lib/note-stream.ts`
* `lib/note-segmenter.ts`
* `lib/technique-analysis-agent.ts`
* `lib/adapters/web-audio.adapter.ts`
* Tests existentes:

  * `lib/pitch-detector.test.ts`
  * `lib/practice-core.test.ts`
  * `lib/note-stream.test.ts`
  * `lib/note-segmenter.test.ts`
  * `__tests__/practice-store-robustness.test.ts`
  * `__tests__/bug-fixes.test.ts`

### Instrucciones

1. Identificar dónde está `mapMatchedEvent`.
2. Identificar dónde está `getEngineOptions`.
3. Identificar dónde se llama a `calculateAdaptiveDifficulty`.
4. Identificar dónde está `calculateCentsTolerance`.
5. Identificar dónde se valida o carga un ejercicio.
6. Identificar dónde se parsea `parsePitch`.
7. Identificar cómo se ejecutan los tests.

### Entregable esperado

Un resumen breve en la conversación o en el PR:

```md
## Technical scan

- mapMatchedEvent: ...
- getEngineOptions: ...
- calculateAdaptiveDifficulty: ...
- calculateCentsTolerance: ...
- exercise validation entrypoint: ...
- parsePitch: ...
- test command: ...
```

### Criterios de aceptación

* No modifica código.
* Identifica todos los puntos de entrada.
* Confirma qué tests existen y cuáles hay que crear.

---

# Fase 1 — Correcciones críticas

Esta fase corresponde al Sprint 1 del documento: eliminar `technique!`, validar ejercicios, conectar dificultad adaptativa, añadir floor de tolerancia y tests de regresión. 

---

## TASK-01 — Eliminar non-null assertion en `mapMatchedEvent`

**Prioridad:** P0
**Tipo:** Bugfix crítico
**Gap cubierto:** GAP-2
**Esfuerzo estimado:** XS/S

### Problema

`mapMatchedEvent` usa `payload.technique!`. Si `technique` llega como `undefined`, el sistema puede propagar datos inválidos al estado sin error visible. El documento exige reemplazar esa non-null assertion por validación explícita y error descriptivo. 

### Archivos esperados

* `lib/practice-engine/engine.ts`
* Archivo donde esté definido `AppError`, si existe.
* Tests relacionados con practice engine o bug fixes.

### Objetivo

Reemplazar:

```ts
const technique = payload.technique!
```

por una validación explícita.

### Implementación esperada

Si existe `AppError`, usarlo:

```ts
if (!payload.technique) {
  throw new AppError({
    code: 'TECHNIQUE_MISSING',
    message: 'NOTE_MATCHED event is missing technique analysis payload',
  })
}
```

Si no existe ese constructor exacto, adaptar al patrón de errores del proyecto.

### Restricciones

* No usar `!` para silenciar TypeScript.
* No usar fallback vacío salvo que la arquitectura ya defina uno.
* No tragar el error silenciosamente.
* No cambiar la forma de `NOTE_MATCHED` salvo que sea imprescindible.

### Tests obligatorios

Añadir test de regresión:

```txt
Dado un NOTE_MATCHED payload sin technique,
cuando mapMatchedEvent procesa el evento,
entonces lanza AppError o error descriptivo TECHNIQUE_MISSING.
```

Añadir test positivo:

```txt
Dado un NOTE_MATCHED payload con technique válido,
mapMatchedEvent mantiene el comportamiento actual.
```

### Criterios de aceptación

* No queda `payload.technique!`.
* Si `technique` falta, el error es explícito.
* El flujo válido no cambia.
* Tests nuevos pasan.

---

## TASK-02 — Crear `validateExercise()` con validación semántica completa

**Prioridad:** P0
**Tipo:** Bugfix crítico / validación de dominio
**Gap cubierto:** GAP-3
**Esfuerzo estimado:** M

### Problema

`isExercise()` valida estructura, pero no semántica. El documento indica que ahora acepta `alter: 2`, no garantiza `notes.length > 0`, no valida octavas y puede permitir ejercicios que crashean en runtime. 

### Archivos esperados

* `lib/domain/type-guards.ts`
* `lib/exercises/`
* Archivo donde esté `parsePitch`
* Archivo donde esté el tipo `Exercise`
* Tests de dominio o `bug-fixes.test.ts`

### Objetivo

Crear una función nueva:

```ts
validateExercise(exercise: unknown): Exercise
```

o, si el proyecto prefiere no retornar el ejercicio:

```ts
validateExercise(exercise: unknown): void
```

La opción recomendada es retornar `Exercise` tipado para facilitar uso posterior.

### Validaciones requeridas

La función debe verificar:

1. El objeto cumple la estructura básica de `Exercise`.
2. `notes.length > 0`.
3. Cada nota tiene `alter ∈ {-1, 0, 1}`.
4. Cada nota tiene `octave ∈ {3, 4, 5, 6, 7}`.
5. Cada duración es un `NoteDuration` válido.
6. No se aceptan accidentales dobles en datos normalizados.
7. Error descriptivo si falla cualquier validación.

### Comportamiento esperado

Ejercicio válido:

```ts
const validated = validateExercise(exercise)
```

Ejercicio inválido:

```ts
throw new AppError({
  code: 'INVALID_EXERCISE',
  message: 'Exercise contains invalid accidental alter=2 at notes[3]',
})
```

### Tests obligatorios

Crear tests para:

1. Rechaza `alter: 2`.
2. Rechaza `alter: -2`.
3. Rechaza `notes: []`.
4. Rechaza `octave: 2`.
5. Rechaza `octave: 8`.
6. Rechaza duración inválida.
7. Acepta ejercicio válido.
8. El mensaje de error incluye índice de nota.

### Criterios de aceptación

* Existe `validateExercise()`.
* `isExercise()` puede seguir existiendo, pero no debe ser la única defensa antes de iniciar sesión.
* Los errores son descriptivos.
* Los tests cubren los casos críticos de GAP-3.

---

## TASK-03 — Integrar `validateExercise()` en `loadExercise()` o punto de entrada equivalente

**Prioridad:** P0
**Tipo:** Integración de validación
**Depende de:** TASK-02
**Esfuerzo estimado:** S

### Problema

Crear `validateExercise()` no basta. El documento exige que la validación ocurra **antes de que el ejercicio entre en el store** y antes de iniciar sesión. 

### Archivos esperados

* `stores/practice-store.ts`
* Posiblemente `lib/practice-engine/engine.ts`
* Posiblemente loaders de ejercicios

### Objetivo

Asegurar que todo ejercicio cargado pase por `validateExercise()` antes de:

* Entrar en estado `initializing`.
* Crear `PracticeEngine`.
* Iniciar audio.
* Iniciar sesión.

### Instrucciones

1. Localizar `loadExercise()`.
2. Insertar `validateExercise()` al inicio del flujo.
3. Si falla, el store debe pasar a estado `error` o devolver error controlado según patrón existente.
4. No iniciar micrófono ni audio si el ejercicio es inválido.

### Tests obligatorios

1. `loadExercise()` con `notes: []` no inicia sesión.
2. `loadExercise()` con `alter: 2` no inicia sesión.
3. El estado resultante contiene error descriptivo.
4. Un ejercicio válido sigue funcionando.

### Criterios de aceptación

* Ningún ejercicio inválido llega al runtime.
* No hay side effects de audio si falla la validación.
* Tests pasan.

---

## TASK-04 — Hacer que `parsePitch` rechace accidentales dobles

**Prioridad:** P1
**Tipo:** Validación de dominio
**Depende de:** TASK-02
**Esfuerzo estimado:** S

### Problema

El documento exige que `parsePitch` rechace `##` y `bb` con error descriptivo, salvo que en el futuro se decida soportar dobles accidentales. 

### Archivos esperados

* Archivo donde esté `parsePitch`
* Tests de ejercicios o parsing

### Objetivo

`parsePitch('C##4')` y `parsePitch('Dbb4')` deben fallar de forma explícita.

### Tests obligatorios

1. `parsePitch('C#4')` funciona.
2. `parsePitch('Db4')` funciona.
3. `parsePitch('C##4')` lanza error descriptivo.
4. `parsePitch('Dbb4')` lanza error descriptivo.
5. El contrato de la función queda documentado con comentario.

### Criterios de aceptación

* Dobles accidentales no pasan silenciosamente.
* El error explica la limitación.
* No se rompe el parsing de notas normales.

---

## TASK-05 — Añadir floor de 15 cents en `calculateCentsTolerance()`

**Prioridad:** P0
**Tipo:** Ajuste funcional de dificultad
**Gap cubierto:** floor excesivamente estricto
**Esfuerzo estimado:** XS

### Problema

La especificación indica que la tolerancia no debe caer por debajo de 15 cents, porque 10 cents es extremadamente estricto para violín. 

### Archivos esperados

* `stores/practice-store.ts`
* Tests de `practice-store` o `practice-core`

### Objetivo

Modificar `calculateCentsTolerance()` para garantizar:

```ts
effectiveTolerance >= 15
```

### Implementación esperada

Ejemplo:

```ts
return Math.max(15, calculatedTolerance)
```

### Tests obligatorios

1. `intonationSkill = 0` devuelve tolerancia base alta.
2. `intonationSkill = 100` no devuelve menos de 15.
3. Valores intermedios siguen siendo coherentes.
4. El resultado está acotado.

### Criterios de aceptación

* Ningún valor de habilidad produce tolerancia menor a 15 cents.
* Tests pasan.
* No se alteran otros cálculos de progreso salvo lo necesario.

---

## TASK-06 — Conectar `perfectNoteStreak` real a `calculateAdaptiveDifficulty()`

**Prioridad:** P0
**Tipo:** Feature funcional crítica
**Gap cubierto:** GAP-1
**Esfuerzo estimado:** S/M

### Problema

`calculateAdaptiveDifficulty(perfectNoteStreak)` existe, pero recibe siempre `0`. El reducer acumula el streak, pero nunca se usa para ajustar la dificultad durante la sesión. 

### Archivos esperados

* `lib/practice-engine/engine.ts`
* `lib/practice-core.ts`
* `stores/practice-store.ts`
* Tests de `note-stream` o engine

### Objetivo

`getEngineOptions()` debe leer el `perfectNoteStreak` real del estado actual y pasarlo a `calculateAdaptiveDifficulty()`.

### Comportamiento esperado

* Streak 0: dificultad base.
* Streak 3: tolerancia menor.
* Streak 6: tolerancia menor que al inicio.
* Streak 10+: mayor `requiredHoldTime`.
* Streak reset: la siguiente nota vuelve a dificultad base, no de forma abrupta en mitad de la nota actual.

### Restricciones

* No introducir estado duplicado si ya existe en reducer/store.
* No leer stale state.
* No recalcular dificultad en medio de un segmento ya iniciado si eso rompe la UX.
* Mantener cap de `requiredHoldTime <= 800ms`.
* Mantener floor de `centsTolerance >= 15`.

### Tests obligatorios

1. `getEngineOptions()` usa streak real, no `0`.
2. Después de 6 notas perfectas, la tolerancia efectiva es menor que al inicio.
3. Con streak alto, `requiredHoldTime` aumenta.
4. `requiredHoldTime` nunca supera 800ms.
5. `centsTolerance` nunca baja de 15.
6. Tras fallo, la siguiente nota usa dificultad base.

### Criterios de aceptación

* GAP-1 queda cerrado.
* No hay hardcode de `0`.
* Test de integración cubre 6 notas perfectas consecutivas.
* La dificultad se ajusta de forma visible pero no injusta.

---

## TASK-07 — Test de integración de dificultad adaptativa end-to-end

**Prioridad:** P1
**Tipo:** Test de integración
**Depende de:** TASK-06
**Esfuerzo estimado:** M

### Problema

No basta con testear `calculateAdaptiveDifficulty()` de forma aislada. La especificación exige comprobar que después de notas perfectas consecutivas la tolerancia efectiva cambia dentro del flujo real. 

### Archivos esperados

* `lib/note-stream.test.ts`
* `__tests__/bug-fixes.test.ts`
* Utilidades de mock stream

### Objetivo

Crear un test que simule una sesión con varias notas perfectas y verifique que el engine cambia opciones.

### Escenario mínimo

```txt
Given:
- ejercicio con al menos 7 notas
- todas las notas se tocan perfectas
When:
- se procesan 6 NOTE_MATCHED perfectos
Then:
- la tolerancia efectiva para la nota siguiente es menor que la inicial
```

### Restricciones

* Si el documento exige delays reales en `note-stream.test.ts`, no mockear `Date.now()` ni tiempo global.
* Usar utilidades existentes tipo `createMockStream` si existen.
* Evitar test frágil con sleeps excesivos.

### Criterios de aceptación

* El test falla en la implementación antigua.
* El test pasa con TASK-06.
* El test no depende de timings no deterministas excesivos.

---

# Fase 2 — Robustez de audio, background y pipeline

---

## TASK-08 — Documentar contrato de `WebAudioFrameAdapter.captureFrame()`

**Prioridad:** P1
**Tipo:** Documentación técnica en código
**Esfuerzo estimado:** XS

### Problema

El documento advierte que `WebAudioFrameAdapter` devuelve una referencia al buffer interno, no una copia, y que ningún consumidor debe guardar esa referencia entre frames. 

### Archivos esperados

* `lib/adapters/web-audio.adapter.ts`
* Interface/puerto de audio frame si existe

### Objetivo

Añadir comentario contractual explícito.

### Texto sugerido

```ts
/**
 * Captures the current audio frame.
 *
 * Important: the returned buffer may reference an internal reusable buffer.
 * Consumers must read it synchronously and must not store or mutate it across frames.
 * Clone the buffer explicitly if long-lived storage is required.
 */
```

### Criterios de aceptación

* El contrato queda documentado junto a la función o interfaz.
* No cambia comportamiento.
* No requiere tests.

---

## TASK-09 — Añadir indicador UI de sesión pausada por background tab

**Prioridad:** P1
**Tipo:** UX / robustez
**Gap cubierto:** GAP-4
**Esfuerzo estimado:** M

### Problema

`requestAnimationFrame` se pausa en background. Si el usuario cambia de pestaña, el hold timer puede quedar inconsistente a nivel UX. El documento recomienda documentarlo en UI y evaluar AudioWorklet a largo plazo. 

### Archivos esperados

* UI de práctica
* Store de práctica si existe
* Hook de visibility si existe o nuevo hook
* `lib/adapters/web-audio.adapter.ts`, solo si hace falta

### Objetivo

Cuando `document.visibilityState === 'hidden'`, la sesión debe mostrar estado pausado o advertencia.

### Comportamiento esperado

Al cambiar a background:

* Pausar visualmente la sesión o mostrar overlay.
* No contar hold time como válido mientras está en background.
* Al volver, pedir al usuario continuar.
* No crashear.
* No corromper progreso.

### Implementación sugerida

Crear hook:

```ts
usePageVisibility()
```

O integrar listener:

```ts
document.addEventListener('visibilitychange', ...)
```

### Tests recomendados

1. Simular `visibilitychange` a hidden.
2. Verificar que aparece indicador.
3. Simular vuelta a visible.
4. Verificar que el usuario puede continuar.

Si no hay framework de UI test, añadir al menos test unitario del hook.

### Criterios de aceptación

* El usuario recibe feedback si la pestaña se pausa.
* El hold timer no se presenta como válido durante background.
* La sesión no queda visualmente congelada sin explicación.

---

## TASK-10 — Mantener coherencia entre `minRms` del pipeline y del segmenter

**Prioridad:** P1
**Tipo:** Invariante de configuración
**Esfuerzo estimado:** S

### Problema

El documento define un invariante crítico:

```txt
minRms(note-stream = 0.01) < minRms(NoteSegmenter = 0.015)
```

Si se cambia uno sin revisar el otro, puede romperse la coherencia entre validación y segmentación. 

### Archivos esperados

* `lib/note-stream.ts`
* `lib/note-segmenter.ts`
* Tests de configuración

### Objetivo

Asegurar vía test o validación que `minRms` del pipeline es menor que `minRms` del segmenter en configuración default y custom.

### Tests obligatorios

1. Defaults cumplen `pipeline.minRms < segmenter.minRms`.
2. Config custom inválida se rechaza o se normaliza.
3. `NoteSegmenter` sigue lanzando error si `minRms <= maxRmsSilence`.

### Criterios de aceptación

* El invariante queda protegido por test.
* No se cambia el valor default salvo necesidad justificada.
* El error de configuración es descriptivo.

---

# Fase 3 — Técnica musical y feedback

---

## TASK-11 — Hacer configurables los umbrales de wolf tone detector

**Prioridad:** P1
**Tipo:** Configuración pedagógica / reducción de falsos positivos
**Esfuerzo estimado:** S

### Problema

El documento indica que los umbrales del wolf tone detector pueden producir falsos positivos en violines de estudio y deben ser configurables. 

### Archivos esperados

* `lib/technique-analysis-agent.ts`
* Config de técnica si existe
* Tests del TechniqueAnalysisAgent

### Objetivo

Permitir configurar:

* `lowConfRatioThreshold`
* `rmsBeatingThreshold`

Defaults actuales:

```txt
lowConfRatio > 0.3
rmsBeating > 0.4
```

### Implementación esperada

Introducir opciones:

```ts
type TechniqueAnalysisOptions = {
  wolfTone?: {
    lowConfRatioThreshold?: number
    rmsBeatingThreshold?: number
  }
}
```

O adaptar al patrón existente.

### Tests obligatorios

1. Defaults conservan comportamiento actual.
2. Umbral más alto reduce detección.
3. Umbral más bajo aumenta detección.
4. Config parcial usa defaults para valores no especificados.

### Criterios de aceptación

* No se hardcodean umbrales imposibles de ajustar.
* Defaults no cambian.
* Tests cubren configuración.

---

## TASK-12 — Proteger reglas de análisis de vibrato en notas cortas

**Prioridad:** P2
**Tipo:** Test/robustez pedagógica
**Esfuerzo estimado:** S

### Problema

La especificación exige que el análisis de vibrato solo se ejecute para segmentos con al menos 20 frames y 500ms. 

### Archivos esperados

* `lib/technique-analysis-agent.ts`
* Tests del agente

### Objetivo

Añadir o verificar guards:

```txt
frames.length >= 20
durationMs >= 500
```

### Tests obligatorios

1. Segmento de 19 frames no genera feedback de vibrato.
2. Segmento de 20 frames pero duración < 500ms no genera feedback de vibrato.
3. Segmento válido sí puede generar feedback de vibrato.

### Criterios de aceptación

* No hay feedback de vibrato en notas cortas.
* Tests pasan.

---

## TASK-13 — Verificar límite de 3 observaciones técnicas por nota

**Prioridad:** P2
**Tipo:** Test/UX pedagógica
**Esfuerzo estimado:** S

### Problema

El documento exige que `prioritizeObservations` limite el output a máximo 3 observaciones ordenadas por `severity * confidence`. 

### Archivos esperados

* `lib/technique-analysis-agent.ts`
* Tests del agente

### Objetivo

Proteger el comportamiento de priorización.

### Tests obligatorios

1. Si hay 5 observaciones, solo salen 3.
2. Las observaciones salen ordenadas por `severity * confidence`.
3. Observaciones con baja confianza no desplazan feedback crítico.

### Criterios de aceptación

* Máximo 3 observaciones por nota.
* Orden correcto.
* No se sobrecarga al estudiante con feedback excesivo.

---

# Fase 4 — Stores, race conditions y cancelación

---

## TASK-14 — Test de `stop() → abort → cleanup`

**Prioridad:** P1
**Tipo:** Integración robustez
**Esfuerzo estimado:** M

### Problema

La especificación exige que la cadena:

```txt
PracticeStore.stop() → abortController.abort() → runner.cancel() → signal.aborted → audioManager.cleanup()
```

se ejecute sin saltarse pasos. 

### Archivos esperados

* `__tests__/practice-store-robustness.test.ts`
* `stores/practice-store.ts`
* `lib/practice-engine/engine.ts`
* Runner de sesión

### Objetivo

Añadir test de integración que compruebe cancelación completa.

### Tests obligatorios

1. `stop()` puede llamarse desde cualquier estado.
2. `stop()` llama a `abort()`.
3. Runner recibe señal abortada.
4. `audioManager.cleanup()` se ejecuta.
5. `AbortError` se trata como cancelación, no como error visible.

### Criterios de aceptación

* Cancelar no deja micrófono activo.
* Cancelar no deja loops vivos.
* Cancelar no muestra error al usuario.

---

## TASK-15 — Test anti-stale con `sessionToken`

**Prioridad:** P1
**Tipo:** Race condition
**Esfuerzo estimado:** M

### Problema

El sistema usa `sessionToken` para descartar updates asíncronos de sesiones antiguas. El documento lo marca como invariante crítico. 

### Archivos esperados

* `__tests__/practice-store-robustness.test.ts`
* `stores/practice-store.ts`

### Objetivo

Verificar que `safeSet()` descarta updates stale.

### Test obligatorio

Escenario:

```txt
1. start() sesión A.
2. Capturar token A.
3. stop().
4. start() sesión B.
5. Intentar aplicar update async con token A.
6. Verificar que estado de sesión B no cambia.
```

### Criterios de aceptación

* `sessionToken` se regenera en cada start.
* Updates antiguos se descartan.
* No se lanza error.
* Estado nuevo no se contamina.

---

## TASK-16 — Asegurar transiciones estrictas del `PracticeStore`

**Prioridad:** P2
**Tipo:** Estado / arquitectura
**Esfuerzo estimado:** S/M

### Problema

La especificación exige que toda transición use `transitions.*` y que no exista transición directa de `idle` a `active`. 

### Archivos esperados

* `stores/practice-store.ts`
* Tests de store

### Objetivo

Proteger la máquina de estados.

### Tests obligatorios

1. `idle → initializing → ready → active` es flujo válido.
2. `idle → active` directo no ocurre.
3. `stop()` desde cualquier estado no lanza excepción.
4. `error → idle` vía reset funciona.
5. No hay mutación directa de estado de práctica fuera de reducer/transitions.

### Criterios de aceptación

* Transiciones explícitas.
* Tests cubren flujos principales.
* No se introducen mutaciones directas.

---

# Fase 5 — ProgressStore y persistencia

---

## TASK-17 — Proteger cálculo de `intonationSkill`

**Prioridad:** P2
**Tipo:** Tests de progreso
**Esfuerzo estimado:** S

### Problema

La especificación exige que `calculateIntonationSkill` use las últimas 10 sesiones, con bonus de tendencia solo si hay al menos 5 sesiones. 

### Archivos esperados

* Store o servicio de progreso
* Tests de progreso

### Objetivo

Añadir tests de cálculo.

### Tests obligatorios

1. Con menos de 5 sesiones, bonus de tendencia = 0.
2. Con más de 10 sesiones, solo considera las últimas 10.
3. Resultado está entre 0 y 100.
4. Tendencia positiva aumenta skill.
5. Tendencia negativa no rompe límites.

### Criterios de aceptación

* Skill siempre acotada.
* Regla de últimas 10 sesiones protegida.

---

## TASK-18 — Proteger buffer de eventos de progreso

**Prioridad:** P2
**Tipo:** Persistencia / storage
**Esfuerzo estimado:** S

### Problema

El documento define orden exacto de operaciones del buffer:

```txt
prepend → slice(1000) → filter(TTL)
```

y TTL de 90 días. 

### Archivos esperados

* ProgressStore
* Tests de ProgressStore

### Objetivo

Añadir tests para límite y TTL.

### Tests obligatorios

1. Al añadir evento nuevo, queda al principio.
2. No hay más de 1000 eventos.
3. Eventos fuera de TTL se eliminan.
4. El orden de operaciones es el especificado.

### Criterios de aceptación

* Storage no crece indefinidamente.
* Eventos recientes se preservan correctamente.

---

## TASK-19 — Robustez ante pérdida de localStorage

**Prioridad:** P2
**Tipo:** Resiliencia
**Esfuerzo estimado:** S

### Problema

La especificación exige que pérdida/corrupción de localStorage no produzca crash y use defaults como `intonationSkill = 0`. 

### Archivos esperados

* ProgressStore
* PracticeStore si aplica
* Tests de persistencia

### Objetivo

Controlar fallos de lectura/parsing.

### Tests obligatorios

1. localStorage vacío inicializa defaults.
2. localStorage con JSON inválido no crashea.
3. localStorage con schema antiguo usa migración o defaults.
4. `intonationSkill` default = 0.

### Criterios de aceptación

* No crash en inicialización.
* Defaults seguros.
* Error opcionalmente logueado, no mostrado como fallo fatal.

---

# Fase 6 — Testing global e invariantes

---

## TASK-20 — Crear suite de invariantes críticos

**Prioridad:** P1
**Tipo:** Test de regresión global
**Esfuerzo estimado:** M

### Problema

El documento incluye un checklist de invariantes que deben verificarse antes de tocar lógica de juego. 

### Archivos sugeridos

* `__tests__/invariants.test.ts`
* O `__tests__/bug-fixes.test.ts`

### Objetivo

Convertir el checklist en tests automáticos cuando sea posible.

### Invariantes a testear

1. `YIN_THRESHOLD = 0.1`.
2. `MIN_FREQUENCY = 180`.
3. `MAX_FREQUENCY` según dificultad.
4. `echoCancellation = false`.
5. `noiseSuppression = false`.
6. `autoGainControl = false`.
7. `minRms(note-stream) < minRms(NoteSegmenter)`.
8. `minRms(segmenter) > maxRmsSilence`.
9. `isMatch` usa `< tolerance`, no `<=`.
10. Comparación de notas por MIDI/enarmónica.
11. `exercise.notes.length > 0`.
12. `alter ∈ {-1, 0, 1}`.
13. `requiredHoldTime <= 800`.
14. `centsTolerance >= 15`.

### Criterios de aceptación

* Los invariantes críticos tienen cobertura automática.
* Si alguien cambia un threshold crítico, los tests fallan.
* No se testean detalles imposibles de observar sin acoplamiento excesivo.

---

## TASK-21 — Cobertura mínima de `practice-core`

**Prioridad:** P2
**Tipo:** Calidad de tests
**Esfuerzo estimado:** M

### Problema

La especificación exige cobertura de ramas ≥ 90% en `lib/practice-core.ts`. 

### Archivos esperados

* `lib/practice-core.test.ts`
* Config de cobertura

### Objetivo

Añadir tests hasta alcanzar cobertura de ramas suficiente.

### Áreas a cubrir

* Matching enarmónico.
* Boundary `|cents| === tolerance`.
* `NOTE_MATCHED` en estados válidos.
* `NOTE_MATCHED` ignorado en `idle` o `completed`.
* Reset de streak.
* Incremento de streak perfecto.
* Hold duration.
* No note detected.
* Session completed.

### Criterios de aceptación

* Branch coverage ≥ 90% para `practice-core.ts`.
* Tests relevantes, no triviales.
* No se cambian reglas funcionales solo para facilitar tests.

---

# Fase 7 — Mejoras avanzadas diferibles

---

## TASK-22 — Evaluar migración a `AudioWorklet`

**Prioridad:** P3
**Tipo:** Spike técnico
**Depende de:** TASK-09
**Esfuerzo estimado:** L

### Problema

`requestAnimationFrame` se pausa en background. AudioWorklet podría resolverlo, pero es costoso. El documento lo coloca como mejora avanzada. 

### Objetivo

Hacer un spike, no una migración completa.

### Entregable

Documento breve o comentario técnico con:

* Viabilidad.
* Compatibilidad navegador.
* Coste.
* Riesgos.
* Plan de migración.
* Decisión: hacer / no hacer / posponer.

### Criterios de aceptación

* No se reescribe el pipeline.
* Se entrega una recomendación técnica.
* Se identifica impacto en tests.

---

## TASK-23 — Decidir soporte de dobles accidentales

**Prioridad:** P3
**Tipo:** Decisión de producto/pedagogía
**Depende de:** TASK-04
**Esfuerzo estimado:** S/M

### Problema

El documento indica que a corto plazo deben rechazarse dobles accidentales, pero a futuro podrían soportarse si hay ejercicios avanzados. 

### Objetivo

Decidir si `##` y `bb` forman parte del roadmap pedagógico.

### Opciones

Opción A — No soportar:

* Mantener rechazo explícito.
* Documentar limitación.

Opción B — Soportar:

* Ampliar regex.
* Normalizar accidentales.
* Ajustar `getAlterString`.
* Añadir tests.
* Revisar comparación MIDI.

### Criterios de aceptación

* Decisión documentada.
* No queda comportamiento ambiguo.

---

## TASK-24 — Migración de snapshots históricos

**Prioridad:** P3
**Tipo:** Persistencia avanzada
**Esfuerzo estimado:** L

### Problema

Si cambia el schema de ProgressStore, los snapshots históricos pueden quedar inconsistentes. El documento lo marca como mejora avanzada. 

### Objetivo

Definir o implementar migración de snapshots.

### Criterios de aceptación

* Snapshots antiguos no rompen el store.
* Se define si se recalculan o se descartan.
* Tests con schema antiguo.

---

# 3. Orden exacto recomendado para una IA

Este es el orden en el que yo se lo daría a una IA ejecutora:

```txt
TASK-00  Technical scan
TASK-01  Fix mapMatchedEvent technique validation
TASK-02  Create validateExercise()
TASK-03  Integrate validateExercise() into loadExercise()
TASK-04  Reject double accidentals in parsePitch
TASK-05  Add 15 cents floor
TASK-06  Connect perfectNoteStreak to adaptive difficulty
TASK-07  Add adaptive difficulty integration test
TASK-20  Add invariants test suite
TASK-10  Protect minRms invariant
TASK-14  Test stop/abort/cleanup chain
TASK-15  Test sessionToken anti-stale
TASK-09  Add background-tab paused UI
TASK-08  Document WebAudioFrameAdapter buffer contract
TASK-11  Configurable wolf tone thresholds
TASK-12  Vibrato guard tests
TASK-13  Technique observations prioritization tests
TASK-17  Intonation skill tests
TASK-18  Progress event buffer tests
TASK-19  localStorage loss robustness
TASK-16  PracticeStore transition tests
TASK-21  practice-core branch coverage
TASK-22  AudioWorklet spike
TASK-23  Double accidental roadmap decision
TASK-24  Snapshot migration
```

Si necesitas avanzar con el menor riesgo posible, ejecuta solo hasta `TASK-07`. Eso cierra los tres gaps funcionales más graves y la tolerancia mínima.

---

# 4. Agrupación por PRs

## PR-1 — Critical runtime safety

Incluye:

* TASK-01
* TASK-02
* TASK-03
* TASK-04

Resultado:

* No hay `technique!`.
* Ejercicios inválidos no llegan al runtime.
* Dobles accidentales se rechazan claramente.

---

## PR-2 — Adaptive difficulty correctness

Incluye:

* TASK-05
* TASK-06
* TASK-07

Resultado:

* La dificultad adaptativa usa streak real.
* La tolerancia nunca baja de 15 cents.
* Hay test end-to-end de progresión de dificultad.

---

## PR-3 — System invariants and pipeline robustness

Incluye:

* TASK-20
* TASK-10
* TASK-14
* TASK-15

Resultado:

* Invariantes críticos protegidos.
* Cancelación y race conditions verificadas.
* Menos riesgo de regresión.

---

## PR-4 — UX robustness and technical feedback

Incluye:

* TASK-09
* TASK-08
* TASK-11
* TASK-12
* TASK-13

Resultado:

* Background tab no confunde al usuario.
* Contrato de audio más claro.
* Técnica musical más configurable y menos ruidosa.

---

## PR-5 — ProgressStore hardening

Incluye:

* TASK-17
* TASK-18
* TASK-19
* TASK-16
* TASK-21

Resultado:

* Progreso robusto.
* Storage acotado.
* Más cobertura de reducer/store.

---

# 5. Prompt maestro para una IA ejecutora

Puedes darle este prompt a Jules/Codex/otra IA para ejecutar el backlog completo de forma controlada:

```text
Actúa como senior TypeScript engineer especializado en spec-driven development, audio DSP y state machines.

Vas a implementar el documento `especificaciones_funcionales.md` de forma incremental, sin refactors cosméticos y preservando todos los invariantes del sistema.

Objetivo:
Cerrar los gaps funcionales críticos del motor de práctica de violín:
1. GAP-1: dificultad adaptativa desconectada.
2. GAP-2: non-null assertion silencioso en `mapMatchedEvent`.
3. GAP-3: validación semántica incompleta de ejercicios.
4. GAP-4: `requestAnimationFrame` pausado en background, mitigación UI.

Reglas:
- Trabaja tarea por tarea.
- No mezcles tareas no relacionadas.
- Añade tests para cada cambio funcional.
- No cambies thresholds críticos salvo que la spec lo indique.
- Mantén `YIN_THRESHOLD = 0.1`.
- Mantén comparación de tolerancia como `< tolerance`, no `<=`.
- Mantén comparación de notas por MIDI/enarmónica, nunca por string.
- Mantén `requiredHoldTime <= 800ms`.
- Añade floor de `centsTolerance >= 15`.
- No uses non-null assertions para ocultar errores de dominio.
- No permitas que ejercicios inválidos lleguen al runtime.
- Si una tarea no puede completarse por falta de contexto, deja un resumen claro de bloqueo y continúa con la siguiente tarea independiente.

Orden de ejecución:
1. Localiza funciones y tests afectados.
2. Elimina `payload.technique!` en `mapMatchedEvent` y reemplázalo por validación explícita.
3. Crea `validateExercise()` con validación semántica:
   - `notes.length > 0`
   - `alter ∈ {-1, 0, 1}`
   - `octave ∈ {3,4,5,6,7}`
   - duración válida
   - errores descriptivos con índice de nota.
4. Integra `validateExercise()` en `loadExercise()` o punto de entrada equivalente antes de iniciar sesión/audio.
5. Haz que `parsePitch()` rechace accidentales dobles `##` y `bb` con error descriptivo.
6. Añade floor de 15 cents en `calculateCentsTolerance()`.
7. Conecta `getEngineOptions()` al `perfectNoteStreak` real del estado del engine y pásalo a `calculateAdaptiveDifficulty()`.
8. Asegura que `requiredHoldTime` nunca supera 800ms.
9. Añade test de integración: después de 6 notas perfectas consecutivas, la tolerancia efectiva es menor que al inicio.
10. Añade suite de invariantes críticos si encaja con la estructura de tests.
11. Añade tests para cancelación, sessionToken anti-stale y validaciones de ejercicios.
12. Implementa mitigación UI para background tab si hay capa UI clara; si no, deja TODO documentado con hook propuesto.
13. Ejecuta typecheck, lint y tests relevantes.

Criterios finales de aceptación:
- No queda `payload.technique!`.
- `alter: 2` se rechaza antes de runtime.
- `notes.length === 0` se rechaza antes de iniciar sesión.
- `parsePitch('C##4')` y `parsePitch('Dbb4')` lanzan error descriptivo.
- `calculateCentsTolerance()` nunca baja de 15.
- `calculateAdaptiveDifficulty()` recibe streak real, no `0`.
- Hay test de regresión para GAP-1, GAP-2 y GAP-3.
- Tests existentes siguen pasando.
- Entrega resumen final con:
  - Archivos modificados.
  - Tests añadidos.
  - Comandos ejecutados.
  - Tareas completadas.
  - Tareas no completadas y motivo.
```

---

# 6. Plantilla de tarea individual para IA

Cuando quieras ejecutar una tarea concreta, usa esta plantilla:

```text
Implementa únicamente TASK-XX: [nombre].

Contexto:
[pegar descripción resumida]

Archivos probables:
- ...

Criterios de aceptación:
- ...
- ...

Tests obligatorios:
- ...
- ...

Restricciones:
- No hagas refactors no relacionados.
- No cambies thresholds críticos.
- No cambies APIs públicas salvo necesidad justificada.
- Mantén TypeScript estricto.
- Ejecuta tests relevantes al final.

Entrega:
- Resumen de cambios.
- Archivos modificados.
- Tests añadidos/actualizados.
- Comandos ejecutados.
- Cualquier bloqueo o decisión técnica.
```

---

# 7. Primera tarea recomendada para lanzar ya

Empezaría con esta, porque es pequeña, crítica y reduce riesgo de corrupción silenciosa:

```text
Implementa TASK-01: Eliminar non-null assertion en mapMatchedEvent.

Objetivo:
Reemplazar `payload.technique!` por validación explícita. Si `payload.technique` falta, lanzar un error descriptivo `TECHNIQUE_MISSING` usando el patrón de errores existente del proyecto.

Archivos probables:
- `lib/practice-engine/engine.ts`
- tests relacionados con practice engine o `__tests__/bug-fixes.test.ts`

Criterios de aceptación:
- No queda `payload.technique!`.
- Si `technique` falta, se lanza error descriptivo.
- Si `technique` existe, el comportamiento no cambia.
- Hay test de regresión para ambos casos.
- Tests relevantes pasan.

Restricciones:
- No crear fallback vacío de technique.
- No silenciar el error.
- No cambiar el shape del evento salvo necesidad justificada.
```

---

# 8. Resultado esperado tras completar las tareas críticas

Cuando se completen `TASK-01` a `TASK-07`, el producto habrá ganado solidez real:

* No habrá corrupción silenciosa de análisis técnico.
* No se podrán iniciar ejercicios inválidos.
* No se aceptarán notas fuera del modelo semántico soportado.
* La dificultad adaptativa funcionará realmente.
* La tolerancia no será injustamente estricta.
* Habrá tests de regresión para los tres gaps críticos principales.
* El motor estará más cerca de un producto fiable para sesiones reales de práctica.

Mi recomendación: **no empezar por AudioWorklet ni por mejoras avanzadas**. Primero cerrar `GAP-1`, `GAP-2` y `GAP-3`; esos son los puntos que más directamente afectan a estabilidad, justicia pedagógica y confianza en el motor.
