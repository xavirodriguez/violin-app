# Backlog SDD ordenado — Violin Practice Coach MVP

## Épica 1 — Afinador fiable

---

## 1. Especificar máquina de estados del afinador

**Objetivo**
Definir formalmente los estados del afinador para evitar estados inconsistentes al iniciar, detener o reiniciar audio.

**Contexto técnico**
Componentes y tipos relacionados:

* `TunerMode`
* `TunerStore`
* `TunerState`
* `PitchDetector`
* `AudioManager`

**Requisitos**

1. El afinador debe representar explícitamente estos estados de usuario:

   * sin permiso
   * inicializando
   * escuchando
   * señal débil
   * nota detectada
   * error
2. Cada estado debe tener un mensaje de usuario claro.
3. Las transiciones deben ser deterministas.
4. Una sesión antigua no debe poder sobrescribir una sesión nueva.
5. Detener el afinador debe liberar recursos de audio.

**Criterios de aceptación**

* Dado que el usuario no ha concedido permiso, se muestra “Activa el micrófono para empezar”.
* Dado que el audio está activo pero no hay señal suficiente, se muestra “Toca una cuerda”.
* Dado que la confianza es baja, se muestra “Señal débil”.
* Dado que se detecta una nota estable, se muestra nota, cents y dirección.
* Dado que ocurre un error de audio, se muestra un mensaje recuperable.
* Al llamar varias veces a iniciar/detener, no quedan loops de audio activos.

**Pruebas esperadas**

* Unit tests de transiciones de `TunerState`.
* Test de concurrencia: dos inicializaciones seguidas solo permiten actualizar a la última.
* Test de reset: `reset()` limpia estado, detector y recursos.

---

## 2. Implementar mensajes UX del afinador

**Objetivo**
Traducir datos técnicos de pitch a instrucciones comprensibles para principiantes.

**Requisitos**

1. No mostrar lenguaje técnico como mensaje principal.
2. El mensaje principal debe ser accionable.
3. La UI puede mostrar cents como dato secundario.
4. Para notas bajas usar mensajes como:

   * “Muy bajo. Sube un poco.”
   * “Un poco bajo.”
5. Para notas altas usar mensajes como:

   * “Un poco alto.”
   * “Muy alto. Baja un poco.”
6. Para nota afinada usar:

   * “Afinado.”

**Criterios de aceptación**

* Si `cents < -35`, el mensaje indica que está muy bajo.
* Si `-35 <= cents < -10`, el mensaje indica que está un poco bajo.
* Si `-10 <= cents <= 10`, el mensaje indica que está afinado.
* Si `10 < cents <= 35`, el mensaje indica que está un poco alto.
* Si `cents > 35`, el mensaje indica que está muy alto.
* El mensaje cambia en tiempo real sin parpadeos excesivos.

**Pruebas esperadas**

* Unit tests para función `getTunerFeedbackMessage(cents, confidence)`.
* Snapshot o component test de `TunerDisplay`.

---

## 3. Endurecer detección de cuerdas G3, D4, A4 y E5

**Objetivo**
Garantizar que el afinador reconoce las cuatro cuerdas al aire del violín de forma estable.

**Requisitos**

1. El sistema debe detectar:

   * G3
   * D4
   * A4
   * E5
2. Debe calcular desviación en cents.
3. Debe mapear frecuencia a nombre de nota.
4. Debe ignorar detecciones con confianza insuficiente.
5. Debe suavizar fluctuaciones pequeñas para evitar UI inestable.

**Criterios de aceptación**

* Una señal simulada de 196 Hz se identifica como G3.
* Una señal simulada de 293.66 Hz se identifica como D4.
* Una señal simulada de 440 Hz se identifica como A4.
* Una señal simulada de 659.25 Hz se identifica como E5.
* Una señal con confianza baja no cambia a estado `DETECTED`.
* La nota mostrada no cambia erráticamente con variaciones menores.

**Pruebas esperadas**

* Unit tests de frecuencia a nota.
* Tests de cents.
* Tests de threshold de confianza.
* Tests con valores cercanos a las cuatro cuerdas.

---

## 4. Manejar permiso denegado de micrófono

**Objetivo**
Evitar bloqueo del producto cuando el usuario niega el permiso de micrófono.

**Requisitos**

1. Si el permiso es denegado, el sistema debe entrar en estado recuperable.
2. La UI debe explicar cómo activar el micrófono.
3. Debe existir acción de reintentar.
4. No debe mostrarse una pantalla blanca.
5. El usuario debe poder navegar a secciones no dependientes de audio si existen.

**Criterios de aceptación**

* Dado permiso denegado, aparece mensaje claro.
* Dado clic en “Reintentar”, se vuelve a solicitar o reinicializar el flujo.
* El error queda representado como `AppError` o estructura equivalente.
* No se inicia `AudioManager` si no hay permiso.

**Pruebas esperadas**

* Mock de `getUserMedia` rechazado con `NotAllowedError`.
* Component test de estado de error.
* Test de retry.

---

## 5. Manejar señal débil y ruido de fondo

