# Orquestacion de Agentes (NAN)

## Resumen

Este repositorio implementa un flujo local de agentes inspirado en
`agent-orchestration-starter`. La idea es delegar trabajo mecanico a modelos
ligeros bajo un contrato estricto, mientras OpenAI/Codex Sol planifica, revisa y
valida cada entrega.

Este flujo **no es el runtime V4 completo**. Es una adaptacion local para Windows
que aprovecha el CLI `opencode`, los agentes locales `nan-code` y `nan-bulletin`
y los scripts de PowerShell del repositorio.

## Roles

| Rol                     | Modelo / Alias                       | Responsabilidad                                                                                             |
| ----------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| **Orquestador**         | OpenAI / Codex Sol (esfuerzo medio)  | Planifica tareas, define objetivos, establece limites de ruta, revisa diffs y ejecuta validaciones.         |
| **Worker de codigo**    | `nan/qwen3.6` (agente `nan-code`)    | Aplica cambios mecanicos unicamente en rutas permitidas. No tiene permisos de escritura fuera del contrato. |
| **Worker de boletines** | `nan/gemma4` (agente `nan-bulletin`) | Lee y extrae informacion de boletines convertidos a archivos locales legibles. Modo lectura.                |

Decisiones de arquitectura, seguridad, depuracion ambigua, refactorizaciones
multi-archivo y decisiones de producto se reservan al orquestador (Codex).

## Flujo delegacion de codigo

### 1. Codex prepara el contrato

Codex define:

- Objetivo verificable (una frase o parrafo corto).
- Rutas permitidas (globales glob, p.ej. `src/**`, `docs/agent-orchestration.md`).
- Comandos de validacion (p.ej. `npm test`, `prettier --check docs/agent-orchestration.md`).

### 2. Codex invoca el trabajador

```powershell
.\scripts\Invoke-NanWorker.ps1 -TaskType code `
  -Objective "Crea docs/agent-orchestration.md" `
  -AllowedPath "docs/agent-orchestration.md" `
  -ValidationCommand "npx prettier --check docs/agent-orchestration.md"
```

El script:

1. Calcula un snapshot SHA-256 de los archivos versionados y no ignorados.
2. Llama a `opencode run --pure --model nan/qwen3.6 --agent nan-code -- ...`.
3. El prompt incluye el contrato completo (`TASK TYPE`, `OBJECTIVE`, `ALLOWED
PATHS`, `REQUIRED VALIDATION`).
4. Tras la ejecucion, compara el snapshot y detecta archivos cambiados.
5. Compara cada archivo cambiado contra las rutas permitidas.

Si algun archivo fuera de `AllowedPath` modificado, el script genera un error de
violacion de contrato, lo cual es **esperado y necesario** — marca el fallo para
que el orquestador lo corrija redefiniendo las rutas.

### 3. Codex revisa y valida

- Revisa el diff (`git diff`).
- Ejecuta los comandos de validacion por su cuenta.
- Aprueba o rechaza el cambio.

## Flujo delegacion de boletines

Codex obtiene o convierte la fuente a un archivo local y ejecuta:

```powershell
.\scripts\Invoke-NanWorker.ps1 -TaskType bulletin `
  -Objective "Extrae texto del boletin del BOE" `
  -InputPath "data/boletin/2025/boe-2025-01.txt"
```

Los boletines son siempre de solo lectura.

## Limites y politicas

### Lo que el trabajador NO hace

- No publica, no hace commits, no push, no despliegue.
- No amplía sus propias rutas permitidas.
- No aprueba su propio resultado.
- No lee secretos ni credenciales ni datos personales.

### Lo que hace

- Lee solo lo necesario; el limite `AllowedPath` se aplica a las escrituras y se
  comprueba despues de la ejecucion.
- Escribe en las rutas permitidas del contrato.
- Avisa si un archivo extra fue modificado (violacion de contrato).

## Validacion del entorno

El script de prueba verifica la configuracion sin llamar a la API externa
(necesita `--Live` para eso):

```powershell
.\scripts\Test-AgentOrchestration.ps1        # modo configuracion
.\scripts\Test-AgentOrchestration.ps1 -Live  # modo live: ejecuta probes reales
```

En modo configuracion comprueba que:

- `opencode` esta disponible y devuelve version.
- Los modelos `nan/qwen3.6` y `nan/gemma4` aparecen en el arbol de modelos.
- `nan-code` se resuelve a `nan/qwen3.6` y `nan-bulletin` a `nan/gemma4`.
- Ambos agentes deniegan las herramientas MCP heredadas `esdata_*`.

En modo `--Live` ademas ejecuta probes en vivo de un solo prompt a cada modelo,
pidiendo devolver cadenas fijas (`QWEN_ROUTE_OK` / `GEMMA_ROUTE_OK`).

## Naturaleza local y Windows

Este flujo es un **subconjunto local del patron de orquestacion de agentes**:

- Se ejecuta sobre Windows con PowerShell (no sobre el runtime V4 completo).
- No usa colas RPC, no tiene panel de monitorizacion, ni base de datos de
  sesiones, ni sistema de autenticacion multi-usuario.
- El orquestador es Codex, que invoca `opencode` con acceso a los modelos NAN;
  no es un servicio autonomo.
- El worker de codigo es una invocacion CLI directa: sin contenedores, sin
  sandboxing ni aislamiento por proceso.

Esta simplicidad es una decision deliberada: facilita la revision humana, reduce
la superficie de fallo y se adapta a un entorno de desarrollo unico donde la
produccion corre sobre caddy y servidores Linux.
