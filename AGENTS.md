# Contrato local de agentes

Este repositorio usa un flujo inspirado en `agent-orchestration-starter`:
OpenAI/Codex planifica y revisa; OpenCode ejecuta contratos acotados con NAN.

## Roles y rutas

- **Sol/Frontier (Orquestador y Revisor)** — OpenAI/Codex Sol, esfuerzo medio.
  Analiza, diagnostica, diseña, descompone tareas y revisa cada entrega.
  Seguridad y decisiones de producto se reservan íntegramente a Codex.
- **Implementación** — `nan/qwen3.6` (Qwen) pica código bajo contrato.
  Ejecuta cambios mecánicos en las rutas permitidas, incluso multiarchivo cuando
  el contrato lo acota expresamente. Soporta retry (3 intentos), fallback
  configurable y telemetría JSON.
- **Boletines** — `nan/gemma4` (Gemma) solo lee boletines. Extrae información de
  boletines convertidos a archivos locales; es estrictamente de solo lectura.

> Delegar la implementación a un worker **no equivale** a delegar la arquitectura
> ni la revisión. Sol/Frontier conserva el control del diseño, la descomposición
> y la validación de cada cambio.

## Flujo Frontier → worker → Frontier

1. **Frontier** (Codex/Sol) analiza, diagnostica, diseña y descompone el trabajo
   en un contrato verificable (objetivo, rutas permitidas, validaciones).
2. El **worker** (Qwen para código, Gemma para boletines) ejecuta el contrato de
   forma autónoma dentro de sus límites.
3. De vuelta al **Frontier** (Codex/Sol): revisa el diff, ejecuta las validaciones
   de forma independiente, lee la telemetría y aprueba o rechaza el cambio.

Este ciclo se repite para cada contrato. Cada iteración mantiene la separación
entre **planificar/diagnosticar/revisar** (Frontier) e **implementar** (worker).

## Contrato de delegación

Antes de delegar código, Codex debe indicar objetivo, rutas permitidas,
criterios de aceptación y validaciones, y ejecutar:

```powershell
.\scripts\Invoke-NanWorker.ps1 -TaskType code `
  -Objective "Objetivo verificable" `
  -AllowedPath "src/**" `
  -ValidationCommand "npm test"
```

Para boletines, Codex obtiene o convierte la fuente a un archivo local y usa
`Invoke-NanWorker.ps1 -TaskType bulletin -InputPath <archivo>`.

El worker soporta:

- `-MaxRetries 3` — reintentos por modelo primario.
- `-FallbackModels "nan/mimo-v2.5,nan/deepseek-v4-flash"` — modelos alternativos.
- `-DryRun` — validación del contrato sin invocar opencode.

Cada ejecución escribe telemetría en `.agent-runs/<guid>.json`.

El trabajador no puede publicar, hacer commits, ampliar sus rutas ni aprobar su
propio resultado. Si falla, debe retornar `blocked-needs-new-contract`; nunca
escala automáticamente a Sol para escribir código. Codex revisa el diff y
ejecuta las validaciones de forma independiente. No se delegan secretos,
credenciales ni datos personales.
