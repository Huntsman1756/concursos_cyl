# Orquestación de Agentes (Codex → NAN)

## Resumen

Este repositorio implementa un flujo local de agentes inspirado en
`agent-orchestration-starter`. OpenAI/Codex Sol es el orquestador Frontier:
planifica, diagnostica, define la arquitectura y los contratos, y valida
cada entrega. Los modelos NAN ejecutan cambios de código únicamente bajo
contratos acotados emitidos por Sol, sin decidir arquitectura ni hacer
diagnóstico por sí mismos.

La referencia publicada es `v0.3.1`, commit
`ae1640e2a7d6151bc6a331be62c6e196d7852c66`. La compatibilidad histórica con la
procedencia firmada V4 conserva el merge
`42cf5c2b1b55628332ce9fc1089957bd4fca3931`. Cambiar runtime, modelo, harness,
agente, permisos o launcher exige cualificar de nuevo la combinación exacta.

Este flujo **no es el runtime V4 completo**. La activación V4 es
`ANALYSIS_ONLY` y la ejecución sigue siendo una adaptación `BOUNDED_LOCAL`
para Windows que aprovecha el CLI `opencode`, los agentes locales `nan-code` y
`nan-bulletin`, un worker PowerShell y un supervisor Frontier. No constituye
aislamiento duro ni una certificación de host de producción.

## Política NAN-first obligatoria

> **Regla**: Codex planifica, diagnostica, diseña, revisa y publica; el worker
> NAN ejecuta toda la implementación manual elegible sin que Codex escriba
> directamente. Un objetivo coherente usa contrato multiarchivo; dos o más
> historias independientes disjuntas usan batch hasta cinco, sin microcontratos
> artificiales.

Para código, tests, datos, artefactos de análisis y documentación, NAN-first
es obligatorio: Codex planifica, decide, revisa, valida y publica; el worker
NAN ejecuta la implementación sin que Codex escriba directamente ni tome
control tras un fallo NAN. Un objetivo coherente usa contrato multiarchivo;
dos o más historias independientes disjuntas usan batch hasta cinco, sin
microcontratos artificiales. Esta política es inviolable en el flujo actual.

## Procedencia de delegación firmada V4

El PR upstream #57 añade un gate opcional antes de publicar. Una firma Ed25519
del host vincula la ejecución aceptada con el commit, el árbol Git, la política,
el perfil, la capacidad del worker, la validación, la revisión y las decisiones
Frontier. Un worker o un modelo no puede fabricar esa autoridad.

Castilla y León no usa todavía `publishFinalizedRunV4`: su supervisor PowerShell
termina entregando un parche para revisión y la publicación se realiza fuera del
broker V4. Por ello el inventario de `castilla-leon.nan.yaml` mantiene
`enforcement: DISABLED`. Ese campo documenta preparación; por sí solo no crea un
gate ni convierte la telemetría local en evidencia V4.

La activación segura debe respetar este orden:

1. Publicar o fijar un artefacto inmutable del runtime que contenga el merge
   `42cf5c2b1b55628332ce9fc1089957bd4fca3931`.
2. Instalar el runtime y conectar las nuevas tareas al supervisor del host, con
   política y perfil separados y vinculados por hash.
3. Desplegar el firmante Ed25519 en el almacén de credenciales del host. La clave
   privada no entra en el repositorio, worktree, entorno del modelo ni logs.
4. Guardar la evidencia fuera del árbol candidato y completar un shakedown
   sintético, incluida su recuperación después de reiniciar el host.
5. Verificar en CI con `runtime verify-delegation`, obteniendo evidencia, clave
   pública confiada y hashes esperados desde almacenamiento protegido.
6. Solo entonces cambiar el gate real de publicación a `REQUIRED` y convertir
   esa verificación en check obligatorio de la rama.

Hasta completar los seis pasos, una ejecución local puede afirmar delegación
acotada respaldada por telemetría, pero no procedencia firmada obligatoria.

## Arquitectura

NAN se usa como proveedor de implementación principal. El worker:

- Intercambia con `opencode` mediante llamadas CLI.
- Ejecuta un intento por defecto y no activa fallbacks implícitos.
- Lee el JSONL durante la ejecución y termina el árbol de OpenCode cuando el
  consumo observado, incluida la caché, supera el presupuesto del perfil.
