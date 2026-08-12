# Contrato local de agentes

Este repositorio usa un flujo inspirado en `agent-orchestration-starter`:
OpenAI/Codex planifica y revisa; OpenCode ejecuta contratos acotados con NAN.

## Roles y rutas

- **Sol/Frontier (Orquestador y Revisor)** — OpenAI/Codex Sol, esfuerzo medio.
  Analiza, diagnostica, diseña, descompone tareas y revisa cada entrega.
  Seguridad y decisiones de producto se reservan íntegramente a Codex.
- **Implementación mecánica** — `nan/qwen3.6` (Qwen) pica código bajo contrato.
- **Razonamiento acotado** — `nan/deepseek-v4-flash` para contratos difíciles.
- **Contexto largo/multimodal** — `nan/mimo-v2.5`. `nan/glm5.2` está prohibido.
  Ejecuta cambios mecánicos en las rutas permitidas, incluso multiarchivo cuando
  el contrato lo acota expresamente. Usa un intento y ningún fallback por
  defecto, con presupuesto observable y telemetría JSON.
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
criterios de aceptación, plan Frontier y validaciones, y ejecutar:

La ejecución real de código solo comienza en un worktree Git enlazado, limpio y
creado por el orquestador. Declarar un modelo aquí no prueba que se haya lanzado:
la telemetría debe conservar ruta, launch, sesión/eventos JSONL, usage, cambios,
validación independiente y el estado `awaiting-frontier-review`.

```powershell
.\scripts\Invoke-NanWorker.ps1 -TaskType code `
  -Objective "Objetivo verificable" `
  -PlannedBy "frontier" `
  -FrontierPlan "Diagnostico X, implemento Y en rutas acotadas" `
  -AcceptanceCriteria @("1. Los tests pasan","2. No hay regression") `
  -AllowedPath "src/**" `
  -ValidationCommand "npm test"
```

Cada campo es obligatorio y se valida en runtime (fail-closed):

| Campo                | Descripción                                                    | Ejemplo                               |
| -------------------- | -------------------------------------------------------------- | ------------------------------------- |
| `PlannedBy`          | Debe ser exactamente `"frontier"` (minúsculas)                 | `"frontier"`                          |
| `FrontierPlan`       | Instrucciones del orquestador (cadena libre)                   | `"Diagnostico X, implemento Y"`       |
| `AcceptanceCriteria` | Criterios separados por saltos de línea (string[] normalizado) | `"1. Tests pasan`n2. Sin regression"` |
| `AllowedPath`        | Glob o lista glob que delimita escrituras                      | `"src/**"`                            |
| `ValidationCommand`  | Comando(s) que deben volver 0                                  | `"npm test"`                          |

Para boletines, Codex obtiene o convierte la fuente a un archivo local y usa
`Invoke-NanWorker.ps1 -TaskType bulletin -InputPath <archivo>`.
Los boletines no tienen requisitos de código (no usan PlannedBy, FrontierPlan,
AcceptanceCriteria ni AllowedPath).

Ejemplo DryRun (obligatorio incluir `-ValidationCommand` para code):

```powershell
.\scripts\Invoke-NanWorker.ps1 -TaskType code `
  -Objective "Verificar contrato" `
  -PlannedBy "frontier" `
  -FrontierPlan "Revisión de configuración" `
  -AcceptanceCriteria @("Sin errores","Verificada estructura") `
  -AllowedPath "src/**" `
  -BudgetProfile batch `
  -ValidationCommand "npm run lint" `
  -DryRun
```

El worker soporta:

- `-MaxRetries 1` — valor seguro por defecto; aumentarlo requiere justificar el coste.
- `-BudgetProfile small|batch|research|extended` — aplica respectivamente 50k, 150k, 300k o 400k tokens observados por ejecución, incluida la caché. El valor seguro por defecto es `small`.
- `-MaxObservedTokens <n>` — override excepcional entre 1k y 1M; prevalece sobre el perfil y queda identificado como `override` en telemetría.
- `-MaxExecutionSeconds 300` — termina el árbol del proceso al agotar el tiempo.
- `-DuplicateWindowSeconds 3600` — bloquea contratos idénticos sobre el mismo SHA durante una hora.
- `-FallbackModels` — vacío por defecto; cada fallback debe cualificarse explícitamente.
- `-DryRun` — validación del contrato sin invocar opencode.
- `-TestMode` — ejecución simulada con `-MockPlan` (solo para pruebas, no consume API).

No se mantienen comandos directos en `.opencode/commands`: toda llamada NAN debe
pasar por `Invoke-NanWorker.ps1` para aplicar presupuesto, deduplicación y telemetría.

Cada ejecución escribe telemetría en `.agent-runs/<guid>.json`.

> `validationExitCode` se persiste en telemetría antes de entrar a cualquier rama
> de fallo; nunca queda `null` tras ejecutar validación (mock o real).

El trabajador no puede publicar, hacer commits, ampliar sus rutas ni aprobar su
propio resultado. Si falla, debe retornar `blocked-needs-new-contract`; nunca
escala automáticamente a Sol para escribir código. Codex revisa el diff y
ejecuta las validaciones de forma independiente. No se delegan secretos,
credenciales ni datos personales.
