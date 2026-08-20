# Contrato local de agentes

Este repositorio usa un flujo inspirado en `agent-orchestration-starter`:
OpenAI/Codex planifica y revisa; OpenCode ejecuta contratos acotados con NAN.

La referencia del runtime es `v0.3.1`, commit
`ae1640e2a7d6151bc6a331be62c6e196d7852c66`; la compatibilidad de procedencia
firmada conserva el merge `42cf5c2b1b55628332ce9fc1089957bd4fca3931`.
La integracion actual sigue
siendo `BOUNDED_LOCAL`: no debe anunciar evidencia firmada ni enforcement
`REQUIRED`. Solo el host privilegiado puede firmar y la clave, la evidencia y
la clave publica confiada permanecen fuera del repositorio y del contexto del
modelo.

La activacion Runtime V4 registrada es exclusivamente `ANALYSIS_ONLY`, con
`hostCompositionHash: null` y publicacion deshabilitada. No se conserva un
binding MCP ejecutable mientras falte un driver de host confiado.

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

## Criterios de selección de modelo

| Modelo NAN              | Agente asignado         | Cuándo usarlo                                                        |
| ----------------------- | ----------------------- | -------------------------------------------------------------------- |
| `nan/qwen3.6`           | `nan-code`              | Edits mecánicos, bounded paths, tareas con claridad de pasos.        |
| `nan/deepseek-v4-flash` | `nan-reasoning-code`    | Contratos que requieren razonamiento explícito antes de implementar. |
| `nan/mimo-v2.5`         | `nan-long-context-code` | Contexto largo (>100k tokens), varios archivos, contratos amplios.   |
| `nan/gemma4`            | `nan-bulletin`          | **Solo lectura** de boletines convertidos a archivo local.           |

La selección es explícita por perfil: `mechanical` usa Qwen, `reasoning` usa
DeepSeek y `long-context` usa MiMo. No existe fallback automático: Codex debe
autorizar cada fallback compatible en el contrato.

## Prohibiciones de modelo

- **`nan/glm5.2`**: Prohibido globalmente. No se declara en `opencode.json`, no se usa en
  fallback, no se menciona en contratos.
- **`nan/gemma4` para código**: Prohibido. Gemma es exclusivamente de lectura de boletines.
  Cualquier intento de usar Gemma en un contrato de código debe fallar de forma determinista.
- **Fallback a Gemma desde código**: Prohibido. El broker rechaza el parámetro
  antes de iniciar una sesión de modelo.

## Pasos por agente

El límite `40/40/50` se refiere exclusivamente a los pasos máximos permitidos
por agente en un contrato NAN: `nan-code` (40 pasos), `nan-reasoning-code`
(40 pasos) y `nan-long-context-code` (50 pasos). Son conteos de iteraciones
de agente, no porcentajes, ni ratios, ni repartos de esfuerzo.

## Política NAN-first obligatoria

Para código, tests, datos, artefactos de análisis y documentación, NAN-first
es obligatorio: Codex planifica, decide, revisa, valida y publica; el worker
NAN ejecuta la implementación sin que Codex escriba directamente ni tome
control tras un fallo NAN.

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
criterios de aceptación, plan Frontier y validaciones. La entrada autónoma por
defecto para una sola historia es `Invoke-FrontierSupervisedNanWorker.ps1`: crea un worktree nuevo por
intento, ejecuta NAN una sola vez, conserva parche, diagnósticos acotados y
telemetría fuera del repo incluso si falla una validación determinista,
elimina los bytes candidatos y solicita a Codex `ACCEPT`, `RETRY` o `ESCALATE`.
Una validacion exclusivamente de `lint` o formato puede producir antes un
repair packet hash-bound y un reintento mecanico de politica en contexto fresco;
si se repite la misma firma termina en `NO_PROGRESS`. Pruebas, build y datos
siguen pasando siempre por la decision independiente de Codex.
Un `RETRY` relanza un worker con sesión nueva sobre el mismo SHA y con
instrucciones reducidas; nunca permite que Codex implemente silenciosamente.
Solo un intento listo y validado puede recibir `ACCEPT`.