**Objetivo**
Hacer que el afinador sea confiable incluso cuando no pueda detectar una nota válida.

**Requisitos**

1. El sistema debe distinguir entre:

   * sin señal
   * señal débil
   * señal ruidosa
   * pitch válido
2. La UI debe guiar al usuario.
3. El afinador no debe mostrar notas falsas ante ruido.
4. La señal débil no debe contarse como error fatal.

**Criterios de aceptación**

* Si no hay input relevante, se muestra “Toca una cuerda”.
* Si hay baja confianza, se muestra “Toca un poco más fuerte o acércate al micrófono”.
* Si hay ruido alto, se muestra “Hay ruido de fondo. La detección puede fallar”.
* El sistema vuelve automáticamente a nota detectada cuando mejora la señal.

**Pruebas esperadas**

* Tests con pitch `undefined`.
* Tests con confianza baja.
* Tests con fluctuación alta de frecuencia.
* Tests de recuperación a estado detectado.

---

## Épica 2 — Onboarding con calibración

---

## 6. Rediseñar `OnboardingFlow` como activación guiada

**Objetivo**
Convertir el onboarding en una experiencia de activación, no en una pantalla informativa.

**Requisitos**

1. El onboarding debe tener pasos explícitos:

   * bienvenida
   * permiso de micrófono
   * test de ruido
   * calibración con A4
   * primer objetivo
2. Cada paso debe tener un único CTA principal.
3. El usuario debe tocar al menos una nota antes de entrar a práctica.
4. El flujo debe poder completarse en menos de 2 minutos.
5. El onboarding debe guardar estado completado.

**Criterios de aceptación**

* Primer paso muestra: “Vamos a preparar el micrófono y afinar tu violín. Tardarás menos de un minuto.”
* El permiso de micrófono se solicita antes del test de ruido.
* El test de ruido dura entre 2 y 3 segundos.
* La calibración solicita “Toca la cuerda A al aire”.
* Al completar, se dirige al primer ejercicio guiado.

**Pruebas esperadas**

* Component tests de cada paso.
* Test de navegación entre pasos.
* Test de persistencia de onboarding completado.

---

## 7. Implementar test de ruido ambiental

**Objetivo**
Medir si el entorno del usuario permite una detección aceptable.

**Requisitos**

1. Medir input durante 2-3 segundos.
2. Clasificar resultado:

   * ruido aceptable
   * ruido alto
   * sin entrada
   * micrófono saturado
3. Guardar `noiseFloor` en calibración local.
4. Mostrar recomendación clara.
5. Permitir continuar aunque haya ruido alto.

**Criterios de aceptación**

* Si el nivel ambiental es bajo, se muestra “El entorno está bien para practicar.”
* Si el ruido es alto, se muestra advertencia no bloqueante.
* Si no hay entrada, se muestra instrucción para revisar micrófono.
* Si hay saturación, se recomienda bajar sensibilidad o alejarse.
* El resultado queda disponible para ajustar sensibilidad.

**Pruebas esperadas**

* Unit tests de clasificación de ruido.
* Mock de muestras de audio silenciosas, normales, ruidosas y saturadas.
* Test de UI para cada resultado.

---

## 8. Implementar calibración con cuerda A4

**Objetivo**
Confirmar que el sistema escucha el violín antes de empezar práctica.

**Requisitos**

1. Pedir al usuario tocar A4 al aire.
2. Validar frecuencia cercana a 440 Hz.
3. Validar confianza mínima.
4. Validar duración estable mínima.
5. Validar volumen suficiente.
6. Permitir repetir calibración.
7. Permitir continuar en modo básico si falla.

**Criterios de aceptación**

* A4 estable durante el umbral definido marca calibración exitosa.
* Una nota distinta muestra “No parece una cuerda A. Intenta de nuevo.”
* Señal débil muestra instrucción de volumen o distancia.
* El usuario puede repetir calibración.
* El usuario puede continuar sin calibración completa, pero con advertencia.

**Pruebas esperadas**

* Tests con A4 válido.
* Tests con D4, G3 y E5 como notas incorrectas.
* Tests de estabilidad temporal.
* Tests de fallback.

---

## 9. Persistir resultado de onboarding y calibración

**Objetivo**
Recordar que el usuario ya completó la preparación inicial.

**Requisitos**

1. Guardar:

   * `onboarding.completed`
   * `completedAt`
   * `noiseFloor`
   * `sensitivity`
   * `lastCalibratedAt`
   * `inputDeviceId`, si aplica
2. Usar esquema versionado.
3. Validar datos al cargar.
4. Recuperar si el estado está corrupto.
5. No guardar audio crudo.

**Criterios de aceptación**

* Recargar la página no reinicia onboarding si ya fue completado.
* Si el storage está corrupto, se reinicia solo la parte inválida.
* La práctica puede arrancar aunque falte calibración previa.
* No se almacena ningún buffer de audio.

**Pruebas esperadas**

* Unit tests de serialización.
* Unit tests de migración.
* Tests de corrupción de storage.
* Test de ausencia de `localStorage`.

