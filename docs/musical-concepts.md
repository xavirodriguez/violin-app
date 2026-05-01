# Glosario de Conceptos Musicales y Técnicos

Este documento define los términos clave utilizados en el código de **Violin Mentor** para facilitar el onboarding de desarrolladores que no tengan formación musical previa.

## Conceptos de Pitch y Afinación

### Scientific Pitch Notation (SPN)
Un método para nombrar notas musicales combinando una letra (A-G) con un número que indica la octava.
- **Ejemplo**: `A4` es el La central (440Hz).
- **En Violín**: Las cuerdas al aire son `G3`, `D4`, `A4` y `E5`.

### Cents (Centésimas)
Una unidad de medida logarítmica para intervalos musicales. Hay 100 cents en un semitono.
- **Uso en el código**: Se usa para medir la desviación de la afinación perfecta.
- **Tolerancia**: Generalmente, una nota se considera "afinada" si está dentro de ±25 cents del objetivo.

### Hz (Hertz)
La unidad de frecuencia que mide los ciclos por segundo de una onda sonora.
- **Uso en el código**: Entrada cruda de los detectores de pitch.

### Enharmonics (Enharmonía)
Notas que suenan igual pero tienen nombres diferentes.
- **Ejemplo**: `C#` (Do sostenido) y `Db` (Re bemol) son la misma nota física.
- **En el código**: La clase `MusicalNote` gestiona esta lógica para validar aciertos independientemente del nombre.

## Técnica del Violín

### Vibrato
Una oscilación controlada del pitch para añadir calidez y expresión.
- **Métricas**: Se mide por su velocidad (Hz) y su amplitud (cents).
- **Rango típico**: 4-7 Hz de velocidad y 10-35 cents de ancho.

### Wolf Tone
Una inestabilidad tonal producida por la resonancia del cuerpo del violín que "compite" con la nota tocada.
- **Detección**: El código lo identifica mediante el "beating" (modulación de amplitud) y una baja confianza en la detección de pitch.

### Intonation Drift
La tendencia de un músico a desafinarse gradualmente hacia arriba (sharp) o hacia abajo (flat) durante la ejecución de una nota larga.

### Onset / Offset
- **Onset**: El momento exacto en que comienza el sonido de una nota (el "ataque").
- **Offset**: El momento en que la nota deja de sonar o cambia.

## Procesamiento de Señal (DSP)

### Algoritmo YIN
El algoritmo principal de detección de pitch utilizado en el proyecto. Es más robusto que la FFT (Transformada Rápida de Fourier) para instrumentos monofónicos como el violín porque minimiza errores de octava.

### RMS (Root Mean Square)
Una medida de la potencia media de la señal de audio.
- **Uso en el código**: Se usa como un "noise gate" para decidir si hay suficiente volumen para intentar detectar una nota.

### Detrending
El proceso de eliminar la tendencia lineal de una serie de datos.
- **Uso**: Se usa antes de analizar el vibrato para que una nota que se está desafinando gradualmente no confunda al detector de oscilaciones.
