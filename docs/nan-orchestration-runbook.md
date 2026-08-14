# Runbook Operativo — NAN Orchestration

Guía rápida para ejecutar, supervisar y auditar flujos de orquestación NAN en este repositorio. Todo el trabajo se canaliza a través del supervisor (`BOUNDED_LOCAL`).

## 1. Ejecución con Invoke-NanWorker

### Comando base

```powershell
.\scripts\Invoke-FrontierSupervisedNanWorker.ps1 `
  -ContractPath  C:\orchestration\contracts\task.json `
  -StateDirectory C:\orchestration\state\task-001 `
  -WorktreeParent C:\orchestration\worktrees
```

### Ejemplo DryRun

```powershell
.\scripts\Invoke-NanWorker.ps1 -TaskType code `
  -Objective "Verificar contrato" `
  -PlannedBy "frontier" `
  -FrontierPlan "Revisión de configuración" `
  -AcceptanceCriteria @(
    "Sin errores",
    "Verificada estructura"
  ) `
  -AllowedPath "src/**" `
  -BudgetProfile small `
  -ValidationCommand "npm run lint" `
  -DryRun
```

### Campos obligatorios del contrato

| Campo                | Descripción                                          | Ejemplo                              |
| -------------------- | ---------------------------------------------------- | ------------------------------------ |
| `PlannedBy`          | Debe ser exactamente `"frontier"` (minúsculas)       | `"frontier"`                         |
| `FrontierPlan`       | Instrucciones del orquestador (cadena libre)         | `"Diagnóstico X, implemento Y"`      |
| `AcceptanceCriteria` | Criterios separados por saltos de línea (`string[]`) | `"1. Tests pasan\n2. Sin regresión"` |
| `AllowedPath`        | Glob o lista glob que delimita escrituras            | `"src/**"`                           |
| `ValidationCommand`  | Comando(s) que deben volver `0`                      | `"npm test"`                         |

> `validationExitCode` se persiste en el intento cuando el broker llega a ejecutar
> la validación. Puede ser `null` si el worker se bloquea antes.

## 2. Tabla de modelos y roles

| Flujo            | Modelo                                | Perfil NAN              | Tipo                                           |
| ---------------- | ------------------------------------- | ----------------------- | ---------------------------------------------- |
| **Mechanical**   | Qwen 3.6 (`nan/qwen3.6`)              | `nan-code`              | Edits mecánicos, bounded paths                 |
| **Reasoning**    | DeepSeek V4 (`nan/deepseek-v4-flash`) | `nan-reasoning-code`    | Contratos que requieren razonamiento explícito |
| **Long-context** | MiMo 2.5 (`nan/mimo-v2.5`)            | `nan-long-context-code` | Contexto largo (> 100 k tokens)                |
| **Bulletin**     | Gemma 4 (`nan/gemma4`)                | `nan-bulletin`          | Solo lectura de boletines convertidos          |

_No existe fallback automático. Codex debe autorizar cada fallback compatible en el contrato._

_Prohibido usar `nan/glm5.2` o delegar código a `nan/gemma4`._

## 3. Límites NAN

| Límite                           | Valor                         |
| -------------------------------- | ----------------------------- |
| **RPM** (solicitudes por minuto) | **60**                        |
| **Concurrencia**                 | **5** workers simultáneos     |
| **TPM por modelo**               | **1 500 000** tokens / minuto |

El límite de tokens se aplica por modelo; RPM y concurrencia, por clave. El proxy
respeta `Retry-After` y registra cada intento sin conservar prompts ni secretos.

## 4. Políticas de reintento

### Se retry

- Códigos: `429` (`rate_limit_exceeded`) y cualquier `5xx`.
- Intentos: **máximo 3** en total.
- `Retry-After`: leer encabezado; **máximo 30 s**. Si no está presente, usar el back-off por defecto.

### No se retry

- `400`, `401`, `402`, `403`, `404` y cualquier error de cuota.
- Errores de contrato mal formado.
- Timeouts de ejecución (se reportan como `blocked-timeout`).

## 5. Estados del pipeline

| Estado                         | Significado                                                              |
| ------------------------------ | ------------------------------------------------------------------------ |
| `awaiting-frontier-review`     | Ejecución terminada; pendiente de aprobación/rechazo de Codex (Frontier) |
| `blocked-provider-auth`        | Fallo de autenticación con el proveedor NAN                              |
| `blocked-provider-quota`       | Cuota del proveedor agotada                                              |
| `blocked-provider-rate-limit`  | Límite de RPM/TPM excedido                                               |
| `blocked-provider-unavailable` | Proveedor no responde o caída                                            |
| `blocked-unverified-provider`  | No se pudo verificar evidencia 2xx del proveedor (ID, modelo, usage)     |
| `blocked-needs-new-contract`   | El contrato es ambiguo, supera las rutas permitidas o requiere rediseño  |

> La telemetría con evidencia verificable de respuesta 2xx marca el flujo como activo;
> sin ella se establece `blocked-unverified-provider` de forma determinista.

## 6. Prohibiciones

- **`nan/glm5.2`**: prohibición global. No se referencia, no se usa, no es fallback.
- **Secretos / credenciales / datos personales**: nunca se delegan ni se escriben.
- **Gemma para código**: Gemma (`nan/gemma4`) es estrictamente de solo lectura de boletines.
  Cualquier contrato de código que intente usar Gemma debe fallar de forma determinista.

## 7. Checklist post-ejecución

Antes de solicitar `ACCEPT` a Codex, verificar:

- [ ] **Diff**: solo archivos dentro de las rutas `AllowedPath` fueron modificados.
- [ ] **Validación**: el comando pasado en `ValidationCommand` retornó `0`;
      `validationExitCode` aparece en el JSONL de telemetría.
- [ ] **Telemetría**: se generó `.agent-runs/<guid>.json` con campos completos
      (`status`, intentos, `validationExitCode`, `providerEvidence` y presupuesto).
- [ ] **Sin secretos**: no se diff-ingren credenciales, claves ni PII.
- [ ] **Estado correcto**: el registro refleja `awaiting-frontier-review` (o un
      estado `blocked-*` si hubo fallo).

## 8. Provenance

| Estado       | Condición                                                                         |
| ------------ | --------------------------------------------------------------------------------- |
| **DISABLED** | Situación actual — el firmante no está protegido ni se ejecutó shakedown firmado. |
| **ENABLING** | En progreso: se ha configurado el firmante protegido y se preparan las pruebas.   |
| **REQUIRED** | Shakedown firmado completado satisfactoriamente.                                  |

Hasta que el shakedown firmado no se ejecute y se confirme, la verificación de procedencia permanece en `DISABLED`.

## 9. Perfiles de presupuesto

| Perfil     | Límite observado |
| ---------- | ---------------- |
| `small`    | 175 k tokens     |
| `batch`    | 600 k tokens     |
| `research` | 500 k tokens     |
| `extended` | 900 k tokens     |

Se puede forzar un override con `-MaxObservedTokens <n>` (entre 1 k y 1 M); queda marcado como `override` en telemetría. El valor seguro por defecto es `small`.

## 10. Referencias rápidas

| Script                                   | Función                                           |
| ---------------------------------------- | ------------------------------------------------- |
| `Invoke-FrontierSupervisedNanWorker.ps1` | Orquesta un único worker en un worktree           |
| `Invoke-NanWorkerBatch.ps1`              | Lanza hasta cinco workers disjuntos en paralelo   |
| `Invoke-NanWorker.ps1`                   | Primitiva individual (uso interno del supervisor) |

---

_Este documento es solo informativo. Las reglas de ejecución se encuentran codificadas
en el supervisor y en los scripts de orquestación. Cualquier ambigüedad requiere
revisión por Codex (Frontier)._