---

## Épica 3 — Primer ejercicio guiado

---

## 10. Definir ejercicio obligatorio inicial `open_a_hold`

**Objetivo**
Crear el primer ejercicio guiado del MVP.

**Requisitos**

1. El ejercicio debe usar solo A4.
2. Debe tener entre 4 y 8 notas o eventos.
3. Debe durar entre 30 y 60 segundos.
4. Debe tener `ExerciseData` completo.
5. Debe generar MusicXML válido.
6. Debe tener dificultad beginner.
7. Debe tener objetivo técnico único: sostener cuerda A afinada.

**Criterios de aceptación**

* El ejercicio aparece en `allExercises`.
* El ejercicio renderiza partitura sin error.
* El nombre es claro, por ejemplo “Open A: mantener 4 tiempos”.
* La nota objetivo es A4.
* La tolerancia recomendada es adecuada para principiante.

**Pruebas esperadas**

* Test de estructura `ExerciseData`.
* Test de `generateMusicXML`.
* Test de render con `SheetMusicView`.

---

## 11. Forzar primer flujo: calibrar → afinar A → practicar Open A

**Objetivo**
Evitar que el usuario nuevo caiga directamente en una biblioteca con demasiadas opciones.

**Requisitos**

1. Si el usuario no ha completado onboarding, inicia onboarding.
2. Después de calibrar, va a afinador o validación de A.
3. Después de afinar A, inicia `open_a_hold`.
4. La biblioteca queda como acceso secundario.
5. El CTA principal debe ser “Empezar primer ejercicio”.

**Criterios de aceptación**

* Usuario nuevo no ve primero dashboard ni biblioteca completa.
* Usuario nuevo completa un flujo guiado.
* Al terminar onboarding, el ejercicio seleccionado es Open A.
* Existe forma de salir del flujo, pero no es el CTA principal.

**Pruebas esperadas**

* Integration test de primera sesión.
* Test de routing o estado inicial.
* Test de CTA principal.

---

## Épica 4 — Motor de práctica nota a nota

---

## 12. Especificar máquina de estados de práctica

**Objetivo**
Unificar la sesión de práctica en estados simples y verificables.

**Requisitos**

1. La práctica debe soportar estos estados:

   * seleccionado
   * escuchando
   * nota correcta
   * nota incorrecta
   * pausado
   * completado
   * error
2. Cada estado debe tener transiciones explícitas.
3. Una sesión debe tener `startedAt`, `endedAt`, `exerciseId`, intentos y resultado.
4. La sesión solo cuenta como válida si hubo feedback de pitch.

**Criterios de aceptación**

* No se puede completar una sesión sin ejercicio.
* No se puede avanzar nota si el audio no está activo.
* Pausar conserva progreso.
* Reiniciar borra progreso de la sesión actual.
* Completar genera resumen.

**Pruebas esperadas**

* Unit tests de estado.
* Integration test de sesión completa.
* Test de pausa y reinicio.

---

## 13. Implementar avance por nota mantenida

**Objetivo**
Avanzar el ejercicio solo cuando el usuario mantenga la nota correcta durante el tiempo requerido.

**Requisitos**

1. Comparar nota detectada contra nota objetivo.
2. Verificar tolerancia en cents.
3. Verificar duración mínima de hold.
4. No penalizar cuando la confianza sea baja.
5. Reiniciar hold si la nota es incorrecta.
6. Avanzar al siguiente índice cuando se cumpla el hold.

**Criterios de aceptación**

* Si A4 está dentro de tolerancia durante el tiempo requerido, avanza.
* Si A4 sale de tolerancia, el hold se reinicia.
* Si la confianza es baja, el hold no avanza ni penaliza.
* Al llegar a la última nota, la sesión pasa a completado.

**Pruebas esperadas**

* Unit tests de `holdDuration`.
* Tests de tolerancia.
* Tests de confianza baja.
* Test de finalización.

---

## 14. Conectar `PracticeFeedback` con nota objetivo y detección real

**Objetivo**
Mostrar feedback inmediato y pedagógico durante la práctica.

**Requisitos**

1. `PracticeFeedback` debe recibir:

   * `targetNote`
   * `detectedPitchName`
   * `centsOff`
   * `status`
   * `centsTolerance`
   * `holdDuration`
   * `requiredHoldTime`
2. El mensaje principal debe ser comprensible.
3. Debe distinguir cuerda al aire de nota digitada.
4. Debe explicar nota equivocada.
5. Debe mostrar progreso de hold.

**Criterios de aceptación**

* Si la nota está afinada, muestra “Bien. Mantén la nota.”
* Si cuerda al aire está baja, muestra “Un poco bajo. Ajusta la clavija o microafinador hacia arriba.”
* Si cuerda al aire está alta, muestra “Un poco alto. Afloja un poco.”
* Si nota digitada está baja, muestra “Un poco bajo. Sube ligeramente el dedo.”
* Si nota digitada está alta, muestra “Un poco alto. Baja ligeramente el dedo.”
* Si toca otra nota, muestra “Estás tocando D. La nota objetivo es A.”

