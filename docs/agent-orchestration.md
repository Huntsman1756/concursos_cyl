# Orquestación de Agentes (Codex → NAN)

## Resumen

Este repositorio implementa un flujo local de agentes inspirado en
`agent-orchestration-starter`. OpenAI/Codex Sol es el orquestador Frontier:
planifica, diagnostica, define la arquitectura y los contratos, y valida
cada entrega. Los modelos NAN ejecutan cambios de código únicamente bajo
contratos acotados emitidos por Sol, sin decidir arquitectura ni hacer
diagnóstico por sí mismos.

La referencia está fijada en el merge
`0d95676ac2c5f2365021514458180ca40e6a37a2`. Cambiar modelo, harness, agente,
permisos o launcher exige cualificar de nuevo la combinación exacta.

Este flujo **no es el runtime V4 completo**. Es una adaptación local para Windows
que aprovecha el CLI `opencode`, los agentes locales `nan-code` y `nan-bulletin`,
y un worker PowerShell con presupuesto, fallback explícito y telemetría JSON.

## Arquitectura

NAN se usa como proveedor de implementación principal. El worker:

- Intercambia con `opencode` mediante llamadas CLI.
- Ejecuta un intento por defecto y no activa fallbacks implícitos.
- Lee el JSONL durante la ejecución y termina el árbol de OpenCode cuando el
  consumo observado, incluida la caché, supera 50.000 tokens.
- Termina ejecuciones de más de 300 segundos y bloquea durante una hora la
  repetición del mismo contrato sobre el mismo SHA.
- Registra telemetría por ejecución: modelo, agente, intento, reintento, código de
  salida, tokens, rutas cambiadas y código de validación.
- Modos: ejecución real y `DryRun` (simulación que también escribe telemetría).

El worker **nunca** escala ni escribe código a través de Sol. El orquestador
(Codex) coordina, revisa diffs, valida y puede redefinir un contrato; solo
Codex inicia la escritura de código.

## Roles

| Rol                     | Modelo / Alias                       | Responsabilidad                                                                              |
| ----------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------- |
| **Orquestador**         | OpenAI / Codex Sol (esfuerzo medio)  | Analiza, diagnostica, diseña, descompone tareas, revisa diffs y valida.                      |
| **Worker de código**    | `nan/qwen3.6` (agente `nan-code`)    | Aplica cambios mecánicos en rutas permitidas con 10 pasos máximos y presupuesto observable.  |
| **Worker de boletines** | `nan/gemma4` (agente `nan-bulletin`) | Lee y extrae información de boletines convertidos a archivos locales legibles. Modo lectura. |

Seguridad y decisiones de producto se reservan al orquestador (Codex).

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

## Routing

Los tipos de tarea se enrutan en `castilla-leon.nan.yaml` con el siguiente comportamiento:

| Ruta                  | `plan` / `diagnose`    | `implement`      | `verifyWith` |
| --------------------- | ---------------------- | ---------------- | ------------ |
| `code`                | `orchestrator`         | `codeExecutor`   | `reviewer`   |
| `debugging`           | `orchestrator`         | `codeExecutor`   | `reviewer`   |
| `cross_file_refactor` | `orchestrator`         | `codeExecutor`   | `reviewer`   |
| `multi_file`          | `orchestrator`         | `codeExecutor`   | `reviewer`   |
| `bulletin`            | —                      | `bulletinReader` | `reviewer`   |
| `architecture`        | `orchestrator` (único) | —                | —            |
| `security_review`     | `orchestrator` (único) | —                | —            |

- `architecture` y `security_review` se procesan íntegramente por el orquestador.
- `bulletin` usa `bulletinReader` como default y `reviewer` para verificación.
- `code`, `debugging`, `cross_file_refactor` y `multi_file` requieren que el
  orquestador planifique/diagnostique, el worker implemente y el revisor verifique.

## Flujo delegación de código

### 1. Codex prepara el contrato

Codex define:

- Objetivo verificable (una frase o párrafo corto).
- Rutas permitidas (patrones glob, p.ej. `src/**`, `docs/agent-orchestration.md`).
- Comandos de validación (p.ej. `npm test`, `prettier --check docs/agent-orchestration.md`).
- El perfil de presupuesto: `small`, `batch`, `research` o `extended`.
- Opcionalmente `MaxRetries`, `FallbackModels`, `MaxObservedTokens` como override y `DryRun`.