Cuando haya dos o más historias independientes, la entrada preferida y
obligatoria es `Invoke-NanWorkerBatch.ps1`. Codex debe separar rutas exactas y
disjuntas. El broker usa uno por defecto para evitar presion sobre la API; una
excepcion explicita puede lanzar hasta cinco contextos NAN frescos en worktrees
detached distintos. Cada historia conserva contrato, parche, telemetría y hashes
fuera del repositorio; Codex revisa la oleada completa una sola vez. No se usa
un lote para cambios con rutas solapadas, decisiones de arquitectura o
dependencias secuenciales.

```powershell
.\scripts\Invoke-NanWorkerBatch.ps1 `
  -BatchJsonPath C:\orchestration\contracts\batch-001.json `
  -StateDirectory C:\orchestration\state\batch-001 `
  -WorktreeParent C:\orchestration\worktrees `
  -MaxConcurrency 5
```

La ejecución de código solo comienza en un worktree Git enlazado, limpio y
creado por el orquestador. Declarar un modelo o conservar una sesión OpenCode no
prueba uso NAN. Además del JSONL local, la telemetría debe incluir evidencia de
respuesta observada en `api.nan.builders`: estado 2xx, ID, modelo, usage,
fingerprint de clave y vínculo exacto con contrato y repositorio. Sin ella el
estado es `blocked-unverified-provider`, nunca `awaiting-frontier-review`.

```powershell
.\scripts\Invoke-FrontierSupervisedNanWorker.ps1 `
  -ContractPath C:\orchestration\contracts\task.json `
  -StateDirectory C:\orchestration\state\task-001 `
  -WorktreeParent C:\orchestration\worktrees
```

`Invoke-NanWorker.ps1` sigue siendo el primitive de un solo intento usado por
el supervisor; no debe presentarse como una orquestación completa.

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
- `-BudgetProfile small|batch|research|extended` — aplica respectivamente 500k, 1250k, 1250k o 1500k tokens observados por ejecución, incluida la caché. El valor seguro por defecto es `extended`.
- `-MaxObservedTokens <n>` — override excepcional entre 1k y 2M; prevalece sobre el perfil y queda identificado como `override` en telemetría.
- `-MaxExecutionSeconds 1800` — termina el árbol del proceso al agotar el tiempo.
- `-DuplicateWindowSeconds 3600` — bloquea contratos idénticos sobre el mismo SHA durante una hora.
- `-FallbackModels` — vacío por defecto; cada fallback debe cualificarse explícitamente.
- `-DryRun` — validación del contrato sin invocar opencode.
- `-TestMode` — ejecución simulada con `-MockPlan` (solo para pruebas, no consume API).

No se mantienen comandos directos en `.opencode/commands`: toda llamada NAN debe
pasar por el supervisor o por su primitive `Invoke-NanWorker.ps1` para aplicar
presupuesto, deduplicación y telemetría.

Cada ejecución escribe telemetría en `.agent-runs/<guid>.json`.

El perfil predeterminado admite un worker NAN. El limite configurable sigue
siendo cinco para oleadas justificadas, cada worker con estado
OpenCode efímero y aislado. Los boletines reciben sus archivos mediante
`-InputPath`; después se deshabilita la lectura libre del repositorio para que
un contrato no pueda explorar fuentes de otro ciclo.

> `validationExitCode` se persiste en telemetría antes de entrar a cualquier rama
> de fallo; nunca queda `null` tras ejecutar validación (mock o real).

El trabajador no puede publicar, hacer commits, ampliar sus rutas ni aprobar su
propio resultado. Si falla, el supervisor puede adaptar una vez el contrato y
reintentar con NAN; agotado el presupuesto termina en `ESCALATE`. Codex revisa
pero no escribe directamente ni toma el control de la implementación. El objetivo
coherente usa contrato multiarchivo; historias independientes usan batch hasta cinco;
microcontratos artificiales prohibidos. Este host Windows es
`BOUNDED_LOCAL`, no aislamiento duro certificado. No se delegan secretos,
credenciales ni datos personales.

Los tokens no son una métrica de éxito ni se estiman. `tokensUsage` es una
observación del cliente; solo `providerEvidence.providerReportedTokens` de
respuestas NAN 2xx puede comunicarse como consumo del proveedor. `DryRun`,
`TestMode` y cualquier ejecución sin evidencia verificable cuentan como cero.