**Pruebas esperadas**

* Unit tests de mensajes.
* Component tests de `PracticeFeedback`.
* Tests para cuerda al aire vs nota digitada.

---

## 15. Implementar controles mínimos de práctica

**Objetivo**
Permitir controlar la sesión sin complejidad innecesaria.

**Requisitos**

1. Deben existir acciones:

   * iniciar
   * pausar
   * reiniciar
   * finalizar
2. Los botones deben estar habilitados según estado.
3. El progreso debe mostrar nota actual y total.
4. Reiniciar debe confirmar si hay progreso significativo.
5. Finalizar manualmente debe marcar sesión incompleta si aplica.

**Criterios de aceptación**

* Antes de iniciar, solo está activo “Empezar”.
* Durante sesión, están activos “Pausar” y “Reiniciar”.
* En pausa, está activo “Continuar”.
* Al completar, aparece resumen.
* Reiniciar vuelve a nota 1.

**Pruebas esperadas**

* Component tests de `PracticeControls`.
* Integration test iniciar → pausar → continuar → completar.
* Test de sesión incompleta.

---

## Épica 5 — Partitura simple

---

## 16. Garantizar render fiable de partitura con `SheetMusicContainer`

**Objetivo**
Asegurar que los ejercicios MVP renderizan correctamente en OSMD.

**Requisitos**

1. `SheetMusicContainer` debe recibir MusicXML válido.
2. Debe mostrar fallback si OSMD falla.
3. Debe soportar vista `focused` como default.
4. Debe evitar bloquear la práctica si falla la partitura.
5. Debe mostrar claramente la nota actual aunque falle el resaltado visual.

**Criterios de aceptación**

* El primer ejercicio renderiza sin error.
* Si OSMD falla, aparece mensaje y nota objetivo textual.
* La práctica puede continuar sin partitura visual.
* Mobile no rompe el layout horizontalmente.
* La vista focused es el default del MVP.

**Pruebas esperadas**

* Component test con MusicXML válido.
* Component test con MusicXML inválido.
* Visual/mobile smoke test.
* Test de fallback.

---

## 17. Resaltar o mostrar la nota actual

**Objetivo**
Que el usuario sepa qué debe tocar en cada momento.

**Requisitos**

1. Si el resaltado en partitura está disponible, usarlo.
2. Si no está disponible, mostrar nota objetivo como texto grande.
3. La nota actual debe actualizarse al avanzar.
4. Debe mostrarse índice actual / total.
5. La UI no debe depender exclusivamente de OSMD.

**Criterios de aceptación**

* En nota 1 de 4 se muestra `1/4`.
* Al avanzar, se muestra `2/4`.
* La nota objetivo aparece siempre visible.
* Si falla la anotación en OSMD, la práctica sigue siendo usable.

**Pruebas esperadas**

* Tests de `currentNoteIndex`.
* Component test de fallback textual.
* Integration test de avance visual.

---

## Épica 6 — Catálogo MVP de ejercicios

---

## 18. Crear bloque A: cuerdas al aire

**Objetivo**
Implementar los primeros 8 ejercicios progresivos.

**Ejercicios**

1. Open A: mantener 4 tiempos.
2. Open D: mantener 4 tiempos.
3. Open G: mantener 4 tiempos.
4. Open E: mantener 4 tiempos.
5. A-D alternadas.
6. D-G alternadas.
7. A-E alternadas.
8. G-D-A-E secuencia lenta.

**Requisitos**

1. Cada ejercicio debe tener `ExerciseData`.
2. Cada ejercicio debe tener entre 4 y 12 notas.
3. Cada ejercicio debe tener una habilidad principal.
4. Cada ejercicio debe tener MusicXML válido.
5. Todos deben ser `Beginner`.
6. No deben incluir ritmos complejos.

**Criterios de aceptación**

* Los 8 ejercicios aparecen en biblioteca.
* Todos renderizan sin error.
* La progresión es gradual.
* Cada ejercicio tiene descripción pedagógica clara.
* Cada ejercicio tiene duración estimada entre 30 y 90 segundos.

**Pruebas esperadas**

* Test de cantidad de ejercicios.
* Test de metadata obligatoria.
* Test de MusicXML para cada ejercicio.
* Test de orden pedagógico.

---

## 19. Crear bloque B: ritmo simple con cuerdas al aire

**Objetivo**
Añadir ejercicios de ritmo básico sin introducir digitación.

**Ejercicios**

9. A en negras.
10. D en negras.
11. A-D en negras.
12. G-D-A en negras.
13. E-A-E con pausas.
14. Cuerdas al aire con blancas y negras.

**Requisitos**

1. Usar solo cuerdas al aire.
2. Introducir negras, blancas y pausas simples.
3. Mantener detección fiable.
4. No mezclar demasiadas habilidades.
5. Mantener duración corta.

**Criterios de aceptación**

