# 🤖 Prompts Específicos para Agente IA de Feature Flags

Aquí encontrarás prompts listos para usar con Claude u otro agente IA generativa. Adapta según tus necesidades específicas.

---

## 1️⃣ Detección Inicial de Features

### Prompt Base

```
Actúa como experto en feature flags y arquitectura TypeScript.

Tu objetivo es analizar mi proyecto y detectar TODAS las funcionalidades
experimentales, nuevas o bajo desarrollo.

[INCLUIR CONTENIDO DE feature-flags-agent-prompt.md]

Mi proyecto está en: [TU_DIRECTORIO]
He incluido [CANTIDAD] archivos TypeScript/React.

Analiza el código y proporciona:
1. JSON con todos los features detectados
2. Archivo .env mejorado
3. Advertencias y riesgos
4. Recomendaciones de arquitectura

Sé exhaustivo, no omitas features pequeños.
```

### Variante: Análisis de Carpeta Específica

```
Analiza únicamente la carpeta src/components/ en busca de:
- Componentes condicionados
- Features en desarrollo
- Funcionalidades experimentales
- APIs nuevas o modificadas

Proporciona un reporte JSON con ubicaciones exactas.
```

### Variante: Migración de Sistema Existente

```
Tengo un sistema de feature flags existente que usa [SISTEMA_ACTUAL].
Necesito migrar a un nuevo sistema basado en variables de entorno.

Analiza:
1. Flags actuales en el código
2. Cómo están implementados
3. Equivalente en nuevo sistema
4. Plan de migración paso a paso

[PEGAR CÓDIGO ACTUAL DE FEATURE FLAGS]
```

---

## 2️⃣ Análisis Específico de Riesgos

### Prompt: Features Críticas

```
Enfócate SOLO en features que:
- Afectan múltiples usuarios
- Tienen impacto en seguridad
- Son críticos para el negocio
- Tienen alto riesgo de regresión

Para cada uno detectado, identifica:
1. Riesgo específico
2. Plan de rollback
3. Puntos de prueba críticos
4. Métricas de monitoreo
```

### Prompt: Dependencias Entre Features

```
Analiza las relaciones entre features en mi proyecto:
1. ¿Cuáles features requieren otras features?
2. ¿Hay conflictos potenciales?
3. ¿El orden de activación importa?
4. ¿Hay dependencias circulares?

Proporciona un diagrama de dependencias y matriz de conflictos.
```

### Prompt: Features Abandonados

```
Encuentra features que:
- Están deshabilitadas en .env
- No se mencionan en la documentación
- Aparentemente no se usan
- Son candidatos para removal

Para cada uno, sugiere si debería:
- Ser eliminado
- Ser documentado
- Ser completado
- Ser deprecado
```

---

## 3️⃣ Generación de Documentación

### Prompt: Feature Catalog

```
Basándote en los features detectados, crea un catálogo completo con:

1. Nombre y descripción corta
2. Tipo (UI, API, Algoritmo, etc.)
3. Estado (Alpha, Beta, Stable, Deprecated)
4. Ubicación en código
5. Impacto en usuarios
6. Cómo habilitarlo
7. Cómo probarlo
8. Casos de uso

Formato: Markdown con tabla de contenidos y ejemplos de código.
```

### Prompt: Guía de Migración

```
Crea una guía paso-a-paso para migrar del sistema actual al nuevo:

1. Pre-requisitos y checklist
2. Pasos de implementación en orden
3. Comandos exactos a ejecutar
4. Cómo verificar cada paso
5. Qué hacer si falla algo
6. Rollback plan
7. Testing después de migración

Incluye ejemplos de código antes/después.
```

### Prompt: Training Material

```
Crea material de capacitación para el equipo sobre feature flags:

1. Qué son y por qué usarlos
2. Nomenclatura y convenciones
3. Cómo usarlos en código
4. Mejores prácticas
5. Errores comunes
6. Troubleshooting
7. Casos de uso reales

Formato: Tutorial interactivo con ejemplos.
```

---

## 4️⃣ Testing y Validación

### Prompt: Test Suite Generator

```
Crea una suite de tests para validar el sistema de feature flags:

1. Tests unitarios para FeatureFlagsManager
2. Tests de integración con React
3. Tests de dependencias
4. Tests de rollout gradual
5. Tests de fallback y error handling
6. Tests de performance

Usa Jest y React Testing Library.
Include: setup, fixtures, assertions.
```

### Prompt: Validation Checklist

```
Crea un checklist exhaustivo para validar que:

1. Todos los features en código tienen flag en .env
2. Todos los flags en .env se usan en código
3. Nomenclatura es consistente
4. Dependencias están correctas
5. Rollback es seguro
6. Performance no se degrada
7. Seguridad no está comprometida

Include: comandos de verificación automática.
```

