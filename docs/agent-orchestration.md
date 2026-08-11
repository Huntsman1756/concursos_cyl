# Orquestación de Agentes (Codex → NAN)

## Resumen

Este repositorio implementa un flujo local de agentes inspirado en
`agent-orchestration-starter`. OpenAI/Codex Sol es el orquestador Frontier:
planifica, diagnostica, define la arquitectura y los contratos, y valida
cada entrega. Los modelos NAN ejecutan cambios de código únicamente bajo
contratos acotados emitidos por Sol, sin decidir arquitectura ni hacer
diagnóstico por sí mismos.

Este flujo **no es el runtime V4 completo**. Es una adaptación local para Windows
que aprovecha el CLI `opencode`, los agentes locales `nan-code` y `nan-bulletin`,
y un worker PowerShell con retry, fallback y telemetría JSON.

## Arquitectura

NAN se usa como proveedor de implementación principal. El worker:

- Intercambia con `opencode` mediante llamadas CLI.
- Reintenta hasta 3 veces por modelo antes de dar por fallida una ejecución.
- Usa modelos NAN alternativos como respaldo si el primario falla.
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
| **Worker de código**    | `nan/qwen3.6` (agente `nan-code`)    | Aplica cambios mecánicos en rutas permitidas. Soporta retry, fallback y telemetría.          |
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
- Opcionalmente `MaxRetries`, `FallbackModels` y `DryRun`.

### 2. Codex invoca el trabajador

Ejecución con retry y fallback:

```powershell
.\scripts\Invoke-NanWorker.ps1 -TaskType code `
  -Objective "Implementa x" `
  -AllowedPath "src/**" `
  -ValidationCommand "npm test" `
  -MaxRetries 3 `
  -FallbackModels "nan/mimo-v2.5,nan/deepseek-v4-flash"
```

Ejecución DryRun (sin coste, valida contrato sin llamar a opencode):

```powershell
.\scripts\Invoke-NanWorker.ps1 -TaskType code `
  -Objective "DryRun verificación" `
  -AllowedPath "src/**" `
  -DryRun
```

El script:

1. Calcula un snapshot SHA-256 de los archivos versionados y no ignorados.
2. Intenta ejecutar opencode con el modelo primario (`nan/qwen3.6`).
3. Si falla, reintentará hasta `{MaxRetries}` veces.
4. Si el primario se agota, intentará cada modelo de fallback.
5. Tras la ejecución exitosa, compara el snapshot y detecta archivos cambiados.
6. Compara cada archivo cambiado contra las rutas permitidas.
7. Escribe telemetría JSON en `.agent-runs/<guid>.json`.
8. Ejecuta los comandos de validación opcionales.

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
  "status": "success"
}
```

- `.agent-runs/` está ignorado por `.gitignore` y por el watcher de opencode.
- No existe limpieza automática de retención; el directorio se gestiona manualmente.

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

| Fase                 | Descripción                                                | Costo API |
| -------------------- | ---------------------------------------------------------- | --------- |
| **Contracts**        | code sin AllowedPath falla, bulletin con AllowedPath falla | Ninguno   |
| **DryRun**           | Ejecución dryrun completa (escribe telemetría)             | Ninguno   |
| **Retry-success**    | Primario falla 2 veces, éxito al 3er intento               | Ninguno   |
| **Fallback-success** | Primario agotado, fallback tiene éxito                     | Ninguno   |
| **Blocked**          | Primario + 1 fallback agotados → blocked                   | Ninguno   |
| **Blocked-all**      | Todos los modelos agotados → blocked                       | Ninguno   |
| **Tokens**           | Extracción y agregación de tokens desde JSONL              | Ninguno   |
| **Nochange**         | 0 cambios sin `-AllowNoChanges` → rechazo                  | Ninguno   |
| **Allowno**          | 0 cambios con `-AllowNoChanges` → aceptado                 | Ninguno   |
| **Violation**        | Cambio fuera de `AllowedPath` → violación                  | Ninguno   |
| **Validation**       | Validación falla → error                                   | Ninguno   |
| **Bulletin**         | Bulletin solo usa gemma4, sin fallback                     | Ninguno   |
| **Telemetry**        | Telemetría creada incluso en fallo, sin campos prohibidos  | Ninguno   |
| **Fail-closed**      | Entradas MockPlan insuficientes → blocked                  | Ninguno   |
| **Fallback-reject**  | Modelo no oficial en fallback se ignora                    | Ninguno   |

No existe fase `Live` implementada. Todas las fases usan `TestMode` con `MockPlan`
y no consumen API NAN. Cada fase tiene tests individuales con PASS/FAIL reportados
al final.

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
- El worker de código es una invocación CLI directa: sin contenedores, sin
  sandboxing ni aislamiento por proceso.
- Soporta retry y fallback: gestiona fallos transitorios de la API.
- La telemetría se guarda en archivos locales JSON ignorados por git.

Esta simplicidad es una decisión deliberada: facilita la revisión humana, reduce
la superficie de fallo y se adapta a un entorno de desarrollo único donde la
producción corre sobre caddy y servidores Linux.