* Los ejercicios 9-14 renderizan.
* El ritmo es legible en mobile.
* La práctica puede avanzar nota a nota.
* La metadata identifica objetivo rítmico.
* No hay slurs ni dobles cuerdas.

**Pruebas esperadas**

* Tests de MusicXML.
* Tests de notas esperadas.
* Tests de duración y dificultad.

---

## 20. Crear bloque C: primer dedo

**Objetivo**
Introducir digitación básica sin complejidad excesiva.

**Ejercicios**

15. A-B en cuerda A.
16. D-E en cuerda D.
17. G-A en cuerda G.
18. E-F# en cuerda E.
19. A-B-A patrón lento.
20. D-E-D patrón lento.

**Requisitos**

1. Cada ejercicio debe introducir una sola relación de dedo.
2. El feedback debe usar mensajes de dedo, no clavija, para notas digitadas.
3. La tolerancia inicial recomendada debe ser ±30 cents.
4. No usar ritmos complejos.
5. No usar más de 12 notas.

**Criterios de aceptación**

* Los ejercicios aparecen después de cuerdas al aire.
* Cada ejercicio tiene `technicalGoals`.
* Cada ejercicio identifica cuerda y patrón.
* La práctica diferencia cuerda al aire de nota digitada.
* El feedback recomienda mover el dedo cuando corresponde.

**Pruebas esperadas**

* Tests de metadata.
* Tests de target notes.
* Tests de feedback para digitación.

---

## 21. Crear bloque D: segundo dedo básico

**Objetivo**
Introducir patrones 0-1-2 de forma progresiva.

**Ejercicios**

21. A-B-C# en cuerda A.
22. D-E-F# en cuerda D.
23. G-A-B en cuerda G.
24. E-F#-G# en cuerda E.
25. Patrón 0-1-2-1-0 en A.
26. Patrón 0-1-2-1-0 en D.

**Requisitos**

1. Usar solo patrones mayores simples.
2. Mantener tolerancia principiante.
3. No introducir tercer dedo.
4. No introducir cambio de posición.
5. Cada ejercicio debe tener una explicación breve.

**Criterios de aceptación**

* Los ejercicios 21-26 renderizan.
* Cada ejercicio tiene progresión 0-1-2 clara.
* El usuario no necesita conocimiento teórico avanzado.
* La detección nota a nota funciona.

**Pruebas esperadas**

* Tests de notas.
* Tests de orden curricular.
* Tests de MusicXML.

---

## 22. Crear bloque E: mini escalas y melodías

**Objetivo**
Cerrar el currículo MVP con ejercicios más musicales.

**Ejercicios**

27. Mini escala en D mayor: D-E-F#-G.
28. Mini escala en A mayor: A-B-C#-D.
29. Melodía simple 1 usando A-B-C#.
30. Melodía simple 2 usando D-E-F#-G.

**Requisitos**

1. Mantener ejercicios cortos.
2. No superar 12 notas.
3. Usar solo habilidades ya introducidas.
4. Dar sensación musical.
5. No añadir ritmos avanzados.

**Criterios de aceptación**

* Los 30 ejercicios están disponibles.
* La progresión completa no tiene saltos bruscos.
* Las melodías usan solo notas ya practicadas.
* Todos los ejercicios tienen MusicXML válido.
* El currículo completo puede recorrerse en orden.

**Pruebas esperadas**

* Test de catálogo completo.
* Test de orden por dificultad.
* Test de validación de notas permitidas.
* Test de render de todos los ejercicios.

---

## Épica 7 — Resumen de sesión

---

## 23. Definir modelo de resumen de sesión

**Objetivo**
Estandarizar los datos mínimos que se guardan al terminar una práctica.

**Requisitos**

1. El resumen debe incluir:

   * ejercicio completado
   * duración
   * precisión general
   * mejor nota
   * nota a mejorar
   * racha actual
   * siguiente ejercicio recomendado
2. Debe distinguir sesión completada de sesión abandonada.
3. Debe indicar si hubo pitch feedback válido.
4. No debe guardar audio crudo.
5. Debe guardar métricas derivadas por nota.

**Criterios de aceptación**

* Una sesión completada genera `PracticeSessionSummary`.
* Una sesión sin feedback válido no cuenta para North Star.
* La duración se calcula correctamente.
* La precisión se calcula desde intentos reales.
* El resumen puede renderizarse sin datos opcionales.

**Pruebas esperadas**

* Unit tests de cálculo de accuracy.
* Unit tests de mejor y peor nota.
* Test de sesión inválida.
* Test de serialización.

---

## 24. Implementar `PracticeCompletion` MVP

**Objetivo**
Mostrar un cierre positivo y accionable tras cada sesión.

**Requisitos**

1. Mostrar:

   * nombre del ejercicio
   * precisión
   * tiempo practicado
   * mejor nota
   * nota a mejorar
   * racha
   * siguiente recomendado
2. Incluir CTA:

   * repetir
   * continuar
3. Evitar gráficos densos.
4. Evitar lenguaje punitivo.
5. El resumen debe aparecer siempre al completar.

**Criterios de aceptación**