- Usa una ejecución NAN por defecto y admite hasta cinco solo mediante override
  explícito, cada una con estado
  OpenCode aislado. El broker respeta además 60 solicitudes por minuto y 1,5 M
  tokens por minuto y modelo; una espera de admisión no consume el tiempo de
  inferencia.
- Termina ejecuciones de más de 1800 segundos y bloquea durante una hora la
  repetición del mismo contrato sobre el mismo SHA.
- Registra telemetría por ejecución: modelo, agente, intento, reintento, código de
  salida, tokens, rutas cambiadas y código de validación.
- Modos: ejecución real y `DryRun` (simulación que también escribe telemetría).

El worker **nunca** escala ni escribe código a través de Sol. El supervisor
puede pedir a Codex una decisión estructurada y relanzar NAN con instrucciones
más cortas; Codex no toma el control de la implementación.

## Roles

| Rol                           | Modelo / Alias                       | Responsabilidad                                                                              |
| ----------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------- |
| **Orquestador**               | OpenAI / Codex Sol (esfuerzo medio)  | Analiza, diagnostica, diseña, descompone tareas, revisa diffs y valida.                      |
| **Worker de código**          | `nan/qwen3.6` (agente `nan-code`)    | Aplica cambios mecánicos en rutas permitidas con 40 pasos máximos y presupuesto observable.  |
| **Worker de boletines**       | `nan/gemma4` (agente `nan-bulletin`) | Lee y extrae información de boletines convertidos a archivos locales legibles. Modo lectura. |
| **Razonamiento acotado**      | `nan/deepseek-v4-flash`              | Perfil `reasoning` para contratos difíciles ya delimitados por Codex, con 40 pasos máximos.  |
| **Contexto largo/multimodal** | `nan/mimo-v2.5`                      | Perfil `long-context` para fuentes extensas, imágenes o audio, con 50 pasos máximos.         |

`nan/glm5.2` no está autorizado y el invocador lo rechaza también como fallback.
El perfil se selecciona con `-ModelProfile mechanical`, `reasoning` o
`long-context`; `auto` conserva Qwen para código y Gemma para extracción simple.

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
- Opcionalmente los perfiles de modelo y presupuesto. Cambiar el binding exige
  volver a cualificar la combinación exacta.

El contrato del supervisor es JSON y no contiene secretos:

```json
{
  "objective": "Implementa x",
  "allowedPaths": ["src/**"],
  "validationCommands": ["npm test"],
  "frontierPlan": "Implementa el cambio localizado",
  "acceptanceCriteria": ["Los tests pasan", "No hay regresión"],
  "budgetProfile": "batch",
  "modelProfile": "mechanical"
}
```

### 2. Codex invoca el supervisor

El estado y los worktrees viven fuera del repositorio. El directorio de estado
debe ser nuevo para impedir reutilizar decisiones de otra ejecución:

```powershell
.\scripts\Invoke-FrontierSupervisedNanWorker.ps1 `
  -ContractPath C:\orchestration\contracts\task-001.json `
  -StateDirectory C:\orchestration\state\task-001 `
  -WorktreeParent C:\orchestration\worktrees `
  -MaxAttempts 2
```

Cada intento crea un worktree separado sobre el mismo SHA, llama al worker con
`MaxRetries=1`, captura telemetría en una ruta elegida por el host y copia fuera
del worktree cualquier parche que respete las rutas del contrato. Si falla una
validación, también conserva su código de salida, clasificación, hashes y hasta
4.000 caracteres de la cola del diagnóstico por comando. Un fallo exclusivamente
de lint o formato genera un repair packet hash-bound y un reintento mecánico en
un contexto fresco antes de gastar una revisión Frontier. Si la firma se repite,
termina en `NO_PROGRESS`. Los demás fallos eliminan el worktree y piden a Codex
una decisión con esa evidencia. `RETRY` añade hasta tres instrucciones acotadas y
lanza una sesión NAN nueva desde el SHA original; solo un intento listo y con
validaciones aprobadas admite `ACCEPT`. `ESCALATE` termina sin aplicar el parche.
Los fallos fatales escriben un resultado `FAILED` sanitizado. El supervisor nunca
hace commit, push, publicación ni despliegue.

