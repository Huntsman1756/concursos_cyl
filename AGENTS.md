# Contrato local de agentes

Este repositorio usa un flujo inspirado en `agent-orchestration-starter`:
OpenAI/Codex planifica y revisa; OpenCode ejecuta contratos acotados con NAN.

## Roles y rutas

- Orquestador y revisor: OpenAI/Codex Sol, esfuerzo medio.
- Implementación mecánica y localizada: `nan/qwen3.6` mediante `nan-code` con
  retry (3 intentos), fallback configurable y telemetría JSON.
- Lectura y extracción de boletines: `nan/gemma4` mediante `nan-bulletin`.
- Seguridad y decisiones de producto se quedan en Codex.

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