* Al completar Open A aparece resumen.
* El usuario ve precisión y tiempo.
* El usuario recibe una recomendación.
* El usuario puede repetir con un clic.
* El usuario puede continuar con el siguiente ejercicio.

**Pruebas esperadas**

* Component test con sesión completa.
* Component test con datos parciales.
* Integration test práctica → resumen.

---

## Épica 8 — Recomendador

---

## 25. Especificar reglas MVP de recomendación

**Objetivo**
Formalizar la lógica de `getRecommendedExercise` para que sea predecible y pedagógica.

**Requisitos**

1. Si `accuracy < 70%`, recomendar repetir.
2. Si `70% <= accuracy < 85%`, recomendar repetir o similar.
3. Si `accuracy >= 85%`, recomendar siguiente.
4. Si hay 3 días sin practicar, recomendar repaso.
5. Si hay problema en cuerda concreta, recomendar ejercicio de esa cuerda.
6. No recomendar saltos bruscos de dificultad.
7. Si el catálogo está vacío, devolver `undefined`.

**Criterios de aceptación**

* Una sesión de 60% recomienda repetir.
* Una sesión de 90% recomienda avanzar.
* Un usuario inactivo 3 días recibe repaso.
* Un problema recurrente en D recomienda ejercicio de D.
* Siempre hay explicación textual si existe recomendación.

**Pruebas esperadas**

* Unit tests de cada regla.
* Test de catálogo vacío.
* Test de progresión sin saltos.
* Test de explicación de recomendación.

---

## 26. Integrar recomendación en home de práctica

**Objetivo**
Hacer que la pantalla principal responda “qué hago ahora”.

**Requisitos**

1. La sección principal debe mostrar el ejercicio recomendado.
2. El CTA principal debe ser “Continuar con ejercicio recomendado”.
3. La biblioteca debe ser acceso secundario.
4. La recomendación debe incluir explicación breve.
5. Si no hay progreso, recomendar primer ejercicio.

**Criterios de aceptación**

* Usuario nuevo ve Open A como recomendado.
* Usuario que acaba de completar Open A ve Open D o A-D según reglas.
* Usuario con baja precisión ve repetir.
* El CTA inicia directamente la práctica.

**Pruebas esperadas**

* Component test de home de práctica.
* Integration test resumen → nueva recomendación.
* Test sin historial.

---

## Épica 9 — Progreso semanal y racha

---

## 27. Implementar cálculo de racha

**Objetivo**
Crear hábito sin depender de cuenta de usuario ni backend.

**Requisitos**

1. Contar días con sesiones válidas.
2. Una sesión válida requiere pitch feedback.
3. Usar fechas locales.
4. No contar múltiples sesiones del mismo día como días extra.
5. Romper racha si pasa un día completo sin práctica.
6. Soportar zona horaria local.

**Criterios de aceptación**

* Practicar hoy inicia racha de 1.
* Practicar mañana aumenta a 2.
* Saltarse un día rompe la racha.
* Dos sesiones en un día mantienen la misma racha.
* Sesión inválida no cuenta.

**Pruebas esperadas**

* Unit tests con fechas.
* Tests de cambio de día.
* Tests de sesiones inválidas.

---

## 28. Implementar progreso semanal MVP

**Objetivo**
Mostrar progreso simple y útil.

**Requisitos**

1. Mostrar:

   * minutos practicados esta semana
   * días practicados esta semana
   * racha actual
   * ejercicios completados
   * precisión promedio reciente
   * siguiente ejercicio recomendado
2. No mostrar heatmaps en MVP.
3. No mostrar analytics avanzados por defecto.
4. Actualizar después de cada sesión.
5. Funcionar sin login.

**Criterios de aceptación**

* Después de una sesión, suben minutos semanales.
* Ejercicios completados se actualiza.
* Precisión reciente se recalcula.
* La racha visible coincide con el cálculo.
* Al recargar, los datos se mantienen.

**Pruebas esperadas**

* Unit tests de agregación semanal.
* Component test de dashboard reducido.
* Integration test sesión → dashboard.

---

## Épica 10 — Persistencia local robusta

---

## 29. Definir `LocalMvpState` versionado

**Objetivo**
Unificar el estado persistido del MVP.

**Especificación base**

```ts
type LocalMvpState = {
  version: number;
  onboarding: {
    completed: boolean;
    completedAt?: number;
    calibration?: {
      inputDeviceId?: string;
      noiseFloor?: number;
      sensitivity?: number;
      lastCalibratedAt: number;
    };
  };
  progress: {
    currentStreak: number;
    lastPracticeDate?: string;
    weeklyPracticeMs: Record<string, number>;
    completedExerciseIds: string[];
    exerciseStats: Record<string, ExerciseProgress>;
    lastRecommendedExerciseId?: string;
  };
  sessions: PracticeSessionSummary[];
  settings: {
    centsTolerance: number;
    autoStart: boolean;
    sheetMusicView: 'focused' | 'full';
  };
};
```

**Requisitos**