`Invoke-NanWorker.ps1` permanece como primitive de un solo intento para el
supervisor y para diagnóstico. Invocarlo directamente no demuestra que haya
ocurrido el ciclo Frontier completo.

### Oleadas paralelas para trabajo independiente

Si Codex identifica dos o más historias sin dependencia y con rutas exactas
disjuntas, usa `Invoke-NanWorkerBatch.ps1` en vez de encadenar supervisores. Un
lote admite de 1 a 20 historias y ejecuta una por defecto. `-MaxConcurrency`
permite hasta cinco de forma explícita, cada una
en un worktree detached y una sesión NAN nueva. El contrato completo y el SHA
Git base quedan ligados por hash; parches y telemetría se guardan fuera del
repositorio. El lote nunca aplica los parches ni publica resultados.

```json
{
  "schemaVersion": 1,
  "baseSha": "0123456789abcdef0123456789abcdef01234567",
  "stories": [
    {
      "id": "ajuste-a",
      "objective": "Implementa el ajuste A",
      "allowedPaths": ["src/a.ts"],
      "validationCommands": ["npm test -- src/a.test.ts"],
      "frontierPlan": "Cambio localizado ya diseñado por Codex",
      "acceptanceCriteria": ["Pasa la prueba focalizada"],
      "modelProfile": "mechanical",
      "budgetProfile": "small"
    }
  ]
}
```

```powershell
.\scripts\Invoke-NanWorkerBatch.ps1 `
  -BatchJsonPath C:\orchestration\contracts\batch-001.json `
  -StateDirectory C:\orchestration\state\batch-001 `
  -WorktreeParent C:\orchestration\worktrees `
  -MaxConcurrency 5
```

Las rutas de lote no aceptan globs ni `..`: esta restricción permite demostrar
que dos workers no escriben el mismo subárbol. Los cambios secuenciales o con
rutas solapadas vuelven al supervisor individual. Codex recibe un único paquete
de revisión con estado, modelo, rutas, hashes de parche/telemetría y tokens
reportados por el proveedor para todas las historias.

Cada campo es obligatorio y se valida en runtime (fail-closed):

| Campo                | Descripción                                                                                                                                                                        | Ejemplo                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `PlannedBy`          | Debe ser exactamente `"frontier"` (minúsculas)                                                                                                                                     | `"frontier"`                              |
| `FrontierPlan`       | Instrucciones del orquestador (cadena libre)                                                                                                                                       | `"Diagnostico X, implemento Y"`           |
| `AcceptanceCriteria` | Criterios de aceptación como arreglo de strings `string[]`, un elemento por criterio (no un string con saltos de línea)                                                            | `@("1. Tests pasan","2. Sin regression")` |
| `AllowedPath`        | Glob o lista glob que delimita escrituras                                                                                                                                          | `"src/**"`                                |
| `ValidationCommand`  | Comando(s) que deben devolver 0. Si alguno falla, el intento se bloquea inmediatamente; se persiste en `validationExitCode` el **primer código no cero** encontrado, no el último. | `"npm test"`                              |
| `BudgetProfile`      | Presupuesto observado por ejecución. `extended` es el valor seguro por defecto; los perfiles menores deben declararse según el alcance del contrato.                               | `"extended"`                              |

| Perfil     |    Tokens | Uso previsto                                               |
| ---------- | --------: | ---------------------------------------------------------- |
| `small`    |   500.000 | Cambio mecánico pequeño y localizado.                      |
| `batch`    | 1.250.000 | Incorporación mecánica de un lote previamente investigado. |
| `research` | 1.250.000 | Lectura y extracción extensa de fuentes.                   |
| `extended` | 1.500.000 | Lote excepcional que combina bastante contexto y trabajo.  |

`MaxObservedTokens` acepta de 1.000 a 2.000.000 y prevalece sobre la tabla,
pero queda registrado como `budgetSource: override`; no debe usarse como valor
habitual ni para ocultar un contrato demasiado amplio.