### 2. Codex invoca el trabajador

Ejecución acotada (un intento, sin fallback por defecto):

```powershell
.\scripts\Invoke-NanWorker.ps1 -TaskType code `
  -Objective "Implementa x" `
  -PlannedBy "frontier" `
  -FrontierPlan "Diagnostico X, implemento Y en rutas acotadas" `
  -AcceptanceCriteria @("1. Los tests pasan","2. No hay regression") `
  -AllowedPath "src/**" `
  -ValidationCommand "npm test" `
  -MaxRetries 1 `
  -BudgetProfile batch `
  -MaxExecutionSeconds 300 `
  -DuplicateWindowSeconds 3600
```

Cada campo es obligatorio y se valida en runtime (fail-closed):

| Campo                | Descripción                                                                                                                                                                        | Ejemplo                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `PlannedBy`          | Debe ser exactamente `"frontier"` (minúsculas)                                                                                                                                     | `"frontier"`                              |
| `FrontierPlan`       | Instrucciones del orquestador (cadena libre)                                                                                                                                       | `"Diagnostico X, implemento Y"`           |
| `AcceptanceCriteria` | Criterios de aceptación como arreglo de strings `string[]`, un elemento por criterio (no un string con saltos de línea)                                                            | `@("1. Tests pasan","2. Sin regression")` |
| `AllowedPath`        | Glob o lista glob que delimita escrituras                                                                                                                                          | `"src/**"`                                |
| `ValidationCommand`  | Comando(s) que deben devolver 0. Si alguno falla, el intento se bloquea inmediatamente; se persiste en `validationExitCode` el **primer código no cero** encontrado, no el último. | `"npm test"`                              |
| `BudgetProfile`      | Presupuesto observado por ejecución. `small` es el valor seguro por defecto; los perfiles mayores deben declararse según el alcance del contrato.                                  | `"batch"`                                 |

| Perfil     |  Tokens | Uso previsto                                               |
| ---------- | ------: | ---------------------------------------------------------- |
| `small`    |  50.000 | Cambio mecánico pequeño y localizado.                      |
| `batch`    | 150.000 | Incorporación mecánica de un lote previamente investigado. |
| `research` | 300.000 | Lectura y extracción extensa de fuentes.                   |
| `extended` | 400.000 | Lote excepcional que combina bastante contexto y trabajo.  |

`MaxObservedTokens` acepta de 1.000 a 1.000.000 y prevalece sobre la tabla,
pero queda registrado como `budgetSource: override`; no debe usarse como valor
habitual ni para ocultar un contrato demasiado amplio.

Ejecución DryRun (sin coste, valida contrato sin llamar a opencode):

```powershell
.\scripts\Invoke-NanWorker.ps1 -TaskType code `
  -Objective "DryRun verificación" `
  -PlannedBy "frontier" `
  -FrontierPlan "Verifico configuración" `
  -AcceptanceCriteria @("Todo correcto") `
  -AllowedPath "src/**" `
  -ValidationCommand "npm run lint" `
  -DryRun
```

El script, cuando se ejecuta desde un worktree Git enlazado y limpio:

1. Calcula un snapshot SHA-256 de los archivos versionados y no ignorados.
2. Intenta ejecutar opencode con el modelo primario (`nan/qwen3.6`) y consume
   su JSONL en streaming, sin `--auto`.
3. Si falla, se detiene tras `{MaxRetries}` intentos; el valor por defecto es 1.
4. Solo usa fallbacks enumerados y cualificados explícitamente.
5. Tras la ejecución exitosa, compara el snapshot y detecta archivos cambiados.
6. Compara cada archivo cambiado contra las rutas permitidas.
7. Escribe telemetría JSON en `.agent-runs/<guid>.json`.
8. Ejecuta los comandos de validación definidos por Frontier fuera del modelo.
9. Termina en `awaiting-frontier-review`; el worker nunca se autoacepta.

No existen atajos en `.opencode/commands`: toda ejecución NAN pasa por el
broker. El hash de contrato incluye tipo, objetivo, rutas, validaciones, plan,
criterios y SHA Git, y evita ejecuciones concurrentes o repetidas durante la
ventana configurada.

Si algún archivo fuera de `AllowedPath` resulta modificado, el script genera un error de
violación de contrato, lo cual es **esperado y necesario** — marca el fallo para
que el orquestador lo corrija redefiniendo las rutas.

### 3. Codex revisa y valida

- Revisa el diff (`git diff`).
- Ejecuta los comandos de validación por su cuenta.
- Revisa la telemetría JSON en `.agent-runs/` para verificar modelo, intentos, etc.
- Aprueba o rechaza el cambio.

## Flujo delegación de boletines

Codex obtiene o convierte la fuente a un archivo local y ejecuta:

```powershell
.\scripts\Invoke-NanWorker.ps1 -TaskType bulletin `
  -Objective "Extrae el BOE 2025-01" `
  -InputPath "data/boletin/2025/boe-2025-01.txt"