1. Todo estado persistido debe tener `version`.
2. Validar al cargar.
3. Migrar versiones antiguas.
4. Recuperar ante corrupción.
5. Mantener backup anterior.
6. No guardar audio.
7. Limitar historial si se usa `localStorage`.

**Criterios de aceptación**

* Recargar página mantiene progreso.
* Cerrar navegador mantiene progreso.
* Estado corrupto no causa pantalla blanca.
* Storage no disponible no bloquea práctica.
* Hay backup recuperable.

**Pruebas esperadas**

* Tests de schema.
* Tests de migración.
* Tests de corrupción.
* Tests sin storage.

---

## 30. Implementar reset manual de datos

**Objetivo**
Permitir al usuario limpiar progreso local.

**Requisitos**

1. Debe existir acción “Resetear progreso”.
2. Debe requerir confirmación.
3. Debe borrar onboarding, progreso, sesiones y settings opcionalmente.
4. Debe reiniciar la app a estado inicial.
5. No debe romper audio ni UI.

**Criterios de aceptación**

* El usuario puede resetear todos sus datos.
* Después del reset, vuelve onboarding.
* No quedan sesiones antiguas.
* No hay errores en consola.
* La acción es reversible solo si existe backup.

**Pruebas esperadas**

* Unit test de clear state.
* Component test de confirmación.
* Integration test reset → onboarding.

---

## Épica 11 — Compartir logro / export

---

## 31. Implementar imagen básica de logro

**Objetivo**
Permitir compartir un resultado emocional y simple.

**Requisitos**

1. La imagen debe incluir:

   * nombre del ejercicio
   * precisión
   * tiempo practicado
   * racha
   * estrellas
   * branding
2. Debe generarse desde `PracticeSessionSummary`.
3. No debe depender de backend.
4. Debe tener fallback si falla canvas/export.
5. Debe aparecer tras completar sesión.

**Criterios de aceptación**

* Desde resumen se puede generar imagen.
* La imagen contiene datos correctos.
* La descarga o compartir funciona en desktop.
* En mobile se usa Web Share API si está disponible.
* Si falla, se muestra error recuperable.

**Pruebas esperadas**

* Unit test de mapping sesión → imagen.
* Component test de CTA.
* Browser smoke test.

---

## 32. Implementar export CSV básico

**Objetivo**
Permitir exportar progreso de manera funcional.

**Columnas**

* `date`
* `exercise_id`
* `exercise_name`
* `duration_seconds`
* `accuracy`
* `avg_cents`
* `completed`
* `best_note`
* `weakest_note`

**Requisitos**

1. Exportar desde sesiones locales.
2. No incluir audio.
3. Escapar correctamente valores CSV.
4. Descargar archivo local.
5. Funcionar aunque no haya sesiones.

**Criterios de aceptación**

* CSV contiene una fila por sesión.
* Los headers son correctos.
* Sesiones vacías generan CSV con headers.
* Los valores son consistentes con resumen.
* El archivo se descarga correctamente.

**Pruebas esperadas**

* Unit test de generación CSV.
* Test de escaping.
* Test sin sesiones.

---

## Épica 12 — Mobile, errores y beta

---

## 33. Pulir responsive mobile del flujo principal

**Objetivo**
Asegurar que el MVP funciona en móvil.

**Requisitos**

1. El onboarding debe ser usable en pantalla pequeña.
2. El afinador debe mostrar mensaje principal visible.
3. La práctica debe priorizar:

   * nota objetivo
   * feedback
   * controles
   * partitura
4. La partitura no debe romper layout.
5. Los botones deben tener tamaño táctil adecuado.

**Criterios de aceptación**

* El flujo completo funciona en mobile viewport.
* No hay scroll horizontal inesperado.
* Los CTAs principales son visibles.
* La partitura tiene fallback si no cabe.
* Los controles son tocables.

**Pruebas esperadas**

* Visual tests mobile.
* Manual QA en Safari mobile y Chrome mobile.
* Test de layout básico.

---

## 34. Añadir empty states y error states MVP

**Objetivo**
Evitar pantallas vacías o bloqueadas.

**Requisitos**

1. Empty state sin ejercicios.
2. Error state de audio.
3. Error state de MusicXML.
4. Error state de storage.
5. Error state de recomendación no disponible.
6. Cada error debe tener recuperación o explicación.

**Criterios de aceptación**

* Si no hay ejercicios, se muestra mensaje útil.
* Si falla audio, se puede reintentar.
* Si falla partitura, se muestra nota textual.
* Si falla storage, se puede practicar sin persistencia.
* Si no hay recomendación, se ofrece biblioteca o primer ejercicio.

**Pruebas esperadas**

* Component tests por error.
* Integration test de fallback de MusicXML.
* Test de storage fallido.

---

## 35. Instrumentar métricas MVP locales

**Objetivo**
Medir si el MVP cumple la hipótesis sin añadir backend obligatorio.

**North Star**

`Completed Practice Sessions with Valid Pitch Feedback`

**Requisitos**