### Prompt: Performance Analysis

```
Analiza el impacto en performance de cada feature:

1. Impacto en bundle size
2. Impacto en runtime performance
3. Impacto en carga inicial
4. Impacto en memory usage

Para cada feature, identifica:
- Overhead de su activación
- Optimizaciones posibles
- Trade-offs
- Threshold de performance

Proporciona recomendaciones.
```

---

## 5️⃣ Planificación de Rollout

### Prompt: Gradual Rollout Plan

```
Crea un plan de rollout gradual para estos features:
[LISTA_DE_FEATURES]

Para cada feature:
1. Rollout percentage por día/semana
2. Grupos de usuarios (alpha, beta, internal)
3. Métricas de monitoreo
4. Success criteria
5. Rollback triggers

Considera:
- Criticidad del feature
- Familiaridad de usuarios
- Riesgos potenciales
- Horarios de menor carga
```

### Prompt: A/B Testing Setup

```
Diseña un A/B test para validar estos features:
[FEATURES_A_TESTEAR]

Especifica:
1. Hipótesis a probar
2. Métrica principal
3. Métrica secundaria
4. Tamaño de muestra
5. Duración del test
6. Criterios de ganador
7. Plan post-test

Incluye: tracking code, analytics setup.
```

### Prompt: Feature Toggle Strategy

```
Desarrolla una estrategia de feature toggles para este roadmap:
[ROADMAP_FEATURES]

Considera:
- Relaciones entre features
- Secuencia de lanzamiento
- Riesgos de timing
- Coordinación entre equipos
- Plan de cleanup de flags antiguos

Proporciona timeline recomendado.
```

---

## 6️⃣ Resolución de Problemas

### Prompt: Debugging Feature Issues

```
Un feature que debería estar habilitado no funciona.

Detalles:
- Feature: [NOMBRE]
- Entorno: [DEV/STAGING/PROD]
- Flag en .env: [VALOR]
- Comportamiento esperado: [DESCRIPCIÓN]
- Comportamiento actual: [DESCRIPCIÓN]
- Código relevante: [PEGAR_CÓDIGO]

Diagnóstica:
1. Por qué podría no estar funcionando
2. Cómo verificar el estado
3. Pasos para resolver
4. Cómo prevenir en futuro
```

### Prompt: Performance Degradation

```
Después de habilitar [FEATURE], el sitio se ralentizó.

Contexto:
- Feature: [NOMBRE]
- Síntoma: [DESCRIPCIÓN_RALENTIZO]
- Métrica afectada: [PÁGINA_CARGA/TIEMPO_INTERACCION/etc]
- Usuarios afectados: [CANTIDAD_PORCENTAJE]

Analiza:
1. Probable causa
2. Cómo confirmarlo
3. Quick fix (deshabilitar vs optimizar)
4. Solución permanente
5. Cómo monitorear
```

---

## 7️⃣ Mantenimiento y Cleanup

### Prompt: Feature Deprecation Plan

```
Estos features son antiguos y deberían retirarse:
[LISTA_FEATURES_ANTIGUOS]

Crea un plan de deprecación:
1. Versión de deprecación
2. Timeline de sunset
3. Migración de usuarios
4. Removal de código
5. Documentación de changelog
6. Notificación a usuarios

Include: deprecation warnings en código.
```

### Prompt: Code Cleanup After Feature

```
El feature [NOMBRE] ya es estable y universalmente usado.

Crea plan para:
1. Remover el flag de .env
2. Limpiar código condicional
3. Remover fallbacks legacy
4. Actualizar documentación
5. Testing post-cleanup

Proporciona commits necesarios.
```

### Prompt: Technical Debt Assessment

```
Evalúa la deuda técnica del sistema de feature flags:

1. Flags abandonados
2. Implementaciones inconsistentes
3. Documentación faltante
4. Tests insuficientes
5. Performance issues

Para cada elemento:
- Severidad
- Impacto
- Esfuerzo de fix
- Prioridad

Proporciona roadmap de remediar.
```

---

## 8️⃣ Casos de Uso Avanzados

### Prompt: Multi-Tenant Feature Management

```
Implementa feature flags para un sistema multi-tenant donde:
- Cada tenant tiene features diferentes
- Features compartidas entre tenants
- Overrides por tenant

Diseña:
1. Estructura de configuración
2. Cómo cargar flags por tenant
3. Caché y performance
4. Admin interface
5. Audit trail

Include: TypeScript types y ejemplos.
```

### Prompt: Server-Side Feature Evaluation

```
Necesito evaluar features en servidor (no en cliente):

Requisitos:
- Validar features antes de procesar
- Features personalizados por usuario/rol
- Cache de evaluaciones
- Auditing de acceso

Implementa:
1. Middleware para validación
2. User context evaluation
3. Caching strategy
4. API endpoints
5. Tests

Include: Express/Next.js examples.
```