```

Los boletines son siempre de solo lectura.

## Telemetría

Cada ejecución escribe un archivo JSON en `.agent-runs/<guid>.json` (incluso `DryRun`):

```json
{
  "telemetryId": "uuid",
  "simulated": false,
  "taskType": "code",
  "selectedModel": "nan/qwen3.6",
  "attempts": [
    {
      "model": "nan/qwen3.6",
      "agent": "nan-code",
      "attempt": 1,
      "retry": 1,
      "exitCode": 0,
      "tokens": {
        "input": 500,
        "output": 300,
        "reasoning": 200,
        "cacheRead": 100,
        "cacheWrite": 50,
        "total": 1500
      },
      "changedPaths": ["src/foo.ts"],
      "validationExitCode": 0
    }
  ],
  "changedPaths": ["src/foo.ts"],
  "contractViolation": false,
  "validationFailed": false,
  "tokensUsage": {
    "input": 500,
    "output": 300,
    "reasoning": 200,
    "cacheRead": 100,
    "cacheWrite": 50,
    "total": 1500
  },
  "success": true,
  "status": "success",
  "frontierContract": {
    "plannedBy": "frontier",
    "planHash": "abc123...",
    "acceptanceCriteriaCount": 2,
    "reviewRequired": true
  }
}
```

- `.agent-runs/` está ignorado por `.gitignore` y por el watcher de opencode.
- No existe limpieza automática de retención; el directorio se gestiona manualmente.
- `validationExitCode` se persiste en cada intento antes de entrar a cualquier rama de fallo; nunca queda `null` tras ejecutar validación (mock o real). Si hay múltiples `ValidationCommand`, el valor registrado es el **primer código no cero** (el primero que falle); si todos pasan, se registra `0`.

## DryRun

El modo `DryRun` permite validar que el contrato, las rutas
permitidas, los modelos y las validaciones están correctamente configurados SIN
invocar opencode ni consumir tokens API. Siempre escribe telemetría (con
`simulated: true`) en un JSON dentro de `.agent-runs/` (ignorados por git);
no modifica archivos de trabajo ni versionados.

## Validación del entorno

El script de prueba ejecuta tests comportamentales en modo `TestMode` sin
consumir API NAN:

```powershell
.\scripts\Test-AgentOrchestration.ps1                      # ejecuta todas las fases
.\scripts\Test-AgentOrchestration.ps1 -Only contracts      # ejecuta solo una fase
```

### Fases de prueba (TestMode)

| Fase                 | Descripción                                                                              | Costo API |
| -------------------- | ---------------------------------------------------------------------------------------- | --------- |
| **Contracts**        | code sin AllowedPath falla, bulletin con AllowedPath falla                               | Ninguno   |
| **DryRun**           | Ejecución dryrun completa (escribe telemetría)                                           | Ninguno   |
| **Retry-success**    | Primario falla 2 veces, éxito al 3er intento                                             | Ninguno   |
| **Fallback-success** | Primario agotado, fallback tiene éxito                                                   | Ninguno   |
| **Blocked**          | Primario + 1 fallback agotados → blocked                                                 | Ninguno   |
| **Blocked-all**      | Todos los modelos agotados → blocked                                                     | Ninguno   |
| **Tokens**           | Extracción y agregación de tokens desde JSONL                                            | Ninguno   |
| **Nochange**         | 0 cambios sin `-AllowNoChanges` → rechazo                                                | Ninguno   |
| **Allowno**          | 0 cambios con `-AllowNoChanges` → aceptado                                               | Ninguno   |
| **Violation**        | Cambio fuera de `AllowedPath` → violación                                                | Ninguno   |
| **Validation**       | Validación falla → error                                                                 | Ninguno   |
| **Bulletin**         | Bulletin solo usa gemma4, sin fallback                                                   | Ninguno   |
| **Bulletin-allows**  | Bulletin con `-AllowedPath` falla (solo lectura)                                         | Ninguno   |
| **Telemetry**        | Telemetría creada incluso en fallo, sin campos prohibidos                                | Ninguno   |
| **Fail-closed**      | Entradas MockPlan insuficientes → blocked                                                | Ninguno   |
| **Fallback-reject**  | Modelo no oficial en fallback se ignora                                                  | Ninguno   |
| **Validation-exit**  | validationExitCode en simulación: singular y lista (ej. `[1,0]`→bloquea, `[0,0]`→acepta) | Ninguno   |

La suite reproducible usa `TestMode` y no consume API NAN. La cualificación real
se ejecuta por separado para no mezclar pruebas deterministas con el estado del
proveedor. El 12 de agosto de 2026 se verificó el binding presupuestado exacto:
Qwen 3.6 produjo la sesión `ses_00b2fa739ffe7psp29zyk79Ts4` con 4.077 tokens y
Gemma 4 la sesión `ses_00b2f4913ffe6H53pMxnPbY8TP` con 3.100 tokens; ambas terminaron sin
cambios. Esto prueba route, launch, eventos y usage, pero no certifica Runtime V4
ni autoriza publicación. El probe Qwen consumió 122.724 tokens para una tarea
sin cambios; esta regresión económica motivó `maxSteps: 10`, un solo intento,
fallbacks vacíos y un perfil seguro `small` de 50.000 tokens. Para no convertir
ese cortafuegos en un cuello de botella, el broker ofrece perfiles por contrato:
`small` (50k), `batch` (150k), `research` (300k) y `extended` (400k). Un
`MaxObservedTokens` explícito entre 1k y 1M prevalece como override auditable.
El broker corta la ejecución al
observar el exceso y la deja en `blocked-token-budget`; un timeout queda en
`blocked-timeout`. Como la API informa tokens por pasos completados, puede existir
un pequeño sobrepaso correspondiente al paso en curso, pero no una trayectoria
completa sin control.

## Límites y políticas

### Lo que el trabajador NO hace

- No publica, no hace commits, no push, no despliegue.
- No amplía sus propias rutas permitidas.
- No aprueba su propio resultado.
- No lee secretos ni credenciales ni datos personales.
- Si falla, debe retornar `blocked-needs-new-contract`; nunca escala ni escribe
  código mediante Sol (Sol solo coordina, revisa y puede redefinir un contrato).

### Lo que hace

- Lee solo lo necesario; el límite `AllowedPath` se aplica a las escrituras y se
  comprueba después de la ejecución.
- Escribe en las rutas permitidas del contrato.
- Avisa si un archivo extra fue modificado (violación de contrato).
- Reintenta hasta 3 veces antes de declarar fallo por modelo.
- Respaldos con modelos NAN alternativos si el primario falla (solo para `code`; `bulletin` solo reintenta gemma4).
- Registra toda la ejecución en telemetría JSON.
- Soporta modo DryRun para validación sin coste (con telemetría incluida).
- Soporta modo TestMode (`-TestMode`) para pruebas comportamentales inyectando un plan mock (`-MockPlan`). TestMode solo se activa con `-TestMode` o `-DryRun` explícito.

## Naturaleza local y Windows

Este flujo es un **subconjunto local del patrón de orquestación de agentes**:

- Se ejecuta sobre Windows con PowerShell (no sobre el runtime V4 completo).
- No usa colas RPC, no tiene panel de monitorización, ni base de datos de
  sesiones, ni sistema de autenticación multi-usuario.
- El orquestador es Codex, que invoca `opencode` con acceso a los modelos NAN;
  no es un servicio autónomo.
- El worker de código es una invocación CLI directa dentro de un worktree
  enlazado y limpio: sin contenedores ni sandbox certificado. Por ello este
  binding es `BOUNDED_LOCAL`, no Runtime V4 de producción.
- Permite retry y fallback solo cuando el contrato los habilita expresamente;
  por defecto usa un intento y ningún fallback.
- La telemetría se guarda en archivos locales JSON ignorados por git.

Esta simplicidad es una decisión deliberada: facilita la revisión humana, reduce
la superficie de fallo y se adapta a un entorno de desarrollo único donde la
producción corre sobre caddy y servidores Linux.