1. Registrar eventos locales:

   * onboarding started
   * onboarding completed
   * microphone granted
   * microphone denied
   * first exercise started
   * exercise completed
   * valid pitch feedback received
   * recommendation accepted
2. Calcular métricas:

   * onboarding completion
   * first exercise completion
   * valid pitch feedback rate
   * exercise completion rate
   * sessions per user per week
3. No guardar audio.
4. No bloquear producto si analytics falla.

**Criterios de aceptación**

* Una sesión cuenta para North Star solo si hubo micrófono activo, detección válida, práctica y resumen.
* Eventos se registran localmente.
* Analytics no afecta práctica.
* Las métricas pueden consultarse en desarrollo.

**Pruebas esperadas**

* Unit tests de eventos.
* Test de sesión válida vs inválida.
* Test de fallo silencioso de analytics.

---

## 36. Ejecutar QA de flujo completo MVP

**Objetivo**
Verificar que el producto demuestra el loop principal.

**Flujo obligatorio**

1. Usuario entra.
2. Ve promesa clara.
3. Permite micrófono.
4. Hace test de ruido.
5. Calibra con A4.
6. Afina A.
7. Hace Open A.
8. Recibe feedback inmediato.
9. Completa sesión.
10. Ve resumen.
11. Recibe recomendación.
12. Recarga página.
13. Conserva progreso.

**Criterios de aceptación**

* El flujo completo funciona sin intervención técnica.
* No hay pantalla blanca.
* No se pierde progreso al recargar.
* El usuario sabe qué hacer después.
* El sistema maneja fallo de audio.
* El sistema maneja fallo de partitura.
* El MVP puede usarse durante una semana con progreso local.

**Pruebas esperadas**

* E2E test del flujo completo.
* QA manual en Chrome desktop.
* QA manual en Safari mobile.
* QA manual en Chrome mobile.
* Test con permiso denegado.
* Test con storage corrupto.

---

# Orden diario recomendado para una IA

## Día 1

Especificar e implementar máquina de estados del afinador.

## Día 2

Implementar mensajes UX del afinador.

## Día 3

Endurecer detección de G3, D4, A4 y E5.

## Día 4

Manejar permiso denegado, señal débil y ruido.

## Día 5

Rediseñar `OnboardingFlow` como flujo de activación.

## Día 6

Implementar test de ruido ambiental.

## Día 7

Implementar calibración con A4.

## Día 8

Persistir onboarding y calibración.

## Día 9

Crear primer ejercicio obligatorio `open_a_hold`.

## Día 10

Forzar flujo inicial calibrar → afinar → practicar Open A.

## Día 11

Especificar máquina de estados de práctica.

## Día 12

Implementar avance por nota mantenida.

## Día 13

Conectar `PracticeFeedback` con detección real.

## Día 14

Implementar controles mínimos de práctica.

## Día 15

Garantizar render fiable de partitura.

## Día 16

Mostrar o resaltar nota actual.

## Día 17

Crear bloque A de ejercicios.

## Día 18

Crear bloque B de ejercicios.

## Día 19

Crear bloque C de ejercicios.

## Día 20

Crear bloque D de ejercicios.

## Día 21

Crear bloque E de ejercicios.

## Día 22

Definir modelo de resumen de sesión.

## Día 23

Implementar `PracticeCompletion` MVP.

## Día 24

Especificar reglas de recomendación.

## Día 25

Integrar recomendación en home de práctica.

## Día 26

Implementar racha.

## Día 27

Implementar progreso semanal.

## Día 28

Definir e implementar `LocalMvpState` versionado.

## Día 29

Implementar reset manual de datos.

## Día 30

Implementar compartir logro como imagen.

## Día 31

Implementar export CSV básico.

## Día 32

Pulir responsive mobile.

## Día 33

Añadir empty states y error states.

## Día 34

Instrumentar métricas MVP locales.

## Día 35

Ejecutar QA end-to-end del MVP.

---

# Regla operativa para cada tarea diaria

Cada tarea que resuelva una IA debe terminar con este checklist:

```md
## Resultado

- [ ] Implementación completada
- [ ] Tests añadidos o actualizados
- [ ] Estados de error cubiertos
- [ ] No se añadió alcance fuera del MVP
- [ ] No se guardó audio crudo
- [ ] Funciona sin backend
- [ ] La UX usa lenguaje comprensible para principiantes

## Evidencia

- Archivos modificados:
- Tests ejecutados:
- Casos cubiertos:
- Riesgos pendientes:
```

---

# Prioridad real de ejecución

El orden crítico es este:

1. Afinador fiable.
2. Onboarding con calibración.
3. Primer ejercicio guiado.
4. Motor de práctica nota a nota.
5. Feedback inmediato.
6. Resumen de sesión.
7. Persistencia local.
8. Racha y progreso semanal.
9. Catálogo completo.
10. Recomendador.
11. Compartir/export.
12. Polish mobile y beta.

La IA no debería empezar con dashboard, logros, analytics avanzado o catálogo completo antes de cerrar el primer loop funcional: **escuchar → practicar → recibir feedback → terminar → saber qué hacer después**.
