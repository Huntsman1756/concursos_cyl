# Contrato local de agentes

Este repositorio usa un flujo inspirado en `agent-orchestration-starter`:
OpenAI/Codex planifica y revisa; OpenCode ejecuta contratos acotados con NAN.

## Roles y rutas

- Orquestador y revisor: OpenAI/Codex Sol, esfuerzo medio.
- Implementacion mecanica y localizada: `nan/qwen3.6` mediante el agente
  `nan-code`.
- Lectura y extraccion de boletines: `nan/gemma4` mediante el agente
  `nan-bulletin`.
- Arquitectura, seguridad, depuracion ambigua, refactorizaciones entre muchos
  archivos y decisiones de producto se quedan en Codex.

## Contrato de delegacion

Antes de delegar codigo, Codex debe indicar objetivo, rutas permitidas,
criterios de aceptacion y validaciones. La llamada normal es:

```powershell
.\scripts\Invoke-NanWorker.ps1 -TaskType code `
  -Objective "Objetivo verificable" `
  -AllowedPath "src/**" `
  -ValidationCommand "npm test"
```

Para boletines, Codex obtiene o convierte la fuente a un archivo local y usa:

```powershell
.\scripts\Invoke-NanWorker.ps1 -TaskType bulletin `
  -Objective "Extrae fechas, importes, organos y requisitos con citas" `
  -InputPath "boletines\fuente.txt"
```

El ejecutor no puede publicar, hacer commits, ampliar sus rutas ni aprobar su
propio resultado. Codex revisa el diff y ejecuta las validaciones de forma
independiente antes de aceptar el trabajo.

No se delegan secretos, archivos `.env`, credenciales ni datos personales. La
configuracion de proyecto nunca contiene la API key de NAN.
