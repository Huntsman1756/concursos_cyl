# Flujo OpenAI + OpenCode + NAN

Este repositorio adopta como piloto local el patron de
[`agent-orchestration-starter`](https://github.com/Huntsman1756/agent-orchestration-starter):
un modelo de frontera planifica y revisa, mientras un trabajador economico
ejecuta historias pequenas con contratos y validacion determinista.

## Seleccion de modelos

| Trabajo | Modelo | Motivo operativo |
|---|---|---|
| Planificacion, decisiones y revision | OpenAI/Codex Sol, esfuerzo medio | Mantiene contexto global y autoridad de aceptacion. |
| Implementacion localizada | `nan/qwen3.6` | Modelo principal de NAN, orientado a uso general con herramientas; se limita a 32 pasos. |
| Boletines y extraccion documental | `nan/gemma4` | Ruta separada, barata y de solo lectura; se limita a 12 pasos. |
| Arquitectura, seguridad o rescate | OpenAI/Codex Sol | Estas tareas no se delegan al trabajador economico. |

La documentacion publica de NAN consultada el 11 de agosto de 2026 muestra
256K de contexto y 1,5M tokens/minuto tanto para Qwen 3.6 como para Gemma 4.
No publica una cuota mensual para esos dos modelos. La disponibilidad concreta
depende de la membresia y API key configuradas en OpenCode.

## Uso desde Codex o PowerShell

Delegar codigo exige rutas permitidas:

```powershell
.\scripts\Invoke-NanWorker.ps1 -TaskType code `
  -Objective "Anade el parser y sus pruebas" `
  -AllowedPath "src/parser/**","tests/parser/**" `
  -ValidationCommand "npm test -- parser"
```

El invocador toma una huella de los archivos visibles para Git antes y despues
de la ejecucion. Si Qwen modifica una ruta fuera del contrato, la ejecucion
falla y Codex debe inspeccionarla; el script no revierte automaticamente para
no destruir trabajo previo.

Leer un boletin local:

```powershell
.\scripts\Invoke-NanWorker.ps1 -TaskType bulletin `
  -Objective "Extrae convocatoria, beneficiarios, cuantias, plazos y anexos" `
  -InputPath "boletines\bocyl-2026-08-11.txt"
```

Gemma no tiene permisos de escritura, shell, red, MCP, subagentes ni acceso
fuera del repositorio. Para PDF escaneado, Codex debe extraer primero el
texto/OCR y conservar referencias de pagina.

En la interfaz de OpenCode tambien estan disponibles `/implementar` y
`/boletin`, aunque el script es la via recomendada porque aplica el contrato de
rutas.

## Comprobacion

```powershell
.\scripts\Test-AgentOrchestration.ps1
.\scripts\Test-AgentOrchestration.ps1 -Live
```

La primera comprueba configuracion y modelos sin consumir inferencia. `-Live`
realiza una llamada minima a cada modelo y nunca lee ni imprime la API key.

## Limites del piloto

No se ha copiado el runtime V4 completo. Su documentacion exige evidencias de
host, coordinador y sandbox por plataforma, y el starter indica que la evidencia
nativa actual es Linux x64. Este piloto funciona en Windows con aislamiento por
permisos de OpenCode y comprobacion posterior de rutas; para ejecucion totalmente
desatendida en VPS se debe desplegar y certificar el broker completo en Linux.

El trabajador nunca hace commit, push, PR o despliegue. Codex conserva revision,
validacion final y publicacion.