El perfil de admisión conserva capacidad técnica de cinco plazas por clave, pero
el coordinador batch usa una por defecto. Elevar `-MaxConcurrency` requiere una
decisión explícita. Este perfil es independiente del `BudgetProfile`; las plazas no se atribuyen al
perfil extended. Cada proceso recibe directorios XDG de datos, estado y caché
distintos; así varias instancias de OpenCode no comparten la base SQLite.
`observed-serial` queda disponible solo como diagnóstico de capacidad 1. Los
bloqueos históricos con 2, 4 y 8 procesos no demostraban un límite del proveedor
porque todos compartían el mismo estado mutable de OpenCode.

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
2. Crea estado OpenCode efímero y aislado, copiando solo la credencial NAN; lo
   elimina al terminar el intento.
3. Inicia un proxy local que reenvía exclusivamente a `api.nan.builders` y no
   conserva prompts ni respuestas. Registra hashes, estado HTTP, modelo, usage,
   fingerprint de clave e ID de respuesta ligados al contrato y repositorio.
4. Ejecuta opencode con el modelo primario (`nan/qwen3.6`) y consume su JSONL en
   streaming, sin `--auto`.
5. Si falla, se detiene tras `{MaxRetries}` intentos; el valor por defecto es 1.
6. Solo usa fallbacks enumerados y cualificados explícitamente.
7. Tras la ejecución exitosa, compara el snapshot y detecta archivos cambiados.
8. Compara cada archivo cambiado contra las rutas permitidas.
9. Escribe telemetría JSON en `.agent-runs/<guid>.json`.
10. Ejecuta las validaciones definidas por Frontier fuera del modelo.
11. Solo termina en `awaiting-frontier-review` si existe al menos una respuesta
    NAN 2xx con ID, modelo esperado y uso positivo. En otro caso termina en
    `blocked-unverified-provider`.

`tokensUsage` es telemetría del cliente OpenCode. No prueba consumo NAN. El
campo separado `providerEvidence.providerReportedTokens` procede de respuestas
observadas en el endpoint NAN, pero sigue siendo evidencia local del host hasta
que la procedencia firmada V4 se active en modo `REQUIRED`.

Nunca se infiere consumo desde el tamaño del prompt, el tiempo de ejecución o
el panel mensual. El panel NAN es agregado por periodo y modelo; la telemetría
local del broker es por sesión. `DryRun`, `TestMode`, respuestas fallidas y
ejecuciones sin evidencia de proveedor se contabilizan como cero en los informes
del broker. Para aceptar un cambio, la telemetría debe incluir
`providerEvidence.verified=true` en al menos una respuesta NAN válida.

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

Los boletines son siempre de solo lectura. El texto final se devuelve entre los
marcadores `NAN DRAFT OUTPUT` y también queda en `draftOutput` dentro de la
telemetría para que Codex pueda revisarlo; nunca se aprueba automáticamente.

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
  "draftOutput": "",
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
fallbacks vacíos. **Valor histórico supersedido**: el `maxSteps` actual es 40
para Qwen y DeepSeek, 50 para MiMo. La oleada real posterior mostró que
50k–400k era insuficiente para varios contratos útiles, por lo que el broker
ofrece perfiles revisados: `small` (500k), `batch` (1.250k), `research` (1.250k)
y `extended` (1.500k). **Valores históricos superseded**: 100k/500k/450k/750k.
Un `MaxObservedTokens` explícito entre 1k y 2M prevalece como override
auditable.
El broker corta la ejecución al
observar el exceso y la deja en `blocked-token-budget`; un timeout queda en
`blocked-timeout`. Como la API informa tokens por pasos completados, puede existir
un pequeño sobrepaso correspondiente al paso en curso, pero no una trayectoria
completa sin control.

El 14 de agosto de 2026 se ejecutó además el primer lote real con dos worktrees
concurrentes. Qwen 3.6 reportó 15.746 tokens y DeepSeek V4 Flash 27.133, para un
total de 42.879 tokens observado en respuestas NAN 2xx. Ambos workers respetaron
sus rutas y produjeron parche y telemetría con hash. Esto cualifica el transporte,
la concurrencia y la atribución del lote, no sus cambios: el parche Qwen fue
rechazado en revisión por un defecto de codificación y ninguno de los dos
artefactos de prueba se incorporó al producto.

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
- Usa respaldos NAN alternativos solo cuando el contrato los declara
  explícitamente; esto se aplica por igual a `code` y `bulletin`.
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