### Prompt: Feature Analytics Dashboard

```
Crea un dashboard para monitorear features in producción:

Métricas:
1. Adoption rate por feature
2. Error rate por feature
3. Performance impact
4. User engagement
5. Rollout progress

Tecnología: [TU_STACK]

Include:
- Query builders
- Visualizations
- Real-time updates
- Export capabilities
```

---

## 9️⃣ Integración Continua

### Prompt: CI/CD Validation

```
Integra validación de feature flags en CI/CD:

Checks automáticos:
1. Nomenclatura consistente
2. Flags en .env existen en código
3. Sin flags huérfanos
4. Dependencias válidas
5. Sin conflictos
6. Performance checks

Generación:
1. Reporte de coverage
2. Documentación auto-generada
3. Warnings pre-deploy

Tecnología: [TU_CICD]
```

### Prompt: Deployment Checklist

```
Crea checklist automatizado para deployment:

Pre-deployment:
1. Validar todos los flags
2. Confirmar .env correcto
3. Tests pasando
4. Performance baseline
5. Monitoring listo

Durante deployment:
1. Monitoreo en tiempo real
2. Alertas de errores
3. Health checks

Post-deployment:
1. Verificar flags activos
2. Confirmar comportamiento
3. Métricas normales
4. Sin errores críticos

Format: Script ejecutable o GitHub Actions.
```

---

## 🔟 Queries Adicionales

### Prompt: Documentation Generation

```
Genera documentación automática de features:

Incluye:
- Feature index
- Quick start guide
- API reference
- Examples by use case
- FAQ
- Troubleshooting guide
- Video tutorials (estructura)

Format: Markdown + HTML
```

### Prompt: Migration from System X

```
Mi proyecto actualmente usa [SISTEMA_ACTUAL] para feature toggles.

Necesito migrar a tu sistema.

Proporciona:
1. Análisis de diferencias
2. Plan de migración
3. Scripts de conversion
4. Validación post-migración
5. Rollback plan

Include: before/after code examples.
```

---

## 📋 Template Genérico

Puedes usar este template para consultas personalizadas:

```
[CONTEXTO]
Mi proyecto es [DESCRIPCIÓN]
Stack: [TECNOLOGÍAS]
Escala: [USUARIOS/FEATURES]
Restricciones: [REQUISITOS_ESPECIALES]

[OBJETIVO]
Necesito: [QUÉ_QUIERES_LOGRAR]
Con énfasis en: [PRIORIDADES]
Problemas actuales: [DESAFÍOS]

[INFORMACIÓN_RELEVANTE]
[CÓDIGO/CONFIGURACIÓN/DETALLES]

[FORMATO_DESEADO]
Respuesta como: [JSON/MARKDOWN/CODE/etc]
Incluir: [DETALLES_ESPECÍFICOS]

[AGENTE_IA]
Actúa como: [EXPERTO_EN_QUÉ]
Considera: [FACTORES_IMPORTANTES]
Evita: [LO_QUE_NO_QUIERES]
```

---

## 💡 Tips para Mejores Resultados

### 1. Sé Específico

❌ "Analiza mi proyecto"
✅ "Analiza src/components/ y detecta features marcadas con // EXPERIMENTAL"

### 2. Proporciona Contexto

❌ "¿Cuál es el mejor sistema de flags?"
✅ "Tengo una app React con 50K usuarios, 15 features, necesito rollout gradual..."

### 3. Define Formato de Salida

❌ "Genera un reporte"
✅ "Genera un reporte JSON con estructura: {id, name, type, locations[]}"

### 4. Usa Ejemplos

❌ "Refactoriza mi código"
✅ "Refactoriza mi código para usar este patrón: [EJEMPLO]"

### 5. Sé Iterativo

```
1. Primer prompt: Análisis inicial
2. Segundo prompt: Profundizar en riesgos
3. Tercer prompt: Implementación específica
4. Cuarto prompt: Testing y validación
```

---

## 🚀 Flujo Recomendado

1. **Semana 1: Discovery**
   - Usar Prompt #1 (Detección Inicial)
   - Analizar resultados
   - Documentar features actuales

2. **Semana 2: Planning**
   - Usar Prompt #4 (Validación)
   - Usar Prompt #5 (Rollout)
   - Crear plan de implementación

3. **Semana 3: Implementation**
   - Usar Prompt #2 (Análisis de Riesgos)
   - Usar Prompt #3 (Documentación)
   - Implementar sistema

4. **Semana 4: Testing & Deployment**
   - Usar Prompt #6 (Testing)
   - Usar Prompt #7 (Rollout)
   - Monitorear en producción

---

**¡Listo para usar estos prompts! Adapta según tus necesidades específicas.** 🎯
